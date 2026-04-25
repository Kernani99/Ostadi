
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCriteriaFor } from '@/lib/evaluation-criteria';
import type { EvaluationCriteria } from '@/lib/types';
import { Loader2, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// Simplified student type for local state
type LocalStudent = {
    id: string;
    firstName: string;
    lastName: string;
};

type DemoData = {
    students: LocalStudent[];
    level: string;
    semester: string;
};

function EvaluationTable() {
    const { toast } = useToast();
    const [demoData, setDemoData] = useState<DemoData | null>(null);
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaIndicatorId: string]: number | null } }>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const dataString = sessionStorage.getItem('evaluationDemoData');
            if (dataString) {
                const data = JSON.parse(dataString);
                setDemoData(data);
            }
        } catch (error) {
            console.error("Failed to parse demo data from sessionStorage", error);
            toast({ title: "خطأ", description: "لم نتمكن من تحميل بيانات المحاكاة.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const { level, semester, students } = demoData || {};

    const evaluationCriteria = useMemo(() => getCriteriaFor(level || '', semester || ''), [level, semester]);
    
    const groupedByCompetency = useMemo(() => evaluationCriteria.reduce<Record<string, EvaluationCriteria[]>>((acc, crit) => {
        if (!acc[crit.competency]) acc[crit.competency] = [];
        acc[crit.competency].push(crit);
        return acc;
    }, {}), [evaluationCriteria]);

    const handleScoreChange = (studentId: string, criteriaId: string, indicatorIndex: number, value: string) => {
        const score = value === '' ? null : Number(value);
        if (score !== null && (isNaN(score) || score < 0)) return;

        setScores(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [`${criteriaId}_${indicatorIndex}`]: score }
        }));
    };

    const handleTotalScoreChange = (studentId: string, value: string) => {
        let targetTotal = Number(value);
        if (isNaN(targetTotal) || targetTotal < 0 || targetTotal > 10) {
            toast({ title: 'قيمة غير صالحة', description: 'الرجاء إدخال رقم بين 0 و 10.', variant: 'destructive' });
            return;
        }
        targetTotal = Math.round(targetTotal * 4) / 4;

        const newStudentScores: { [criteriaIndicatorId: string]: number | null } = {};
        const criteriaTotals: { [criteriaId: string]: number } = {};

        evaluationCriteria.forEach(crit => {
            criteriaTotals[crit.id] = 0;
            crit.indicators.forEach((_, indIndex) => { newStudentScores[`${crit.id}_${indIndex}`] = 0; });
        });

        let scoreToDistribute = targetTotal;
        const step = 0.25;
        
        let availableIndicators = evaluationCriteria.flatMap(crit => {
            const maxPerIndicator = crit.indicators.length > 0 ? crit.maxScore / crit.indicators.length : 0;
            return crit.indicators.map((_, indIndex) => ({
                key: `${crit.id}_${indIndex}`,
                critId: crit.id,
                critMaxScore: crit.maxScore,
                indicatorMaxScore: maxPerIndicator,
            }))
        });

        let attempts = 0;
        const maxAttempts = (targetTotal / step) * 100;

        while (scoreToDistribute > 0.001 && availableIndicators.length > 0 && attempts < maxAttempts) {
            const randomIndex = Math.floor(Math.random() * availableIndicators.length);
            const indicator = availableIndicators[randomIndex];

            const currentIndicatorScore = newStudentScores[indicator.key]!;
            const potentialIndicatorScore = currentIndicatorScore + step;
            const potentialCritTotal = criteriaTotals[indicator.critId] + step;

            if (potentialIndicatorScore <= indicator.indicatorMaxScore + 0.001 && potentialCritTotal <= indicator.critMaxScore + 0.001) {
                newStudentScores[indicator.key] = parseFloat(potentialIndicatorScore.toFixed(2));
                criteriaTotals[indicator.critId] += step;
                scoreToDistribute -= step;
            }
            
            const updatedIndicatorScore = newStudentScores[indicator.key]!;
            
            if (updatedIndicatorScore >= indicator.indicatorMaxScore - 0.001) {
                availableIndicators = availableIndicators.filter(ind => ind.key !== indicator.key);
            }
            
            if (criteriaTotals[indicator.critId] >= indicator.critMaxScore - 0.001) {
                 availableIndicators = availableIndicators.filter(ind => ind.critId !== indicator.critId);
            }
            attempts++;
        }

        if (scoreToDistribute > 0.01) {
            toast({ title: 'خطأ في التوزيع', description: `لم يتم توزيع ${scoreToDistribute.toFixed(2)} نقطة.`, variant: 'destructive' });
        }

        setScores(prev => ({ ...prev, [studentId]: newStudentScores }));
        toast({ title: 'تم التوزيع', description: `تم توزيع النقطة ${targetTotal} على المؤشرات.`, variant: 'success' });
    };

    const calculateGrandTotal = (studentId: string) => {
        const studentScores = scores[studentId] || {};
        return Object.values(studentScores).reduce((acc: number, score: number | null) => acc + (score || 0), 0);
    };

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

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (!demoData || !students || students.length === 0 || !level || !semester) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                <h1 className="text-2xl font-bold">لم يتم العثور على بيانات المحاكاة</h1>
                <p className="text-muted-foreground">الرجاء العودة إلى صفحة الإعداد وبدء تقييم جديد.</p>
                <Button asChild><Link href="/evaluations-demo">العودة إلى الإعداد</Link></Button>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-8">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    @page { size: A4 landscape; margin: 1cm; }
                    .print-table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .print-table th, .print-table td { border: 1px solid black; padding: 1px; text-align: center; font-size: 8pt; vertical-align: middle; }
                    .print-table th { font-weight: bold; background-color: #f2f2f2 !important; }
                    .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); max-width: 20px; white-space: normal;}
                }
            `}</style>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between no-print">
                    <div>
                        <CardTitle>جدول تقييم المحاكاة</CardTitle>
                        <CardDescription>{level} - الفصل {semester}</CardDescription>
                    </div>
                    <Button onClick={handleExport} variant="outline"><FileDown className="me-2 text-green-600"/> تحميل (Excel)</Button>
                </CardHeader>
                <CardContent>
                     {/* Print Header */}
                     <div className="hidden print:block mb-4 space-y-1">
                        <h1 className="text-center font-bold text-base my-2">التقويم المستمر في التعليم الابتدائي لمادة التربية البدنية والرياضية - الفصل ${semester}</h1>
                        <div className="text-sm text-center">القسم: {level}</div>
                    </div>
                     <Table className="border min-w-full print-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead rowSpan={3} className="sticky left-0 bg-card z-10 border-e min-w-[200px] align-middle print:bg-gray-100">اللقب والاسم</TableHead>
                                 {Object.entries(groupedByCompetency).map(([competency, criteria]) => (
                                    <TableHead key={competency} colSpan={criteria.reduce((acc, crit) => acc + crit.indicators.length, 0)} className="text-center">{competency}</TableHead>
                                ))}
                                <TableHead rowSpan={3} className="text-center align-middle w-28">
                                    <div>العلامة من 10</div>
                                    <div className="text-xs font-normal text-muted-foreground no-print">(إدخال مباشر)</div>
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
                            {students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="sticky left-0 bg-card z-10 border-e font-medium print:bg-white">{student.lastName} {student.firstName}</TableCell>
                                    {evaluationCriteria.flatMap(crit => (
                                        crit.indicators.map((_, indIndex) => (
                                            <TableCell key={`${crit.id}-${indIndex}`} className="text-center p-1 min-w-[80px]">
                                                <Input
                                                    type="number" min="0" step="0.25"
                                                    value={scores[student.id]?.[`${crit.id}_${indIndex}`] ?? ''}
                                                    onChange={(e) => handleScoreChange(student.id, crit.id, indIndex, e.target.value)}
                                                    className="w-16 text-center mx-auto no-print"
                                                />
                                                <span className="hidden print:inline">{scores[student.id]?.[`${crit.id}_${indIndex}`] ?? ''}</span>
                                            </TableCell>
                                        ))
                                    ))}
                                    <TableCell className="text-center font-bold text-lg text-primary align-top pt-2">
                                         <div className="flex flex-col items-center gap-2">
                                            <span className="h-6">{calculateGrandTotal(student.id).toFixed(2)}</span>
                                            <Input
                                                type="number" min="0" max="10" step="0.25"
                                                className="w-20 text-center mx-auto h-8 text-sm no-print"
                                                placeholder="مباشر"
                                                onBlur={(e) => handleTotalScoreChange(student.id, e.target.value)}
                                                key={`${student.id}-total`}
                                            />
                                         </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EvaluationTable />
        </Suspense>
    );
}
