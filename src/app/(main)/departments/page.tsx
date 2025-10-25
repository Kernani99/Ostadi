import { GroupManager } from "@/components/departments/group-manager";
import { Card, CardContent } from "@/components/ui/card";

export default function DepartmentsPage() {
  return (
    <div className="container mx-auto p-4">
       <div className="flex flex-col items-center gap-2 mb-6">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          إدارة الأقسام والأفواج
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
      </div>
      
      <Card className="mb-8 p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-2 text-primary">قائمة الأقسام</h2>
        <p className="text-muted-foreground">سيتم عرض وإدارة الأقسام هنا في المستقبل.</p>
      </Card>
      
      <GroupManager />
    </div>
  );
}
