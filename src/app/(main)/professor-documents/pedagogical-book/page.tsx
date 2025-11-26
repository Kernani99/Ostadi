'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  Building,
  User,
  Mic,
  Clock,
  Calendar,
  Users,
  ClipboardCheck,
  CalendarX,
  BookUser,
} from "lucide-react";
import Link from "next/link";

const pedagogicalSections = [
  {
    href: "/settings/technical-card",
    icon: BookUser,
    title: "البطاقة الفنية للأستاذ",
    description: "جميع التفاصيل والبيانات المتعلقة بالأستاذ والمؤهلات الأكاديمية.",
  },
  {
    href: "/professor-documents/pedagogical-book/institution-card",
    icon: Building,
    title: "البطاقة الفنية للمؤسسة",
    description: "معلومات شاملة عن المؤسسة ومرافقها وجميع التجهيزات المتوفرة.",
  },
  {
    href: "/professor-documents/pedagogical-book/sports-equipment",
    icon: Wrench,
    title: "العتاد الرياضي",
    description: "متابعة وتسيير العتاد الرياضي المتوفر بالمؤسسة وحالته الفنية.",
  },
  {
    href: "/professor-documents/pedagogical-book/seminars-schedule",
    icon: Mic,
    title: "جدول الندوات",
    description: "مواعيد الندوات والاجتماعات التربوية والملتقيات التكوينية.",
  },
  {
    href: "/professor-documents/pedagogical-book/timetable",
    icon: Clock,
    title: "جدول التوقيت",
    description: "تنظيم الحصص الدراسية الأسبوعية ومواعيد الأقسام المختلفة.",
  },
  {
    href: "/professor-documents/pedagogical-book/annual-plan",
    icon: Calendar,
    title: "التوزيع السنوي",
    description: "خطط الدروس والأنشطة طيلة السنة الدراسية بشكل منظم ومفصل.",
  },
  {
    href: "/professor-documents/pedagogical-book/class-councils",
    icon: Users,
    title: "مجالس الأقسام",
    description: "تنظيم ومتابعة مجالس الأقسام والتوصيات الدورية لكل فصل.",
  },
  {
    href: "/professor-documents/pedagogical-book/term-exams",
    icon: ClipboardCheck,
    title: "الامتحانات الفصلية",
    description: "إدارة الامتحانات وتحليل النتائج الفصلية وإحصائيات الطلاب.",
  },
  {
    href: "/professor-documents/pedagogical-book/school-holidays",
    icon: CalendarX,
    title: "العطل المدرسية",
    description: "تعرف على تواريخ العطل الرسمية خلال العام الدراسي الحالي.",
  },
];

export default function PedagogicalBookPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl text-center text-primary relative">
          الدفتر البيداغوجي
          <span className="absolute -bottom-2 start-1/2 -translate-x-1/2 w-20 h-1 bg-accent rounded-full"></span>
        </h1>
        <p className="text-muted-foreground text-center">أدوات متكاملة لإدارة العملية التعليمية بكفاءة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedagogicalSections.map((section) => (
          <Link href={section.href} key={section.title}>
            <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <section.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
