import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AttendancePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">المناداة (الحضور والغياب)</h1>
      <Card>
        <CardHeader>
          <CardTitle>تسجيل الحضور</CardTitle>
          <CardDescription>
            هذه الواجهة قيد التطوير. سيتم هنا عرض واجهة سريعة لاختيار القسم وتسجيل الحضور والغياب.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            قريباً...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
