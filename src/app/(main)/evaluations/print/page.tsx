
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

const OTHER_YEARS_CRITERIA: Omit<EvaluationCriteria, 'id' | 'semester'>[] = [
    { name: 'السلوك والانضباط', level: 'other', maxScore: 2 },
    { name: 'المواظبة (غياب/تأخر)', level: 'other', maxScore: 1 },
    { name: 'البدلة الرياضية', level: 'other', maxScore: 1 },
    { name: 'المشاركة الإيجابية', level: 'other', maxScore: 2 },
    { name: 'إنجاز التمارين الفردية', level: 'other', maxScore: 2 },
    { name: 'التنسيق في التمارين الجماعية', level: 'other', maxScore: 2 },
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

    const evaluationCriteria = useMemo(() => {
        let criteria: Omit<EvaluationCriteria, 'id' | 'semester'>[] = [];
         if (level === 'أولى ابتدائي') {
            criteria = FIRST_YEAR_CRITERIA;
        } else if (['ثانية ابتدائي', 'ثالثة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي'].includes(level || '')) {
            criteria = OTHER_YEARS_CRITERIA;
        }
        return criteria.map((c, i) => ({ ...c, id: `crit_${i}`, semester: semester || '1' }));
    }, [level, semester]);

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
            if (ev.criteriaId && ev.criteriaId !== 'observation' && ev.score !== null) {
                if (!map.has(ev.studentId)) {
                    map.set(ev.studentId, {});
                }
                const criteriaIdentifier = evaluationCriteria.find(c => c.id === ev.criteriaId || c.name === ev.criteriaId); // fallback for old data
                 if (criteriaIdentifier) {
                    map.get(ev.studentId)![criteriaIdentifier.id] = ev.score;
                }
            }
        });
        return map;
    }, [evaluations, evaluationCriteria]);
    
    const observationsMap = useMemo(() => {
        const map = new Map<string, string>();
        evaluations?.forEach(ev => {
            if (ev.criteriaId === 'observation' && ev.observation) {
                map.set(ev.studentId, ev.observation);
            }
        });
        return map;
    }, [evaluations]);

    const sortedStudents = useMemo(() => students?.sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)) || [], [students]);

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

    if (!students || students.length === 0 || evaluationCriteria.length === 0) {
        return <div className="flex h-screen items-center justify-center">لا توجد بيانات لعرضها.</div>;
    }

    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();

    return (
        <div className="p-4 bg-white text-black font-body text-xs">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    @page { size: A4 portrait; margin: 1cm; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { page-break-inside: auto; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .print-table th, .print-table td { font-size: 8pt; padding: 4px; word-break: break-word; }
                    .print-table th { white-space: normal; vertical-align: middle; }
                    .print-table thead tr { background-color: transparent !important; }
                }
            `}</style>
             <header className="print-header text-center mb-4 space-y-1">
                <h1 className="text-base font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-sm font-semibold">المدرسة الابتدائية: {institution?.name || '...'}</h2>
                <div className="flex justify-between text-xs">
                    <span>السنة الدراسية: {profileData?.schoolYear || '...'}</span>
                    <span>الأستاذ(ة): {professorName || '...'}</span>
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
                                <th key={criteria.id} className="border border-gray-500 p-1 w-16">
                                    {criteria.name} (/{criteria.maxScore})
                                </th>
                            ))}
                             <th className="border border-gray-500 p-1 w-20">مجموع التقويم المستمر</th>
                             <th className="border border-gray-500 p-1 w-48">الملاحظة</th>
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
                                <td className="border border-gray-500 p-1 text-center">
                                    {observationsMap.get(student.id) || ''}
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
