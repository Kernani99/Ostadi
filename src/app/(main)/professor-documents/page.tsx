
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked, FolderKanban, ClipboardList } from "lucide-react";
import Link from "next/link";


export default function ProfessorDocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="وثائق الأستاذ" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/professor-documents/daily-log">
          <Card className="transition-colors hover:border-primary/50 hover:bg-accent/30">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent p-3 text-accent-foreground">
                  <BookMarked className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>الكراس اليومي</CardTitle>
                  <CardDescription>إدارة وتدوين السجلات اليومية للحصص.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/professor-documents/pedagogical-book">
          <Card className="transition-colors hover:border-primary/50 hover:bg-accent/30">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent p-3 text-accent-foreground">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>الدفتر البيداغوجي</CardTitle>
                  <CardDescription>سجلات ومتابعات بيداغوجية متنوعة.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/attendance">
          <Card className="transition-colors hover:border-primary/50 hover:bg-accent/30">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent p-3 text-accent-foreground">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>دفتر المناداة</CardTitle>
                  <CardDescription>إدارة الحضور والغياب للتلاميذ.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

    </div>
  );
}
