
'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Student, Institution, ProfessorProfile, Evaluation, EvaluationCriteria } from '@/lib/types';
import { collection, query, where, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// This is the same criteria definition from the evaluations page.
const FIRST_YEAR_CRITERIA: Omit<EvaluationCriteria, 'id' | 'semester'>[] = [
    { name: 'سلوك المتعلم', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'الغيابات و التأخرات', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'البدلة الرياضية', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'المشاركة الفعالة في الحصة', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'التحكم في مختلف وضعيات الجسم', level: 'أولى ابتدائي', maxScore: 2 },
];

function PrintContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const institutionId = searchParams.get('institutionId');
    const level = searchParams.get('level');
    const semester = searchParams.get('semester');

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

    const evaluationCriteria = useMemo(() => FIRST_YEAR_CRITERIA.map((c, i) => ({ ...c, id: `fy_crit_${i}`, semester: semester || '1' })), [semester]);

    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);
    const evaluationsQuery = useMemoFirebase(() => {
        if (studentIds.length === 0 || !semester) return null;
        return query(collection(firestore, 'evaluations'), where('studentId', 'in', studentIds), where('semester', '==', semester));
    }, [firestore, studentIds, semester]);
    const { data: evaluations, isLoading: loadingEvals } = useCollection<Evaluation>(evaluationsQuery);

    // --- Data Processing ---
    const scoresMap = useMemo(() => {
        const map = new Map<string, { [criteriaId: string]: number }>();
        evaluations?.forEach(ev => {
            if (!map.has(ev.studentId)) {
                map.set(ev.studentId, {});
            }
            map.get(ev.studentId)![ev.criteriaId] = ev.score ?? 0;
        });
        return map;
    }, [evaluations]);
    
    const sortedStudents = useMemo(() => students?.sort((a,b) => a.lastName.localeCompare(b.lastName)) || [], [students]);

    const calculateTotal = (studentId: string) => {
        const studentScores = scoresMap.get(studentId) || {};
        return Object.values(studentScores).reduce((acc, score) => acc + (score || 0), 0);
    };
    
    // --- Effects ---
    const isLoading = loadingProfile || loadingInstitution || loadingStudents || loadingEvals;
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

    return (
        <div className="p-4 bg-white text-black font-body text-xs">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 portrait; margin: 0.5in; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { page-break-inside: auto; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .print-table th, .print-table td { font-size: 9pt; padding: 4px; }
                    .print-table th { white-space: normal; vertical-align: middle; }
                    .print-table thead tr { background-color: transparent !important; }
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
                    كشف تقييم {level} - الفصل {semester}
                </h1>
            </header>

            <main>
                <table className="w-full border-collapse border border-gray-600 print-table">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-500 p-1">الرقم</th>
                            <th className="border border-gray-500 p-1 text-right">اللقب والإسم</th>
                            {evaluationCriteria.map(criteria => (
                                <th key={criteria.id} className="border border-gray-500 p-1 w-20">
                                    {criteria.name} (/{criteria.maxScore})
                                </th>
                            ))}
                             <th className="border border-gray-500 p-1 w-24">مجموع التقويم المستمر</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map((student, index) => (
                            <tr key={student.id}>
                                <td className="border border-gray-500 p-1 text-center">{index + 1}</td>
                                <td className="border border-gray-500 p-1">{student.lastName} {student.firstName}</td>
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


export default function PrintEvaluationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}
