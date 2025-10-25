'use client'
import { StatCard } from "@/components/dashboard/stat-card";
import { useCollection, useFirestore } from "@/firebase";
import { Building, Building2, Users, User } from "lucide-react";
import { collection } from 'firebase/firestore'
import { useMemoFirebase } from "@/firebase/provider";


export default function DashboardPage() {
  const firestore = useFirestore();

  const studentsQuery = useMemoFirebase(() => {
    return collection(firestore, 'students')
  }, [firestore])
  const { data: students } = useCollection(studentsQuery);

  const departmentsQuery = useMemoFirebase(() => {
    return collection(firestore, 'departments')
  }, [firestore])
  const { data: departments } = useCollection(departmentsQuery);

  const institutionsQuery = useMemoFirebase(() => {
    return collection(firestore, 'institutions')
  }, [firestore])
  const { data: institutions } = useCollection(institutionsQuery);


  const totalStudents = students?.length ?? 0;
  const totalMales = students?.filter((s) => s.gender === "male").length ?? 0;
  const totalFemales = students?.filter((s) => s.gender === "female").length ?? 0;
  const totalDepartments = departments?.length ?? 0;
  const totalInstitutions = institutions?.length ?? 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">الرئيسية</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="إجمالي التلاميذ"
          value={totalStudents}
          icon={Users}
        />
        <StatCard
          title="عدد الذكور"
          value={totalMales}
          icon={User}
        />
        <StatCard
          title="عدد الإناث"
          value={totalFemales}
          icon={User}
        />
        <StatCard
          title="إجمالي الأقسام"
          value={totalDepartments}
          icon={Building2}
        />
        <StatCard
          title="عدد المؤسسات"
          value={totalInstitutions}
          icon={Building}
        />
      </div>
      <div className="mt-8">
        {/* Placeholder for future charts and more detailed statistics */}
      </div>
    </div>
  );
}
