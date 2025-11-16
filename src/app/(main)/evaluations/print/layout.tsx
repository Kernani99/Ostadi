
import "@/app/globals.css";

// This layout is intentionally minimal to override the main layout for printing.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
        <head>
            <title>طباعة التقييم</title>
        </head>
        <body>
            <div className="bg-white text-black">
                {children}
            </div>
        </body>
    </html>
  );
}
