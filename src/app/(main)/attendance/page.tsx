
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Student, Department, Institution, Attendance } from "@/lib/types";
import { collection, doc, query, where, setDoc } from "firebase/firestore";
import { addMonths, subMonths, format, getWeeksInMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";


// Helper function to get number of weeks in a month
const getWeeksOfMonth = (date: Date) => {
    const weeks = getWeeksInMonth(date, { weekStartsOn: 6 }); // Assuming Saturday is the start of the week for school context
    return Array.from({ length: weeks }, (_, i) => i + 1);
};


export default function AttendancePage() {
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
        selectedInstitution && selectedLevel ? 
        query(
            collection(firestore, 'students'), 
            where('institutionId', '==', selectedInstitution),
            where('level', '==', selectedLevel)
        ) : null
    , [firestore, selectedInstitution, selectedLevel]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const monthStr = format(currentDate, 'yyyy-MM');
    // We need to fetch attendance for all students found, as we don't have a single departmentId anymore
    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);

    const attendanceQuery = useMemoFirebase(() =>
        studentIds.length > 0 ? query(collection(firestore, 'attendances'), where('studentId', 'in', studentIds), where('month', '==', monthStr)) : null
    , [firestore, studentIds, monthStr]);
    const { data: attendances, isLoading: loadingAttendances } = useCollection<Attendance>(attendanceQuery);
    
    // Memoize processed attendance data for performance
    const attendanceMap = useMemo(() => {
        const map = new Map<string, { [week: number]: string }>();
        if (!attendances) return map;
        attendances.forEach(att => {
            map.set(att.studentId, att.records);
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
        // The student object might not have a departmentId if they are unassigned.
        // We'll save it if it exists, otherwise we can save `null` or an empty string.
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
        // This needs a dedicated print page that filters by institution and level,
        // similar to the students print page. For now, we'll just log a message.
        // A full implementation would require a new route e.g., /attendance/print-level
        console.log("Printing for institution:", selectedInstitution, "and level:", selectedLevel);
        toast({
            title: "ميزة الطباعة قيد التطوير",
            description: "سيتم تفعيل طباعة سجل الحضور قريباً.",
        });
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-bold text-3xl text-center text-primary relative">
                المناداة (الحضوضر والغياب)
                <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
                </h1>
            </div>

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
    );
}

    

    