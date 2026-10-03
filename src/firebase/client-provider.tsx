'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { FirebaseProvider, useFirebase } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { BrandMark } from '@/components/brand';
import { startAppCheck } from '@/firebase/app-check';

/** المسارات المتاحة دون تسجيل دخول. المطابقة على مقطع كامل، لا على بادئة نصية. */
const PUBLIC_ROOTS = ['/login', '/register', '/forgot-password', '/evaluations-demo'];
/** صفحات الدخول التي يُعاد توجيه المستخدم المسجَّل منها إلى لوحة التحكم. */
const AUTH_ROOTS = ['/login', '/register', '/forgot-password'];

const under = (pathname: string, roots: string[]) =>
  roots.some((root) => pathname === root || pathname.startsWith(root + '/'));

/**
 * بوابة الواجهة: تمنع عرض الصفحات الخاصة قبل التحقق من الجلسة.
 * ملاحظة أمنية: هذه البوابة لتجربة الاستخدام فقط؛ الحماية الفعلية للبيانات
 * تفرضها قواعد Firestore (firestore.rules) على الخادم.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = under(pathname, PUBLIC_ROOTS);
  const isAuthPage = under(pathname, AUTH_ROOTS);
  const isVerified = !!user && user.emailVerified;

  useEffect(() => {
    if (isUserLoading) return;
    if (isVerified && isAuthPage) {
      router.replace('/');
    } else if (!isVerified && !isPublic) {
      // غير مسجَّل، أو حساب لم يُفعَّل بريده: صفحة الدخول تتكفل بالشرح وإعادة إرسال رابط التفعيل.
      router.replace('/login');
    }
  }, [isUserLoading, isVerified, isAuthPage, isPublic, router]);

  if (!isPublic && (isUserLoading || !isVerified)) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background">
        <BrandMark className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground [&_svg]:h-7 [&_svg]:w-7" />
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ التحقق من الجلسة…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo(() => {
    const initialized = initializeFirebase();
    // الكابتشا (App Check) تُفعَّل قبل أي طلب إلى المصادقة أو قاعدة البيانات.
    startAppCheck(initialized.firebaseApp);
    return initialized;
  }, []);

  return (
    <FirebaseProvider firebaseApp={services.firebaseApp} auth={services.auth} firestore={services.firestore}>
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}
