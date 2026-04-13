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
    <NextIntlClientProvider messages={messages}>
      <AgriProvider>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-28 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-3 py-5 sm:py-6">
            <div className="flex items-center shrink-0">
              <img
                src="/xagria-white-logo.png"
                alt="XAGRIA"
                className="h-10 w-auto object-contain sm:h-12 md:h-14"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 overflow-x-auto whitespace-nowrap">
              <LocaleSwitcher />
              <UnitToggle />
            </div>
          </nav>

          <main className="flex-1">{children}</main>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-surface/90 p-4 backdrop-blur-md print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-4 text-center">
            <div className="text-[11px] font-bold tracking-wide text-gray-400">
              XAGRIA · Precision without Friction · brought to you with love ❤️ by{' '}
              <a
                href="https://sienda.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                Sienda Ltd
              </a>
            </div>
          </div>
        </footer>
      </AgriProvider>
    </NextIntlClientProvider>
  );
}
