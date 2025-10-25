
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Attendance, Institution, AttendanceReport, GeneralStats, Department, TopAbsence, DepartmentAbsence } from "@/lib/types";
import { collection, doc, query, where, setDoc, getDocs } from "firebase/firestore";
import { addMonths, subMonths, format, getWeeksInMonth, eachDayOfInterval, isSameMonth, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Printer, Users, CalendarX, BarChart3, UserCheck, Clock, Filter, Search, Calendar as CalendarIcon, Eye, ArrowUpDown } from "lucide-react";
import { useState, useMemo, useReducer } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


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
        const studentId = student.id;
        const departmentId = student.departmentId || null; 
        
        const attendanceId = `${studentId}_${monthStr}`;
        const attendanceRef = doc(firestore, 'attendances', attendanceId);
        
        const existingRecords = attendanceMap.get(studentId) || {};
        const newRecords = { ...existingRecords, [week]: status };

        try {
            await setDoc(attendanceRef, {
                studentId: studentId,
                departmentId: departmentId,
                month: monthStr,
                records: newRecords
            });

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
                             <Button onClick={handlePrint} variant="outline" size="icon">
                                <Printer className="h-5 w-5"/>
                                <span className="sr-only">طباعة</span>
                            </Button>
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

// Reducer for table state management
const tableReducer = (state, action) => {
  switch (action.type) {
    case 'SORT': {
      const { column } = action.payload;
      const isAsc = state.sortColumn === column && state.sortDirection === 'asc';
      return { ...state, sortColumn: column, sortDirection: isAsc ? 'desc' : 'asc', currentPage: 1 };
    }
    case 'SEARCH':
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case 'PAGINATE':
      return { ...state, currentPage: action.payload };
    case 'SET_ROWS_PER_PAGE':
      return { ...state, rowsPerPage: action.payload, currentPage: 1 };
    default:
      return state;
  }
};

const usePaginatedTable = (data, initialSortColumn) => {
    const [state, dispatch] = useReducer(tableReducer, {
        sortColumn: initialSortColumn,
        sortDirection: 'desc',
        searchTerm: '',
        currentPage: 1,
        rowsPerPage: 10,
    });

    const sortedData = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => {
            const aVal = a[state.sortColumn];
            const bVal = b[state.sortColumn];
            if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, state.sortColumn, state.sortDirection]);

    const filteredData = useMemo(() => {
        return sortedData.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(state.searchTerm.toLowerCase())
            )
        );
    }, [sortedData, state.searchTerm]);

    const paginatedData = useMemo(() => {
        const startIndex = (state.currentPage - 1) * state.rowsPerPage;
        return filteredData.slice(startIndex, startIndex + state.rowsPerPage);
    }, [filteredData, state.currentPage, state.rowsPerPage]);

    return { ...state, dispatch, paginatedData, totalPages: Math.ceil(filteredData.length / state.rowsPerPage), totalEntries: filteredData.length };
};


