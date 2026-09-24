import Link from 'next/link';
import {requireDeskSession} from '@/lib/desk/auth';
const planned = [
  ['Market Check', 'Assess a product, market and commercial question.'],
  ['Market Radar', 'Watch selected markets for changes worth investigating.'],
  ['Trade Flows', 'Explore where agricultural products move and how trade changes.'],
  ['Price Signals', 'Review price movements with their source and market context.'],
  ['Weather and Supply Risk', 'Consider weather conditions that may affect production and supply.'],
  ['Find Suppliers', 'Research potential suppliers for a defined sourcing need.'],
  ['Find Buyers', 'Research prospective buyers and routes to market.'],
  ['Deal Check', 'Examine a proposed deal’s assumptions, costs and commercial risks.']
];
export default async function DeskPage() {
  await requireDeskSession();
  return <>
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div><p className="text-sm font-bold uppercase tracking-widest text-brand">Sienda Ltd · Private workspace</p>
        <h1 className="mt-3 text-4xl font-bold">Agricultural Intelligence Desk</h1></div>
      <form action="/desk/logout" method="post"><button className="rounded-lg border border-white/25 px-5 py-3 hover:border-brand">Log out</button></form>
    </div>
    <p className="mt-5 max-w-3xl text-lg text-muted">A workbench for agricultural market research, sourcing and commercial decisions. Your private access is ready; the intelligence tools below are planned for later stages.</p>
    <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{planned.map(([name, description]) =>
      <article key={name} className="rounded-xl border border-white/10 bg-surface p-6">
        <span className="text-xs font-bold uppercase tracking-wider text-brand">Planned</span>
        <h2 className="mt-3 text-xl font-bold">{name}</h2><p className="mt-3 text-muted">{description}</p>
      </article>)}</div>
    <Link href="/" className="underline underline-offset-4">Back to XAGRIA gateway</Link>
  </>;
}
