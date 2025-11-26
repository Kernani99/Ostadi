
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Attendance, Institution, Department } from "@/lib/types";
import { collection, doc, query, where, setDoc, getDocs } from "firebase/firestore";
import { addMonths, subMonths, format, getWeeksInMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Printer, Users, CalendarX, BarChart3, UserCheck, Clock, Filter, Search, Calendar as CalendarIcon, Eye, ArrowUpDown, FileDown, Activity, ShieldOff, Loader2 } from "lucide-react";
import { useState, useMemo, useReducer } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';


// Helper function to get number of weeks in a month
const getWeeksOfMonth = (date: Date) => {
    const weeks = getWeeksInMonth(date, { weekStartsOn: 6 }); // Assuming Saturday is the start of the week for school context
    return Array.from({ length: weeks }, (_, i) => i + 1);
};

function AttendanceRegistration() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for filters and date
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Fetching data from Firestore
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

    const monthStr = format(currentDate, 'yyyy-MM');
    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);

    const attendanceQuery = useMemoFirebase(() =>
        firestore && studentIds.length > 0 ? query(collection(firestore, 'attendances'), where('studentId', 'in', studentIds), where('month', '==', monthStr)) : null
    , [firestore, studentIds, monthStr]);
    const { data: attendances, isLoading: loadingAttendances } = useCollection<Attendance>(attendanceQuery);
    
    // Memoize processed attendance data for performance
    const attendanceMap = useMemo(() => {
        const map = new Map<string, { [week: number]: string }>();
        if (!attendances) return map;
        attendances.forEach(att => {
            // Ensure records is an object before setting
            if (typeof att.records === 'object' && att.records !== null) {
                map.set(att.studentId, att.records);
            }
        });
        return map;
    }, [attendances]);


    // Handlers
    const handleInstitutionChange = (id: string) => {
        setSelectedInstitution(id);
        setSelectedLevel('');
    };

    const handleLevelChange = (level: string) => {
        setSelectedLevel(level);
    };

    const handleAttendanceChange = async (student: Student, week: number, status: string) => {
        if (!firestore) return;
        const studentId = student.id;
        
        const attendanceId = `${studentId}_${monthStr}`;
        const attendanceRef = doc(firestore, 'attendances', attendanceId);
        
        const existingRecords = attendanceMap.get(studentId) || {};
        const newRecords = { ...existingRecords, [week]: status };

        try {
            await setDoc(attendanceRef, {
                studentId: studentId,
                departmentId: student.departmentId || null,
                month: monthStr,
                records: newRecords,
                institutionId: student.institutionId,
                level: student.level,
            }, { merge: true });

             toast({
                title: "تم الحفظ",
                description: `تم تسجيل حضور التلميذ للأسبوع ${week}.`,
                duration: 2000,
             });
        } catch (error) {
            console.error("Failed to save attendance: ", error);
             toast({
                title: "خطأ",
                description: "فشل في حفظ بيانات الحضور.",
                variant: "destructive"
             });
        }
    };
    
    const weeksOfMonth = getWeeksOfMonth(currentDate);

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
       
        const printWindow = window.open(`/attendance/print-annual?${params.toString()}`, '_blank');
        printWindow?.focus();
    }

    const handleExport = () => {
        if (!students || students.length === 0) {
            toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
            return;
        }

        const institutionName = institutions?.find(i => i.id === selectedInstitution)?.name || '';
        const monthName = format(currentDate, 'MMMM yyyy', { locale: ar });
        const fileName = `حضور-${selectedLevel}-${institutionName}-${monthName}.xlsx`;

        const statusMap = { present: 'حاضر', absent: 'غائب', justified: 'مبرر', 'no-outfit': 'بدون لباس' };
        
        const dataToExport = students.map(student => {
            const row: {[key: string]: any} = {
                'اللقب': student.lastName,
                'الإسم': student.firstName,
            };
            const studentAttendance = attendanceMap.get(student.id) || {};
            weeksOfMonth.forEach(week => {
                const statusKey = studentAttendance[week] as keyof typeof statusMap;
                row[`الأسبوع ${week}`] = statusKey ? statusMap[statusKey] : '';
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `حضور ${monthName}`);
        XLSX.writeFile(workbook, fileName);
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>اختيار المستوى</CardTitle>
                    <CardDescription>اختر المؤسسة والمستوى لعرض سجل الحضور.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <Select onValueChange={handleInstitutionChange} value={selectedInstitution} disabled={loadingInstitutions}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر المؤسسة..." />
                        </SelectTrigger>
                        <SelectContent>
                            {institutions?.map(inst => (
                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={handleLevelChange} value={selectedLevel} disabled={!selectedInstitution}>
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
                </CardContent>
            </Card>

            {selectedLevel && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
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
                                <Button onClick={handleExport} variant="outline" size="icon">
                                    <FileDown className="h-5 w-5 text-green-600"/>
                                    <span className="sr-only">تصدير Excel</span>
                                </Button>
                                <Button onClick={handlePrint} variant="outline" size="icon">
                                    <Printer className="h-5 w-5"/>
                                    <span className="sr-only">طباعة</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-card z-10 min-w-[150px] border-e">اسم التلميذ</TableHead>
                                        {weeksOfMonth.map(week => (
                                            <TableHead key={week} className="text-center min-w-[100px]">الأسبوع {week}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingStudents || loadingAttendances ? (
                                        <TableRow>
                                            <TableCell colSpan={weeksOfMonth.length + 1} className="text-center h-24">
                                                جاري تحميل البيانات...
                                            </TableCell>
                                        </TableRow>
                                    ) : students && students.length > 0 ? (
                                        students.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell className="sticky left-0 bg-card z-10 font-medium border-e">{student.lastName} {student.firstName}</TableCell>
                                                {weeksOfMonth.map(week => (
                                                    <TableCell key={week} className="p-1 text-center">
                                                        <Select
                                                            value={attendanceMap.get(student.id)?.[week] || ''}
                                                            onValueChange={(status) => handleAttendanceChange(student, week, status)}
                                                        >
                                                            <SelectTrigger className="h-8 w-20 text-xs">
                                                                <SelectValue placeholder="-" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="present">ح</SelectItem>
                                                                <SelectItem value="absent">غ</SelectItem>
                                                                <SelectItem value="justified">م</SelectItem>
                                                                <SelectItem value="no-outfit">ب.ل</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={weeksOfMonth.length + 1} className="text-center h-24">
                                               لا يوجد تلاميذ في هذا المستوى.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                         <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><span className="font-bold">ح:</span><span>حاضر</span></div>
                            <div className="flex items-center gap-2"><span className="font-bold">غ:</span><span>غائب</span></div>
                            <div className="flex items-center gap-2"><span className="font-bold">م:</span><span>مبرر</span></div>
                            <div className="flex items-center gap-2"><span className="font-bold">ب.ل:</span><span>بدون لباس</span></div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

type LevelReport = {
    level: string;
    totalStudents: number;
    totalAbsences: number;
    attendancePercentage: number;
    absencePercentage: number;
    topAbsences: { studentName: string; absenceCount: number }[];
};
const ReportChartColors = ["#22c55e", "#ef4444"]; // Green for present, Red for absent


function AttendanceReports() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reportData, setReportData] = useState<LevelReport[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
        useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
    );
    
    const handleGenerateReport = async () => {
        if (!selectedInstitution || !firestore) {
             toast({ title: "الرجاء اختيار المؤسسة أولاً", variant: "destructive" });
            return;
        }
        
        setIsLoading(true);
        const monthStr = format(currentDate, 'yyyy-MM');
        
        const studentsQuery = query(collection(firestore, 'students'), where('institutionId', '==', selectedInstitution));
        const studentsSnapshot = await getDocs(studentsQuery);
        const allStudentsInInst = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));

        const attendanceQuery = query(
            collection(firestore, 'attendances'), 
            where('institutionId', '==', selectedInstitution),
            where('month', '==', monthStr)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const allAttendancesInMonth = attendanceSnapshot.docs.map(doc => doc.data() as Attendance);

        const levels = ['أولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي'];
        const reports: LevelReport[] = [];

        for (const level of levels) {
            const studentsInLevel = allStudentsInInst.filter(s => s.level === level);
            if (studentsInLevel.length === 0) continue;

            const studentIdsInLevel = new Set(studentsInLevel.map(s => s.id));
            const attendancesInLevel = allAttendancesInMonth.filter(a => studentIdsInLevel.has(a.studentId));
            
            let totalAbsences = 0;
            const absencesByStudent = new Map<string, number>();

            attendancesInLevel.forEach(att => {
                Object.values(att.records).forEach(status => {
                    if (status === 'absent') {
                        totalAbsences++;
                        absencesByStudent.set(att.studentId, (absencesByStudent.get(att.studentId) || 0) + 1);
                    }
                });
            });

            const totalPossibleAttendances = studentsInLevel.length * getWeeksInMonth(currentDate, {weekStartsOn: 6});
            const attendanceCount = totalPossibleAttendances - totalAbsences;

            const attendancePercentage = totalPossibleAttendances > 0 ? (attendanceCount / totalPossibleAttendances) * 100 : 100;
            const absencePercentage = totalPossibleAttendances > 0 ? (totalAbsences / totalPossibleAttendances) * 100 : 0;
            
            const topAbsences = Array.from(absencesByStudent.entries()).map(([studentId, absenceCount]) => {
                const student = studentsInLevel.find(s => s.id === studentId);
                return {
                    studentName: `${student?.lastName || ''} ${student?.firstName || ''}`,
                    absenceCount
                };
            }).sort((a,b) => b.absenceCount - a.absenceCount).slice(0, 5); // Top 5

            reports.push({
                level,
                totalStudents: studentsInLevel.length,
                totalAbsences,
                attendancePercentage,
                absencePercentage,
                topAbsences
            });
        }

        setReportData(reports);
        setIsLoading(false);
        if (reports.length === 0) {
             toast({ title: "لا توجد بيانات", description: "لم يتم العثور على تلاميذ أو سجلات حضور لهذا الشهر في المؤسسة المحددة." });
        }
    };
    
    const handlePrintReport = () => {
        if (!reportData || !selectedInstitution) {
            toast({
                title: "لا توجد بيانات للطباعة",
                description: "الرجاء إنشاء التقرير أولاً.",
                variant: "destructive"
            });
            return;
        }

        try {
            const institutionName = institutions?.find(i => i.id === selectedInstitution)?.name || '';
            const printData = {
                reportData,
                institutionName,
                month: format(currentDate, 'MMMM yyyy', { locale: ar }),
            };
            sessionStorage.setItem('attendanceReportPrintData', JSON.stringify(printData));
            const printWindow = window.open('/attendance/print-report', '_blank');
            printWindow?.focus();
        } catch (e) {
            console.error("Failed to store print data:", e);
            toast({
                title: "خطأ في الطباعة",
                description: "لم نتمكن من تحضير البيانات للطباعة.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary"/>
                        <CardTitle>إنشاء تقرير شهري</CardTitle>
                    </div>
                     <CardDescription>اختر المؤسسة والشهر لعرض تقرير الغيابات المفصل حسب المستوى الدراسي.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-4">
                    <Select onValueChange={setSelectedInstitution} value={selectedInstitution} disabled={loadingInstitutions}>
                        <SelectTrigger className="w-full md:w-[250px]">
                            <SelectValue placeholder="اختر المؤسسة..." />
                        </SelectTrigger>
                        <SelectContent>
                            {institutions?.map(inst => (
                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                         <Button size="icon" variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <h3 className="text-lg font-bold text-primary w-32 text-center">
                            {format(currentDate, 'MMMM yyyy', { locale: ar })}
                        </h3>
                        <Button size="icon" variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                        <Search className="me-2 h-4 w-4" />
                        {isLoading ? 'جاري العرض...' : 'عرض التقرير'}
                    </Button>
                     <Button variant="destructive" onClick={handlePrintReport} disabled={!reportData || reportData.length === 0}>
                        <Printer className="me-2 h-4 w-4" />
                        طباعة التقرير
                    </Button>
                </CardContent>
            </Card>

            {isLoading ? (
                 <div className="flex items-center justify-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <p className="ms-2 text-muted-foreground">جاري إنشاء التقارير...</p>
                </div>
            ) : reportData ? (
                <div className="space-y-8">
                {reportData.map(report => (
                    <Card key={report.level} className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">{report.level}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-4">
                                <StatCard title="إجمالي التلاميذ" value={report.totalStudents} icon={Users} description="في هذا المستوى"/>
                                <StatCard title="إجمالي الغيابات" value={report.totalAbsences} icon={CalendarX} description="خلال هذا الشهر"/>
                            </div>
                             <div className="md:col-span-1">
                                <h3 className="text-center font-semibold mb-2">نسبة الحضور والغياب</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'حضور', value: report.attendancePercentage },
                                                { name: 'غياب', value: report.absencePercentage }
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                           {[
                                                { value: report.attendancePercentage },
                                                { value: report.absencePercentage }
                                            ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ReportChartColors[index % ReportChartColors.length]} />
                                           ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Legend iconType="circle"/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="md:col-span-1">
                                 <h3 className="text-center font-semibold mb-2">التلاميذ الأكثر غياباً</h3>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>التلميذ</TableHead>
                                            <TableHead className="text-center">عدد الغيابات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.topAbsences.length > 0 ? report.topAbsences.map(s => (
                                            <TableRow key={s.studentName}>
                                                <TableCell>{s.studentName}</TableCell>
                                                <TableCell className="text-center"><Badge variant="destructive">{s.absenceCount}</Badge></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">لا توجد غيابات مسجلة.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                 </Table>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <Card className="flex items-center justify-center h-60">
                    <p className="text-muted-foreground">الرجاء اختيار مؤسسة وشهر ثم الضغط على "عرض التقرير".</p>
                </Card>
            )}
        </div>
    );
}

export default function AttendancePage() {
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-bold text-3xl text-center text-primary relative">
                المناداة (الحضور والغياب)
                <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
                </h1>
            </div>
            
            <Tabs defaultValue="registration" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="registration">تسجيل الحضور</TabsTrigger>
                    <TabsTrigger value="reports">قسم التقارير</TabsTrigger>
                </TabsList>
                <TabsContent value="registration">
                   <AttendanceRegistration />
                </TabsContent>
                <TabsContent value="reports">
                    <AttendanceReports />
                </TabsContent>
            </Tabs>

        </div>
    );
}
