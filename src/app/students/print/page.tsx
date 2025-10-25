'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, doc, query, where, Query, DocumentData } from "firebase/firestore";
import type { Student, Institution, ProfessorProfile } from "@/lib/types";
import { useMemo, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';

function PrintPageContent() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const level = searchParams.get('level');
    const institutionId = searchParams.get('institutionId');

    const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
    const { data: profileData, isLoading: isLoadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    const institutionsQuery = useMemoFirebase(() => collection(firestore, 'institutions'), [firestore]);
    const { data: institutions, isLoading: isLoadingInstitutions } = useCollection<Institution>(institutionsQuery);
    
    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q: Query<DocumentData> = collection(firestore, 'students');
        
        const conditions = [];
        if (level) {
            conditions.push(where('level', '==', level));
        }
        if (institutionId) {
            conditions.push(where('institutionId', '==', institutionId));
        }

        if (conditions.length > 0) {
            q = query(q, ...conditions);
        }

        return q;
    }, [firestore, level, institutionId]);

    const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

    const institutionMap = useMemo(() => 
        new Map(institutions?.map(inst => [inst.id, inst.name])), 
    [institutions]);

    const studentsGrouped = useMemo(() => {
        if (!students) return new Map();
        
        return students.reduce((acc, student) => {
            const institutionName = institutionMap.get(student.institutionId) || 'مؤسسة غير معروفة';
            const levelName = student.level || 'مستوى غير محدد';
            
            const groupKey = `${institutionName}|${levelName}`;

            if (!acc.has(groupKey)) {
                acc.set(groupKey, []);
            }
            acc.get(groupKey)?.push(student);
            
            // Sort students within the group
            acc.get(groupKey)?.sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));

            return acc;
        }, new Map<string, Student[]>());

    }, [students, institutionMap]);


    const sortedGroupKeys = useMemo(() => 
        Array.from(studentsGrouped.keys()).sort(), 
    [studentsGrouped]);


    useEffect(() => {
        if (!isLoadingStudents && !isLoadingProfile && !isLoadingInstitutions && students) {
             const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingStudents, isLoadingProfile, isLoadingInstitutions, students]);

    const isLoading = isLoadingStudents || isLoadingProfile || isLoadingInstitutions;

     if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ms-2">جاري تجهيز القائمة للطباعة...</p>
            </div>
        )
    }

     if (!students || students.length === 0) {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>لا يوجد تلاميذ لعرضهم أو طباعتهم حسب الفلاتر المحددة.</p>
            </div>
        )
    }

    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
    const listTitle = level && institutionId 
        ? `قائمة تلاميذ ${level} - ${institutionMap.get(institutionId)}`
        : level
        ? `قائمة تلاميذ ${level}`
        : institutionId
        ? `قائمة تلاميذ مؤسسة ${institutionMap.get(institutionId)}`
        : 'القائمة الإسمية للتلاميذ';

    return (
        <div className="p-8 bg-white text-black font-body">
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page-break-before {
                        page-break-before: always;
                    }
                    .student-table {
                        page-break-inside: auto;
                    }
                     .student-table thead {
                        display: table-header-group;
                    }
                    .student-table tbody tr {
                        page-break-inside: avoid;
                    }
                     @page {
                        size: A4 portrait;
                        margin: 0.75in;
                    }
                }
            `}</style>
             <header className="text-center mb-10 space-y-2">
                <h1 className="text-xl font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-lg font-semibold">المدرسة الابتدائية: {profileData?.schoolName || '...'}</h2>
                <h3 className="text-base">السنة الدراسية: {profileData?.schoolYear || '...'}</h3>
                <h3 className="text-base">الأستاذ: {professorName || '...'}</h3>
                <h1 className="text-2xl font-bold mt-4 underline decoration-double">{listTitle}</h1>
            </header>
            
            <main className="space-y-10">
                {sortedGroupKeys.map((key, index) => {
                    const [institutionName, levelName] = key.split('|');
                    const groupStudents = studentsGrouped.get(key) || [];
                    return (
                        <div key={key} className={`student-table ${index > 0 ? 'page-break-before' : ''}`}>
                            <h2 className="text-xl font-bold mb-4">
                                المؤسسة: {institutionName} - المستوى: {levelName}
                            </h2>
                            <table className="w-full border-collapse border border-gray-400 text-sm">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="border border-gray-400 p-2 w-12">الرقم</th>
                                        <th className="border border-gray-400 p-2 text-right">اللقب والإسم</th>
                                        <th className="border border-gray-400 p-2 text-right w-40">تاريخ الميلاد</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupStudents.map((student, studentIndex) => (
                                        <tr key={student.id}>
                                            <td className="border border-gray-400 p-2 text-center">{studentIndex + 1}</td>
                                            <td className="border border-gray-400 p-2">{student.lastName} {student.firstName}</td>
                                            <td className="border border-gray-400 p-2">{student.dateOfBirth || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                })}
            </main>
            <footer className="mt-16 pt-8 text-center text-sm">
                 <div className="flex justify-around">
                    <div className="flex-1">
                        <h4 className="font-bold text-lg">إمضاء المفتش</h4>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg">إمضاء المدير</h4>
                    </div>
                </div>
            </footer>
        </div>
    );
}


export default function PrintStudentsPage() {
    return (
        <Suspense fallback={<div>جاري التحميل...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}