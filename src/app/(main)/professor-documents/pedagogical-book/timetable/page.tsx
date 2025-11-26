'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function TimetablePage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          جدول التوقيت
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
        <p className="text-muted-foreground text-center">تنظيم الحصص الدراسية الأسبوعية ومواعيد الأقسام المختلفة.</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-primary" />
            قيد الإنشاء
          </CardTitle>
          <CardDescription>هذه الميزة لا تزال قيد التطوير. ترقبوا التحديثات القادمة!</CardDescription>
        </CardHeader>
        <CardContent>
          <p>ستتمكن قريبًا من إنشاء وإدارة جدول التوقيت الأسبوعي الخاص بك، مع عرض مرئي سهل ومميزات للطباعة والتصدير.</p>
        </CardContent>
      </Card>
    </div>
  );
}
