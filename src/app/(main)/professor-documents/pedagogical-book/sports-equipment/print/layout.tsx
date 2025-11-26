
import "@/app/globals.css";

// This layout is intentionally minimal to override the main layout for printing.
// It renders its children directly without adding any extra HTML structure
// that could conflict with the parent layout.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

    