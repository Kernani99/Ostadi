'use client';

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { AlertCircle, Check, Loader2, MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase } from "@/firebase";
import { WILAYAS } from "@/lib/wilayas";
import { cn } from "@/lib/utils";

const RANKS = ["مرسم", "متربص", "متعاقد"] as const;

const passwordRules = [
  { label: "8 أحرف على الأقل", test: (p: string) => p.length >= 8 },
  { label: "حرف واحد على الأقل", test: (p: string) => /\p{L}/u.test(p) },
  { label: "رقم واحد على الأقل", test: (p: string) => /\d/.test(p) },
];

function messageFor(code: string | undefined): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return "هذا البريد الإلكتروني مسجَّل من قبل. سجّل الدخول أو استعمل بريداً آخر.";
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return "كلمة المرور ضعيفة. اختر كلمة أطول تجمع حروفاً وأرقاماً.";
    case 'auth/invalid-email':
      return "صيغة البريد الإلكتروني غير صحيحة.";
    case 'auth/too-many-requests':
      return "محاولات كثيرة. حاول بعد بضع دقائق.";
    case 'auth/network-request-failed':
      return "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
    default:
      return "تعذّر إنشاء الحساب. حاول مرة أخرى.";
  }
}

export default function RegisterPage() {
  const { auth, firestore } = useFirebase();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [rank, setRank] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const rules = useMemo(() => passwordRules.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const passwordOk = rules.every((r) => r.ok);
  const confirmOk = confirm.length > 0 && confirm === password;
  const canSubmit =
    lastName.trim() && firstName.trim() && rank && wilaya && email.trim() && passwordOk && confirmOk && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await setDoc(
        doc(firestore, "professor_profile", user.uid),
        {
          firstName: firstName.trim().slice(0, 80),
          lastName: lastName.trim().slice(0, 80),
          rank,
          wilaya,
          email: user.email,
        },
        { merge: true }
      );

      await sendEmailVerification(user);
      // لا جلسة قبل تفعيل البريد.
      await signOut(auth);
      setRegisteredEmail(user.email);
    } catch (err: unknown) {
      setError(messageFor((err as { code?: string })?.code));
    } finally {
      setIsLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthLayout title="بقيت خطوة واحدة" description="أُنشئ حسابك. فعّله من بريدك الإلكتروني لتتمكن من الدخول.">
        <Alert variant="success">
          <MailCheck className="h-4 w-4" />
          <AlertTitle>أُرسل رابط التفعيل</AlertTitle>
          <AlertDescription>
            أرسلنا رابط التفعيل إلى <bdi dir="ltr" className="font-semibold">{registeredEmail}</bdi>. افتح الرسالة واضغط على الرابط ثم سجّل الدخول. تفقّد مجلد الرسائل غير المرغوب فيها إن لم تجدها.
          </AlertDescription>
        </Alert>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">الانتقال إلى تسجيل الدخول</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="إنشاء حساب" description="املأ بياناتك لإنشاء حساب أستاذ. الخدمة مجانية بالكامل.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lastName">اللقب</Label>
            <Input id="lastName" name="family-name" autoComplete="family-name" required maxLength={80} value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">الاسم</Label>
            <Input id="firstName" name="given-name" autoComplete="given-name" required maxLength={80} value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rank">الصفة</Label>
            <Select onValueChange={setRank} value={rank} disabled={isLoading}>
              <SelectTrigger id="rank"><SelectValue placeholder="اختر الصفة" /></SelectTrigger>
              <SelectContent>
                {RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wilaya">الولاية</Label>
            <Select onValueChange={setWilaya} value={wilaya} disabled={isLoading}>
              <SelectTrigger id="wilaya"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
              <SelectContent>
                {WILAYAS.map((w, i) => (
                  <SelectItem key={w} value={w}>
                    <span className="tabular text-muted-foreground">{String(i + 1).padStart(2, '0')}</span> {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            className="text-left"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <PasswordInput
            id="password"
            name="new-password"
            autoComplete="new-password"
            required
            maxLength={128}
            aria-describedby="password-rules"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <ul id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
            {rules.map((r) => (
              <li key={r.label} className={cn("flex items-center gap-1 text-muted-foreground", r.ok && "text-success")}>
                <Check className={cn("h-3.5 w-3.5 opacity-30", r.ok && "opacity-100")} />
                {r.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
          <PasswordInput
            id="confirm"
            name="confirm-password"
            autoComplete="new-password"
            required
            maxLength={128}
            aria-invalid={confirm.length > 0 && !confirmOk}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={isLoading}
          />
          {confirm.length > 0 && !confirmOk && (
            <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين.</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
          {isLoading && <Loader2 className="animate-spin" />}
          {isLoading ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب؟{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
}
