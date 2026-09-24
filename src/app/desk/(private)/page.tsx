import Link from 'next/link';
import {requireDeskSession} from '@/lib/desk/auth';

const tools = [
  {name: 'Market Check', description: 'Assess a product, market and commercial question.'},
  {name: 'Market Radar', description: 'Watch selected markets for changes worth investigating.'},
  {name: 'Trade Flows', description: 'Explore where agricultural products move, compare supplying origins and detect changes worth investigating.', href: '/desk/trade-flows', status: 'LIVE'},
  {name: 'Price Signals', description: 'Review price movements with their source and market context.'},
  {name: 'Weather and Supply Risk', description: 'Consider weather conditions that may affect production and supply.'},
  {name: 'Find Suppliers', description: 'Research potential suppliers for a defined sourcing need.'},
  {name: 'Find Buyers', description: 'Research prospective buyers and routes to market.'},
  {name: 'Deal Check', description: 'Examine a proposed deal’s assumptions, costs and commercial risks.'}
];

export default async function DeskPage() {
  await requireDeskSession();
  return <>
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div><p className="text-sm font-bold uppercase tracking-widest text-brand">Sienda Ltd · Private workspace</p><h1 className="mt-3 text-4xl font-bold">Agricultural Intelligence Desk</h1></div>
      <form action="/desk/logout" method="post"><button className="rounded-lg border border-white/25 px-5 py-3 hover:border-brand">Log out</button></form>
    </div>
    <p className="mt-5 max-w-3xl text-lg text-muted">A workbench for agricultural market research, sourcing and commercial decisions. Use live intelligence tools to investigate markets and identify changes worth examining.</p>
    <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map(tool => {
      const content = <><span className="text-xs font-bold uppercase tracking-wider text-brand">{tool.status ?? 'Planned'}</span><h2 className="mt-3 text-xl font-bold">{tool.name}</h2><p className="mt-3 text-muted">{tool.description}</p></>;
      return tool.href ? <Link key={tool.name} href={tool.href} className="rounded-xl border border-white/10 bg-surface p-6 transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">{content}</Link> : <article key={tool.name} className="rounded-xl border border-white/10 bg-surface p-6">{content}</article>;
    })}</div>
    <Link href="/" className="underline underline-offset-4">Back to XAGRIA gateway</Link>
  </>;
}
