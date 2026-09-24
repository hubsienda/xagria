import Link from 'next/link';
import TradeFlowsClient from './TradeFlowsClient';
import {TRADE_PRODUCTS} from '@/lib/trade/products';
import {REPORTER_MARKETS} from '@/lib/trade/reporters';
import {requireDeskSession} from '@/lib/desk/auth';

export const metadata = {title: 'Trade Flows · XAGRIA'};

export default async function TradeFlowsPage() {
  await requireDeskSession();
  return <>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Sienda Ltd · Private workspace</p>
        <h1 className="mt-3 text-4xl font-bold">Trade Flows</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">Explore how agricultural products move between markets and detect changes worth investigating.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/desk" className="rounded-lg border border-white/20 px-4 py-2.5 text-sm hover:border-brand">Agricultural Intelligence Desk</Link>
        <form action="/desk/logout" method="post"><button className="rounded-lg border border-white/20 px-4 py-2.5 text-sm hover:border-brand">Log out</button></form>
      </div>
    </div>
    <TradeFlowsClient products={TRADE_PRODUCTS} reporters={REPORTER_MARKETS} />
  </>;
}
