import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {AgriProvider} from '@/context/AgriContext';
import UnitToggle from '@/components/UnitToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          <AgriProvider>
            <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-28">
              <nav className="flex items-center justify-between gap-4 py-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/xagria-white-logo.png"
                    alt="XAGRIA"
                    className="h-6 w-auto object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <LocaleSwitcher />
                  <UnitToggle />
                </div>
              </nav>

              <main className="flex-1">{children}</main>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-surface/80 p-4 backdrop-blur-md print:hidden">
              <div className="mx-auto flex max-w-4xl items-center justify-center">
                <div className="flex h-12 w-full max-w-sm items-center justify-center rounded-xl border border-white/5 bg-background text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  XAGRIA · Precision without Friction
                </div>
              </div>
            </footer>
          </AgriProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
