import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">التقارير والاحصائيات</h1>
      <Card>
        <CardHeader>
          <CardTitle>عرض التقارير</CardTitle>
          <CardDescription>
            هذه الواجهة قيد التطوير. سيتم هنا عرض تقارير مفصلة قابلة للفلترة والطباعة.
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
