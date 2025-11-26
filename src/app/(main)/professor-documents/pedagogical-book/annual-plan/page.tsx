'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function AnnualPlanPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          التوزيع السنوي
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
        <p className="text-muted-foreground text-center">خطط الدروس والأنشطة طيلة السنة الدراسية بشكل منظم ومفصل.</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
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
