'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // صفحة عرض المحاكاة تُفتح في تبويب مستقل وتدير هيكلها بنفسها.
  if (pathname.startsWith('/evaluations-demo/view')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh">
      <header className="no-print border-b bg-sidebar text-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/login"><Brand /></Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-sidebar-foreground sm:block">أداة الأستاذ</span>
            <span className="[&_button]:text-sidebar-foreground [&_button:hover]:bg-sidebar-accent"><ThemeToggle /></span>
          </div>
        </div>
      </header>
      <main className="container py-6 md:py-10">{children}</main>
    </div>
  );
}
