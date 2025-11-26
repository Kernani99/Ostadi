'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarX } from "lucide-react";

export default function SchoolHolidaysPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          العطل المدرسية
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
        <p className="text-muted-foreground text-center">تعرف على تواريخ العطل الرسمية خلال العام الدراسي الحالي.</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
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
