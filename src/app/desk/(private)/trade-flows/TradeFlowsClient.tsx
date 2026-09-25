'use client';

import {useRef, useState, type FormEvent} from 'react';
import DeskSelect from '@/components/desk/DeskSelect';
import {tradeFlowResetSelection} from '@/lib/desk/tool-defaults';
import {tradeAnalysisFilename, tradeAnalysisToCsv} from '@/lib/trade/csv';
import type {ComparisonBlock, ReporterMarket, TradeAnalysis, TradeProduct} from '@/lib/trade/types';

type Props = {products: TradeProduct[]; reporters: ReporterMarket[]};
const defaults = tradeFlowResetSelection();

const number = new Intl.NumberFormat('en-GB', {maximumFractionDigits: 0});
const decimal = new Intl.NumberFormat('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const pct = new Intl.NumberFormat('en-GB', {minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero'});

const formatTonnes = (kg: number) => `${number.format(kg / 1000)} t`;
const formatMoney = (value: number, currency: 'EUR' | 'GBP') => new Intl.NumberFormat('en-GB', {style: 'currency', currency, maximumFractionDigits: 0}).format(value);
const formatUnit = (value: number | null, symbol: '€' | '£') => value == null || !Number.isFinite(value) ? '—' : `${symbol}${decimal.format(value)}/kg`;
const formatPct = (value: number | null) => value == null || !Number.isFinite(value) ? 'Insufficient comparable data' : `${pct.format(value)}%`;
const formatMonth = (month: string) => {
  const [year, rawMonth] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {month: 'long', year: 'numeric'}).format(new Date(Date.UTC(year, rawMonth - 1, 1)));
};

function ComparisonPanel({title, data}: {title: string; data: ComparisonBlock | null}) {
  if (!data) return <section className="rounded-xl border border-white/10 bg-surface p-5"><h3 className="font-bold">{title}</h3><p className="mt-3 text-sm text-muted">Insufficient comparable data</p></section>;
  return <section className="rounded-xl border border-white/10 bg-surface p-5">
    <h3 className="font-bold">{title}</h3>
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      <div><dt className="text-xs uppercase tracking-wide text-muted">Quantity</dt><dd className="mt-1 font-semibold">{formatPct(data.quantity.changePct)}</dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-muted">Trade value</dt><dd className="mt-1 font-semibold">{formatPct(data.tradeValue.changePct)}</dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-muted">Trade unit value</dt><dd className="mt-1 font-semibold">{formatPct(data.unitValue.changePct)}</dd></div>
    </dl>
  </section>;
}

