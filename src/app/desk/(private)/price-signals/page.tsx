import Link from 'next/link';
import {requireDeskSession} from '@/lib/desk/auth';
import {PRICE_MARKETS} from '@/lib/prices/markets';
import PriceSignalsClient from './PriceSignalsClient';

export const metadata = {title: 'Price Signals · XAGRIA'};

export default async function PriceSignalsPage() {
  await requireDeskSession();
  return <>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Sienda Ltd · Private workspace</p>
        <h1 className="mt-3 text-4xl font-bold">Price Signals</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">Track official fresh-produce price movements and identify changes worth investigating.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/desk" className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold hover:border-brand">← BACK TO DESK</Link>
        <form action="/desk/logout" method="post"><button className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold hover:border-brand">LOG OUT</button></form>
      </div>
    </div>
    <PriceSignalsClient markets={PRICE_MARKETS} />
  </>;
}
