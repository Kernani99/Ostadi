import { StatCard } from "@/components/dashboard/stat-card";
import { departments, institutions, students } from "@/lib/data";
import { Building, Building2, GraduationCap, User, Users } from "lucide-react";

export default function DashboardPage() {
  const totalStudents = students.length;
  const totalMales = students.filter((s) => s.gender === "male").length;
  const totalFemales = students.filter((s) => s.gender === "female").length;
  const totalDepartments = departments.length;
  const totalInstitutions = institutions.length;

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
