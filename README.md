# أستاذي

منصة لأستاذ التربية البدنية والرياضية في الابتدائي: التلاميذ، الأقسام، المناداة، التقييم (تشخيصي / مستمر / بالحصة)، ووثائق الأستاذ.

Next.js 15 (App Router) · React 19 · Firebase Auth + Firestore · Tailwind CSS.

## التشغيل

```bash
npm install
cp .env.example .env.local   # ثم املأ القيم
npm run dev                  # http://localhost:4000
```

`npm run build` للبناء، `npm run typecheck` لفحص الأنواع.

## الحماية

- **عزل البيانات** تفرضه `firestore.rules` في الخادم: كل مستند مملوك لصاحبه (`userId`)، والحساب يجب أن يكون بريده مفعَّلاً. بوابة الواجهة (`src/firebase/client-provider.tsx`) لتجربة الاستخدام فقط.
- بعد أي تعديل على القواعد: `firebase deploy --only firestore:rules`.
- **المساعد الذكي** موقوف حالياً (قيد التطوير؛ يُفعَّل بـ `AI_ASSISTANT_ENABLED=true`). عند تفعيله يمرّ عبر `/api/ai-assistant`: يتحقق من رمز هوية Firebase، يحدّ المعدّل لكل مستخدم، ويحتفظ بمفتاح Anthropic في الخادم.
- **ترويسات الأمان** (CSP، HSTS، منع التأطير…) في `next.config.mjs`.

## إعدادات مطلوبة في لوحة Firebase / Google Cloud

1. تقييد مفتاح الويب (API key) على نطاقات الموقع فقط (HTTP referrers) وعلى واجهتي Identity Toolkit و Firestore.
2. **الكابتشا (App Check + reCAPTCHA v3):**
   - أنشئ مفتاح reCAPTCHA v3 لنطاق موقعك من <https://www.google.com/recaptcha/admin/create>.
   - Firebase Console ← App Check ← Apps ← تطبيق الويب ← reCAPTCHA ← الصق **المفتاح السري**.
   - ضع **مفتاح الموقع** في `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` في إعدادات الاستضافة ثم أعد النشر.
   - بعد التأكد من أن الموقع يعمل: App Check ← APIs ← اضغط **Enforce** على Cloud Firestore و Authentication.
3. Authentication ← Settings: تفعيل *Email enumeration protection* وسياسة كلمات المرور (8 أحرف على الأقل).
4. حصر النطاقات المصرَّح بها (Authorized domains) في نطاقات الموقع.

## التصميم

رموز الألوان والخط في `src/app/globals.css` و`tailwind.config.ts`. المكوّنات تستهلك الرموز (`bg-card`, `text-muted-foreground`, `text-success`…) ولا تكتب ألواناً مباشرة، والوضع الداكن يعمل تلقائياً عبر الصنف `.dark`. صفحات الطباعة تبقى أبيض/أسود دائماً.