export default function TradeFlowsClient({products, reporters}: Props) {
  const [productId, setProductId] = useState(defaults.productId);
  const [reporterCode, setReporterCode] = useState(defaults.reporterCode);
  const [direction, setDirection] = useState<'imports' | 'exports' | ''>(defaults.direction);
  const [periodMonths, setPeriodMonths] = useState<12 | 24 | 36 | ''>(defaults.periodMonths);
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  function invalidateAnalysis() {
    requestId.current += 1;
    setAnalysis(null);
    setError('');
    setLoading(false);
  }

  function downloadCsv() {
    if (!analysis) return;
    const file = new Blob([tradeAnalysisToCsv(analysis)], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = tradeAnalysisFilename(analysis);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function clearAnalysis() {
    requestId.current += 1;
    setAnalysis(null);
    setError('');
    setLoading(false);
    setProductId('');
    setReporterCode('');
    setDirection('');
    setPeriodMonths('');
  }

  async function runAnalysis(event: FormEvent) {
    event.preventDefault();
    if (!productId || !reporterCode || !direction || !periodMonths) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/desk/api/trade-flows', {
        method: 'POST', headers: {'content-type': 'application/json'},
        body: JSON.stringify({productId, reporterCode, direction, periodMonths}),
      });
      const payload = await response.json() as {analysis?: TradeAnalysis; error?: string};
      if (!response.ok || !payload.analysis) throw new Error(payload.error || 'Trade data could not be loaded.');
      if (currentRequest !== requestId.current) return;
      setAnalysis(payload.analysis);
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      setAnalysis(null);
      setError(caught instanceof Error ? caught.message : 'Trade data could not be loaded.');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  const canRun = Boolean(productId && reporterCode && direction && periodMonths) && !loading;

  return <div className="mt-10 space-y-8">
    <form onSubmit={runAnalysis} className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <DeskSelect id="trade-product" label="Product" value={productId} placeholder="Select product…" searchable options={products.map(product => ({value: product.id, label: `${product.name}${product.selectorNote ? ` — ${product.selectorNote}` : ''}`}))} onChange={value => {invalidateAnalysis(); setProductId(value);}} />
        <DeskSelect id="trade-market" label="Reporting market" value={reporterCode} placeholder="Select reporting market…" searchable options={reporters.map(reporter => ({value: reporter.code, label: reporter.name}))} onChange={value => {invalidateAnalysis(); setReporterCode(value);}} />
        <DeskSelect id="trade-direction" label="Trade direction" value={direction} placeholder="Select direction…" options={[{value: 'imports', label: 'Imports'}, {value: 'exports', label: 'Exports'}]} onChange={value => {invalidateAnalysis(); setDirection(value as 'imports' | 'exports');}} />
        <DeskSelect id="trade-period" label="Period" value={periodMonths ? String(periodMonths) : ''} placeholder="Select period…" options={[{value: '12', label: 'Last 12 months'}, {value: '24', label: 'Last 24 months'}, {value: '36', label: 'Last 36 months'}]} onChange={value => {invalidateAnalysis(); setPeriodMonths(value ? Number(value) as 12 | 24 | 36 : '');}} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={!canRun} className="rounded-lg bg-brand px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'ANALYSING TRADE DATA…' : 'RUN ANALYSIS'}</button>
        <button type="button" onClick={clearAnalysis} className="rounded-lg border border-white/25 px-5 py-3 font-bold text-white hover:border-brand">CLEAR</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-100">{error}</p>}
    </form>

    {analysis && <>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-bold">{analysis.product.name} · {analysis.reporter.name}</h2><p className="mt-2 text-sm text-muted">{analysis.direction === 'imports' ? 'Imports' : 'Exports'} · Last {analysis.periodMonths} months · Commodity code group {analysis.productCodeLabel}</p>{analysis.productScopeNote && <p className="mt-2 max-w-3xl text-xs text-muted">Statistical scope: {analysis.productScopeNote}</p>}</div>
          <div className="flex flex-wrap items-center gap-4"><p className="text-sm font-semibold text-brand">Data through: {formatMonth(analysis.latestMonth)}</p><button type="button" onClick={downloadCsv} className="rounded-lg border border-brand px-4 py-2 text-sm font-bold text-brand hover:bg-brand hover:text-black">DOWNLOAD CSV</button></div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-surface p-5"><p className="text-xs uppercase tracking-wide text-muted">Total quantity</p><p className="mt-2 text-2xl font-bold">{formatTonnes(analysis.summary.quantityKg)}</p></div>
          <div className="rounded-xl border border-white/10 bg-surface p-5"><p className="text-xs uppercase tracking-wide text-muted">Total trade value</p><p className="mt-2 text-2xl font-bold">{formatMoney(analysis.summary.tradeValue, analysis.currencyCode)}</p></div>
          <div className="rounded-xl border border-white/10 bg-surface p-5"><p className="text-xs uppercase tracking-wide text-muted">Trade unit value</p><p className="mt-2 text-2xl font-bold">{formatUnit(analysis.summary.unitValuePerKg, analysis.currencySymbol)}</p></div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2"><ComparisonPanel title="Latest month vs same month previous year" data={analysis.latestMonthComparison} /><ComparisonPanel title="Latest 12 months vs previous 12 months" data={analysis.rolling12Comparison} /></div>

      <section className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-bold">{analysis.direction === 'imports' ? 'Supplier origins' : 'Destination markets'}</h2><p className="mt-2 text-sm text-muted">Ranked by quantity over the selected period. Aggregate and special partner codes are excluded.</p>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted"><tr><th className="py-3 pr-4">Rank</th><th className="py-3 pr-4">{analysis.direction === 'imports' ? 'Origin' : 'Destination'}</th><th className="py-3 pr-4">Quantity</th><th className="py-3 pr-4">Trade value</th><th className="py-3 pr-4">Trade unit value</th><th className="py-3 pr-4">Share</th><th className="py-3">Latest 12m change</th></tr></thead><tbody>{analysis.suppliers.map(row => <tr key={row.originCode} className="border-b border-white/5"><td className="py-3 pr-4">{row.rank}</td><td className="py-3 pr-4 font-semibold">{row.origin}</td><td className="py-3 pr-4">{formatTonnes(row.quantityKg)}</td><td className="py-3 pr-4">{formatMoney(row.tradeValue, analysis.currencyCode)}</td><td className="py-3 pr-4">{formatUnit(row.unitValuePerKg, analysis.currencySymbol)}</td><td className="py-3 pr-4">{row.marketSharePct == null ? '—' : `${row.marketSharePct.toFixed(1)}%`}</td><td className="py-3">{formatPct(row.changePct)}</td></tr>)}</tbody></table></div>
      </section>

      <section className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">Monthly trend</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted"><tr><th className="py-3 pr-4">Month</th><th className="py-3 pr-4">Quantity</th><th className="py-3 pr-4">Trade value</th><th className="py-3">Trade unit value</th></tr></thead><tbody>{analysis.monthlyTrend.map(row => <tr key={row.month} className="border-b border-white/5"><td className="py-3 pr-4">{formatMonth(row.month)}</td><td className="py-3 pr-4">{formatTonnes(row.quantityKg)}</td><td className="py-3 pr-4">{formatMoney(row.tradeValue, analysis.currencyCode)}</td><td className="py-3">{formatUnit(row.unitValuePerKg, analysis.currencySymbol)}</td></tr>)}</tbody></table></div></section>

      <section className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">{analysis.direction === 'imports' ? 'Origin evolution' : 'Destination evolution'}</h2><p className="mt-2 text-sm text-muted">Leading {analysis.direction === 'imports' ? 'origins' : 'destinations'}: latest rolling 12 months against the preceding 12 months.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted"><tr><th className="py-3 pr-4">{analysis.direction === 'imports' ? 'Origin' : 'Destination'}</th><th className="py-3 pr-4">Latest 12m</th><th className="py-3 pr-4">Previous 12m</th><th className="py-3 pr-4">Change</th><th className="py-3 pr-4">Current share</th><th className="py-3 pr-4">Previous share</th><th className="py-3">Share change</th></tr></thead><tbody>{analysis.originEvolution.map(row => <tr key={row.originCode} className="border-b border-white/5"><td className="py-3 pr-4 font-semibold">{row.origin}</td><td className="py-3 pr-4">{formatTonnes(row.latest12QuantityKg)}</td><td className="py-3 pr-4">{formatTonnes(row.previous12QuantityKg)}</td><td className="py-3 pr-4">{formatPct(row.changePct)}</td><td className="py-3 pr-4">{row.currentSharePct == null ? '—' : `${row.currentSharePct.toFixed(1)}%`}</td><td className="py-3 pr-4">{row.previousSharePct == null ? '—' : `${row.previousSharePct.toFixed(1)}%`}</td><td className="py-3">{row.shareChangePp == null ? '—' : `${pct.format(row.shareChangePp)} pp`}</td></tr>)}</tbody></table></div></section>

      <section className="rounded-xl border border-brand/30 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">Brokerage Signals</h2>{analysis.signals.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{analysis.signals.map((signal, index) => <article key={`${signal.title}-${index}`} className="rounded-lg border border-white/10 bg-black/30 p-4"><h3 className="font-bold text-brand">{signal.title}</h3><p className="mt-2 text-sm text-muted">{signal.evidence}</p></article>)}</div> : <p className="mt-4 text-sm text-muted">No threshold-level movement was detected in the comparable data.</p>}<div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-bold">Worth investigating</h3><p className="mt-2 text-sm text-muted">{analysis.worthInvestigating}</p></div></section>

      <section className="rounded-xl border border-white/10 p-5 text-sm text-muted sm:p-6"><h2 className="font-bold text-white">Source and methodology</h2><dl className="mt-4 grid gap-2 sm:grid-cols-2"><div><dt className="font-semibold text-white">Source</dt><dd>{analysis.sourceName}</dd></div><div><dt className="font-semibold text-white">Dataset / API</dt><dd>{analysis.dataset} · {analysis.datasetLabel}</dd></div><div><dt className="font-semibold text-white">Reporter / flow</dt><dd>{analysis.reporter.name} · {analysis.direction}</dd></div><div><dt className="font-semibold text-white">Commodity codes</dt><dd>{analysis.productCodeLabel}</dd></div><div><dt className="font-semibold text-white">Latest data</dt><dd>{formatMonth(analysis.latestMonth)}</dd></div><div><dt className="font-semibold text-white">Currency</dt><dd>{analysis.currencyCode} ({analysis.currencySymbol})</dd></div></dl>{analysis.productScopeNote && <p className="mt-4"><span className="font-semibold text-white">Product scope:</span> {analysis.productScopeNote}</p>}<p className="mt-4"><a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">Official source documentation</a></p>
        <details className="mt-5 border-t border-white/10 pt-4"><summary className="cursor-pointer font-semibold text-white">Methodology note</summary><div className="mt-3 space-y-2">{analysis.provider === 'eurostat' ? <><p>Trade value is Eurostat’s international-trade statistical value in euros. Quantity is derived from Comext net-mass quantity reported in 100 kg and converted to kilograms.</p><p>Recent months may be revised. Missing or confidential trade can affect detailed totals, and Combined Nomenclature classifications can change between years.</p></> : <><p>Trade value is the official HMRC UK Overseas Trade Statistics value in pounds sterling. Net mass comes from HMRC OTS records and is normalised to kilograms.</p><p>HMRC separates EU and non-EU flows; XAGRIA combines both official import flow types or both export flow types for the selected UK analysis. Recent statistics may be revised, and confidentiality or commodity-classification changes can affect detailed totals.</p></>}<p>Trade unit value is calculated as statistical trade value divided by net mass. It is an analytical unit value, not a wholesale, producer, retail or transaction market price.</p><p>Partner rankings and market shares use individual-country partner flows only; aggregate or special partner codes are excluded to prevent double counting.</p></div></details>
      </section>
    </>}
  </div>;
}