
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
          map.set(dept.id, allStudents.filter(s => s.departmentId === dept.id));
        });

        return map;

    }, [allStudents, departments]);
    
    useEffect(() => {
        if (!isLoadingDepts && !isLoadingStudents) {
            setTimeout(() => window.print(), 500); // Delay print to allow rendering
        }
    }, [isLoadingDepts, isLoadingStudents]);
    
    if (isLoadingDepts || isLoadingStudents) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ms-2">جاري تجهيز القائمة للطباعة...</p>
            </div>
        )
    }

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>طباعة قائمة الأفواج</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                    body {
                        font-family: 'Cairo', sans-serif;
                        direction: rtl;
                        margin: 2rem;
                    }
                    h1 {
                        text-align: center;
                        font-size: 2rem;
                        margin-bottom: 2rem;
                        border-bottom: 2px solid #333;
                        padding-bottom: 1rem;
                    }
                    .department {
                        page-break-inside: avoid;
                        margin-bottom: 2rem;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        padding: 1rem;
                    }
                    .department-header {
                        display: flex;
                        justify-content: space-between;
                        font-size: 1.5rem;
                        font-weight: bold;
                        background-color: #f2f2f2;
                        padding: 0.5rem 1rem;
                        border-radius: 4px 4px 0 0;
                        border-bottom: 1px solid #ccc;

                    }
                    .student-list {
                        column-count: 2;
                        column-gap: 2rem;
                        padding: 1rem 0;
                    }
                    .student-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.5rem;
                        border-bottom: 1px dotted #eee;
                    }
                    .student-name {
                        font-size: 1rem;
                    }
                     .student-gender {
                        font-size: 0.9rem;
                        color: #555;
                    }
                     @media print {
                        body {
                            margin: 0;
                        }
                        .department {
                            border: 1px solid #aaa;
                        }
                    }
                `}</style>
            </head>
            <body>
                <h1>قائمة الأفواج</h1>
                {departments && departments.length > 0 ? (
                    <div>
                        {departments.map(dept => (
                            <div key={dept.id} className="department">
                                <div className="department-header">
                                    <span>{dept.name}</span>
                                    <span>عدد التلاميذ: {studentsByDepartment.get(dept.id)?.length || 0}</span>
                                </div>
                                <div className="student-list">
                                    {studentsByDepartment.get(dept.id)?.length > 0 ? (
                                        studentsByDepartment.get(dept.id)?.map(student => (
                                            <div key={student.id} className="student-item">
                                               <span className="student-name">{student.lastName} {student.firstName}</span>
                                               <span className="student-gender">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p>لا يوجد تلاميذ في هذا الفوج.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>لا توجد أفواج لعرضها.</p>
                )}
            </body>
        </html>
    );
}

    