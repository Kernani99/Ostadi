'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Student, Institution, ProfessorProfile, Evaluation, EvaluationCriteria } from '@/lib/types';
import { collection, query, where, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const EVALUATION_CRITERIA: Omit<EvaluationCriteria, 'id' | 'semester'>[] = [
    { name: 'المعيار 01', indicators: ['المؤشر 1', 'المؤشر 2', 'المؤشر 3'], maxScore: 2 },
    { name: 'المعيار 02', indicators: ['المؤشر 1', 'المؤشر 2', 'المؤشر 3', 'المؤشر 4'], maxScore: 2 },
    { name: 'المعيار 03', indicators: ['المؤشر 1', 'المؤشر 2', 'المؤشر 3', 'المؤشر 4'], maxScore: 2 },
    { name: 'المعيار 04', indicators: ['التفاعل', 'المبادرة', 'الالتزام بالتعليمات', 'إنجاز المهام'], maxScore: 4 },
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
        return EVALUATION_CRITERIA.map((c, i) => ({ ...c, id: `crit_${i}`, semester: semester || '1' }));
    }, [semester]);


    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);
    const evaluationsQuery = useMemoFirebase(() => {
        if (studentIds.length === 0 || !semester) return null;
        return query(collection(firestore, 'evaluations'), where('studentId', 'in', studentIds), where('semester', '==', semester));
    }, [firestore, studentIds, semester]);
    const { data: evaluations, isLoading: loadingEvals } = useCollection<Evaluation>(evaluationsQuery);

    // --- Data Processing ---
    const scoresMap = useMemo(() => {
        const map = new Map<string, { [criteriaIndicatorId: string]: number }>();
        evaluations?.forEach(ev => {
            if (ev.criteriaId && ev.indicatorId && ev.score !== null) {
                 if (!map.has(ev.studentId)) {
                    map.set(ev.studentId, {});
                }
                map.get(ev.studentId)![`${ev.criteriaId}_${ev.indicatorId}`] = ev.score;
            }
        });
        return map;
    }, [evaluations]);
    
    const sortedStudents = useMemo(() => students?.sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)) || [], [students]);

    const calculateCriteriaTotal = (studentId: string, criteriaId: string) => {
        const studentScores = scoresMap.get(studentId) || {};
        const criteria = evaluationCriteria.find(c => c.id === criteriaId);
        if (!criteria) return 0;
        
        let total = 0;
        criteria.indicators.forEach((indicator, index) => {
             const key = `${criteriaId}_${index}`;
             total += studentScores[key] || 0;
        });
        return total;
    };
    
    const calculateGrandTotal = (studentId: string) => {
        let grandTotal = 0;
        evaluationCriteria.forEach(criteria => {
            grandTotal += calculateCriteriaTotal(studentId, criteria.id);
        });
        return grandTotal;
    }
    
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
                    .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
                }
            `}</style>
             <header className="print-header mb-4 space-y-1">
                <div className="grid grid-cols-3 text-sm">
                    <div>المؤسسة: {institution?.name || '...'}</div>
                    <div className="text-center">السنة الدراسية: {schoolYear}</div>
                    <div className="text-left">الأستاذ: {professorName}</div>
                     <div>القسم: {level}</div>
                </div>
                <h1 className="text-center font-bold text-base my-2">التقويم المستمر في التعليم الابتدائي لمادة التربية البدنية والرياضية</h1>
                 <div className="text-sm">الكفاءة الختامية: ....................................................................</div>
            </header>

            <main>
                <table className="print-table">
                    <thead>
                         <tr>
                            <th rowSpan={3} className="w-[150px]">اللقب والاسم</th>
                            <th colSpan={11}>التحكم في مختلف وضعيات الجسم</th>
                            <th colSpan={4}>مشاركة التلميذ في الفوج التربوي</th>
                            <th rowSpan={3} className="vertical-text w-[30px]">العلامة من 10</th>
                        </tr>
                        <tr>
                            <th colSpan={3}>المعيار 01 (2) نقطة</th>
                            <th colSpan={4}>المعيار 02 (2) نقطة</th>
                            <th colSpan={4}>المعيار 03 (2) نقطة</th>
                            <th colSpan={4}>المعيار 04 (4) نقطة</th>
                        </tr>
                        <tr>
                             {evaluationCriteria.flatMap(c => c.indicators.map(ind => <th key={`${c.id}-${ind}`} className="vertical-text text-xs p-1">{ind}</th>))}
                        </tr>
                    </thead>
                    <tbody>
                         {sortedStudents.map((student, index) => (
                            <tr key={student.id}>
                                <td className="text-right p-1">{index + 1}- {student.lastName} {student.firstName}</td>
                                {evaluationCriteria.flatMap(criteria => (
                                    criteria.indicators.map((indicator, indIndex) => (
                                        <td key={`${criteria.id}-${indIndex}`}>
                                            {scoresMap.get(student.id)?.[`${criteria.id}_${indIndex}`] ?? ''}
                                        </td>
                                    ))
                                ))}
                                <td className="font-bold">{calculateGrandTotal(student.id)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
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
