import { cn } from "@/lib/utils";

/** شعار المنصة: مسار مضمار داخل مربع — يُستعمل في الشريط الجانبي وصفحات الدخول. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M4 16V11a8 8 0 0 1 16 0v5" />
        <path d="M8.5 16v-4.5a3.5 3.5 0 0 1 7 0V16" />
        <path d="M3 20h18" />
      </svg>
    </span>
  );
}

export function Brand({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold">أستاذي</span>
        {subtitle && <span className="text-[11px] opacity-70">التربية البدنية والرياضية</span>}
      </span>
    </span>
  );
}
