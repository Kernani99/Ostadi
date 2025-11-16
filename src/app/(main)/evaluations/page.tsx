
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution, Student, Evaluation, EvaluationCriteria } from '@/lib/types';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { ChevronRight, Save, Loader2, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


const FIRST_YEAR_CRITERIA: Omit<EvaluationCriteria, 'id' | 'semester'>[] = [
    { name: 'سلوك المتعلم', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'الغيابات و التأخرات', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'البدلة الرياضية', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'المشاركة الفعالة في الحصة', level: 'أولى ابتدائي', maxScore: 2 },
    { name: 'التحكم في مختلف وضعيات الجسم', level: 'أولى ابتدائي', maxScore: 2 },
];


function FirstYearEvaluationTable({ institutionId, level, semester }: { institutionId: string; level: string; semester: string; }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Fetch students
    const studentsQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, 'students'),
            where('institutionId', '==', institutionId),
            where('level', '==', level)
        );
    }, [firestore, institutionId, level]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    // Hardcoded criteria for now
    const evaluationCriteria = useMemo(() => FIRST_YEAR_CRITERIA.map((c, i) => ({...c, id: `fy_crit_${i}`})), []);

    // State for scores
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number | null } }>({});

     // Fetch existing evaluations
    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);
    const evaluationsQuery = useMemoFirebase(() => {
       if (studentIds.length === 0) return null;
       return query(
           collection(firestore, 'evaluations'),
           where('studentId', 'in', studentIds),
           where('semester', '==', semester)
       )
    }, [firestore, studentIds, semester]);
    const { data: existingEvals, isLoading: loadingEvals } = useCollection<Evaluation>(evaluationsQuery);

    // Populate scores from existing evaluations
    useEffect(() => {
        if (existingEvals) {
            const newScores = { ...scores };
            existingEvals.forEach(ev => {
                if (!newScores[ev.studentId]) {
                    newScores[ev.studentId] = {};
                }
                newScores[ev.studentId][ev.criteriaId] = ev.score;
            });
            setScores(newScores);
        }
    }, [existingEvals]);


    const handleScoreChange = (studentId: string, criteriaId: string, value: string) => {
        const score = value === '' ? null : Number(value);
        const maxScore = evaluationCriteria.find(c => c.id === criteriaId)?.maxScore ?? 2;
        if (score !== null && (isNaN(score) || score < 0 || score > maxScore)) {
            return;
        }

        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [criteriaId]: score,
            }
        }));
    };

    const calculateTotal = (studentId: string) => {
        const studentScores = scores[studentId] || {};
        return Object.values(studentScores).reduce((acc, score) => acc + (score || 0), 0);
    };

    const handleSaveEvaluations = async () => {
        setIsSaving(true);
        const batch = writeBatch(firestore);

        students?.forEach(student => {
            const studentScores = scores[student.id] || {};
            evaluationCriteria.forEach(criteria => {
                const score = studentScores[criteria.id];
                if (score !== undefined) {
                    const evalId = `${student.id}_${criteria.id}_${semester}`;
                    const evalRef = doc(firestore, 'evaluations', evalId);
                    batch.set(evalRef, {
                        studentId: student.id,
                        criteriaId: criteria.id,
                        semester: semester,
                        score: score,
                    });
                }
            });
        });

        try {
            await batch.commit();
            toast({
                title: 'تم الحفظ بنجاح',
                description: 'تم حفظ تقييمات التلاميذ.',
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
    
    if (loadingStudents || loadingEvals) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>جدول تقييم السنة الأولى ابتدائي - الفصل {semester}</CardTitle>
                    <CardDescription>أدخل الدرجات لكل تلميذ. المجموع سيتم حسابه تلقائياً.</CardDescription>
                </div>
                 <Button onClick={handlePrint} variant="outline" size="icon">
                    <Printer className="h-5 w-5"/>
                    <span className="sr-only">طباعة</span>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table className="border min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card z-10 border-e min-w-[50px] text-center">الرقم</TableHead>
                                <TableHead className="sticky left-12 bg-card z-10 border-e min-w-[200px]">الاسم واللقب</TableHead>
                                {evaluationCriteria.map(criteria => (
                                    <TableHead key={criteria.id} className="text-center min-w-[150px] whitespace-nowrap">
                                        {criteria.name} (/{criteria.maxScore})
                                    </TableHead>
                                ))}
                                <TableHead className="text-center min-w-[120px]">مجموع التقويم المستمرة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students && students.length > 0 ? (
                                students.map((student, index) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="sticky left-0 bg-card z-10 border-e text-center font-medium">{index + 1}</TableCell>
                                        <TableCell className="sticky left-12 bg-card z-10 border-e font-medium">{student.lastName} {student.firstName}</TableCell>
                                        {evaluationCriteria.map(criteria => (
                                            <TableCell key={criteria.id} className="text-center p-1">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={criteria.maxScore}
                                                    step="0.25"
                                                    value={scores[student.id]?.[criteria.id] ?? ''}
                                                    onChange={(e) => handleScoreChange(student.id, criteria.id, e.target.value)}
                                                    className="w-20 text-center mx-auto"
                                                />
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-center font-bold text-lg text-primary">
                                            {calculateTotal(student.id)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={evaluationCriteria.length + 3} className="h-24 text-center">
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
    );
}


export default function EvaluationsPage() {
  const firestore = useFirestore();
  const [semester, setSemester] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [showTable, setShowTable] = useState(false);

  const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
    useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
  );

  const handleStartEvaluation = () => {
    if (semester && institutionId && level) {
      setShowTable(true);
    }
  };

  const renderEvaluationTable = () => {
    if (!showTable) return null;

    if (level === 'أولى ابتدائي') {
      return <FirstYearEvaluationTable institutionId={institutionId} level={level} semester={semester} />;
    }
    
    return (
        <Card className="mt-8">
            <CardHeader><CardTitle>جدول التقييم</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground">جدول التقييم لهذا المستوى لم يتم إعداده بعد.</p>
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          قسم التقييم
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>

      {!showTable ? (
        <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>إعدادات التقييم</CardTitle>
                <CardDescription>الرجاء اختيار الفصل، المؤسسة، والمستوى للبدء.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                <label className="text-sm font-medium">1. اختر الفصل الدراسي</label>
                <Select onValueChange={setSemester} value={semester}>
                    <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="1">الفصل الأول</SelectItem>
                    <SelectItem value="2">الفصل الثاني</SelectItem>
                    <SelectItem value="3">الفصل الثالث</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                {semester && (
                <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">2. اختر المؤسسة</label>
                    <Select onValueChange={setInstitutionId} value={institutionId} disabled={loadingInstitutions}>
                    <SelectTrigger>
                        <SelectValue placeholder="اختر المؤسسة..." />
                    </SelectTrigger>
                    <SelectContent>
                        {institutions?.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                )}

                {institutionId && (
                <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium">3. اختر المستوى</label>
                    <Select onValueChange={setLevel} value={level}>
                    <SelectTrigger>
                        <SelectValue placeholder="اختر المستوى..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
                        <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                        <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                        <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                        <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                )}

                {level && (
                <div className="flex justify-end pt-6">
                    <Button onClick={handleStartEvaluation} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    بدء عملية التقييم
                    <ChevronRight className="me-2 h-4 w-4" />
                    </Button>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      ) : (
        <div>
            <Button variant="outline" onClick={() => setShowTable(false)} className="mb-4">
                الرجوع إلى الإعدادات
            </Button>
            {renderEvaluationTable()}
        </div>
      )}
    </div>
  );
}
