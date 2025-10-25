
import "@/app/globals.css";

export default function PrintAnnualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <title>طباعة سجل الحضور السنوي</title>
      </head>
      <div>
        {children}
      </div>
    </>
  );
}
