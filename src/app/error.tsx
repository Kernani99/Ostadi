'use client';

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** حدّ الأخطاء العام: رسالة عامة للمستخدم، والتفاصيل لا تُعرض على الشاشة. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        تعذّر عرض هذه الصفحة. أعد المحاولة، وإن استمر الخطأ فأعد تحميل الصفحة.
      </p>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
