'use client';

import Link from "next/link";
import { useMemo } from "react";
import { collection, doc, query, where } from "firebase/firestore";
import {
  ArrowLeft,
  BookCheck,
  Building2,
  ClipboardList,
  Landmark,
  Stethoscope,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { Department, Institution, ProfessorProfile, Student } from "@/lib/types";

const LEVELS = ["أولى ابتدائي", "ثانية ابتدائي", "ثالثة ابتدائي", "رابعة ابتدائي", "خامسة ابتدائي"];
const LEVEL_SHORT: Record<string, string> = {
  "أولى ابتدائي": "الأولى",
  "ثانية ابتدائي": "الثانية",
  "ثالثة ابتدائي": "الثالثة",
  "رابعة ابتدائي": "الرابعة",
  "خامسة ابتدائي": "الخامسة",
};

const shortcuts: { href: string; label: string; text: string; icon: LucideIcon }[] = [
  { href: "/attendance", label: "المناداة", text: "تسجيل الحضور والغياب", icon: ClipboardList },
  { href: "/diagnostic", label: "التقييم التشخيصي", text: "مؤشرات بداية السنة", icon: Stethoscope },
  { href: "/evaluations", label: "التقييم المستمر", text: "شبكات التقييم الفصلية", icon: BookCheck },
  { href: "/students", label: "التلاميذ", text: "إضافة وتحويل وتعديل", icon: UserPlus },
];

const percent = (part: number, total: number) => (total > 0 ? `${((part / total) * 100).toFixed(0)}%` : "—");

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const { data: students, isLoading: loadingStudents } = useCollection<Student>(
    useMemoFirebase(() => (user ? query(collection(firestore, 'students'), where('userId', '==', user.uid)) : null), [firestore, user])
  );
  const { data: departments } = useCollection<Department>(
    useMemoFirebase(() => (user ? query(collection(firestore, 'departments'), where('userId', '==', user.uid)) : null), [firestore, user])
  );
  const { data: institutions } = useCollection<Institution>(
    useMemoFirebase(() => (user ? query(collection(firestore, 'institutions'), where('userId', '==', user.uid)) : null), [firestore, user])
  );
  const { data: profile } = useDoc<ProfessorProfile>(
    useMemoFirebase(() => (user ? doc(firestore, 'professor_profile', user.uid) : null), [firestore, user])
  );

  const stats = useMemo(() => {
    const list = students ?? [];
    const males = list.filter((s) => s.gender === 'male').length;
    const exempt = list.filter((s) => s.status === 'exempt').length;
    const byLevel = LEVELS.map((level) => {
      const inLevel = list.filter((s) => s.level === level);
      const m = inLevel.filter((s) => s.gender === 'male').length;
      return { level: LEVEL_SHORT[level], males: m, females: inLevel.length - m };
    });
    return { total: list.length, males, females: list.length - males, exempt, byLevel };
  }, [students]);

  const firstName = profile?.firstName?.trim();
  const isEmpty = !loadingStudents && (institutions?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `مرحباً، ${firstName}` : "مرحباً بك"}
        description="نظرة عامة على تلاميذك وأقسامك ومؤسساتك."
        actions={
          <Button asChild>
            <Link href="/attendance"><ClipboardList /> بدء المناداة</Link>
          </Button>
        }
      />

      {isEmpty && (
        <Card className="border-dashed bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="font-semibold">ابدأ بإضافة مؤسستك الأولى</p>
              <p className="text-sm text-muted-foreground">أضف المؤسسة، ثم الأفواج والتلاميذ، لتفعيل المناداة والتقييم.</p>
            </div>
            <Button asChild>
              <Link href="/settings"><Landmark /> إضافة مؤسسة</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="إجمالي التلاميذ" value={stats.total} icon={Users} description={stats.exempt > 0 ? `منهم ${stats.exempt} معفى` : "كل المسجلين"} />
        <StatCard title="الذكور" value={stats.males} icon={Users} tone="info" description={`${percent(stats.males, stats.total)} من الإجمالي`} />
        <StatCard title="الإناث" value={stats.females} icon={Users} tone="rose" description={`${percent(stats.females, stats.total)} من الإجمالي`} />
        <StatCard title="الأفواج" value={departments?.length ?? 0} icon={Building2} tone="violet" description={`في ${institutions?.length ?? 0} مؤسسة`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>توزيع التلاميذ حسب المستوى</CardTitle>
            <CardDescription>عدد الذكور والإناث في كل سنة دراسية.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.total === 0 ? (
              <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                لا توجد بيانات تلاميذ بعد.
              </p>
            ) : (
              <>
                <div className="h-[280px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byLevel} margin={{ top: 8, right: 0, left: -18, bottom: 0 }} barGap={4}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="level" reversed tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis orientation="left" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{
                          direction: "rtl",
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          color: "hsl(var(--popover-foreground))",
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="males" name="ذكور" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="females" name="إناث" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 flex justify-center gap-5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-3" /> ذكور</li>
                  <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-4" /> إناث</li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وصول سريع</CardTitle>
            <CardDescription>المهام الأكثر استعمالاً.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            {shortcuts.map(({ href, label, text, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{text}</span>
                </span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
