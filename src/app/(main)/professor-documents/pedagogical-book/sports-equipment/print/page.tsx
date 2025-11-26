
'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import type { SportsEquipment, ProfessorProfile } from '@/lib/types';
import { collection, query, where, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

function PrintContent() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch professor profile for the header
    const profileDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'professor_profile', 'main_profile') : null, [firestore]);
    const { data: profileData, isLoading: loadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    // Fetch sports equipment data for the current user
    const equipmentQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'sports_equipment'), where('userId', '==', user.uid)) : null,
        [firestore, user]
    );
    const { data: equipment, isLoading: loadingEquipment } = useCollection<SportsEquipment>(equipmentQuery);

    const sortedEquipment = useMemo(() => {
        if (!equipment) return [];
        return [...equipment].sort((a, b) => a.name.localeCompare(b.name));
    }, [equipment]);

    const isLoading = loadingProfile || loadingEquipment;

    useEffect(() => {
        if (!isLoading && sortedEquipment.length > 0) {
            const timer = setTimeout(() => window.print(), 500); // Delay to ensure rendering
            return () => clearTimeout(timer);
        }
    }, [isLoading, sortedEquipment]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> <span className="ms-2">جاري تحضير الطباعة...</span></div>;
    }

    if (!sortedEquipment || sortedEquipment.length === 0) {
        return <div className="flex h-screen items-center justify-center">لا توجد بيانات لطباعتها.</div>;
    }

    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
    const schoolName = profileData?.schoolName || '...';
    const wilaya = profileData?.wilaya || '...';
    const schoolYear = profileData?.schoolYear || '...';

    return (
        <div className="p-8 bg-white text-black font-body">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 portrait; margin: 1cm; }
                    .print-header { text-align: center; margin-bottom: 2rem; }
                    .print-table { width: 100%; border-collapse: collapse; }
                    .print-table th, .print-table td { border: 1px solid #000; padding: 8px; text-align: right; font-size: 12pt; }
                    .print-table th { background-color: #e2e8f0; }
                    .print-table .text-center { text-align: center; }
                    .print-footer { margin-top: 4rem; text-align: center; }
                }
            `}</style>

            <header className="print-header">
                <h1 className="text-xl font-bold">مديرية التربية لولاية: {wilaya}</h1>
                <h2 className="text-lg font-semibold">المدرسة الابتدائية: {schoolName}</h2>
                <h3 className="text-base mt-2">السنة الدراسية: {schoolYear}</h3>
                <h3 className="text-base">الأستاذ(ة): {professorName}</h3>
                <h1 className="text-2xl font-bold mt-6 underline decoration-double">سجل العتاد الرياضي</h1>
            </header>

            <main>
                <table className="print-table">
                    <thead>
                        <tr>
                            <th className="w-16 text-center">الرقم</th>
                            <th>الوسيلة التعليمية</th>
                            <th className="w-24 text-center">الكمية الإجمالية</th>
                            <th className="w-24 text-center">الصالحة</th>
                            <th className="w-24 text-center">التالفة</th>
                            <th className="w-48 text-center">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEquipment.map((item, index) => (
                            <tr key={item.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>{item.name}</td>
                                <td className="text-center">{item.totalQuantity}</td>
                                <td className="text-center">{item.goodCondition}</td>
                                <td className="text-center">{item.badCondition}</td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>

            <footer className="print-footer">
                <div className="flex justify-around">
                    <div>
                        <h4 className="font-bold">إمضاء المدير(ة)</h4>
                    </div>
                    <div>
                        <h4 className="font-bold">إمضاء الأستاذ(ة)</h4>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function SportsEquipmentPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
            <PrintContent />
        </Suspense>
    );
}

    