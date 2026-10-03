"use client";

import type { ReactNode } from "react";
import { BarChart3, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";
import { Brand, BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { isCaptchaEnabled } from "@/firebase/app-check";

const highlights = [
  { icon: ClipboardCheck, title: "المناداة والغياب", text: "تسجيل أسبوعي سريع مع تقارير شهرية وسنوية جاهزة للطباعة." },
  { icon: BarChart3, title: "التقييم بأنواعه", text: "تشخيصي، مستمر، وبالحصة — وفق معايير المنهاج لكل مستوى." },
  { icon: FileText, title: "وثائق الأستاذ", text: "الكراس اليومي، الدفتر البيداغوجي، والبطاقة الفنية في مكان واحد." },
];

export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="pattern-zellij relative hidden flex-col justify-between bg-sidebar p-10 text-white lg:flex xl:p-14">
        <Brand />
        <div className="max-w-md space-y-8">
          <h2 className="text-3xl font-bold leading-snug xl:text-4xl">
            كل ما يحتاجه أستاذ التربية البدنية، في منصة واحدة.
          </h2>
          <ul className="space-y-5">
            {highlights.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-sm leading-relaxed text-sidebar-foreground/80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="flex items-center gap-2 text-xs text-sidebar-muted">
          <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
          بياناتك وبيانات تلاميذك معزولة في حسابك ولا يطّلع عليها غيرك.
        </p>
      </aside>

      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 lg:invisible">
            <BrandMark className="bg-primary text-primary-foreground" />
            <span className="text-[15px] font-bold">أستاذي</span>
          </span>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px] animate-fade-up space-y-7">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </div>
        <div className="space-y-1 text-center text-xs text-muted-foreground">
          {isCaptchaEnabled && (
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              هذه الصفحة محمية بـ reCAPTCHA ضد الطلبات الآلية.
            </p>
          )}
          <p>تطوير وبرمجة: قرناني عبد الحليم</p>
        </div>
      </main>
    </div>
  );
}
