
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { Institution, Student, Evaluation, EvaluationCriteria } from '@/lib/types';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { Save, Loader2, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast, toast } from '@/hooks/use-toast';

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

const observationsByScore: { [key: number]: { female: string[], male: string[] }} = {
    10: { // ممتاز
        female: [
            'تلميذة ممتازة، تعمل بذكاء وتطبق المهارات بكفاءة عالية.',
            'مستوى رائع وعمل متقن، تظهر مهارات عالية وانضباطاً نموذجياً.',
            'مبدعة وتمتلك مهارات تعلم عالية، حضور إيجابي ومشاركة فعالة جداً.',
        ],
        male: [
            'تلميذ ممتاز، يعمل بذكاء ويطبق المهارات بكفاءة عالية.',
            'مستوى رائع وعمل متقن، يظهر مهارات عالية وانضباطاً نموذجياً.',
            'مبدع ويمتلك مهارات تعلم عالية، حضور إيجابي ومشاركة فعالة جداً.',
        ],
    },
    9: { // جيد جداً
        female: [
            'تلميذة تحب العمل ولديها مهارات عالية، سلوك منضبط ومشاركة قيمة.',
            'عمل جيد جداً وحضور إيجابي دائم، مجتهدة وتطبق المطلوب بدقة.',
            'تلميذة تمتلك مهارات عالية ولكنها تحتاج ثقة أكبر لإظهارها.',
        ],
        male: [
            'تلميذ يحب العمل ولديه مهارات عالية، سلوك منضبط ومشاركة قيمة.',
            'عمل جيد جداً وحضور إيجابي دائم، مجتهد ويطبق المطلوب بدقة.',
            'تلميذ يمتلك مهارات عالية لو استغلها بشكل أفضل لحقق الامتياز.',
        ],
    },
    8: { // جيد
        female: [
            'تلميذة جيدة، تبذل مجهودات كبيرة وتظهر تحسناً ملحوظاً.',
            'عمل جيد وسلوك منضبط، مشاركتها إيجابية ومستمرة.',
            'حضور إيجابي وأخلاق حسنة، تتقبل التوجيهات وتعمل بها.',
        ],
        male: [
            'تلميذ جيد، يبذل مجهودات كبيرة ويظهر تحسناً ملحوظاً.',
            'عمل جيد وسلوك منضبط، مشاركته إيجابية ومستمرة.',
            'حضور إيجابي وأخلاق حسنة، يتقبل التوجيهات ويعمل بها.',
        ],
    },
    7: { // متوسط إلى جيد
        female: [
            'تلميذة لديها إمكانيات جيدة، أثرت عليها قلة التركيز أحياناً.',
            'تمتلك مهارات، لكن كثرة الحركة تفقدها التركيز وتؤثر على كفاءة التطبيق.',
            'تلميذة تحب المشاركة ولكنها متسرعة، تحتاج للتمهل والتركيز على دقة الأداء.',
        ],
        male: [
            'تلميذ يمتلك إمكانيات جيدة، أثرت عليه قلة التركيز أحياناً.',
            'يمتلك مهارات، لكن كثرة الحركة تفقده التركيز وتؤثر على كفاءة التطبيق.',
            'تلميذ يحب المشاركة ولكنه متسرع، يحتاج للتمهل والتركيز على دقة الأداء.',
        ],
    },
    6: { // متوسط / مقبول
        female: [
            'تلميذة خجولة وقليلة المشاركة، تحتاج لمزيد من التحفيز للاندماج.',
            'مشاركة محدودة، تحتاج لبذل مجهود أكبر لفهم وتنفيذ المهارات.',
            'تلميذة قليلة المشاركة ولا تتبع التعليمات دائماً، تحتاج لمزيد من الانضباط.',
        ],
        male: [
            'تلميذ خجول وقليل المشاركة، يحتاج لمزيد من التحفيز للاندماج.',
            'تلميذ يحب العمل لكن سلوكه (مثل العنف أو الفوضى) يؤثر سلباً عليه وعلى المجموعة.',
            'مشاركة محدودة، يحتاج لبذل مجهود أكبر لفهم وتنفيذ المهارات.',
        ],
    },
    5: { female: [], male: [] },
    4: { female: [], male: [] },
    3: { female: [], male: [] },
    2: { female: [], male: [] },
    1: { female: [], male: [] },
    0: { female: [], male: [] },
};
const genericObservations = [
    'غير المؤسسة.',
    'غائبة.',
    'معفية.',
    'غائب.',
    'معفى.'
];

function getObservationsForScore(score: number, gender: 'male' | 'female'): string[] {
    const scoreCategory = Math.floor(score);
    const specificObservations = observationsByScore[scoreCategory]?.[gender] || [];
    return [...specificObservations, ...genericObservations];
}


