'use client';

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase";
import { isCaptchaEnabled } from "@/firebase/app-check";

// رسالة موحّدة لكل أخطاء بيانات الدخول حتى لا يُكشف أيّ البريدين مسجَّل.
const GENERIC_ERROR = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

function messageFor(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return "صيغة البريد الإلكتروني غير صحيحة.";
    case 'auth/too-many-requests':
      return "محاولات كثيرة. تم إيقاف الدخول مؤقتاً، حاول بعد بضع دقائق أو أعد تعيين كلمة المرور.";
    case 'auth/user-disabled':
      return "هذا الحساب معطَّل. تواصل مع المشرف.";
    case 'auth/network-request-failed':
      // مع الكابتشا مفعَّلة، هذا الخطأ يظهر أيضاً حين لا تحصل الصفحة على شهادة reCAPTCHA (بعد مهلة 30 ثانية).
      return isCaptchaEnabled
        ? "تعذّر الاتصال بالخادم أو تعذّر التحقق عبر reCAPTCHA. أعد تحميل الصفحة وحاول مجدداً، وعطّل مانع الإعلانات إن وُجد."
        : "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
    default:
      return GENERIC_ERROR;
  }
}

export default function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setNeedsVerification(false);
    setResendState('idle');
    setIsLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!user.emailVerified) {
        // الحساب غير مفعَّل: لا نُبقي جلسة مفتوحة.
        await signOut(auth);
        setNeedsVerification(true);
        setIsLoading(false);
      }
      // عند النجاح تتكفل بوابة المصادقة بالتوجيه إلى لوحة التحكم.
    } catch (err: unknown) {
      setError(messageFor((err as { code?: string })?.code));
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setResendState('sending');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!user.emailVerified) await sendEmailVerification(user);
      await signOut(auth);
      setResendState('sent');
    } catch {
      setResendState('failed');
    }
  };

  return (
    <AuthLayout title="تسجيل الدخول" description="أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>تعذّر تسجيل الدخول</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {needsVerification && (
          <Alert variant="warning" role="alert">
            <MailCheck className="h-4 w-4" />
            <AlertTitle>الحساب في انتظار التفعيل</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>افتح بريدك الإلكتروني واضغط على رابط التفعيل، ثم سجّل الدخول من جديد.</p>
              {resendState === 'sent' ? (
                <p className="font-medium text-success">أُرسل رابط تفعيل جديد.</p>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={resendVerification} disabled={resendState === 'sending'}>
                  {resendState === 'sending' && <Loader2 className="animate-spin" />}
                  إعادة إرسال رابط التفعيل
                </Button>
              )}
              {resendState === 'failed' && <p className="text-destructive">تعذّر الإرسال الآن. حاول بعد قليل.</p>}
            </AlertDescription>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="h-11"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading || !email || !password}>
          {isLoading && <Loader2 className="animate-spin" />}
          {isLoading ? "جارٍ الدخول…" : "دخول"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          أنشئ حساباً مجاناً
        </Link>
      </p>
    </AuthLayout>
  );
}
