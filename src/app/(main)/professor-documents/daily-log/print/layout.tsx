
import "@/app/globals.css";

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
        <head>
            <title>طباعة الكراس اليومي</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
        </head>
        <div className="font-body antialiased bg-white text-black">
            {children}
        </div>
    </>
  );
}
