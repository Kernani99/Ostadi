
'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, doc, query, where } from "firebase/firestore";
import type { Student, ProfessorProfile, Attendance, Institution } from "@/lib/types";
import { useMemo, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';

const attendanceStatusMap: { [key: string]: string } = {
    present: 'ح',
    absent: 'غ',
    justified: 'م',
    'no-outfit': 'ب.ل',
};

// Define school year months
const schoolMonths = [
    { name: 'نوفمبر', value: '11' },
    { name: 'ديسمبر', value: '12' },
    { name: 'جانفي', value: '01' },
    { name: 'فيفري', value: '02' },
    { name: 'مارس', value: '03' },
    { name: 'أفريل', value: '04' },
    { name: 'ماي', value: '05' },
    { name: 'جوان', value: '06' },
];

const currentYear = new Date().getFullYear();
const schoolMonthStrings = schoolMonths.map(m => (parseInt(m.value) >= 9 ? `${currentYear -1}`: `${currentYear}`) + `-${m.value}`);

function PrintAnnualContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    
    const institutionId = searchParams.get('institutionId');
    const level = searchParams.get('level');

    const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);
    
    const institutionDocRef = useMemoFirebase(() => institutionId ? doc(firestore, 'institutions', institutionId) : null, [firestore, institutionId]);
    const { data: institution, isLoading: loadingInstitution } = useDoc<Institution>(institutionDocRef);

    const studentsQuery = useMemoFirebase(() => 
        institutionId && level ? query(collection(firestore, 'students'), where('institutionId', '==', institutionId), where('level', '==', level)) : null
    , [firestore, institutionId, level]);
    const { data: students, isLoading: loadingStudents } = useCollection<Student>(studentsQuery);
    
    const studentIds = useMemo(() => students?.map(s => s.id) || [], [students]);

    const attendanceQuery = useMemoFirebase(() =>
        studentIds.length > 0 ? query(collection(firestore, 'attendances'), where('studentId', 'in', studentIds), where('month', 'in', schoolMonthStrings)) : null
    , [firestore, studentIds]);

    const { data: attendances, isLoading: loadingAttendances } = useCollection<Attendance>(attendanceQuery);

    const attendanceMap = useMemo(() => {
        const map = new Map<string, Map<string, { [week: number]: string }>>();
        attendances?.forEach(att => {
            if (!map.has(att.studentId)) {
                map.set(att.studentId, new Map());
            }
            map.get(att.studentId)!.set(att.month, att.records);
        });
        return map;
    }, [attendances]);
    
    const sortedStudents = useMemo(() => students?.sort((a,b) => a.lastName.localeCompare(b.lastName)) || [], [students]);

    const isLoading = loadingProfile || loadingInstitution || loadingStudents || loadingAttendances;
    
    useEffect(() => {
        if (!isLoading && sortedStudents.length > 0) {
            setTimeout(() => window.print(), 1000);
        }
    }, [isLoading, sortedStudents]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري التحضير للطباعة...</span></div>;
    }
    
    if (!institutionId || !level || sortedStudents.length === 0) {
         return <div className="flex h-screen items-center justify-center"><p>لا توجد بيانات لعرضها. يرجى التأكد من اختيار المؤسسة والمستوى.</p></div>;
    }
    
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
                    .no-break { page-break-inside: avoid; }
                    .month-header {
                         writing-mode: vertical-rl;
                         text-orientation: mixed;
                         transform: rotate(180deg);
                    }
                }
            `}</style>

            <header className="print-header text-center mb-4 space-y-1 no-break">
                <h1 className="text-base font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-sm font-semibold">المدرسة الابتدائية: {institution?.name || '...'}</h2>
                <div className="flex justify-between text-xs">
                    <span>السنة الدراسية: {profileData?.schoolYear || '...'}</span>
                    <span>الأستاذ: {professorName || '...'}</span>
                </div>
                <h1 className="text-lg font-bold mt-2 underline decoration-double">
                    كشف الحضور السنوي - {level}
                </h1>
            </header>

            <main>
                <table className="w-full border-collapse border border-gray-600 print-table text-center">
                    <thead>
                        <tr className="bg-gray-200">
                            <th rowSpan={2} className="border border-gray-500 p-1 align-middle">الرقم</th>
                            <th rowSpan={2} className="border border-gray-500 p-1 align-middle min-w-[120px]">اللقب والإسم</th>
                            {schoolMonths.map(month => (
                                <th key={month.value} colSpan={5} className="border border-gray-500 p-1">{month.name}</th>
                            ))}
                        </tr>
                         <tr className="bg-gray-200">
                             {schoolMonths.map(month => (
                                 <>
                                    <th className="border border-gray-500 font-normal w-[20px]">1</th>
                                    <th className="border border-gray-500 font-normal w-[20px]">2</th>
                                    <th className="border border-gray-500 font-normal w-[20px]">3</th>
                                    <th className="border border-gray-500 font-normal w-[20px]">4</th>
                                    <th className="border border-gray-500 font-normal w-[20px]">5</th>
                                 </>
                             ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map((student, index) => (
                            <tr key={student.id}>
                                <td className="border border-gray-500 p-1">{index + 1}</td>
                                <td className="border border-gray-500 p-1 text-right">{student.lastName} {student.firstName}</td>
                                {schoolMonthStrings.map(monthStr => {
                                    const studentMonthData = attendanceMap.get(student.id)?.get(monthStr) || {};
                                    return (
                                        <>
                                            {[1, 2, 3, 4, 5].map(week => (
                                                <td key={`${monthStr}-${week}`} className="border border-gray-500 p-1 font-bold">
                                                    {attendanceStatusMap[studentMonthData[week] || ''] || ''}
                                                </td>
                                            ))}
                                        </>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs no-break">
                    <div className="flex items-center gap-1"><span className="font-bold">ح:</span><span>حاضر</span></div>
                    <div className="flex items-center gap-1"><span className="font-bold">غ:</span><span>غائب</span></div>
                    <div className="flex items-center gap-1"><span className="font-bold">م:</span><span>مبرر</span></div>
                    <div className="flex items-center gap-1"><span className="font-bold">ب.ل:</span><span>بدون لباس</span></div>
                </div>
            </main>

            <footer className="print-footer mt-8 pt-4 text-xs no-break">
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

export default function PrintAnnualAttendancePage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintAnnualContent />
        </Suspense>
    );
}
