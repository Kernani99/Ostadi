import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { themeInitScript } from '@/components/theme';
import { AppDirection } from '@/components/direction';

// الخط يُستضاف ذاتياً عبر next/font: لا طلبات لطرف ثالث، ولا إزاحة في التخطيط.
const fontSans = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'أستاذي — منصة أستاذ التربية البدنية والرياضية',
    template: '%s — أستاذي',
  },
  description: 'منصة لتسيير التلاميذ والأقسام والمناداة والتقييم ووثائق الأستاذ في مادة التربية البدنية والرياضية.',
  applicationName: 'أستاذي',
  // المنصة خاصة ببيانات تلاميذ: لا تُفهرس في محركات البحث.
  robots: { index: false, follow: false },
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f6051' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1614' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppDirection>
          <FirebaseClientProvider>{children}</FirebaseClientProvider>
          <Toaster />
        </AppDirection>
      </body>
    </html>
  );
}
