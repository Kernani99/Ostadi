'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarX } from "lucide-react";

export default function SchoolHolidaysPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="العطل المدرسية" description="تعرف على تواريخ العطل الرسمية خلال العام الدراسي الحالي." />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="text-primary" />
            قيد الإنشاء
          </CardTitle>
          <CardDescription>هذه الميزة لا تزال قيد التطوير. ترقبوا التحديثات القادمة!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>سيتم عرض جدول العطل المدرسية الرسمية هنا قريبًا، مع إمكانية التصدير والطباعة.</p>
        </CardContent>
      </Card>
    </div>
  );
}
