import { Toaster } from "@/components/ui/toaster";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm no-print">
            <div className="container mx-auto p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-primary">STAPS Manager</h1>
                <p className="text-sm text-muted-foreground">أداة الأستاذ</p>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            {children}
        </main>
        <Toaster />
    </div>
  );
}
