'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClassCouncilsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="مجالس الأقسام" description="تنظيم ومتابعة مجالس الأقسام والتوصيات الدورية لكل فصل." />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary" />
            قيد الإنشاء
          </CardTitle>
          <CardDescription>هذه الميزة لا تزال قيد التطوير. ترقبوا التحديثات القادمة!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>نعمل حاليًا على تطوير نظام متكامل لإدارة مجالس الأقسام، تسجيل الحضور، وتدوين التوصيات والملاحظات.</p>
        </CardContent>
      </Card>
    </div>
  );
}
