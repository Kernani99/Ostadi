
'use client';

import { useState, useMemo, useEffect, Suspense, FC } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCriteriaFor } from '@/lib/evaluation-criteria';
import type { EvaluationCriteria } from '@/lib/types';
import { Save, Loader2, Printer, FileDown, PlusCircle, Trash2, Pencil, Users, User, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


// Simplified student type for local state
type LocalStudent = {
    id: string;
    firstName: string;
    lastName: string;
};

const studentFormSchema = z.object({
  firstName: z.string().min(1, "الإسم الأول مطلوب"),
  lastName: z.string().min(1, "اللقب مطلوب"),
});
type StudentFormValues = z.infer<typeof studentFormSchema>;


const StudentDialog: FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: LocalStudent | null;
    onSave: (student: LocalStudent) => void;
}> = ({ open, onOpenChange, student, onSave }) => {
    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: { firstName: '', lastName: '' },
    });

    useEffect(() => {
        if (student) {
            form.reset(student);
        } else {
            form.reset({ firstName: '', lastName: '' });
        }
    }, [student, form, open]);

    const onSubmit = (data: StudentFormValues) => {
        onSave({
            id: student?.id || new Date().toISOString(),
            ...data
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{student ? 'تعديل تلميذ' : 'إضافة تلميذ'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem><FormLabel>اللقب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem><FormLabel>الإسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">حفظ</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


function EvaluationDemoPage() {
    const { toast } = useToast();
    const [level, setLevel] = useState<string>('');
    const [semester, setSemester] = useState<string>('');
    const [students, setStudents] = useState<LocalStudent[]>([{id: '1', lastName: 'تلميذ', firstName: 'تجريبي'}]);
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaIndicatorId: string]: number | null } }>({});
    
    // Student Dialog State
    const [isStudentDialogOpen, setStudentDialogOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<LocalStudent | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<LocalStudent | null>(null);

    const evaluationCriteria = useMemo(() => getCriteriaFor(level, semester), [level, semester]);
    const groupedByCompetency = useMemo(() => evaluationCriteria.reduce<Record<string, EvaluationCriteria[]>>((acc, crit) => {
        if (!acc[crit.competency]) acc[crit.competency] = [];
        acc[crit.competency].push(crit);
        return acc;
    }, {}), [evaluationCriteria]);
    const allIndicators = useMemo(() => evaluationCriteria.flatMap(c => c.indicators), [evaluationCriteria]);

    const handleSaveStudent = (studentData: LocalStudent) => {
        setStudents(prev => {
            const exists = prev.some(s => s.id === studentData.id);
            if (exists) {
                return prev.map(s => s.id === studentData.id ? studentData : s);
            }
            return [...prev, studentData];
        });
    };
    
    const handleOpenStudentDialog = (student: LocalStudent | null = null) => {
        setStudentToEdit(student);
        setStudentDialogOpen(true);
    }
    
    const confirmDeleteStudent = () => {
        if (studentToDelete) {
            setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
            setStudentToDelete(null);
        }
    };


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
        toast({ title: 'تم التوزيع', description: `تم توزيع النقطة ${targetTotal} على المؤشرات.` });
    };

    const calculateGrandTotal = (studentId: string) => {
        const studentScores = scores[studentId] || {};
        return Object.values(studentScores).reduce((acc: number, score: number | null) => acc + (score || 0), 0);
    };

    const handlePrint = () => { window.print(); };

    return (
        <div className="space-y-6">
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
             <StudentDialog open={isStudentDialogOpen} onOpenChange={setStudentDialogOpen} student={studentToEdit} onSave={handleSaveStudent} />
             <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف التلميذ {studentToDelete?.lastName} {studentToDelete?.firstName}؟</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteStudent}>حذف</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>

            <div className="text-center no-print">
                <h1 className="text-3xl font-bold text-primary">محاكي التقييم المستمر</h1>
                <p className="text-muted-foreground mt-2">أداة لتجربة إدخال وطباعة كشوف التقييم. البيانات لا يتم حفظها.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="no-print">
                    <CardHeader><CardTitle>1. إعداد التقييم</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Select onValueChange={setSemester} value={semester}>
                            <SelectTrigger><SelectValue placeholder="اختر الفصل الدراسي..." /></SelectTrigger>
                            <SelectContent><SelectItem value="1">الفصل الأول</SelectItem><SelectItem value="2">الفصل الثاني</SelectItem><SelectItem value="3">الفصل الثالث</SelectItem></SelectContent>
                        </Select>
                        <Select onValueChange={setLevel} value={level}>
                            <SelectTrigger><SelectValue placeholder="اختر المستوى الدراسي..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem><SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem><SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                                <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem><SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="no-print">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>2. إدارة التلاميذ ({students.length})</CardTitle>
                            <Button size="sm" onClick={() => handleOpenStudentDialog()}><PlusCircle className="me-2" />إضافة</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-48 overflow-y-auto">
                        {students.length > 0 ? (
                            <div className="space-y-2">
                                {students.map(s => (
                                    <div key={s.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                        <p>{s.lastName} {s.firstName}</p>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenStudentDialog(s)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStudentToDelete(s)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground text-center">الرجاء إضافة تلاميذ.</p>}
                    </CardContent>
                </Card>
            </div>

            {level && semester && (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between no-print">
                        <div>
                            <CardTitle>3. جدول التقييم</CardTitle>
                            <CardDescription>أدخل الدرجات لكل مؤشر، أو استخدم الإدخال المباشر في عمود العلامة النهائية.</CardDescription>
                        </div>
                        <Button onClick={handlePrint} variant="outline"><Printer className="me-2"/> طباعة</Button>
                    </CardHeader>
                    <CardContent className="print:overflow-visible">
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
                                {students.length > 0 ? (
                                    students.map((student) => (
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
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={allIndicators.length + 2} className="h-24 text-center">لا يوجد تلاميذ.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EvaluationDemoPage />
        </Suspense>
    );
}

    