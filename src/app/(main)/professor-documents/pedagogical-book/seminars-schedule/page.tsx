'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";

export default function SeminarsSchedulePage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          جدول الندوات
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
        <p className="text-muted-foreground text-center">مواعيد الندوات والاجتماعات التربوية والملتقيات التكوينية.</p>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
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
