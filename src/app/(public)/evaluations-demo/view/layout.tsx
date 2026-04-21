
import "@/app/globals.css";

// This layout is intentionally minimal.
// It will inherit from the parent (public) layout but is here for structure.
export default function DemoViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
