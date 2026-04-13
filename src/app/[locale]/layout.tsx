import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AgriProvider } from "@/context/AgriContext";
import UnitToggle from "@/components/UnitToggle";
import "@/app/globals.css";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased bg-background text-white min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <AgriProvider>
            <nav className="flex items-center justify-between p-6 max-w-4xl mx-auto">
              <img 
                src="/xagria 1000x300 #ADFF2F wP.png" 
                alt="XAGRIA" 
                className="h-6 w-auto object-contain"
              />
              <UnitToggle />
            </nav>
            
            <main className="max-w-4xl mx-auto pb-32">
              {children}
            </main>

            <footer className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-md border-t border-white/5 p-4 print:hidden">
              <div className="max-w-4xl mx-auto flex items-center justify-center">
                <div className="bg-background w-full max-w-sm h-12 rounded-xl flex items-center justify-center text-[10px] text-gray-600 font-bold tracking-widest border border-white/5 uppercase">
                  Ad Slot • XAGRIA Pro
                </div>
              </div>
            </footer>
          </AgriProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
