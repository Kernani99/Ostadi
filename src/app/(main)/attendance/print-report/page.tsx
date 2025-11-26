
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";

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
    professorName: string;
    schoolYear: string;
}

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
            const timer = setTimeout(() => window.print(), 1000); // Delay to allow layout to render
            return () => clearTimeout(timer);
        }
    }, [isLoading, printData]);


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري تحضير التقرير...</span></div>;
    }

    if (!printData || !printData.reportData || printData.reportData.length === 0) {
        return <div className="flex h-screen items-center justify-center"><p>لا توجد بيانات لعرضها. يرجى إنشاء تقرير أولاً.</p></div>;
    }

    const { reportData, institutionName, month, professorName, schoolYear } = printData;

    return (
        <div className="p-4 bg-white text-black font-body">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
                    @page { size: A4 portrait; margin: 10px; }
                    .no-print { display: none; }
                    .print-table { page-break-inside: avoid; border-spacing: 0; border-collapse: collapse; width: 100%; }
                    .print-table th, .print-table td { padding: 6px; border: 1px solid #ccc; text-align: right; font-size: 10pt; }
                    .print-table th { background-color: #f2f2f2; font-weight: bold; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .text-red-600 { color: #dc2626; }
                }
            `}</style>
            
            <header className="print-header text-center mb-4 space-y-1">
                <h1 className="text-base font-bold">المؤسسة: {institutionName}</h1>
                 <h2 className="text-sm">الأستاذ(ة): {professorName || '...'} | السنة الدراسية: {schoolYear || '...'}</h2>
                <h1 className="text-lg font-bold mt-1 underline decoration-double">
                    تقرير الحضور والغياب لشهر {month}
                </h1>
            </header>

            <main className="space-y-4">
                {reportData.map(report => (
                    <div key={report.level} className="print-table">
                        <table className="w-full">
                             <thead>
                                <tr>
                                    <th colSpan={2} className="text-center text-base bg-gray-200 p-2">{report.level}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="w-1/2">
                                        <p><strong>إجمالي التلاميذ:</strong> {report.totalStudents}</p>
                                        <p><strong>إجمالي الغيابات:</strong> {report.totalAbsences}</p>
                                    </td>
                                    <td className="w-1/2">
                                        <p><strong>نسبة الحضور:</strong> <span className="font-bold">{report.attendancePercentage.toFixed(1)}%</span></p>
                                        <p><strong>نسبة الغياب:</strong> <span className="font-bold text-red-600">{report.absencePercentage.toFixed(1)}%</span></p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
            </main>
             <footer className="print-footer mt-4 pt-2 text-xs">
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المفتش</h4>
                         <div className="mt-8">...........................</div>
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold">إمضاء المدير</h4>
                         <div className="mt-8">...........................</div>
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
