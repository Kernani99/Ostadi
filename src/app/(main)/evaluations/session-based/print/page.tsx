
'use client';

import { Suspense, useEffect, useMemo, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Student, Institution, ProfessorProfile, SessionEvaluation } from '@/lib/types';
import { collection, query, where, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format, getWeeksInMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

function PrintContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const institutionId = searchParams.get('institutionId');
    const level = searchParams.get('level');
    const month = searchParams.get('month'); // YYYY-MM

    // --- Data Fetching ---
    const profileDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'professor_profile', 'main_profile') : null, [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    const institutionDocRef = useMemoFirebase(() => institutionId && firestore ? doc(firestore, 'institutions', institutionId) : null, [firestore, institutionId]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !institutionId || !level) return null;
        return query(collection(firestore, 'students'), where('institutionId', '==', institutionId), where('level', '==', level));
    }, [firestore, institutionId, level]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
    
    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);

    const evaluationsQuery = useMemoFirebase(() =>
        firestore && studentIds.length > 0 && month ? query(collection(firestore, 'session_evaluations'), where('studentId', 'in', studentIds), where('month', '==', month)) : null
    , [firestore, studentIds, month]);
    const { data: fetchedEvaluations, isLoading: loadingEvaluations } = useCollection<SessionEvaluation>(evaluationsQuery);

    // --- Data Processing ---
    const scoresMap = useMemo(() => {
        const map = new Map<string, Record<string, number | null>>();
        fetchedEvaluations?.forEach(ev => {
            map.set(ev.studentId, ev.scores);
        });
        return map;
    }, [fetchedEvaluations]);

    const sortedStudents = useMemo(() => students?.sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)) || [], [students]);

    const printDate = useMemo(() => month ? new Date(`${month}-01T12:00:00`) : new Date(), [month]);
    const weeksOfMonth = useMemo(() => getWeeksInMonth(printDate, { weekStartsOn: 6 }), [printDate]);
    const hasTwoSessions = ['أولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي'].includes(level || '');

    const calculateMonthlyScore = (studentId: string) => {
        const studentScores = scoresMap.get(studentId) || {};
        const scoresArray = Object.values(studentScores).filter(s => s !== null && s !== undefined) as number[];
        if (scoresArray.length === 0) return { avg: "0.00", count: 0 };
        const sum = scoresArray.reduce((acc, s) => acc + s, 0);
        return {
            avg: (sum / scoresArray.length).toFixed(2),
            count: scoresArray.length
        };
    };

    // --- Effects ---
    const isLoading = loadingProfile || loadingInstitution || loadingStudents || loadingEvaluations;
    useEffect(() => {
        if (!isLoading && sortedStudents.length > 0) {
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, sortedStudents]);

    // --- Render Logic ---
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري التحضير للطباعة...</span></div>;
    }

    if (!students || students.length === 0) {
        return <div className="flex h-screen items-center justify-center">لا توجد بيانات لعرضها.</div>;
    }
    
    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
    const schoolYear = profileData?.schoolYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

    return (
        <div className="p-4 bg-white text-black font-body text-xs" dir="rtl">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    @page { size: A4 landscape; margin: 1cm; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .print-table th, .print-table td { border: 1px solid black; padding: 2px; text-align: center; font-size: 9pt; vertical-align: middle; }
                    .print-table th { font-weight: bold; background-color: #f2f2f2 !important; }
                }
            `}</style>
             <header className="print-header mb-4 space-y-1">
                <div className="grid grid-cols-3 text-sm">
                    <div>المؤسسة: {institution?.name || '...'}</div>
                    <div className="text-center">السنة الدراسية: {schoolYear}</div>
                    <div className="text-left">الأستاذ: {professorName}</div>
                </div>
                <h1 className="text-center font-bold text-base my-2">كشف تقييم الحصص لشهر {month ? format(printDate, 'MMMM yyyy', { locale: ar }) : '...'} - {level}</h1>
            </header>

            <main>
                <table className="print-table">
                    <thead>
                         <tr>
                            <th rowSpan={2} className="w-[150px]">اللقب والاسم</th>
                            {weeksOfMonth.map(week => (
                                <th key={week} colSpan={hasTwoSessions ? 2 : 1}>الأسبوع {week}</th>
                            ))}
                            <th rowSpan={2} className="w-[60px]">عدد الحصص</th>
                            <th rowSpan={2} className="w-[80px]">النقطة الشهرية</th>
                        </tr>
                        <tr>
                            {weeksOfMonth.flatMap(week =>
                                hasTwoSessions ? (
                                    <Fragment key={week}>
                                        <th className="text-xs p-1 border-t">ح1</th>
                                        <th className="text-xs p-1 border-t">ح2</th>
                                    </Fragment>
                                ) : (
                                    <th key={`${week}-1`} className="text-xs p-1 border-t">الحصة</th>
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody>
                         {sortedStudents.map((student, index) => {
                            const monthlyScore = calculateMonthlyScore(student.id);
                            return (
                                <tr key={student.id}>
                                    <td className="text-right p-1">{index + 1}- {student.lastName} {student.firstName}</td>
                                    {weeksOfMonth.map(week => (
                                        hasTwoSessions ? (
                                            <Fragment key={week}>
                                                <td>{scoresMap.get(student.id)?.[`${week}_1`] ?? ''}</td>
                                                <td>{scoresMap.get(student.id)?.[`${week}_2`] ?? ''}</td>
                                            </Fragment>
                                        ) : (
                                            <td key={`${week}-1`}>{scoresMap.get(student.id)?.[`${week}_1`] ?? ''}</td>
                                        )
                                    ))}
                                    <td className="font-bold">{monthlyScore.count}</td>
                                    <td className="font-bold text-lg">{monthlyScore.avg}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </main>
             <footer className="print-footer mt-8 pt-4 text-sm">
                <div className="flex justify-around">
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المفتش</h4>
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المدير</h4>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function PrintSessionEvaluationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}
