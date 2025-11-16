
import "@/app/globals.css";

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The <head> tag was removed to prevent hydration errors.
  // Next.js automatically handles the document head.
  // Fonts and other head elements are managed in the root layout.
  return (
    <div className="font-body antialiased bg-white text-black">
        {children}
    </div>
  );
}
