
import "@/app/globals.css";

// This layout is intentionally minimal to override the main layout for printing.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="print-container bg-white text-black">
        <style>{`
            @media print {
                body {
                    background-color: #fff !important;
                }
            }
        `}</style>
        {children}
    </div>
  );
}
