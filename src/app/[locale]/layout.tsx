import { AgriProvider } from "@/context/AgriContext";
import "./globals.css";

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>
        <AgriProvider>
          <header className="p-6 flex justify-between items-center max-w-4xl mx-auto">
            <img src="/xagria-logo.png" alt="XAGRIA" className="h-8" />
            {/* Unit Toggle Button */}
            <UnitToggle />
          </header>
          
          <main className="max-w-4xl mx-auto pb-24">
            {children}
          </main>

          {/* Simple Shared Ad Slot at the bottom */}
          <footer className="fixed bottom-0 w-full bg-surface border-t border-white/10 p-2 print:hidden">
            <div className="max-w-4xl mx-auto h-12 flex items-center justify-center text-[10px] text-gray-500">
              ADVERTISEMENT
            </div>
          </footer>
        </AgriProvider>
      </body>
    </html>
  );
}
