
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Institution, SessionEvaluation } from "@/lib/types";
import { collection, doc, query, where, setDoc } from "firebase/firestore";
import { addMonths, subMonths, format, getWeeksInMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Loader2, Search, Printer } from "lucide-react";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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
        } else {
            // Clear evaluations when query changes and there's no data
            setEvaluations({});
        }
    }, [fetchedEvaluations]);


    const weeksOfMonth = useMemo(() => {
        const weeks = getWeeksInMonth(currentDate, { weekStartsOn: 6 }); // Saturday start
        return Array.from({ length: weeks }, (_, i) => i + 1);
    }, [currentDate]);
    
    const hasTwoSessions = ['أولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي'].includes(selectedLevel);

    const sessions = useMemo(() => {
        return weeksOfMonth.flatMap(week => {
            if (hasTwoSessions) {
                return [
                    { week: week, session: 1, label: `الأسبوع ${week} (ح1)` },
                    { week: week, session: 2, label: `الأسبوع ${week} (ح2)` },
                ];
            } else {
                return [{ week: week, session: 1, label: `الأسبوع ${week}` }];
            }
        });
    }, [weeksOfMonth, hasTwoSessions]);


    const handleScoreChange = (studentId: string, week: number, session: number, score: string) => {
        const scoreValue = score === '' ? null : Math.max(0, Math.min(10, Number(score)));
        const key = `${week}_${session}`;
        setEvaluations(prev => {
            const studentEvals = prev[studentId] || {};
            const newStudentEvals = { ...studentEvals, [key]: scoreValue };
            return { ...prev, [studentId]: newStudentEvals };
        });
    };
    
    const calculateMonthlyScore = (studentId: string) => {
        const studentScores = evaluations[studentId] || {};
        const scoresArray = Object.values(studentScores).filter(s => s !== null && s !== undefined) as number[];
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
    
    const handlePrint = () => {
        if (!selectedInstitution || !selectedLevel) {
            toast({
                title: "الرجاء اختيار المؤسسة والمستوى أولاً",
                variant: "destructive"
            });
            return;
        }

        const params = new URLSearchParams();
        params.set('institutionId', selectedInstitution);
        params.set('level', selectedLevel);
        params.set('month', monthStr);
        const printUrl = `/evaluations/session-based/print?${params.toString()}`;
        window.open(printUrl, '_blank');
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
                            <div className="flex items-center gap-2">
                                <Button onClick={handlePrint} variant="outline">
                                    <Printer className="me-2 h-4 w-4"/> طباعة
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="me-2 animate-spin"/> : <Save className="me-2" />}
                                    حفظ التقييمات
                                </Button>
                            </div>
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
                                         {weeksOfMonth.map((week) => (
                                            <TableHead key={week} className="text-center" colSpan={hasTwoSessions ? 2 : 1}>الأسبوع {week}</TableHead>
                                        ))}
                                        <TableHead className="text-center font-bold">عدد الحصص</TableHead>
                                        <TableHead className="text-center font-bold text-primary">النقطة الشهرية</TableHead>
                                    </TableRow>
                                     <TableRow>
                                        <TableHead className="sticky left-0 bg-card z-10 border-e"></TableHead>
                                        {weeksOfMonth.flatMap(week =>
                                            hasTwoSessions ? (
                                                <Fragment key={week}>
                                                    <TableHead className="text-center text-xs p-1 border-t">ح1</TableHead>
                                                    <TableHead className="text-center text-xs p-1 border-t">ح2</TableHead>
                                                </Fragment>
                                            ) : (
                                                <TableHead key={`${week}-1`} className="text-center text-xs p-1 border-t">الحصة</TableHead>
                                            )
                                        )}
                                        <TableHead></TableHead>
                                        <TableHead></TableHead>
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
                                                    {weeksOfMonth.map(week => (
                                                        hasTwoSessions ? (
                                                            <Fragment key={week}>
                                                                <TableCell className="p-1">
                                                                    <Input 
                                                                        type="number" min="0" max="10" step="0.5"
                                                                        value={evaluations[student.id]?.[`${week}_1`] ?? ''}
                                                                        onChange={(e) => handleScoreChange(student.id, week, 1, e.target.value)}
                                                                        className="w-16 h-8 text-center mx-auto"
                                                                    />
                                                                </TableCell>
                                                                 <TableCell className="p-1">
                                                                    <Input 
                                                                        type="number" min="0" max="10" step="0.5"
                                                                        value={evaluations[student.id]?.[`${week}_2`] ?? ''}
                                                                        onChange={(e) => handleScoreChange(student.id, week, 2, e.target.value)}
                                                                        className="w-16 h-8 text-center mx-auto"
                                                                    />
                                                                </TableCell>
                                                            </Fragment>
                                                        ) : (
                                                            <TableCell key={`${week}-1`} className="p-1">
                                                                <Input 
                                                                    type="number" min="0" max="10" step="0.5"
                                                                    value={evaluations[student.id]?.[`${week}_1`] ?? ''}
                                                                    onChange={(e) => handleScoreChange(student.id, week, 1, e.target.value)}
                                                                    className="w-16 h-8 text-center mx-auto"
                                                                />
                                                            </TableCell>
                                                        )
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
