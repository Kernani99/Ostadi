'use client';

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { collection, doc, query, where } from "firebase/firestore";
import { format, getWeeksInMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from "lucide-react";

import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Institution, ProfessorProfile, Student } from "@/lib/types";

const TWO_SESSION_LEVELS = ['رابعة ابتدائي', 'خامسة ابتدائي'];

const getWeeksOfMonth = (date: Date) => {
    if (date.getMonth() === 8) return [1]; // سبتمبر: أسبوع واحد
    const weeks = getWeeksInMonth(date, { weekStartsOn: 6 });
    return Array.from({ length: weeks }, (_, i) => i + 1);
};

/**
 * كل القيم (أسماء التلاميذ، المؤسسة، معاملات الرابط) تُعرض كنص عبر JSX.
 * النسخة السابقة كانت تبني HTML بالسلاسل النصية وتحقنه بـ innerHTML، ما يسمح بتنفيذ
 * سكربت مخزَّن في اسم تلميذ (XSS).
 */
function PrintAnnualContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const searchParams = useSearchParams();

    const level = searchParams.get('level');
    const institutionId = searchParams.get('institutionId');

    const profileDocRef = useMemoFirebase(() => user ? doc(firestore, 'professor_profile', user.uid) : null, [firestore, user]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    const institutionDocRef = useMemoFirebase(() => institutionId && user ? doc(firestore, 'institutions', institutionId) : null, [firestore, institutionId, user]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => {
        if (!level || !institutionId || !user) return null;
        return query(
            collection(firestore, 'students'),
            where('institutionId', '==', institutionId),
            where('level', '==', level),
            where('userId', '==', user.uid)
        );
    }, [firestore, level, institutionId, user]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const sortedStudents = useMemo(
        () => [...(students ?? [])].sort((a, b) =>
            `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ar')
        ),
        [students]
    );

    const isLoading = loadingProfile || loadingInstitution || loadingStudents;
    const hasTwoSessions = TWO_SESSION_LEVELS.includes(level || '');

    const months = useMemo(() => {
        const now = new Date();
        const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        return [9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => {
            const date = new Date(m >= 9 ? startYear : startYear + 1, m - 1, 1);
            return { key: m, label: format(date, 'MMMM', { locale: ar }), weeks: getWeeksOfMonth(date) };
        });
    }, []);

    const span = hasTwoSessions ? 2 : 1;
    const totalCols = months.reduce((sum, m) => sum + m.weeks.length * span, 0);

    useEffect(() => {
        if (isLoading || sortedStudents.length === 0) return;
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, [isLoading, sortedStudents.length]);

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><span className="ms-2">جاري تحضير الصفحة للطباعة...</span></div>;
    }

    if (sortedStudents.length === 0) {
        return <div className="flex h-screen w-full items-center justify-center">لا يوجد تلاميذ في هذا المستوى لعرضهم.</div>;
    }

    return (
        <div className="annual-sheet">
            <style>{`
                @page { size: A4 landscape; margin: 0.5cm; }
                .annual-sheet { direction: rtl; background: #fff; color: #000; font-size: 8pt; padding: 8px; }
                .annual-sheet .page-header { text-align: center; margin-bottom: 5px; }
                .annual-sheet .page-header h1 { font-size: 13pt; font-weight: 700; margin: 0; }
                .annual-sheet .page-header h2 { font-size: 10pt; margin: 1px 0; }
                .annual-sheet .info { display: flex; justify-content: space-between; font-size: 10pt; margin-top: 3px; font-weight: 600; }
                .annual-sheet table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                .annual-sheet th, .annual-sheet td { border: 1px solid #000; padding: 2px 1px; text-align: center; height: 28px; overflow: hidden; white-space: nowrap; font-size: 7pt; }
                .annual-sheet thead th { background-color: #e0e0e0; font-weight: 700; vertical-align: middle; }
                .annual-sheet tbody tr:nth-child(even) { background-color: #f9f9f9; }
                .annual-sheet .col-num { width: 30px; }
                .annual-sheet .col-name { width: 130px; }
                .annual-sheet td.name { text-align: right; padding-right: 5px; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .annual-sheet { padding: 0; }
                    .annual-sheet thead { display: table-header-group; }
                    .annual-sheet tr { page-break-inside: avoid; }
                }
            `}</style>

            <div className="page-header">
                <h1>مديرية التربية لولاية {profileData?.wilaya || '...'}</h1>
                <h2>المدرسة: {institution?.name || '...'}</h2>
                <div className="info">
                    <span>القسم: {level || ''}</span>
                    <span>الأستاذ(ة): {`${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim()}</span>
                    <span>السنة الدراسية: {profileData?.schoolYear || '...'}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowSpan={2} className="col-num">الرقم</th>
                        <th rowSpan={2} className="col-name">الاسم واللقب</th>
                        {months.map((m) => (
                            <th key={m.key} colSpan={m.weeks.length * span}>{m.label}</th>
                        ))}
                    </tr>
                    <tr>
                        {months.flatMap((m) =>
                            m.weeks.map((week) => (
                                <th key={`${m.key}-${week}`} colSpan={span}>أ{week}</th>
                            ))
                        )}
                    </tr>
                </thead>
                <tbody>
                    {sortedStudents.map((student, index) => (
                        <tr key={student.id}>
                            <td>{index + 1}</td>
                            <td className="name">{student.lastName} {student.firstName}</td>
                            {Array.from({ length: totalCols }, (_, i) => <td key={i} />)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PrintAnnualAttendancePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintAnnualContent />
        </Suspense>
    );
}
