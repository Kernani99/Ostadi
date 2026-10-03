"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import {
  BookCheck,
  Building2,
  CheckCircle,
  ClipboardList,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { ProfessorProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "عام",
    items: [{ href: "/", label: "الرئيسية", icon: LayoutDashboard }],
  },
  {
    label: "التسيير",
    items: [
      { href: "/students", label: "التلاميذ", icon: Users },
      { href: "/departments", label: "الأفواج التربوية", icon: Building2 },
      { href: "/attendance", label: "المناداة", icon: ClipboardList },
    ],
  },
  {
    label: "التقييم",
    items: [
      { href: "/diagnostic", label: "التقييم التشخيصي", icon: Stethoscope },
      { href: "/evaluations", label: "التقييم المستمر", icon: BookCheck },
      { href: "/evaluations/session-based", label: "التقييم بالحصة", icon: CheckCircle },
    ],
  },
  {
    label: "الأدوات",
    items: [
      { href: "/professor-documents/daily-log", label: "الكراس اليومي", icon: NotebookPen },
      { href: "/professor-documents", label: "وثائق الأستاذ", icon: Files },
      { href: "/ai-assistant", label: "المساعد الذكي", icon: Sparkles, soon: true },
      { href: "/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

/** العنصر النشط هو صاحب أطول بادئة مطابقة، حتى لا يُفعَّل «/evaluations» و«/evaluations/session-based» معاً. */
function activeHref(pathname: string): string | null {
  let best: string | null = null;
  for (const { href } of allItems) {
    const match = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
    if (match && (!best || href.length > best.length)) best = href;
  }
  return best;
}

/** صفحات تُفتح في تبويب مستقل للطباعة أو العرض الكامل: بلا هيكل التطبيق. */
export function isChromelessPath(pathname: string): boolean {
  return /(^|\/)print(-[a-z]+)?(\/|$)/.test(pathname) || pathname.startsWith("/evaluations/view");
}

function NavList({ current, onNavigate }: { current: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold text-sidebar-muted">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, icon: Icon, soon }) => {
              const active = current === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-sidebar-primary",
                      active && "bg-sidebar-accent text-white"
                    )}
                  >
                    {active && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-sidebar-primary" />}
                    <Icon className={cn("h-[18px] w-[18px] shrink-0 text-sidebar-muted group-hover:text-white", active && "text-sidebar-primary")} />
                    <span className="flex-1">{label}</span>
                    {soon && <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-muted">قريباً</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ current, onNavigate }: { current: string | null; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Link href="/" onClick={onNavigate} className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5 text-white">
        <Brand />
      </Link>
      <div className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
        <NavList current={current} onNavigate={onNavigate} />
      </div>
      <p className="border-t border-sidebar-border px-5 py-3 text-[11px] text-sidebar-muted">
        تطوير وبرمجة: قرناني عبد الحليم
      </p>
    </div>
  );
}

function UserMenu() {
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  const profileRef = useMemoFirebase(() => (user ? doc(firestore, "professor_profile", user.uid) : null), [firestore, user]);
  const { data: profile } = useDoc<ProfessorProfile>(profileRef);

  const name = useMemo(() => {
    const full = `${profile?.lastName || ""} ${profile?.firstName || ""}`.trim();
    return full || user?.email || "الأستاذ";
  }, [profile, user]);

  const initial = name.trim().charAt(0).toUpperCase() || "أ";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      toast({ title: "تعذّر تسجيل الخروج", description: "حاول مرة أخرى.", variant: "destructive" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg border bg-card py-1 pe-3 ps-1 text-sm shadow-xs transition-colors hover:bg-muted"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            {initial}
          </span>
          <span className="hidden max-w-[160px] truncate font-medium sm:block">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          {user?.email && <p dir="ltr" className="truncate text-end text-xs font-normal text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/technical-card"><Files /> البطاقة الفنية</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings /> الإعدادات</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut /> تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = activeHref(pathname);
  const currentLabel = allItems.find((i) => i.href === current)?.label;

  if (isChromelessPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        تجاوز إلى المحتوى
      </a>

      <aside data-app-chrome className="fixed inset-y-0 start-0 z-40 hidden w-64 lg:block">
        <SidebarBody current={current} />
      </aside>

      <div className="flex min-h-dvh flex-col lg:ps-64">
        <header
          data-app-chrome
          className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-8"
        >
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" aria-label="فتح قائمة التنقل">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-0 p-0 [&>button]:text-white">
              <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
              <SidebarBody current={current} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-muted-foreground">
            {currentLabel ?? "أستاذي"}
          </p>

          <ThemeToggle />
          <UserMenu />
        </header>

        <main id="main" data-app-main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1320px] animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
