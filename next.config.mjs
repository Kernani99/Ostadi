const isDev = process.env.NODE_ENV !== 'production';

/**
 * سياسة أمان المحتوى (CSP).
 * - script-src: Next.js يحقن سكربتات تهيئة مضمَّنة، لذا 'unsafe-inline' لازمة ما لم تُستعمل nonces
 *   (التي تفرض عرضاً ديناميكياً لكل الصفحات). 'unsafe-eval' في التطوير فقط (Fast Refresh).
 * - connect-src: واجهات Firebase (المصادقة و Firestore) فقط. المساعد الذكي يمرّ عبر /api على نفس الأصل.
 * - المصدر الخارجي الوحيد للسكربتات والإطارات هو reCAPTCHA (الكابتشا). الخط مستضاف ذاتياً عبر next/font.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://www.google.com/recaptcha/${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  "worker-src 'self' blob:",
  "frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // لا يُستعمل مُحسِّن الصور في الخادم: يُغلق سطح هجوم ‎/_next/image‎ بالكامل.
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // بيانات شخصية: لا تخزين مؤقت لردود الواجهة البرمجية.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
