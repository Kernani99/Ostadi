
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Files,
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
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import type { ProfessorProfile } from "@/lib/types";

const navItems = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/students", label: "التلاميذ", icon: Users },
  { href: "/departments", label: "الأقسام", icon: Building2 },
  { href: "/attendance", label: "المناداة", icon: ClipboardList },
  { href: "/professor-documents", label: "وثائق الأستاذ", icon: Files },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const NavLink = ({
  href,
  label,
  icon: Icon,
  isActive,
  isMobile = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isMobile?: boolean;
}) => (
  <Link
    href={href}
    className={cn(
      "transition-colors text-muted-foreground hover:text-foreground",
      isActive && "text-foreground",
      isMobile ? "flex items-center gap-4 px-2.5" : "text-sm font-medium"
    )}
  >
    {isMobile && <Icon className="h-5 w-5" />}
    {label}
  </Link>
);

const AppNav = ({ isMobile = false }: { isMobile?: boolean }) => {
  const pathname = usePathname();
  return (
    <nav className={cn(
        isMobile 
        ? "grid gap-6 text-lg font-medium" 
        : "hidden md:flex md:flex-row md:items-center md:gap-5 lg:gap-6 text-sm font-medium"
      )}>
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} isActive={pathname === item.href} isMobile={isMobile} />
      ))}
    </nav>
  );
};


export function Header() {
  const firestore = useFirestore();
  const profileDocRef = useMemoFirebase(() => doc(firestore, 'professor_profile', 'main_profile'), [firestore]);
  const { data: profileData } = useDoc<ProfessorProfile>(profileDocRef);
  const professorName = profileData ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() : '...';

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>مرحباً بك استاذ: {professorName}</span>
        </Link>
      </div>

      <div className="flex-1 flex justify-center">
        <AppNav />
      </div>

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
        <SheetContent side="right">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 mb-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="">مرحباً بك استاذ: {professorName}</span>
                </Link>
            </div>
          <AppNav isMobile />
        </SheetContent>
      </Sheet>
    </header>
  );
}
