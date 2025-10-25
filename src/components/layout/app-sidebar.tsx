"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChartHorizontalBig,
  Building2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/students", label: "التلاميذ", icon: Users },
  { href: "/departments", label: "الأقسام", icon: Building2 },
  { href: "/attendance", label: "المناداة", icon: ClipboardList },
  { href: "/reports", label: "التقارير", icon: BarChartHorizontalBig },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const NavLink = ({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
      isActive && "bg-muted text-primary"
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
);

const AppNav = () => {
  const pathname = usePathname();
  return (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} isActive={pathname === item.href} />
      ))}
    </nav>
  );
};

export function AppSidebar() {
  return (
    <div className="hidden border-l bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="">STAPS Manager</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <AppNav />
        </div>
      </div>
    </div>
  );
}

export const MobileNav = () => (
    <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="3" x2="21" y1="6" y2="6" />
              <line x1="3" x2="21" y1="12" y2="12" />
              <line x1="3" x2="21" y1="18" y2="18" />
            </svg>
            <span className="sr-only">فتح قائمة التنقل</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="">STAPS Manager</span>
            </Link>
          </div>
          <AppNav />
        </SheetContent>
      </Sheet>
);
