'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";

export default function SeminarsSchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="جدول الندوات" description="مواعيد الندوات والاجتماعات التربوية والملتقيات التكوينية." />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="text-primary" />
            قيد الإنشاء
          </CardTitle>
          <CardDescription>هذه الميزة لا تزال قيد التطوير. ترقبوا التحديثات القادمة!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>قريبًا، ستتمكن من تسجيل وإدارة جدول الندوات والاجتماعات التربوية، مع إشعارات وتذكيرات.</p>
        </CardContent>
      </Card>
    </div>
  );
}
