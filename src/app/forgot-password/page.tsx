'use client';

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase";

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setDone(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-email') {
        setError("صيغة البريد الإلكتروني غير صحيحة.");
      } else if (code === 'auth/too-many-requests') {
        setError("طلبات كثيرة. حاول بعد بضع دقائق.");
      } else if (code === 'auth/network-request-failed') {
        setError("تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.");
      } else {
        // لا نكشف إن كان البريد مسجَّلاً أم لا: نفس الرسالة في الحالتين.
        setDone(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="استعادة كلمة المرور" description="أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.">
      {done ? (
        <Alert variant="success">
          <MailCheck className="h-4 w-4" />
          <AlertTitle>تحقق من بريدك</AlertTitle>
          <AlertDescription>
            إن كان هذا البريد مسجَّلاً لدينا فستصلك رسالة تحتوي رابط إعادة التعيين خلال دقائق. تفقّد مجلد الرسائل غير المرغوب فيها أيضاً.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@example.com"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 text-left"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isLoading || !email}>
            {isLoading && <Loader2 className="animate-spin" />}
            إرسال رابط الاستعادة
          </Button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          <ArrowRight className="h-4 w-4" />
          العودة إلى تسجيل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
}
