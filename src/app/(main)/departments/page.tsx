import { GroupManager } from "@/components/departments/group-manager";

export default function DepartmentsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">إدارة الأقسام والأفواج</h1>
      
      {/* A placeholder for department list and management UI */}
      <div className="mb-8 p-6 border rounded-lg bg-card text-card-foreground">
        <h2 className="text-xl font-semibold mb-2">قائمة الأقسام</h2>
        <p className="text-muted-foreground">سيتم عرض وإدارة الأقسام هنا في المستقبل.</p>
      </div>
      
      <GroupManager />
    </div>
  );
}
