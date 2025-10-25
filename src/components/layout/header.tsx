import { MobileNav } from "./app-sidebar";

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <MobileNav />
      <div className="w-full flex-1">
        {/* Can add breadcrumbs or page titles here in the future */}
      </div>
    </header>
  );
}
