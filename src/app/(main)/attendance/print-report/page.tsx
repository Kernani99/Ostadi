
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Loader2, Users, CalendarX } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type LevelReport = {
    level: string;
    totalStudents: number;
    totalAbsences: number;
    attendancePercentage: number;
    absencePercentage: number;
    topAbsences: { studentName: string; absenceCount: number }[];
};

type PrintData = {
    reportData: LevelReport[];
    institutionName: string;
    month: string;
}

const ReportChartColors = ["#22c55e", "#ef4444"]; // Green for present, Red for absent


function PrintContent() {
    const [printData, setPrintData] = useState<PrintData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        if (!isLoading && printData) {
            const timer = setTimeout(() => window.print(), 1000); // Delay to allow charts to render
            return () => clearTimeout(timer);
        }
    }, [isLoading, printData]);


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري تحضير التقرير...</span></div>;
    }

    if (!printData || !printData.reportData || printData.reportData.length === 0) {
        return <div className="flex h-screen items-center justify-center"><p>لا توجد بيانات لعرضها. يرجى إنشاء تقرير أولاً.</p></div>;
    }

    const { reportData, institutionName, month } = printData;

    return (
        <div className="p-4 bg-white text-black font-body text-xs">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 portrait; margin: 20px; }
                    .no-print { display: none; }
                    .print-header, .print-footer { position: relative; }
                    .print-card { border: 1px solid #e2e8f0; border-radius: 0.5rem; margin-bottom: 1.5rem; page-break-inside: avoid; }
                    .recharts-wrapper { width: 100% !important; height: 150px !important; }
                    .recharts-legend-wrapper { font-size: 10px; }
                }
            `}</style>
            
            <header className="print-header text-center mb-6 space-y-1">
                <h1 className="text-lg font-bold">المدرسة الابتدائية: {institutionName}</h1>
                <h1 className="text-xl font-bold mt-2 underline decoration-double">
                    تقرير الحضور والغياب لشهر {month}
                </h1>
            </header>

            <main className="space-y-6">
                {reportData.map(report => (
                    <div key={report.level} className="print-card p-4">
                        <h2 className="text-center font-bold text-lg mb-4 bg-gray-100 p-2 rounded">{report.level}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'flex-start' }}>
                             <div className="col-span-1 space-y-2 text-center">
                                 <div className="p-2 border rounded">
                                    <Users className="mx-auto h-6 w-6 text-blue-600 mb-1" />
                                    <h4 className="font-bold">إجمالي التلاميذ</h4>
                                    <p className="text-lg font-bold">{report.totalStudents}</p>
                                 </div>
                                 <div className="p-2 border rounded">
                                    <CalendarX className="mx-auto h-6 w-6 text-red-600 mb-1" />
                                    <h4 className="font-bold">إجمالي الغيابات</h4>
                                    <p className="text-lg font-bold">{report.totalAbsences}</p>
                                 </div>
                             </div>
                             <div className="col-span-1">
                                <h3 className="text-center font-semibold mb-2">نسبة الحضور</h3>
                                 <ResponsiveContainer width="100%" height={150}>
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
                                            outerRadius={60}
                                            innerRadius={40}
                                            labelLine={false}
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                           {[
                                                { value: report.attendancePercentage },
                                                { value: report.absencePercentage }
                                            ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ReportChartColors[index % ReportChartColors.length]} />
                                           ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                        <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="col-span-1">
                                <h3 className="text-center font-semibold mb-2">التلاميذ الأكثر غياباً</h3>
                                 <table className="w-full text-sm">
                                     <thead>
                                         <tr className="bg-gray-100">
                                            <th className="p-1 border text-right">التلميذ</th>
                                            <th className="p-1 border text-center w-20">الغيابات</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {report.topAbsences.length > 0 ? report.topAbsences.slice(0, 5).map(s => ( // Limit to top 5
                                            <tr key={s.studentName}>
                                                <td className="p-1 border">{s.studentName}</td>
                                                <td className="p-1 border text-center font-bold text-red-600">{s.absenceCount}</td>
                                            </tr>
                                         )) : (
                                            <tr>
                                                <td colSpan={2} className="p-1 border text-center h-16 text-gray-500">لا توجد غيابات.</td>
                                            </tr>
                                         )}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    </div>
                ))}
            </main>
             <footer className="print-footer mt-8 pt-4 text-sm">
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '50px' }}>
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
