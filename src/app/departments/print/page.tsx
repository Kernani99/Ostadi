
'use client';

import { useCollection, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection } from "firebase/firestore";
import type { Student, Department } from "@/lib/types";
import { useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PrintDepartmentsPage() {
    const firestore = useFirestore();
    
    const departmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore]);
    const { data: departments, isLoading: isLoadingDepts } = useCollection<Department>(departmentsQuery);

    const allStudentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
    const { data: allStudents, isLoading: isLoadingStudents } = useCollection<Student>(allStudentsQuery);
    
    const studentsByDepartment = useMemo(() => {
        if (!allStudents || !departments) return new Map<string, Student[]>();
        
        const map = new Map<string, Student[]>();
        
        departments.forEach(dept => {
          map.set(dept.id, allStudents.filter(s => s.departmentId === dept.id).sort((a, b) => a.lastName.localeCompare(b.lastName)));
        });

        return map;

    }, [allStudents, departments]);
    
    useEffect(() => {
        if (!isLoadingDepts && !isLoadingStudents && (departments?.length ?? 0) > 0) {
            // A short delay to ensure content is rendered before print dialog opens
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingDepts, isLoadingStudents, departments]);
    
    if (isLoadingDepts || isLoadingStudents) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ms-2">جاري تجهيز القائمة للطباعة...</p>
            </div>
        )
    }

    if (!departments || departments.length === 0) {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>لا توجد أفواج لعرضها أو طباعتها.</p>
            </div>
        )
    }

    return (
        <div className="p-8">
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none;
                    }
                    @page {
                        size: A4;
                        margin: 0.75in;
                    }
                }
                .department {
                    page-break-inside: avoid;
                }
            `}</style>
            <h1 className="text-center text-3xl font-bold mb-8 pb-4 border-b-2 border-black">
                قائمة الأفواج
            </h1>
            
            <div className="space-y-8">
                {departments.map(dept => (
                    <div key={dept.id} className="department border border-gray-300 rounded-lg overflow-hidden">
                        <div className="department-header bg-gray-100 p-3 flex justify-between font-bold text-xl">
                            <span>{dept.name}</span>
                            <span>عدد التلاميذ: {studentsByDepartment.get(dept.id)?.length || 0}</span>
                        </div>
                        <div className="student-list p-4 columns-2 gap-8">
                            {studentsByDepartment.get(dept.id)?.length > 0 ? (
                                studentsByDepartment.get(dept.id)?.map((student, index) => (
                                    <div key={student.id} className="student-item flex justify-between py-1 border-b border-gray-200">
                                       <span className="student-name">{index + 1}. {student.lastName} {student.firstName}</span>
                                       <span className="student-gender text-gray-600">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">لا يوجد تلاميذ في هذا الفوج.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

    