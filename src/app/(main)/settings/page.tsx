import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">الإعدادات</h1>
      <Card>
        <CardHeader>
          <CardTitle>إدارة الإعدادات</CardTitle>
          <CardDescription>
            هذه الواجهة قيد التطوير. سيتم هنا إدارة المؤسسات ومعايير التقييم وإعدادات التطبيق.
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
