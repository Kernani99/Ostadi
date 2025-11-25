
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { doc } from "firebase/firestore";
import type { ProfessorProfile, GeneralStats } from "@/lib/types";
import { Loader2, Users, CalendarX, UserCheck, Clock } from "lucide-react";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";


type PrintData = {
    reportData: GeneralStats;
    dateRange: {
        from: string;
        to: string;
    }
}

function PrintContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [printData, setPrintData] = useState<PrintData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const profileDocRef = useMemoFirebase(() => user ? doc(firestore, 'professor_profile', 'main_profile') : null, [firestore, user]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    useEffect(() => {
        const data = sessionStorage.getItem('attendanceReportPrintData');
        if (data) {
            try {
                setPrintData(JSON.parse(data));
            } catch (e) {
                console.error("Failed to parse print data from sessionStorage", e);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading && !loadingProfile && printData) {
            setTimeout(() => window.print(), 1000); // Delay to allow charts to render
        }
    }, [isLoading, loadingProfile, printData]);


    if (isLoading || loadingProfile) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري تحضير التقرير...</span></div>;
    }

    if (!printData) {
        return <div className="flex h-screen items-center justify-center"><p>لا توجد بيانات لعرضها. يرجى إنشاء تقرير أولاً.</p></div>;
    }

    const { reportData, dateRange } = printData;
    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
    const fromDate = format(new Date(dateRange.from), 'dd/MM/yyyy');
    const toDate = format(new Date(dateRange.to), 'dd/MM/yyyy');

    return (
        <div className="p-4 bg-white text-black font-body text-xs">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 portrait; margin: 20px; }
                    .no-print { display: none; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { page-break-inside: auto; }
                    .print-table thead { display: table-header-group; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .print-card { border: 1px solid #e2e8f0; border-radius: 0.5rem; margin-bottom: 1rem; page-break-inside: avoid; }
                    .recharts-wrapper { width: 100% !important; height: 300px !important; }
                }
            `}</style>
            
            <header className="print-header text-center mb-6 space-y-1">
                <h1 className="text-lg font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-base font-semibold">المدرسة الابتدائية: {profileData?.schoolName || '...'}</h2>
                <h3 className="text-sm">السنة الدراسية: {profileData?.schoolYear || '...'}</h3>
                <h3 className="text-sm">الأستاذ: {professorName || '...'}</h3>
                <h1 className="text-xl font-bold mt-2 underline decoration-double">
                    تقرير الحضور والغياب
                </h1>
                <p className="text-sm text-gray-600">للفترة من {fromDate} إلى {toDate}</p>
            </header>

            <main className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="print-card p-3">
                        <UserCheck className="mx-auto h-6 w-6 text-green-600 mb-1" />
                        <h4 className="font-bold">نسبة الحضور</h4>
                        <p className="text-lg font-bold">{reportData.attendancePercentage.toFixed(1)}%</p>
                    </div>
                    <div className="print-card p-3">
                        <CalendarX className="mx-auto h-6 w-6 text-red-600 mb-1" />
                        <h4 className="font-bold">نسبة الغياب</h4>
                        <p className="text-lg font-bold">{reportData.totalAbsencePercentage.toFixed(1)}%</p>
                    </div>
                    <div className="print-card p-3">
                        <Users className="mx-auto h-6 w-6 text-blue-600 mb-1" />
                        <h4 className="font-bold">إجمالي الغيابات</h4>
                        <p className="text-lg font-bold">{reportData.totalAbsences}</p>
                    </div>
                     <div className="print-card p-3">
                        <Clock className="mx-auto h-6 w-6 text-yellow-600 mb-1" />
                        <h4 className="font-bold">متوسط الغياب</h4>
                        <p className="text-lg font-bold">{reportData.averageAbsencePerStudent.toFixed(1)}</p>
                    </div>
                </div>

                <div className="print-card">
                     <h3 className="text-base font-bold p-3 border-b text-center bg-gray-50">توزيع الغياب حسب الأشهر</h3>
                     <div className="p-2 h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.monthlyAbsenceDistribution}>
                                <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip wrapperStyle={{ fontSize: "10px" }} />
                                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="print-card pt-4">
                     <h3 className="text-base font-bold p-3 border-b text-center bg-gray-50">قائمة التلاميذ الأكثر غياباً</h3>
                    <table className="w-full text-sm print-table">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">#</th>
                                <th className="p-2 border text-right">التلميذ</th>
                                <th className="p-2 border text-right">القسم</th>
                                <th className="p-2 border">عدد الغيابات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.topAbsences.slice(0, 10).map((item, index) => (
                                <tr key={item.studentId}>
                                    <td className="p-2 border text-center">{index + 1}</td>
                                    <td className="p-2 border">{item.studentName}</td>
                                    <td className="p-2 border">{item.departmentName}</td>
                                    <td className="p-2 border text-center font-bold text-red-600">{item.absenceCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </main>
             <footer className="print-footer mt-8 pt-4 text-sm">
                <div className="flex justify-around">
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المفتش</h4>
                         <div className="mt-12">...........................</div>
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المدير</h4>
                         <div className="mt-12">...........................</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function PrintReportPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}


    