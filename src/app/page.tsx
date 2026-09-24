import Link from 'next/link';
import {cookies, headers} from 'next/headers';
import DeskShell from '@/components/DeskShell';
import {routing} from '@/i18n/routing';

export default async function RootPage() {
  const saved = (await cookies()).get('NEXT_LOCALE')?.value;
  const languages = ((await headers()).get('accept-language') || '').split(',')
    .map((item) => { const [tag, quality] = item.trim().split(';q='); return {locale: tag.toLowerCase().split('-')[0], q: quality === undefined ? 1 : Number(quality)}; })
    .filter(({q}) => q > 0).sort((a, b) => b.q - a.q);
  const supported = (value?: string) => routing.locales.find((locale) => locale === value);
  const locale = supported(saved) || languages.map(({locale}) => supported(locale)).find(Boolean) || routing.defaultLocale;
  return <DeskShell>
    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand">Precision without friction</p>
    <h1 className="text-4xl font-bold sm:text-5xl">Your agricultural workspace.</h1>
    <p className="mt-5 max-w-2xl text-lg text-muted">Practical field calculators and a private desk for agricultural intelligence and commercial work.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2">
      <Link href="/desk" className="rounded-2xl border border-white/15 bg-surface p-8 transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
        <h2 className="text-2xl font-bold">Private Desk <span aria-hidden="true">→</span></h2>
        <p className="mt-3 text-muted">Sienda Ltd’s owner-only agricultural intelligence workspace. Passphrase required.</p>
      </Link>
      <Link href={`/${locale}`} className="rounded-2xl border border-white/15 bg-surface p-8 transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
        <h2 className="text-2xl font-bold">Public Agricultural Tools <span aria-hidden="true">→</span></h2>
        <p className="mt-3 text-muted">Six practical calculators, freely available in English, Spanish and Italian.</p>
      </Link>
    </div>
  </DeskShell>;
}
