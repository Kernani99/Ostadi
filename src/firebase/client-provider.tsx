'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { signOut } from 'firebase/auth';
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

/** مفاتيح sessionStorage التي تحمل بيانات خاصة بحساب. */
export const PRIVATE_SESSION_KEYS = ['attendanceReportPrintData', 'evaluationDemoData'];

const under = (pathname: string, roots: string[]) =>
  roots.some((root) => pathname === root || pathname.startsWith(root + '/'));

/**
 * بوابة الواجهة: تمنع عرض الصفحات الخاصة قبل التحقق من الجلسة.
 * ملاحظة أمنية: هذه البوابة لتجربة الاستخدام فقط؛ الحماية الفعلية للبيانات
 * تفرضها قواعد Firestore (firestore.rules) على الخادم.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, auth } = useFirebase();
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
      // حساب لم يُفعَّل بريده لا يحتفظ بجلسة: يُخرَج فوراً، وصفحة الدخول تتكفل بإعادة إرسال رابط التفعيل.
      if (user) void signOut(auth).catch(() => {});
      router.replace('/login');
    }
  }, [isUserLoading, isVerified, isAuthPage, isPublic, router, user, auth]);

  // عزل الحسابات على الجهاز المشترك: أي بيانات مؤقتة خزّنها حساب في هذا التبويب
  // (تقرير الغياب المعدّ للطباعة…) تُمحى عند الخروج أو عند دخول حساب آخر.
  const lastUid = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (isUserLoading) return;
    const uid = user?.uid ?? null;
    if (lastUid.current !== undefined && lastUid.current !== uid) {
      try {
        for (const key of PRIVATE_SESSION_KEYS) sessionStorage.removeItem(key);
      } catch {
        // التخزين غير متاح
      }
    }
    lastUid.current = uid;
  }, [isUserLoading, user]);

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
  const services = useMemo(() => initializeFirebase(), []);

  // الكابتشا (App Check) تُفعَّل بعد اكتمال الـ hydration مباشرةً وقبل أي طلب إلى قاعدة البيانات.
  // reCAPTCHA تضيف عنصراً إلى <body>؛ لو أُضيف أثناء الرسم الأول لاختلف الـ HTML عمّا أرسله الخادم،
  // فيعيد React بناء الصفحة ويحذف ذلك العنصر (خطأ React #418 ثم «reCAPTCHA placeholder element»).
  useLayoutEffect(() => {
    startAppCheck(services.firebaseApp);
  }, [services]);

  return (
    <FirebaseProvider firebaseApp={services.firebaseApp} auth={services.auth} firestore={services.firestore}>
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}
