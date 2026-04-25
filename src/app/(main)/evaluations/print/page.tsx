
'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Student, Institution, ProfessorProfile, Evaluation, EvaluationCriteria } from '@/lib/types';
import { getCriteriaFor } from '@/lib/evaluation-criteria';
import { collection, query, where, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

function PrintContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const searchParams = useSearchParams();

    const institutionId = searchParams.get('institutionId');
    const level = searchParams.get('level');
    const semester = searchParams.get('semester');

    // --- Data Fetching ---
    const profileDocRef = useMemoFirebase(() => user ? doc(firestore, 'professor_profile', user.uid) : null, [firestore, user]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    const institutionDocRef = useMemoFirebase(() => institutionId && user ? doc(firestore, 'institutions', institutionId) : null, [firestore, institutionId, user]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !institutionId || !level || !user) return null;
        return query(collection(firestore, 'students'), where('institutionId', '==', institutionId), where('level', '==', level), where('userId', '==', user.uid));
    }, [firestore, institutionId, level, user]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
    
    const evaluationCriteria = useMemo(() => {
        if (!level || !semester) return [];
        return getCriteriaFor(level, semester);
    }, [level, semester]);


    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);
    const evaluationsQuery = useMemoFirebase(() => {
        if (studentIds.length === 0 || !semester || !user) return null;
        return query(collection(firestore, 'evaluations'), where('studentId', 'in', studentIds), where('semester', '==', semester), where('userId', '==', user.uid));
    }, [firestore, studentIds, semester, user]);
    const { data: evaluations, isLoading: loadingEvals } = useCollection<Evaluation>(evaluationsQuery);

    // --- Data Processing ---
    const scoresMap = useMemo(() => {
        const map = new Map<string, { [criteriaIndicatorId: string]: number }>();
        evaluations?.forEach(ev => {
            if (ev.criteriaId && ev.indicatorId !== undefined && ev.score !== null) {
                 if (!map.has(ev.studentId)) {
                    map.set(ev.studentId, {});
                }
                map.get(ev.studentId)![`${ev.criteriaId}_${ev.indicatorId}`] = ev.score;
            }
        });
        return map;
    }, [evaluations]);
    
    const sortedStudents = useMemo(() => students?.sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)) || [], [students]);
    
    const calculateGrandTotal = (studentId: string) => {
        const studentScores = scoresMap.get(studentId) || {};
        let grandTotal = 0;
        Object.values(studentScores).forEach(score => {
            grandTotal += score || 0;
        });
        return grandTotal;
    }

    const groupedByCompetency = useMemo(() => {
        return evaluationCriteria.reduce<Record<string, EvaluationCriteria[]>>((acc, crit) => {
            if (!acc[crit.competency]) {
                acc[crit.competency] = [];
            }
            acc[crit.competency].push(crit);
            return acc;
        }, {});
    }, [evaluationCriteria]);
    
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
                    .print-table th, .print-table td { border: 1px solid black; padding: 1px; text-align: center; font-size: 8pt; vertical-align: middle; }
                    .print-table th { font-weight: bold; background-color: #f2f2f2 !important; }
                    .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); max-width: 20px; white-space: normal;}
                }
            `}</style>
             <header className="print-header mb-4 space-y-1">
                <div className="grid grid-cols-3 text-sm">
                    <div>المؤسسة: {institution?.name || '...'}</div>
                    <div className="text-center">السنة الدراسية: {schoolYear}</div>
                    <div className="text-left">الأستاذ: {professorName}</div>
                     <div>القسم: {level}</div>
                </div>
                <h1 className="text-center font-bold text-base my-2">التقويم المستمر في التعليم الابتدائي لمادة التربية البدنية والرياضية - الفصل ${semester}</h1>
                 <div className="text-sm">الكفاءة الختامية: ينفذ حركات قاعدية مبنية على تكامل وظائف جسمه</div>
            </header>

            <main>
                <table className="print-table">
                    <thead>
                         <tr>
                            <th rowSpan={3} className="w-[120px]">اللقب والاسم</th>
                            {Object.entries(groupedByCompetency).map(([competency, criteria]) => {
                                const colSpan = criteria.reduce((acc, crit) => acc + crit.indicators.length, 0);
                                return <th key={competency} colSpan={colSpan}>{competency}</th>
                            })}
                            <th rowSpan={3} className="vertical-text w-[25px]">العلامة من 10</th>
                        </tr>
                        <tr>
                            {Object.values(groupedByCompetency).flat().map(crit => (
                                <th key={crit.id} colSpan={crit.indicators.length} className="p-1">
                                    <div>{crit.name} ({crit.maxScore})</div>
                                    {crit.description && <div className="text-xs font-normal">{crit.description}</div>}
                                </th>
                            ))}
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

    