'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Institution, SessionEvaluation } from "@/lib/types";
import { collection, doc, query, where, setDoc } from "firebase/firestore";
import { addMonths, subMonths, format, getWeeksInMonth, startOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Loader2, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export default function SessionEvaluationPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [evaluations, setEvaluations] = useState<Record<string, Record<string, number | null>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
        useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
    );
    
    const studentsQuery = useMemoFirebase(() => 
        firestore && selectedInstitution && selectedLevel ? 
        query(
            collection(firestore, 'students'), 
            where('institutionId', '==', selectedInstitution),
            where('level', '==', selectedLevel)
        ) : null
    , [firestore, selectedInstitution, selectedLevel]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        return students.filter(student =>
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const monthStr = format(currentDate, 'yyyy-MM');
    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);

    const evaluationsQuery = useMemoFirebase(() =>
        firestore && studentIds.length > 0 ? query(collection(firestore, 'session_evaluations'), where('studentId', 'in', studentIds), where('month', '==', monthStr)) : null
    , [firestore, studentIds, monthStr]);
    const { data: fetchedEvaluations, isLoading: loadingEvaluations } = useCollection<SessionEvaluation>(evaluationsQuery);

    useEffect(() => {
        if (fetchedEvaluations) {
            const newEvals: Record<string, Record<string, number | null>> = {};
            fetchedEvaluations.forEach(ev => {
                newEvals[ev.studentId] = ev.scores;
            });
            setEvaluations(newEvals);
        }
    }, [fetchedEvaluations]);


    const monthDays = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        return eachDayOfInterval({ start, end }).filter(day => isSameMonth(day, currentDate));
    }, [currentDate]);

    const sessions = useMemo(() => {
        return monthDays.filter(day => getDay(day) >= 0 && getDay(day) <= 4) // Sunday to Thursday
          .flatMap(day => {
              const dayName = daysOfWeek[getDay(day)];
              return [
                  { date: format(day, 'yyyy-MM-dd'), session: 1, label: `${dayName} ${format(day, 'dd')}` },
                  { date: format(day, 'yyyy-MM-dd'), session: 2, label: `${dayName} ${format(day, 'dd')}` },
              ];
          });
    }, [monthDays]);

    const handleScoreChange = (studentId: string, date: string, session: number, score: string) => {
        const scoreValue = score === '' ? null : Math.max(0, Math.min(10, Number(score)));
        setEvaluations(prev => {
            const studentEvals = prev[studentId] || {};
            const newStudentEvals = { ...studentEvals, [`${date}_${session}`]: scoreValue };
            return { ...prev, [studentId]: newStudentEvals };
        });
    };
    
    const calculateMonthlyScore = (studentId: string) => {
        const studentScores = evaluations[studentId] || {};
        const scoresArray = Object.values(studentScores).filter(s => s !== null) as number[];
        if (scoresArray.length === 0) return { avg: 0, count: 0 };
        const sum = scoresArray.reduce((acc, s) => acc + s, 0);
        return {
            avg: (sum / scoresArray.length),
            count: scoresArray.length
        };
    };

    const handleSave = async () => {
        if (!firestore || !students) return;
        setIsSaving(true);
        try {
            for (const student of students) {
                const studentId = student.id;
                if (evaluations[studentId]) {
                    const evalId = `${studentId}_${monthStr}`;
                    const evalRef = doc(firestore, 'session_evaluations', evalId);
                    await setDoc(evalRef, {
                        studentId: studentId,
                        month: monthStr,
                        institutionId: student.institutionId,
                        level: student.level,
                        scores: evaluations[studentId]
                    }, { merge: true });
                }
            }
            toast({ title: "تم الحفظ بنجاح", description: "تم حفظ تقييمات الحصص لهذا الشهر." });
        } catch (error) {
            console.error("Error saving session evaluations:", error);
            toast({ title: "خطأ", description: "لم نتمكن من حفظ التقييمات.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-bold text-3xl text-center text-primary relative">
                التقييم حسب الحصة
                <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>اختيار الفوج</CardTitle>
                    <CardDescription>اختر المؤسسة والمستوى لعرض قائمة التلاميذ.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <Select onValueChange={setSelectedInstitution} value={selectedInstitution} disabled={loadingInstitutions}>
                        <SelectTrigger><SelectValue placeholder="اختر المؤسسة..." /></SelectTrigger>
                        <SelectContent>
                            {institutions?.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={setSelectedLevel} value={selectedLevel} disabled={!selectedInstitution}>
                        <SelectTrigger><SelectValue placeholder="اختر المستوى..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="أولى ابتدائي">أولى ابتدائي</SelectItem>
                            <SelectItem value="ثانية ابتدائي">ثانية ابتدائي</SelectItem>
                            <SelectItem value="ثالثة ابتدائي">ثالثة ابتدائي</SelectItem>
                            <SelectItem value="رابعة ابتدائي">رابعة ابتدائي</SelectItem>
                            <SelectItem value="خامسة ابتدائي">خامسة ابتدائي</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedLevel && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center mb-4">
                             <div className="flex items-center gap-4">
                                <Button size="icon" variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <h3 className="text-xl font-bold text-primary">
                                    {format(currentDate, 'MMMM yyyy', { locale: ar })}
                                </h3>
                                <Button size="icon" variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="me-2 animate-spin"/> : <Save className="me-2" />}
                                حفظ التقييمات
                            </Button>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="البحث عن تلميذ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ps-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-card z-10 min-w-[150px] border-e">اسم التلميذ</TableHead>
                                        {sessions.map(({ date, session, label }, index) => (
                                            <TableHead key={`${date}-${session}`} className="text-center p-1 text-xs">
                                                {label} (ح{session})
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-center font-bold">عدد الحصص</TableHead>
                                        <TableHead className="text-center font-bold text-primary">النقطة الشهرية</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingStudents || loadingEvaluations ? (
                                        <TableRow><TableCell colSpan={sessions.length + 3} className="text-center h-24">جاري تحميل البيانات...</TableCell></TableRow>
                                    ) : filteredStudents.length > 0 ? (
                                        filteredStudents.map(student => {
                                            const monthlyScore = calculateMonthlyScore(student.id);
                                            return (
                                                <TableRow key={student.id}>
                                                    <TableCell className="sticky left-0 bg-card z-10 font-medium border-e">{student.lastName} {student.firstName}</TableCell>
                                                    {sessions.map(({ date, session }) => (
                                                        <TableCell key={`${date}-${session}`} className="p-1">
                                                            <Input 
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                step="0.5"
                                                                value={evaluations[student.id]?.[`${date}_${session}`] ?? ''}
                                                                onChange={(e) => handleScoreChange(student.id, date, session, e.target.value)}
                                                                className="w-16 h-8 text-center mx-auto"
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="text-center font-bold">{monthlyScore.count}</TableCell>
                                                    <TableCell className="text-center font-bold text-primary text-lg">{monthlyScore.avg.toFixed(2)}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow><TableCell colSpan={sessions.length + 3} className="text-center h-24">لا يوجد تلاميذ في هذا المستوى.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
