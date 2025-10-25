
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Department, Institution, Attendance } from "@/lib/types";
import { collection, doc, query, where, setDoc } from "firebase/firestore";
import { addMonths, subMonths, format, getDaysInMonth, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

// Helper function to generate days of the month
const getMonthDays = (date: Date) => {
    const daysInMonth = getDaysInMonth(date);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

// Attendance status options
const attendanceStatuses = [
    { value: 'present', label: 'ح' },
    { value: 'absent', label: 'غ' },
    { value: 'justified', label: 'م' },
    { value: 'no-outfit', label: 'ب.ل' },
];

export default function AttendancePage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for filters and date
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Fetching data from Firestore
    const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
        useMemoFirebase(() => collection(firestore, 'institutions'), [firestore])
    );

    const departmentsQuery = useMemoFirebase(() =>
        selectedInstitution ? query(collection(firestore, 'departments'), where('institutionId', '==', selectedInstitution)) : null
    , [firestore, selectedInstitution]);
    const { data: departments, isLoading: loadingDepartments } = useCollection<Department>(departmentsQuery);
    
    const studentsQuery = useMemoFirebase(() => 
        selectedDepartment ? query(collection(firestore, 'students'), where('departmentId', '==', selectedDepartment)) : null
    , [firestore, selectedDepartment]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const monthStr = format(currentDate, 'yyyy-MM');
    const attendanceQuery = useMemoFirebase(() =>
        selectedDepartment ? query(collection(firestore, 'attendances'), where('departmentId', '==', selectedDepartment), where('month', '==', monthStr)) : null
    , [firestore, selectedDepartment, monthStr]);
    const { data: attendances, isLoading: loadingAttendances } = useCollection<Attendance>(attendanceQuery);
    
    // Memoize processed attendance data for performance
    const attendanceMap = useMemo(() => {
        const map = new Map<string, { [day: number]: string }>();
        if (!attendances) return map;
        attendances.forEach(att => {
            map.set(att.studentId, att.records);
        });
        return map;
    }, [attendances]);


    // Handlers
    const handleInstitutionChange = (id: string) => {
        setSelectedInstitution(id);
        setSelectedDepartment('');
    };

    const handleDepartmentChange = (id: string) => {
        setSelectedDepartment(id);
    };

    const handleAttendanceChange = async (studentId: string, day: number, status: string) => {
        if (!selectedDepartment) return;

        const date = startOfMonth(currentDate);
        date.setDate(day);
        
        const attendanceId = `${studentId}_${monthStr}`;
        const attendanceRef = doc(firestore, 'attendances', attendanceId);
        
        const existingRecords = attendanceMap.get(studentId) || {};
        const newRecords = { ...existingRecords, [day]: status };

        try {
            await setDoc(attendanceRef, {
                studentId: studentId,
                departmentId: selectedDepartment,
                month: monthStr,
                records: newRecords
            }, { merge: true });

             toast({
                title: "تم الحفظ",
                description: `تم تسجيل حضور التلميذ لليوم ${day}.`,
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
    
    const daysOfMonth = getMonthDays(currentDate);

    const handlePrint = () => {
        if (!selectedDepartment) {
            toast({
                title: "الرجاء اختيار قسم أولاً",
                variant: "destructive"
            });
            return;
        }
        const params = new URLSearchParams();
        params.set('departmentId', selectedDepartment);
        params.set('month', monthStr);
        window.open(`/attendance/print?${params.toString()}`, '_blank');
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-bold text-3xl text-center text-primary relative">
                المناداة (الحضور والغياب)
                <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>اختيار القسم</CardTitle>
                    <CardDescription>اختر المؤسسة والقسم لعرض سجل الحضور.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <Select onValueChange={handleInstitutionChange} disabled={loadingInstitutions}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر المؤسسة..." />
                        </SelectTrigger>
                        <SelectContent>
                            {institutions?.map(inst => (
                                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select onValueChange={handleDepartmentChange} disabled={!selectedInstitution || loadingDepartments}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر القسم..." />
                        </SelectTrigger>
                        <SelectContent>
                            {departments?.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedDepartment && (
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
                                        {daysOfMonth.map(day => (
                                            <TableHead key={day} className="text-center min-w-[60px]">{day}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingStudents || loadingAttendances ? (
                                        <TableRow>
                                            <TableCell colSpan={daysOfMonth.length + 1} className="text-center h-24">
                                                جاري تحميل البيانات...
                                            </TableCell>
                                        </TableRow>
                                    ) : students && students.length > 0 ? (
                                        students.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell className="sticky left-0 bg-card z-10 font-medium border-e">{student.lastName} {student.firstName}</TableCell>
                                                {daysOfMonth.map(day => (
                                                    <TableCell key={day} className="p-1 text-center">
                                                        <Select
                                                            value={attendanceMap.get(student.id)?.[day] || ''}
                                                            onValueChange={(status) => handleAttendanceChange(student.id, day, status)}
                                                        >
                                                            <SelectTrigger className="h-8 w-14 text-xs">
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
                                            <TableCell colSpan={daysOfMonth.length + 1} className="text-center h-24">
                                               لا يوجد تلاميذ في هذا القسم.
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
    );
}

