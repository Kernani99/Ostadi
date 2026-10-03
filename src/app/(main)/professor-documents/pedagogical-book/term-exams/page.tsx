'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function TermExamsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="الامتحانات الفصلية" description="إدارة الامتحانات وتحليل النتائج الفصلية وإحصائيات الطلاب." />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="text-primary" />
            قيد الإنشاء
          </CardTitle>
          <CardDescription>هذه الميزة لا تزال قيد التطوير. ترقبوا التحديثات القادمة!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>نحن نعمل على توفير أدوات متقدمة لإدارة الامتحانات، تحليل النتائج، وتوليد إحصائيات مفصلة لمتابعة أداء الطلاب.</p>
        </CardContent>
      </Card>
    </div>
  );
}
