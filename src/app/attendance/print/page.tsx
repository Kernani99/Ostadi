
'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, doc, query, where } from "firebase/firestore";
import type { Student, Department, ProfessorProfile, Attendance } from "@/lib/types";
import { useMemo, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { format, getDaysInMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

const attendanceStatusMap: { [key: string]: string } = {
    present: 'ح',
    absent: 'غ',
    justified: 'م',
    'no-outfit': 'ب.ل',
};


function PrintContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    
    const departmentId = searchParams.get('departmentId');
    const month = searchParams.get('month'); // "yyyy-MM"

    const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);
    
    const departmentDocRef = useMemoFirebase(() => departmentId ? doc(firestore, 'departments', departmentId) : null, [firestore, departmentId]);
    const { data: department, isLoading: loadingDepartment } = useDoc<Department>(departmentDocRef);

    const institutionDocRef = useMemoFirebase(() => department ? doc(firestore, 'institutions', department.institutionId) : null, [firestore, department]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => 
        departmentId ? query(collection(firestore, 'students'), where('departmentId', '==', departmentId)) : null
    , [firestore, departmentId]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);

    const attendanceQuery = useMemoFirebase(() =>
        departmentId && month ? query(collection(firestore, 'attendances'), where('departmentId', '==', departmentId), where('month', '==', month)) : null
    , [firestore, departmentId, month]);
    const { data: attendances, isLoading: loadingAttendances } = useCollection<Attendance>(attendanceQuery);

    const attendanceMap = useMemo(() => {
        const map = new Map<string, { [day: number]: string }>();
        attendances?.forEach(att => {
            map.set(att.studentId, att.records);
        });
        return map;
    }, [attendances]);
    
    const sortedStudents = useMemo(() => students?.sort((a,b) => a.lastName.localeCompare(b.lastName)) || [], [students]);

    const isLoading = loadingProfile || loadingDepartment || loadingInstitution || loadingStudents || loadingAttendances;
    
    useEffect(() => {
        if (!isLoading && students && students.length > 0) {
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, students]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري التحضير...</span></div>;
    }
    
    if (!departmentId || !month || !department || sortedStudents.length === 0) {
         return <div className="flex h-screen items-center justify-center"><p>لا توجد بيانات لعرضها. يرجى التأكد من اختيار القسم والشهر الصحيحين.</p></div>;
    }
    
    const printDate = new Date(`${month}-01T12:00:00`);
    const daysOfMonth = Array.from({ length: getDaysInMonth(printDate) }, (_, i) => i + 1);
    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();


    return (
        <div className="p-4 bg-white text-black font-body text-xs">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 landscape; margin: 0.5in; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { page-break-inside: auto; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                }
            `}</style>

            <header className="print-header text-center mb-4 space-y-1">
                <h1 className="text-lg font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-base font-semibold">المدرسة الابتدائية: {institution?.name || '...'}</h2>
                <div className="flex justify-between text-sm">
                    <span>السنة الدراسية: {profileData?.schoolYear || '...'}</span>
                    <span>الأستاذ: {professorName || '...'}</span>
                </div>
                <h1 className="text-xl font-bold mt-2 underline decoration-double">
                    كشف الحضور الشهري - {department.name} - {format(printDate, 'MMMM yyyy', { locale: ar })}
                </h1>
            </header>

            <main>
                <table className="w-full border-collapse border border-gray-600 print-table">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-500 p-1">الرقم</th>
                            <th className="border border-gray-500 p-1 text-right">اللقب والإسم</th>
                            {daysOfMonth.map(day => (
                                <th key={day} className="border border-gray-500 p-1 w-6">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map((student, index) => (
                            <tr key={student.id}>
                                <td className="border border-gray-500 p-1 text-center">{index + 1}</td>
                                <td className="border border-gray-500 p-1">{student.lastName} {student.firstName}</td>
                                {daysOfMonth.map(day => (
                                    <td key={day} className="border border-gray-500 p-1 text-center font-bold">
                                        {attendanceStatusMap[attendanceMap.get(student.id)?.[day] || ''] || ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2"><span className="font-bold">ح:</span><span>حاضر</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold">غ:</span><span>غائب</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold">م:</span><span>مبرر</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold">ب.ل:</span><span>بدون لباس</span></div>
                </div>
            </main>

            <footer className="print-footer mt-8 pt-4 text-sm">
                <div className="flex justify-around">
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المفتش</h4>
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المدير</h4>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function PrintAttendancePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}
