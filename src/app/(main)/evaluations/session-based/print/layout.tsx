
import "@/app/globals.css";

// This layout is intentionally minimal to override the main layout for printing.
export default function SessionPrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
