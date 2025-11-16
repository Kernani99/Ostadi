
import "@/app/globals.css";

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is used for the evaluation view page opened in a new tab.
  // It should not render a full HTML document, as it's still part of the Next.js app.
  // The main layout provides the html/body structure. We just wrap the content.
  return (
    <div className="font-body antialiased bg-white text-black min-h-screen">
      {children}
    </div>
  );
}
