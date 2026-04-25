'use client';

import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith('/evaluations');

  return (
    <div className="flex min-h-screen w-full flex-col">
      {showHeader && <Header />}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
