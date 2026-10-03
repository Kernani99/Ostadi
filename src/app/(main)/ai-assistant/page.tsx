import Link from "next/link";
import { Construction, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// المساعد موقوف مؤقتاً. واجهة المحادثة محفوظة في src/components/ai/assistant-chat.tsx،
// والمسار /api/ai-assistant مغلق ما لم يُضبط AI_ASSISTANT_ENABLED=true في الخادم.
export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-3">المساعد الذكي <Badge variant="warning">قيد التطوير</Badge></span>}
        description="مساعد تربوي لتحليل النتائج وصياغة التقارير والمذكرات."
      />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Sparkles className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-bold">هذه الخدمة غير متاحة حالياً</h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            نعمل على تجهيز المساعد الذكي ليكون آمناً وموثوقاً قبل إتاحته. سيُفعَّل في تحديث قادم دون أي إجراء من جهتك.
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Construction className="h-4 w-4" /> قيد التطوير
          </p>
          <Button asChild variant="outline">
            <Link href="/">العودة إلى الرئيسية</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