function AttendanceReports() {
    const firestore = useFirestore();
    const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: subMonths(new Date(), 1), to: new Date() });
    const [reportData, setReportData] = useState<GeneralStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data: students } = useCollection<Student>(useMemoFirebase(() => collection(firestore, 'students'), [firestore]));
    const { data: departments } = useCollection<Department>(useMemoFirebase(() => collection(firestore, 'departments'), [firestore]));

    const topAbsencesTable = usePaginatedTable(reportData?.topAbsences, 'absenceCount');
    const deptAbsencesTable = usePaginatedTable(reportData?.departmentAbsences, 'absenceCount');


    const handleGenerateReport = async () => {
        if (!dateRange.from || !dateRange.to || !students || !departments) return;
        
        setIsLoading(true);
        const allAttendances: Attendance[] = [];

        const attendanceQuery = query(collection(firestore, 'attendances'));
        const querySnapshot = await getDocs(attendanceQuery);
        querySnapshot.forEach(doc => {
            allAttendances.push({ id: doc.id, ...doc.data() } as Attendance);
        });

        // --- Calculation Logic ---
        const totalStudents = students.length;
        let totalAbsences = 0;
        const absencesByMonth: { [key: string]: number } = {};
        const absencesByWeekday: { [key: string]: number } = { 'الأحد': 0, 'الاثنين': 0, 'الثلاثاء': 0, 'الأربعاء': 0, 'الخميس': 0 };

        const absencesByStudent = new Map<string, number>();
        const absencesByDepartment = new Map<string, number>();

        const schoolDaysInRange = eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).filter(d => d.getDay() !== 5 && d.getDay() !== 6).length;

        allAttendances.forEach(att => {
            const monthDate = new Date(att.month + '-01T12:00:00');
            const student = students.find(s => s.id === att.studentId);
            if (!student) return;

            if (isSameMonth(monthDate, dateRange.from) || isSameMonth(monthDate, dateRange.to) || (monthDate > dateRange.from && monthDate < dateRange.to)) {
                Object.values(att.records).forEach(status => {
                    if (status === 'absent') {
                        totalAbsences++;
                        const monthKey = format(monthDate, 'yyyy-MM');
                        absencesByMonth[monthKey] = (absencesByMonth[monthKey] || 0) + 1;
                        
                        absencesByStudent.set(att.studentId, (absencesByStudent.get(att.studentId) || 0) + 1);

                        if (att.departmentId) {
                            absencesByDepartment.set(att.departmentId, (absencesByDepartment.get(att.departmentId) || 0) + 1);
                        }
                    }
                });
            }
        });
        
        const totalPossibleAttendances = totalStudents * schoolDaysInRange;
        const attendanceRate = totalPossibleAttendances > 0 ? ((totalPossibleAttendances - totalAbsences) / totalPossibleAttendances) * 100 : 100;
        const absenceRate = totalPossibleAttendances > 0 ? (totalAbsences / totalPossibleAttendances) * 100 : 0;
        const averageAbsencePerStudent = totalStudents > 0 ? totalAbsences / totalStudents : 0;

        const monthlyAbsenceData = Object.entries(absencesByMonth).map(([month, count]) => ({
            name: format(new Date(month + '-01T12:00:00'), 'MMM', { locale: ar }),
            total: count
        }));
        
        const weeklyAbsenceData = Object.entries(absencesByWeekday).map(([day, count]) => ({
            name: day,
            total: count
        }));

        const topAbsences: TopAbsence[] = Array.from(absencesByStudent.entries()).map(([studentId, absenceCount]) => {
            const student = students.find(s => s.id === studentId);
            const department = departments.find(d => d.id === student?.departmentId);
            return {
                studentId,
                studentName: `${student?.lastName || ''} ${student?.firstName || ''}`,
                departmentName: department?.name || 'غير محدد',
                absenceCount
            };
        }).sort((a,b) => b.absenceCount - a.absenceCount);

        const studentsByDept = students.reduce((acc, student) => {
            if(student.departmentId) {
                acc[student.departmentId] = (acc[student.departmentId] || 0) + 1;
            }
            return acc;
        }, {});

        const departmentAbsences: DepartmentAbsence[] = departments.map(dept => {
            const absenceCount = absencesByDepartment.get(dept.id) || 0;
            const studentCount = studentsByDept[dept.id] || 0;
            const totalPossible = studentCount * schoolDaysInRange;
            const absencePercentage = totalPossible > 0 ? (absenceCount / totalPossible) * 100 : 0;
            return {
                departmentId: dept.id,
                departmentName: dept.name,
                studentCount: studentCount,
                absenceCount: absenceCount,
                absencePercentage: absencePercentage,
            }
        }).sort((a,b) => b.absenceCount - a.absenceCount);


        setReportData({
            totalStudents: totalStudents,
            totalDepartments: departments.length,
            totalAbsences: totalAbsences,
            totalAbsencePercentage: absenceRate,
            attendancePercentage: attendanceRate,
            schoolDays: schoolDaysInRange,
            averageAbsencePerStudent: averageAbsencePerStudent,
            monthlyAbsenceDistribution: monthlyAbsenceData,
            weeklyAbsenceDistribution: weeklyAbsenceData,
            topAbsences,
            departmentAbsences,
        });
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary"/>
                        <CardTitle>تصفية الإحصائيات</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span>من تاريخ:</span>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? format(dateRange.from, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateRange.from}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="flex items-center gap-2">
                        <span>إلى تاريخ:</span>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !dateRange.to && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.to ? format(dateRange.to, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateRange.to}
                                onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                        <Search className="me-2 h-4 w-4" />
                        {isLoading ? 'جاري العرض...' : 'عرض الإحصائيات'}
                    </Button>
                    <Button variant="destructive" disabled={!reportData}>
                        <Printer className="me-2 h-4 w-4" />
                        طباعة التقرير
                    </Button>
                </CardContent>
            </Card>

             <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general"><BarChart3 className="me-2"/>الإحصائيات العامة</TabsTrigger>
                    <TabsTrigger value="department" disabled><BarChart3 className="me-2"/>إحصائيات القسم</TabsTrigger>
                    <TabsTrigger value="student" disabled><BarChart3 className="me-2"/>إحصائيات متعلم</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    {reportData ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>الإحصائيات العامة للحضور والغياب</CardTitle>
                                        <Badge>الفترة: {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} - {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : ''}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <StatCard title="إجمالي التلاميذ" value={reportData.totalStudents} icon={Users} description={`${reportData.totalDepartments} قسم دراسي`} />
                                        <StatCard title="إجمالي الغيابات" value={reportData.totalAbsences} icon={CalendarX} description={`+${reportData.totalAbsencePercentage.toFixed(1)}% نسبة الغياب الإجمالية`} />
                                        <StatCard title="نسبة الحضور" value={`${reportData.attendancePercentage.toFixed(1)}%`} icon={UserCheck} description={`${reportData.schoolDays} يوم دراسي`}/>
                                        <StatCard title="متوسط الغياب" value={reportData.averageAbsencePerStudent.toFixed(1)} icon={Clock} description="لكل متعلم"/>
                                    </div>
                                    <div className="grid gap-8 md:grid-cols-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>توزيع الغياب حسب الأشهر</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={reportData.monthlyAbsenceDistribution}>
                                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>توزيع الغياب حسب أيام الأسبوع</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={reportData.weeklyAbsenceDistribution}>
                                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                        <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <div className="grid gap-8 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>التلاميذ الأكثر غياباً</CardTitle>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Input placeholder="ابحث..." value={topAbsencesTable.searchTerm} onChange={(e) => topAbsencesTable.dispatch({ type: 'SEARCH', payload: e.target.value })} className="max-w-sm"/>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>#</TableHead>
                                                    <TableHead>
                                                        <Button variant="ghost" onClick={() => topAbsencesTable.dispatch({ type: 'SORT', payload: 'studentName' })}>
                                                            التلميذ <ArrowUpDown className="ms-2 h-4 w-4" />
                                                        </Button>
                                                    </TableHead>
                                                    <TableHead>
                                                        <Button variant="ghost" onClick={() => topAbsencesTable.dispatch({ type: 'SORT', payload: 'departmentName' })}>
                                                            القسم <ArrowUpDown className="ms-2 h-4 w-4" />
                                                        </Button>
                                                    </TableHead>
                                                    <TableHead>
                                                         <Button variant="ghost" onClick={() => topAbsencesTable.dispatch({ type: 'SORT', payload: 'absenceCount' })}>
                                                            عدد الغيابات <ArrowUpDown className="ms-2 h-4 w-4" />
                                                        </Button>
                                                    </TableHead>
                                                    <TableHead>عرض</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {topAbsencesTable.paginatedData.map((item, index) => (
                                                    <TableRow key={item.studentId}>
                                                        <TableCell>{(topAbsencesTable.currentPage - 1) * topAbsencesTable.rowsPerPage + index + 1}</TableCell>
                                                        <TableCell>{item.studentName}</TableCell>
                                                        <TableCell>{item.departmentName}</TableCell>
                                                        <TableCell><Badge variant="destructive">{item.absenceCount}</Badge></TableCell>
                                                        <TableCell><Button variant="ghost" size="icon"><Eye className="h-4 w-4"/></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                         <div className="flex items-center justify-end space-x-2 py-4">
                                            <span className="text-sm text-muted-foreground">
                                                إظهار {topAbsencesTable.paginatedData.length} من أصل {topAbsencesTable.totalEntries} مدخل
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => topAbsencesTable.dispatch({ type: 'PAGINATE', payload: topAbsencesTable.currentPage - 1 })} disabled={topAbsencesTable.currentPage === 1}>
                                                السابق
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => topAbsencesTable.dispatch({ type: 'PAGINATE', payload: topAbsencesTable.currentPage + 1 })} disabled={topAbsencesTable.currentPage === topAbsencesTable.totalPages}>
                                                التالي
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                 <Card>
                                    <CardHeader>
                                        <CardTitle>الأقسام حسب نسبة الغياب</CardTitle>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Input placeholder="ابحث..." value={deptAbsencesTable.searchTerm} onChange={(e) => deptAbsencesTable.dispatch({ type: 'SEARCH', payload: e.target.value })} className="max-w-sm"/>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                     <TableHead>#</TableHead>
                                                    <TableHead>
                                                         <Button variant="ghost" onClick={() => deptAbsencesTable.dispatch({ type: 'SORT', payload: 'departmentName' })}>
                                                            القسم <ArrowUpDown className="ms-2 h-4 w-4" />
                                                        </Button>
                                                    </TableHead>
                                                    <TableHead>عدد التلاميذ</TableHead>
                                                    <TableHead>
                                                         <Button variant="ghost" onClick={() => deptAbsencesTable.dispatch({ type: 'SORT', payload: 'absenceCount' })}>
                                                            عدد الغيابات <ArrowUpDown className="ms-2 h-4 w-4" />
                                                        </Button>
                                                    </TableHead>
                                                    <TableHead>
                                                         <Button variant="ghost" onClick={() => deptAbsencesTable.dispatch({ type: 'SORT', payload: 'absencePercentage' })}>
                                                            نسبة الغياب <ArrowUpDown className="ms-2 h-4 w-4" />
                                                        </Button>
                                                    </TableHead>
                                                    <TableHead>عرض</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {deptAbsencesTable.paginatedData.map((item, index) => (
                                                    <TableRow key={item.departmentId}>
                                                         <TableCell>{(deptAbsencesTable.currentPage - 1) * deptAbsencesTable.rowsPerPage + index + 1}</TableCell>
                                                        <TableCell>{item.departmentName}</TableCell>
                                                        <TableCell>{item.studentCount}</TableCell>
                                                        <TableCell>{item.absenceCount}</TableCell>
                                                        <TableCell><Badge variant={item.absencePercentage > 5 ? "destructive" : "default"}>{item.absencePercentage.toFixed(1)}%</Badge></TableCell>
                                                        <TableCell><Button variant="ghost" size="icon"><Eye className="h-4 w-4"/></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="flex items-center justify-end space-x-2 py-4">
                                            <span className="text-sm text-muted-foreground">
                                                إظهار {deptAbsencesTable.paginatedData.length} من أصل {deptAbsencesTable.totalEntries} مدخل
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => deptAbsencesTable.dispatch({ type: 'PAGINATE', payload: deptAbsencesTable.currentPage - 1 })} disabled={deptAbsencesTable.currentPage === 1}>
                                                السابق
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => deptAbsencesTable.dispatch({ type: 'PAGINATE', payload: deptAbsencesTable.currentPage + 1 })} disabled={deptAbsencesTable.currentPage === deptAbsencesTable.totalPages}>
                                                التالي
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className="flex items-center justify-center h-60">
                            <p className="text-muted-foreground">الرجاء تحديد فترة زمنية وعرض الإحصائيات.</p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function AttendancePage() {
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-bold text-3xl text-center text-primary relative">
                المناداة (الحضورو الغياب)
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
