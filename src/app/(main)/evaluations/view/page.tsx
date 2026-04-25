
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Student, Evaluation, EvaluationCriteria } from '@/lib/types';
import { getCriteriaFor } from '@/lib/evaluation-criteria';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { Save, Loader2, Printer, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';


function EvaluationTable({ institutionId, level, semester }: { institutionId: string; level: string; semester: string; }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const evaluationCriteria = useMemo(() => getCriteriaFor(level, semester), [level, semester]);

    const studentsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'students'),
            where('institutionId', '==', institutionId),
            where('level', '==', level),
            where('userId', '==', user.uid)
        );
    }, [firestore, institutionId, level, user]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaIndicatorId: string]: number | null } }>({});

    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);

    // Fetch existing evaluations
    const evaluationsQuery = useMemoFirebase(() => {
       if (studentIds.length === 0 || !user) return null;
       return query(
           collection(firestore, 'evaluations'),
           where('studentId', 'in', studentIds),
           where('semester', '==', semester),
           where('userId', '==', user.uid)
       )
    }, [firestore, studentIds, semester, user]);
    const { data: existingEvals, isLoading: loadingEvals } = useCollection<Evaluation>(evaluationsQuery);
    
    useEffect(() => {
        if (existingEvals) {
            const newScores: { [studentId: string]: { [criteriaIndicatorId: string]: number | null } } = {};
            existingEvals.forEach(ev => {
                if (!newScores[ev.studentId]) {
                    newScores[ev.studentId] = {};
                }
                if (ev.criteriaId && ev.indicatorId !== undefined) {
                     newScores[ev.studentId][`${ev.criteriaId}_${ev.indicatorId}`] = ev.score;
                }
            });
            setScores(newScores);
        }
    }, [existingEvals]);


    const handleScoreChange = (studentId: string, criteriaId: string, indicatorIndex: number, value: string) => {
        const score = value === '' ? null : Number(value);
        const criteria = evaluationCriteria.find(c => c.id === criteriaId);
        if (!criteria) return;
        
        if (score !== null && (isNaN(score) || score < 0 )) {
            return;
        }

        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [`${criteriaId}_${indicatorIndex}`]: score,
            }
        }));
    };
    
    const handleTotalScoreChange = (studentId: string, value: string) => {
        let targetTotal = Number(value);
        if (isNaN(targetTotal) || targetTotal < 0 || targetTotal > 10) {
            toast({
                title: 'قيمة غير صالحة',
                description: 'الرجاء إدخال رقم بين 0 و 10.',
                variant: 'destructive',
            });
            return;
        }
    
        // Round to nearest 0.25
        targetTotal = Math.round(targetTotal * 4) / 4;
    
        const newStudentScores: { [criteriaIndicatorId: string]: number | null } = {};
        const criteriaTotals: { [criteriaId: string]: number } = {};
    
        // 1. Initialize scores and totals
        evaluationCriteria.forEach(crit => {
            criteriaTotals[crit.id] = 0;
            crit.indicators.forEach((_, indIndex) => {
                const scoreKey = `${crit.id}_${indIndex}`;
                newStudentScores[scoreKey] = 0;
            });
        });
    
        let scoreToDistribute = targetTotal;
        const step = 0.25;
        
        let availableIndicators = evaluationCriteria.flatMap(crit => {
            // Handle division by zero if a criterion has no indicators
            const maxPerIndicator = crit.indicators.length > 0 ? crit.maxScore / crit.indicators.length : 0;
            return crit.indicators.map((_, indIndex) => ({
                key: `${crit.id}_${indIndex}`,
                critId: crit.id,
                critMaxScore: crit.maxScore,
                indicatorMaxScore: maxPerIndicator,
            }))
        });
    
        let attempts = 0;
        const maxAttempts = (targetTotal / step) * 100; // Adjusted attempts
    
        while (scoreToDistribute > 0.001 && availableIndicators.length > 0 && attempts < maxAttempts) {
            const randomIndex = Math.floor(Math.random() * availableIndicators.length);
            const indicator = availableIndicators[randomIndex];
    
            const currentIndicatorScore = newStudentScores[indicator.key]!;
            const potentialIndicatorScore = currentIndicatorScore + step;
            const potentialCritTotal = criteriaTotals[indicator.critId] + step;
            
            // Check if adding the step exceeds either the indicator's max score or the criterion's max score
            if (potentialIndicatorScore <= indicator.indicatorMaxScore + 0.001 && potentialCritTotal <= indicator.critMaxScore + 0.001) {
                newStudentScores[indicator.key]! = potentialIndicatorScore;
                criteriaTotals[indicator.critId] += step;
                scoreToDistribute -= step;
            }
            
            const updatedIndicatorScore = newStudentScores[indicator.key]!;
            
            // If an indicator is now "full" (or very close to it), remove it from the pool for next attempts
            if (updatedIndicatorScore >= indicator.indicatorMaxScore - 0.001) {
                availableIndicators = availableIndicators.filter(ind => ind.key !== indicator.key);
            }
            
            // If a criterion's total is now "full", remove all its indicators from the pool
            if (criteriaTotals[indicator.critId] >= indicator.critMaxScore - 0.001) {
                 availableIndicators = availableIndicators.filter(ind => ind.critId !== indicator.critId);
            }
    
            attempts++;
        }
        
        // After the loop, some scores might not be perfect multiples of 0.25 due to floating point math
        // Let's clean them up
        for(const key in newStudentScores) {
            if(newStudentScores[key] !== null){
                newStudentScores[key] = parseFloat(newStudentScores[key]!.toFixed(2));
            }
        }
    
    
        if (scoreToDistribute > 0.01) {
            toast({
                title: 'خطأ في التوزيع',
                description: `لم يتم توزيع ${scoreToDistribute.toFixed(2)} نقطة. قد تكون النقطة الإجمالية أكبر من المجموع الممكن.`,
                variant: 'destructive',
            });
        }
    
        setScores(prev => ({
            ...prev,
            [studentId]: newStudentScores
        }));
    
        toast({
            title: 'تم التوزيع',
            description: `تم توزيع النقطة ${targetTotal} على المؤشرات بنجاح.`,
            variant: 'success'
        });
    };
    
    const calculateGrandTotal = (studentId: string) => {
        const studentScores = scores[studentId] || {};
        return Object.values(studentScores).reduce((acc: number, score: number | null) => acc + (score || 0), 0);
    };

    const handleSaveEvaluations = async () => {
        if (!user) {
            toast({ title: 'خطأ', description: 'يجب تسجيل الدخول للحفظ.', variant: 'destructive'});
            return;
        }
        setIsSaving(true);
        const batch = writeBatch(firestore);

        students?.forEach(student => {
            const studentScores = scores[student.id] || {};
            
            evaluationCriteria.forEach(crit => {
                crit.indicators.forEach((indicator, index) => {
                    const scoreKey = `${crit.id}_${index}`;
                    const score = studentScores[scoreKey];
                    const evalId = `${student.id}_${crit.id}_${index}_${semester}`;
                    const evalRef = doc(firestore, 'evaluations', evalId);
                    
                    batch.set(evalRef, {
                        studentId: student.id,
                        criteriaId: crit.id,
                        indicatorId: index,
                        semester: semester,
                        level: level,
                        institutionId: institutionId,
                        score: score ?? null,
                        userId: user.uid,
                    }, { merge: true });
                });
            });
        });

        try {
            await batch.commit();
            toast({
                title: 'تم الحفظ بنجاح',
                description: 'تم حفظ تقييمات التلاميذ.',
                variant: 'success'
            });
        } catch (error) {
            console.error("Error saving evaluations: ", error);
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء حفظ التقييمات.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePrint = () => {
        const params = new URLSearchParams();
        params.set('institutionId', institutionId);
        params.set('level', level);
        params.set('semester', semester);
        const printWindow = window.open(`/evaluations/print?${params.toString()}`, '_blank');
        printWindow?.focus();
    }

    const handleExport = () => {
        if (!students || students.length === 0) {
            toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
            return;
        }

        const fileName = `تقييم-${level}-الفصل-${semester}.xlsx`;

        const dataToExport = students.map(student => {
            const row: {[key: string]: any} = {
                'اللقب والاسم': `${student.lastName} ${student.firstName}`,
            };
            const studentScores = scores[student.id] || {};
            evaluationCriteria.forEach(crit => {
                crit.indicators.forEach((indicator, index) => {
                    row[`${crit.name} - ${indicator}`] = studentScores[`${crit.id}_${index}`] ?? '';
                })
            });
            row['العلامة من 10'] = calculateGrandTotal(student.id);
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `تقييم الفصل ${semester}`);
        XLSX.writeFile(workbook, fileName);
    };
    
    if (loadingStudents || loadingEvals) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /> <p className="ms-2">جاري تحميل بيانات التقييم...</p></div>
    }

    const groupedByCompetency = evaluationCriteria.reduce<Record<string, EvaluationCriteria[]>>((acc, crit) => {
        if (!acc[crit.competency]) {
            acc[crit.competency] = [];
        }
        acc[crit.competency].push(crit);
        return acc;
    }, {});
    
    const allIndicators = evaluationCriteria.flatMap(c => c.indicators);

    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>كشف تقييم {level} - الفصل {semester}</CardTitle>
                        <CardDescription>أدخل الدرجات لكل مؤشر، أو أدخل العلامة النهائية مباشرة في عمود "العلامة من 10".</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleExport} variant="outline" size="icon">
                            <FileDown className="h-5 w-5 text-green-600"/>
                            <span className="sr-only">تصدير Excel</span>
                        </Button>
                        <Button onClick={handlePrint} variant="outline" size="icon">
                            <Printer className="h-5 w-5"/>
                            <span className="sr-only">طباعة</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto print:overflow-visible">
                        <Table className="border min-w-full">
                           <TableHeader>
                                <TableRow>
                                    <TableHead rowSpan={3} className="sticky left-0 bg-card z-10 border-e min-w-[200px] align-middle">اللقب والاسم</TableHead>
                                     {Object.entries(groupedByCompetency).map(([competency, criteria]) => {
                                        const colSpan = criteria.reduce((acc, crit) => acc + crit.indicators.length, 0);
                                        return <TableHead key={competency} colSpan={colSpan} className="text-center">{competency}</TableHead>
                                    })}
                                    <TableHead rowSpan={3} className="text-center align-middle">
                                        <div>العلامة من 10</div>
                                        <div className="text-xs font-normal text-muted-foreground">(إدخال مباشر)</div>
                                    </TableHead>
                                </TableRow>
                                <TableRow>
                                    {Object.values(groupedByCompetency).flat().map(crit => (
                                        <TableHead key={crit.id} colSpan={crit.indicators.length} className="text-center p-1">
                                            <div>{crit.name} ({crit.maxScore})</div>
                                            {crit.description && <div className="text-xs font-normal text-muted-foreground">{crit.description}</div>}
                                        </TableHead>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    {evaluationCriteria.flatMap(c => c.indicators.map((indicator, i) => (
                                        <TableHead key={`${c.id}-${i}`} className="text-center text-xs p-1">{indicator}</TableHead>
                                    )))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students && students.length > 0 ? (
                                    students.map((student) => {
                                        const totalScore = calculateGrandTotal(student.id);
                                        return (
                                        <TableRow key={student.id}>
                                            <TableCell className="sticky left-0 bg-card z-10 border-e font-medium">{student.lastName} {student.firstName}</TableCell>
                                            {evaluationCriteria.flatMap(crit => (
                                                crit.indicators.map((_, indIndex) => (
                                                    <TableCell key={`${crit.id}-${indIndex}`} className="text-center p-1 min-w-[80px]">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.25"
                                                            value={scores[student.id]?.[`${crit.id}_${indIndex}`] ?? ''}
                                                            onChange={(e) => handleScoreChange(student.id, crit.id, indIndex, e.target.value)}
                                                            className="w-16 text-center mx-auto"
                                                        />
                                                    </TableCell>
                                                ))
                                            ))}
                                            <TableCell className="text-center font-bold text-lg text-primary align-top pt-2">
                                                 <div className="flex flex-col items-center gap-2">
                                                    <span className="h-6">{totalScore.toFixed(2)}</span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.25"
                                                        className="w-20 text-center mx-auto h-8 text-sm"
                                                        placeholder="مباشر"
                                                        onBlur={(e) => handleTotalScoreChange(student.id, e.target.value)}
                                                        key={`${student.id}-total`}
                                                    />
                                                 </div>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={allIndicators.length + 2} className="h-24 text-center">
                                            لا يوجد تلاميذ في هذا المستوى.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button onClick={handleSaveEvaluations} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin me-2" /> : <Save className="me-2" />}
                        حفظ التقييمات
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function EvaluationViewPage() {
    const searchParams = useSearchParams();
    const institutionId = searchParams.get('institutionId');
    const level = searchParams.get('level');
    const semester = searchParams.get('semester');
    
    if (!institutionId || !level || !semester) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>المعلمات المطلوبة (المؤسسة، المستوى، الفصل) غير متوفرة لعرض الجدول.</p>
            </div>
        );
    }
    
    return <EvaluationTable institutionId={institutionId} level={level} semester={semester} />;
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EvaluationViewPage />
        </Suspense>
    );
}
