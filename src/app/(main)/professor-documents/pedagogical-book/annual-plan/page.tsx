'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function AnnualPlanPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="التوزيع السنوي" description="خطط الدروس والأنشطة طيلة السنة الدراسية بشكل منظم ومفصل." />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-primary" />
            قيد الإنشاء
          </CardTitle>
          <CardDescription>هذه الميزة لا تزال قيد التطوير. ترقبوا التحديثات القادمة!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>نحن نعمل بجد لتوفير أداة شاملة لتخطيط الدروس والأنشطة السنوية. ستتمكن قريبًا من تنظيم خططك الدراسية بسهولة.</p>
        </CardContent>
      </Card>
    </div>
  );
}