function EvaluationTable({ institutionId, level, semester, criteria }: { institutionId: string; level: string; semester: string; criteria: EvaluationCriteria[] }) {
    const firestore = useFirestore();
    const [isSaving, setIsSaving] = useState(false);

    const studentsQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, 'students'),
            where('institutionId', '==', institutionId),
            where('level', '==', level)
        );
    }, [firestore, institutionId, level]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number | null } }>({});
    const [observations, setObservations] = useState<{ [studentId: string]: string }>({});

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

    useEffect(() => {
        if (existingEvals) {
            const newScores = { ...scores };
            const newObservations = { ...observations };
            existingEvals.forEach(ev => {
                if (!newScores[ev.studentId]) {
                    newScores[ev.studentId] = {};
                }
                if (ev.criteriaId && ev.criteriaId !== 'observation') {
                    const foundCriteria = criteria.find(c => c.id === ev.criteriaId);
                    if (foundCriteria) {
                        newScores[ev.studentId][foundCriteria.id] = ev.score;
                    }
                }
                if (ev.observation) { 
                    newObservations[ev.studentId] = ev.observation;
                }
            });
            setScores(newScores);
            setObservations(newObservations);
        }
    }, [existingEvals, criteria]);

    const handleScoreChange = (studentId: string, criteriaId: string, value: string) => {
        const score = value === '' ? null : Number(value);
        const maxScore = criteria.find(c => c.id === criteriaId)?.maxScore ?? 0;
        if (score !== null && (isNaN(score) || score < 0 || score > maxScore)) {
            return;
        }

        const currentTotal = calculateTotal(studentId);
        const currentScore = scores[studentId]?.[criteriaId] ?? 0;
        const newTotal = currentTotal - currentScore + (score ?? 0);

        if (Math.floor(currentTotal) !== Math.floor(newTotal)) {
             handleObservationChange(studentId, '');
        }

        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [criteriaId]: score,
            }
        }));
    };
    
    const handleObservationChange = (studentId: string, value: string) => {
        setObservations(prev => ({
            ...prev,
            [studentId]: value
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
            const studentObservation = observations[student.id];

            criteria.forEach(crit => {
                const score = studentScores[crit.id];
                const evalId = `${student.id}_${crit.id}_${semester}`;
                const evalRef = doc(firestore, 'evaluations', evalId);
                batch.set(evalRef, {
                    studentId: student.id,
                    criteriaId: crit.id,
                    semester: semester,
                    level: level,
                    institutionId: institutionId,
                    score: score ?? null,
                }, { merge: true });
            });
            
            const obsId = `${student.id}_observation_${semester}`;
            const obsRef = doc(firestore, 'evaluations', obsId);
             batch.set(obsRef, {
                studentId: student.id,
                criteriaId: 'observation',
                semester: semester,
                level: level,
                institutionId: institutionId,
                observation: studentObservation || null,
             }, { merge: true });
            
        });

        try {
            await batch.commit();
            toast({
                title: 'تم الحفظ بنجاح',
                description: 'تم حفظ تقييمات وملاحظات التلاميذ.',
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
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /> <p className="ms-2">جاري تحميل بيانات التقييم...</p></div>
    }

    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>جدول تقييم {level} - الفصل {semester}</CardTitle>
                        <CardDescription>أدخل الدرجات واختر الملاحظة لكل تلميذ. المجموع سيتم حسابه تلقائياً.</CardDescription>
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
                                    {criteria.map(crit => (
                                        <TableHead key={crit.id} className="text-center min-w-[150px] whitespace-nowrap">
                                            {crit.name} (/{crit.maxScore})
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center min-w-[120px]">مجموع التقويم المستمر</TableHead>
                                    <TableHead className="text-center min-w-[250px]">الملاحظة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students && students.length > 0 ? (
                                    students.map((student, index) => {
                                        const totalScore = calculateTotal(student.id);
                                        const availableObservations = getObservationsForScore(totalScore, student.gender);
                                        
                                        return (
                                        <TableRow key={student.id}>
                                            <TableCell className="sticky left-0 bg-card z-10 border-e text-center font-medium">{index + 1}</TableCell>
                                            <TableCell className="sticky left-12 bg-card z-10 border-e font-medium">{student.lastName} {student.firstName}</TableCell>
                                            {criteria.map(crit => (
                                                <TableCell key={crit.id} className="text-center p-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={crit.maxScore}
                                                        step="0.25"
                                                        value={scores[student.id]?.[crit.id] ?? ''}
                                                        onChange={(e) => handleScoreChange(student.id, crit.id, e.target.value)}
                                                        className="w-20 text-center mx-auto"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center font-bold text-lg text-primary">
                                                {totalScore}
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <Select
                                                    value={observations[student.id] || ''}
                                                    onValueChange={(value) => handleObservationChange(student.id, value)}
                                                >
                                                    <SelectTrigger className="w-full text-xs">
                                                        <SelectValue placeholder="اختر ملاحظة..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableObservations.map(obs => (
                                                            <SelectItem key={obs} value={obs}>{obs}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={criteria.length + 4} className="h-24 text-center">
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

    const criteria = useMemo(() => {
        let criteriaList: Omit<EvaluationCriteria, 'id'>[] = [];
        if (level === 'أولى ابتدائي') {
            criteriaList = FIRST_YEAR_CRITERIA;
        } else if (level) {
            criteriaList = OTHER_YEARS_CRITERIA;
        }
        return criteriaList.map((c, i) => ({ ...c, id: `${level === 'أولى ابتدائي' ? 'fy' : 'oy'}_crit_${i}`}));
    }, [level]);

    if (!institutionId || !level || !semester) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>المعلمات المطلوبة (المؤسسة، المستوى، الفصل) غير متوفرة لعرض الجدول.</p>
            </div>
        );
    }
    
    return <EvaluationTable institutionId={institutionId} level={level} semester={semester} criteria={criteria} />;
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EvaluationViewPage />
        </Suspense>
    );
}
