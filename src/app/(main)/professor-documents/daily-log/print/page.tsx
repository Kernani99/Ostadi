
'use client';

import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, query, where, doc } from "firebase/firestore";
import type { DailyLog, Institution, ProfessorProfile } from "@/lib/types";
import { Suspense, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

function PrintContent() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch professor profile
    const profileDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'professor_profile', 'main_profile') : null, [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);
    
    // Fetch all institutions to create a map
    const { data: institutions, isLoading: loadingInstitutions } = useCollection<Institution>(
        useMemoFirebase(() => firestore ? collection(firestore, 'institutions') : null, [firestore])
    );
    const institutionMap = useMemo(() => {
        return new Map(institutions?.map(i => [i.id, i.name]));
    }, [institutions]);

    // Fetch user's daily logs
    const userLogsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'daily_logs'), where('userId', '==', user.uid)) : null, 
    [firestore, user]);
    const { data: dailyLogs, isLoading: loadingLogs } = useCollection<DailyLog>(userLogsQuery);

    const sortedLogs = useMemo(() => {
        if (!dailyLogs) return [];
        return [...dailyLogs].sort((a,b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            if(dateA !== dateB) return dateA - dateB; // Sort by date first
            // Then sort by start time
            return (a.startTime || "").localeCompare(b.startTime || "");
        });
    }, [dailyLogs]);
    
    const isLoading = loadingProfile || loadingInstitutions || loadingLogs;

    useEffect(() => {
        if (!isLoading && sortedLogs.length > 0) {
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, sortedLogs]);


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري تحضير الطباعة...</span></div>;
    }
    
    if (!sortedLogs || sortedLogs.length === 0) {
        return <div className="flex h-screen items-center justify-center"><p>لا توجد سجلات لطباعتها.</p></div>;
    }

    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
    
    const primaryInstitutions = new Set(sortedLogs.map(log => institutionMap.get(log.institutionId)).filter(Boolean));

    return (
        <div className="p-4 bg-white text-black font-body text-xs">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 landscape; margin: 1cm; }
                    .print-header, .print-footer { position: relative; }
                    .print-table { width: 100%; border-collapse: collapse; }
                    .print-table th, .print-table td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; font-size: 9pt; word-break: break-word; }
                    .print-table thead { display: table-header-group; background-color: #e2e8f0; }
                    .print-table tbody tr { page-break-inside: avoid; }
                    .print-table .text-right { text-align: right; }
                }
            `}</style>
            
             <header className="print-header text-center mb-4 space-y-1">
                <h1 className="text-lg font-bold">مديرية التربية لولاية: ${profileData?.wilaya || '...'}</h1>
                <div className="flex justify-between text-sm px-4">
                    <span>الأستاذ(ة): ${professorName || '...'}</span>
                    <span>الموسم الدراسي: ${profileData?.schoolYear || '...'}</span>
                </div>
                 <h2 className="text-base font-semibold">المؤسسة: ${Array.from(primaryInstitutions).join(' - ')}</h2>
            </header>

            <main>
                <table className="w-full border-collapse border border-gray-600 print-table">
                    <thead>
                        <tr>
                            <th>المدرسة</th>
                            <th>التاريخ</th>
                            <th>التوقيت</th>
                            <th>المستوى</th>
                            <th>الميدان</th>
                            <th className="w-[15%]">التعلمات</th>
                            <th className="w-[15%]">محتوى التعلم</th>
                            <th>رقم المذكرة</th>
                            <th className="w-[15%]">الملاحظة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLogs.map((log) => (
                            <tr key={log.id}>
                                <td>{institutionMap.get(log.institutionId) || 'غير معروف'}</td>
                                <td>{log.date}</td>
                                <td>${log.startTime || ''} - ${log.endTime || ''}</td>
                                <td>{log.level}</td>
                                <td>{log.field}</td>
                                <td className="text-right">{log.learnings}</td>
                                <td className="text-right">{log.learningContent}</td>
                                <td>{log.memoNumber}</td>
                                <td className="text-right">{log.observation}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
}

export default function DailyLogPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}
