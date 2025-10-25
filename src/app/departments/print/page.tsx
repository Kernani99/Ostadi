'use client';

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, doc } from "firebase/firestore";
import type { Student, Department, ProfessorProfile } from "@/lib/types";
import { useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PrintDepartmentsPage() {
    const firestore = useFirestore();
    
    const departmentsQuery = useMemoFirebase(() => collection(firestore, 'departments'), [firestore]);
    const { data: departments, isLoading: isLoadingDepts } = useCollection<Department>(departmentsQuery);

    const allStudentsQuery = useMemoFirebase(() => collection(firestore, 'students'), [firestore]);
    const { data: allStudents, isLoading: isLoadingStudents } = useCollection<Student>(allStudentsQuery);
    
    const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
    const { data: profileData, isLoading: isLoadingProfile } = useDoc<ProfessorProfile>(profileDocRef);

    const studentsByDepartment = useMemo(() => {
        if (!allStudents || !departments) return new Map<string, Student[]>();
        
        const map = new Map<string, Student[]>();
        
        departments.forEach(dept => {
          map.set(dept.id, allStudents.filter(s => s.departmentId === dept.id).sort((a, b) => a.lastName.localeCompare(b.lastName)));
        });

        return map;

    }, [allStudents, departments]);

    const departmentsByLevel = useMemo(() => {
      if (!departments) return new Map<string, Department[]>();
  
      const grouped = departments.reduce((acc, dept) => {
          const level = dept.level || 'غير محدد';
          if (!acc.has(level)) {
              acc.set(level, []);
          }
          acc.get(level)!.push(dept);
          return acc;
      }, new Map<string, Department[]>());
  
      const levelOrder = ['أولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'غير محدد'];
      
      const sortedGrouped = new Map<string, Department[]>();
      levelOrder.forEach(level => {
          if(grouped.has(level)) {
              // Sort departments within each level by name
              const sortedDepts = grouped.get(level)!.sort((a, b) => a.name.localeCompare(b.name));
              sortedGrouped.set(level, sortedDepts);
          }
      });
  
      return sortedGrouped;
    }, [departments]);
    
    useEffect(() => {
        if (!isLoadingDepts && !isLoadingStudents && !isLoadingProfile && (departments?.length ?? 0) > 0) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingDepts, isLoadingStudents, isLoadingProfile, departments]);
    
    const isLoading = isLoadingDepts || isLoadingStudents || isLoadingProfile;

    if (isLoading) {
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

    const professorName = `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();

    return (
        <div className="p-8 bg-white text-black font-body">
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
                        size: A4 portrait;
                        margin: 0.5in;
                    }
                    .page-break-before {
                        page-break-before: always;
                    }
                    .department-card {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
             <header className="text-center mb-10 space-y-2">
                <h1 className="text-xl font-bold">مديرية التربية لولاية: {profileData?.wilaya || '...'}</h1>
                <h2 className="text-lg font-semibold">المدرسة الابتدائية: {profileData?.schoolName || '...'}</h2>
                <h3 className="text-base">السنة الدراسية: {profileData?.schoolYear || '...'}</h3>
                <h3 className="text-base">الأستاذ: {professorName || '...'}</h3>
                <h1 className="text-2xl font-bold mt-4 underline decoration-double">قائمة الأفواج</h1>
            </header>
            
            <main className="space-y-10">
                {Array.from(departmentsByLevel.entries()).map(([level, depts]) => (
                    <div key={level}>
                        <h2 className="text-2xl font-bold text-center mb-6 p-2 bg-gray-200 rounded-md">
                            أفواج {level}
                        </h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {depts.map(dept => (
                                <div key={dept.id} className="department-card border border-gray-400 rounded-lg overflow-hidden break-inside-avoid-column">
                                    <div className="department-header bg-gray-100 p-2 text-center font-bold text-lg border-b border-gray-400">
                                        <span>{dept.name} ( العدد: {studentsByDepartment.get(dept.id)?.length || 0} )</span>
                                    </div>
                                    <div className="student-list p-2">
                                        {studentsByDepartment.get(dept.id)?.length > 0 ? (
                                            <ol className="list-decimal list-inside text-sm space-y-1">
                                                {studentsByDepartment.get(dept.id)?.map((student, index) => (
                                                    <li key={student.id} className="student-item">
                                                        {index + 1}- {student.lastName} {student.firstName}
                                                    </li>
                                                ))}
                                            </ol>
                                        ) : (
                                            <p className="text-gray-500 text-center p-4">لا يوجد تلاميذ.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>
            <footer className="mt-16 pt-8 text-center">
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
