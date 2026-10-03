import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="tabular text-6xl font-bold text-primary">404</p>
      <h1 className="text-xl font-bold">الصفحة غير موجودة</h1>
      <p className="max-w-sm text-sm text-muted-foreground">الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت.</p>
      <Button asChild>
        <Link href="/">العودة إلى الرئيسية</Link>
      </Button>
    </div>
  );
}
