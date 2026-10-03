'use client';

import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

/** مفتاح الموقع (site key) علني بطبيعته؛ المفتاح السري يبقى في لوحة Firebase فقط. */
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export const isCaptchaEnabled = !!SITE_KEY;

let started = false;

/**
 * يفعّل Firebase App Check بـ reCAPTCHA v3 (كابتشا غير مرئية).
 * بعد تفعيل «Enforce» في لوحة Firebase، ترفض خوادم Google كل طلب إلى المصادقة
 * (دخول، تسجيل، استعادة كلمة المرور) أو إلى Firestore لا يحمل شهادة reCAPTCHA صالحة —
 * فالحماية مفروضة في الخادم، وتشمل كل الأقسام لا نموذجاً واحداً.
 */
export function startAppCheck(app: FirebaseApp): void {
  if (started || !SITE_KEY || typeof window === 'undefined') return;
  started = true;
  try {
    if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG === 'true') {
      // للتطوير المحلي فقط: يطبع رمز تصحيح في الكونسول يُسجَّل في لوحة App Check.
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // مُهيَّأ مسبقاً (إعادة تحميل سريعة أثناء التطوير)
  }
}
