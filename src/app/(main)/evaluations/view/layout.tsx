
import "@/app/globals.css";

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
        <head>
            <title>جدول التقييم</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
        </head>
        <body>
            <div className="font-body antialiased bg-white text-black">
                {children}
            </div>
        </body>
    </html>
  );
}
