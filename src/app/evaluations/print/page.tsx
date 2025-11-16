'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, query, where, doc } from "firebase/firestore";
import type { Student, Institution, ProfessorProfile, Evaluation, EvaluationCriteria } from "@/lib/types";
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

const FIRST_YEAR_CRITERIA_PRINT: Omit<EvaluationCriteria, 'id' | 'semester' | 'level'>[] = [
    { name: 'سلوك المتعلم', maxScore: 2 },
    { name: 'الغيابات و التأخرات', maxScore: 2 },
    { name: 'البدلة الرياضية', maxScore: 2 },
    { name: 'المشاركة الفعالة في الحصة', maxScore: 2 },
    { name: 'التحكم في مختلف وضعيات الجسم', maxScore: 2 },
];

function PrintContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const institutionId = searchParams.get('institutionId');
    const level = searchParams.get('level');
    const semester = searchParams.get('semester');

    const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    const institutionDocRef = useMemoFirebase(() => institutionId ? doc(firestore, 'institutions', institutionId) : null, [firestore, institutionId]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => {
        if (!institutionId || !level) return null;
        return query(
            collection(firestore, 'students'),
            where('institutionId', '==', institutionId),
            where('level', '==', level)
        );
    }, [firestore, institutionId, level]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const evaluationCriteria = useMemo(() => FIRST_YEAR_CRITERIA_PRINT.map((c, i) => ({...c, id: `fy_crit_${i}`})), []);

    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);
    const evaluationsQuery = useMemoFirebase(() => {
       if (studentIds.length === 0 || !semester) return null;
       return query(
           collection(firestore, 'evaluations'),
           where('studentId', 'in', studentIds),
           where('semester', '==', semester)
       )
    }, [firestore, studentIds, semester]);
    const { data: existingEvals, isLoading: loadingEvals } = useCollection<Evaluation>(evaluationsQuery);

    const scoresMap = useMemo(() => {
        const map = new Map<string, { [criteriaId: string]: number | null }>();
        existingEvals?.forEach(ev => {
            if (!map.has(ev.studentId)) {
                map.set(ev.studentId, {});
            }
            map.get(ev.studentId)![ev.criteriaId] = ev.score;
        });
        return map;
    }, [existingEvals]);

    const calculateTotal = (studentId: string) => {
        const studentScores = scoresMap.get(studentId) || {};
        return Object.values(studentScores).reduce((acc, score) => acc + (score || 0), 0);
    };

    const sortedStudents = useMemo(() => {
        return students?.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)) || [];
    }, [students]);

    const isLoading = loadingProfile || loadingInstitution || loadingStudents || loadingEvals;

    useEffect(() => {
        if (!isLoading && students && students.length > 0) {
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, students]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري تحضير التقرير للطباعة...</span></div>;
    }
    
    if (!institutionId || !level || !semester || !students || students.length === 0) {
        return <div className="flex h-screen items-center justify-center"><p>لا توجد بيانات لعرضها. يرجى التأكد من اختيار جميع الخيارات.</p></div>;
    }

    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
    const title = `كشف تقييم السنة ${level} - الفصل ${semester}`;

    return (
        <div className="p-4 bg-white text-black font-body">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 10px; }
                    @page { size: A4 portrait; margin: 0.5in; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { page-break-inside: auto; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .no-print { display: none; }
                }
            `}</style>
            <header className="print-header text-center mb-4 space-y-1">
                <h1 className="text-base font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-sm font-semibold">المدرسة الابتدائية: {institution?.name || '...'}</h2>
                <div className="flex justify-between text-xs">
                    <span>السنة الدراسية: {profileData?.schoolYear || '...'}</span>
                    <span>الأستاذ: {professorName || '...'}</span>
                </div>
                <h1 className="text-lg font-bold mt-2 underline decoration-double">
                    {title}
                </h1>
            </header>
            <main>
                <table className="w-full border-collapse border border-gray-600 print-table text-[10px]">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-500 p-1 w-8">رقم</th>
                            <th className="border border-gray-500 p-1 text-right">الاسم واللقب</th>
                            {evaluationCriteria.map(criteria => (
                                <th key={criteria.id} className="border border-gray-500 p-1 w-20">
                                    {criteria.name} <br/> (/{criteria.maxScore})
                                </th>
                            ))}
                            <th className="border border-gray-500 p-1 w-24">مجموع التقويم</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map((student, index) => (
                            <tr key={student.id}>
                                <td className="border border-gray-500 p-1 text-center">{index + 1}</td>
                                <td className="border border-gray-500 p-1 text-right font-semibold">{student.lastName} {student.firstName}</td>
                                {evaluationCriteria.map(criteria => (
                                    <td key={criteria.id} className="border border-gray-500 p-1 text-center font-bold">
                                        {scoresMap.get(student.id)?.[criteria.id] ?? ''}
                                    </td>
                                ))}
                                <td className="border border-gray-500 p-1 text-center font-bold text-base">
                                    {calculateTotal(student.id)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <footer className="print-footer mt-16 pt-4 text-sm">
                <div className="flex justify-around">
                    <div className="text-center">
                        <h4 className="font-bold text-base">إمضاء المفتش</h4>
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold text-base">إمضاء المدير</h4>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function PrintEvaluationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}