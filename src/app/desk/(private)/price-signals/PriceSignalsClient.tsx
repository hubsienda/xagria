'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {priceAnalysisFilename, priceAnalysisToCsv} from '@/lib/prices/csv';
import type {PriceAnalysis, PriceComparison, PriceMarket, PriceOptions, PricePeriod, PriceProductOption, PriceStage} from '@/lib/prices/types';

type Props = {markets: PriceMarket[]};
const decimal = new Intl.NumberFormat('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const pct = new Intl.NumberFormat('en-GB', {minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero'});
const dateFmt = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));
const formatPct = (value: number | null) => value == null || !Number.isFinite(value) ? 'Insufficient comparable data' : `${pct.format(value)}%`;
const formatValue = (value: number, unit: string) => `${decimal.format(value)} ${unit}`;

function ComparisonCard({title, data, unit, referenceLabel}: {title: string; data: PriceComparison | null; unit: string; referenceLabel: string}) {
  return <section className="rounded-xl border border-white/10 bg-surface p-5">
    <h3 className="font-bold">{title}</h3>
    {!data ? <p className="mt-3 text-sm text-muted">Insufficient comparable data</p> : <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      <div><dt className="text-xs uppercase tracking-wide text-muted">Current</dt><dd className="mt-1 font-semibold">{formatValue(data.current, unit)}</dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-muted">{referenceLabel}</dt><dd className="mt-1 font-semibold">{formatValue(data.reference, unit)}{data.referenceDate ? <span className="block text-xs font-normal text-muted">{formatDate(data.referenceDate)}</span> : null}</dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-muted">Change</dt><dd className="mt-1 font-semibold">{formatPct(data.changePct)}</dd></div>
    </dl>}
  </section>;
}

function firstSelection(product?: PriceProductOption) {
  const variety = product?.varieties[0];
  return {sourceProduct: product?.sourceProduct ?? '', variety: variety?.value ?? '', stage: variety?.stages[0] ?? ''};
}

export default function PriceSignalsClient({markets}: Props) {
  const [marketCode, setMarketCode] = useState('ES');
  const [options, setOptions] = useState<PriceOptions | null>(null);
  const [sourceProduct, setSourceProduct] = useState('');
  const [variety, setVariety] = useState('');
  const [stage, setStage] = useState<PriceStage | ''>('');
  const [periodMonths, setPeriodMonths] = useState<PricePeriod>(24);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const analysisRequestId = useRef(0);

  function invalidateAnalysis() {
    analysisRequestId.current += 1;
    setAnalysis(null);
    setAnalysisLoading(false);
    setAnalysisError('');
  }

  useEffect(() => {
    let cancelled = false;
    analysisRequestId.current += 1;
    setAnalysis(null); setAnalysisLoading(false); setAnalysisError('');
    async function load() {
      setOptionsLoading(true); setOptionsError(''); setOptions(null);
      try {
        const response = await fetch('/desk/api/price-signals', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({mode: 'options', marketCode})});
        const payload = await response.json() as {options?: PriceOptions; error?: string};
        if (!response.ok || !payload.options) throw new Error(payload.error || 'Price options could not be loaded.');
        if (cancelled) return;
        setOptions(payload.options);
        const selection = firstSelection(payload.options.products[0]);
        setSourceProduct(selection.sourceProduct); setVariety(selection.variety); setStage(selection.stage as PriceStage | '');
      } catch (error) {
        if (!cancelled) setOptionsError(error instanceof Error ? error.message : 'Price options could not be loaded.');
      } finally { if (!cancelled) setOptionsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [marketCode]);

  const selectedProduct = options?.products.find(product => product.sourceProduct === sourceProduct);
  const selectedVariety = selectedProduct?.varieties.find(item => item.value === variety);

  function changeProduct(value: string) {
    invalidateAnalysis();
    setSourceProduct(value);
    const selection = firstSelection(options?.products.find(product => product.sourceProduct === value));
    setVariety(selection.variety); setStage(selection.stage as PriceStage | '');
  }

  function changeVariety(value: string) {
    invalidateAnalysis();
    setVariety(value);
    const selected = selectedProduct?.varieties.find(item => item.value === value);
    setStage(selected?.stages[0] ?? '');
  }

  async function runAnalysis(event: FormEvent) {
    event.preventDefault();
    if (!sourceProduct || !variety || !stage) return;
    const requestId = ++analysisRequestId.current;
    setAnalysisLoading(true); setAnalysisError('');
    try {
      const response = await fetch('/desk/api/price-signals', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({mode: 'analyse', marketCode, sourceProduct, variety, stage, periodMonths})});
      const payload = await response.json() as {analysis?: PriceAnalysis; error?: string};
      if (!response.ok || !payload.analysis) throw new Error(payload.error || 'Price analysis could not be loaded.');
      if (requestId !== analysisRequestId.current) return;
      setAnalysis(payload.analysis);
    } catch (error) {
      if (requestId !== analysisRequestId.current) return;
      setAnalysis(null); setAnalysisError(error instanceof Error ? error.message : 'Price analysis could not be loaded.');
    } finally {
      if (requestId === analysisRequestId.current) setAnalysisLoading(false);
    }
  }

  function downloadCsv() {
    if (!analysis) return;
    const blob = new Blob([priceAnalysisToCsv(analysis)], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = priceAnalysisFilename(analysis); document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const basisUnit = analysis?.latest.normalisedUnit ?? analysis?.latest.rawUnit ?? '';
  const latestBasisPrice = analysis ? (analysis.latest.normalisedPrice ?? analysis.latest.rawPrice) : null;

  return <div className="mt-10 space-y-8">
    <form onSubmit={runAnalysis} className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm font-semibold">Market
          <select value={marketCode} onChange={event => setMarketCode(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-white outline-none focus:border-brand">
            {markets.map(market => <option key={market.code} value={market.code}>{market.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Product
          <select disabled={optionsLoading || !options?.products.length} value={sourceProduct} onChange={event => changeProduct(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-white outline-none focus:border-brand disabled:opacity-50">
            {options?.products.map(product => <option key={product.sourceProduct} value={product.sourceProduct}>{product.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Variety
          <select disabled={!selectedProduct} value={variety} onChange={event => changeVariety(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-white outline-none focus:border-brand disabled:opacity-50">
            {selectedProduct?.varieties.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Price stage
          <select disabled={!selectedVariety} value={stage} onChange={event => {invalidateAnalysis(); setStage(event.target.value as PriceStage);}} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-white outline-none focus:border-brand disabled:opacity-50">
            {selectedVariety?.stages.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Period
          <select value={periodMonths} onChange={event => {invalidateAnalysis(); setPeriodMonths(Number(event.target.value) as PricePeriod);}} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-white outline-none focus:border-brand">
            <option value={12}>Last 12 months</option><option value={24}>Last 24 months</option><option value={36}>Last 36 months</option>
          </select>
        </label>
      </div>
      {optionsLoading && <p className="mt-4 text-sm text-muted">Loading available products, varieties and stages…</p>}
      {optionsError && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-100">{optionsError}</p>}
      {options && !options.products.length && <p className="mt-4 text-sm text-muted">No supported price series is currently available for this market.</p>}
      <button disabled={analysisLoading || optionsLoading || !sourceProduct || !variety || !stage} className="mt-6 rounded-lg bg-brand px-5 py-3 font-bold text-black disabled:cursor-wait disabled:opacity-50">{analysisLoading ? 'Analysing price data…' : 'Run analysis'}</button>
      {analysisError && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-100">{analysisError}</p>}
    </form>

    {analysis && latestBasisPrice != null && <>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-bold">{analysis.productName} · {analysis.market.name}</h2><p className="mt-2 text-sm text-muted">{analysis.variety} · {analysis.stage} · Last {analysis.periodMonths} months</p></div>
          <div className="flex flex-wrap items-center gap-4"><p className="text-sm font-semibold text-brand">Latest report: {formatDate(analysis.latest.startDate)}</p><button type="button" onClick={downloadCsv} className="rounded-lg border border-brand px-4 py-2 text-sm font-bold text-brand hover:bg-brand hover:text-black">DOWNLOAD CSV</button></div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-brand/30 bg-surface p-5"><p className="text-xs uppercase tracking-wide text-muted">Latest reported price</p><p className="mt-2 text-2xl font-bold">{decimal.format(analysis.latest.rawPrice)} {analysis.latest.rawUnit}</p>{analysis.latest.normalisedPrice != null && analysis.latest.normalisedUnit && <p className="mt-1 text-sm text-brand">{decimal.format(analysis.latest.normalisedPrice)} {analysis.latest.normalisedUnit}</p>}<p className="mt-2 text-xs text-muted">Currency: {analysis.currency}</p></div>
          <div className="rounded-xl border border-brand/30 bg-surface p-5"><p className="text-xs uppercase tracking-wide text-muted">Price stage</p><p className="mt-2 text-2xl font-bold">{analysis.stage}</p><p className="mt-2 text-xs text-muted">{analysis.stage === 'Ex-packaging' ? 'Price reported after packing/conditioning rather than at farmgate.' : 'Keep this stage distinct from prices measured elsewhere in the supply chain.'}</p></div>
          <div className="rounded-xl border border-white/10 bg-surface p-5"><p className="text-xs uppercase tracking-wide text-muted">Variety / unit</p><p className="mt-2 text-lg font-bold">{analysis.variety}</p><p className="mt-2 text-sm text-muted">Original unit: {analysis.rawUnit}{analysis.normalisedUnit ? ` · Normalised: ${analysis.normalisedUnit}` : ''}</p></div>
        </div>
        <p className="mt-4 text-sm text-muted"><span className="font-semibold text-white">Source:</span> {analysis.sourceName}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ComparisonCard title="Latest vs previous observation" data={analysis.previousComparison} unit={basisUnit} referenceLabel="Previous" />
        <ComparisonCard title="Latest vs comparable period last year" data={analysis.yearOnYearComparison} unit={basisUnit} referenceLabel="Previous year" />
        <ComparisonCard title="vs previous 4-observation average" data={analysis.recentAverageComparison} unit={basisUnit} referenceLabel="Previous 4 avg" />
      </div>

      <section className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">12-month context</h2>{analysis.range12Month ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs uppercase text-muted">Average</p><p className="mt-1 font-semibold">{formatValue(analysis.range12Month.average, basisUnit)}</p></div><div><p className="text-xs uppercase text-muted">High</p><p className="mt-1 font-semibold">{formatValue(analysis.range12Month.high, basisUnit)}</p></div><div><p className="text-xs uppercase text-muted">Low</p><p className="mt-1 font-semibold">{formatValue(analysis.range12Month.low, basisUnit)}</p></div><div><p className="text-xs uppercase text-muted">Position</p><p className="mt-1 font-semibold">{analysis.range12Month.positionPct == null ? 'Insufficient comparable data' : `${analysis.range12Month.positionPct.toFixed(1)}% of observed range`}</p></div></div> : <p className="mt-3 text-sm text-muted">Insufficient comparable data</p>}</section>

      <section className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">Seasonal comparison</h2>{analysis.seasonalComparison ? <p className="mt-3 text-sm text-muted">Latest price: <span className="font-semibold text-white">{formatValue(analysis.seasonalComparison.current, basisUnit)}</span> · seasonal reference: <span className="font-semibold text-white">{formatValue(analysis.seasonalComparison.reference, basisUnit)}</span> · difference: <span className="font-semibold text-white">{formatPct(analysis.seasonalComparison.changePct)}</span> · reference years: {analysis.seasonalComparison.referenceYears.join(', ')}</p> : <p className="mt-3 text-sm text-muted">Insufficient comparable data</p>}</section>

      <section className="rounded-xl border border-white/10 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">Price trend</h2><p className="mt-2 text-sm text-muted">The selected historical series. Different varieties and supply-chain stages are never combined.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted"><tr><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Reported price</th><th className="py-3 pr-4">Normalised price</th><th className="py-3 pr-4">Stage</th><th className="py-3 pr-4">Variety</th><th className="py-3">Unit</th></tr></thead><tbody>{analysis.trend.slice().reverse().map((row, index) => <tr key={`${row.startDate}-${index}`} className="border-b border-white/5"><td className="py-3 pr-4">{formatDate(row.startDate)}</td><td className="py-3 pr-4">{decimal.format(row.rawPrice)} {row.rawUnit}</td><td className="py-3 pr-4">{row.normalisedPrice != null && row.normalisedUnit ? `${decimal.format(row.normalisedPrice)} ${row.normalisedUnit}` : '—'}</td><td className="py-3 pr-4">{row.stage}</td><td className="py-3 pr-4">{row.variety}</td><td className="py-3">{row.rawUnit}</td></tr>)}</tbody></table></div></section>

      <section className="rounded-xl border border-brand/30 bg-surface p-5 sm:p-6"><h2 className="text-xl font-bold">Price Signals</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{analysis.signals.map((signal, index) => <article key={`${signal.title}-${index}`} className="rounded-lg border border-white/10 bg-black/30 p-4"><h3 className="font-bold text-brand">{signal.title}</h3><p className="mt-2 text-sm text-muted">{signal.evidence}</p></article>)}</div><div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-bold">Worth investigating</h3><p className="mt-2 text-sm text-muted">{analysis.worthInvestigating}</p></div></section>

      <section className="rounded-xl border border-white/10 p-5 text-sm text-muted sm:p-6"><h2 className="font-bold text-white">Source and methodology</h2><dl className="mt-4 grid gap-2 sm:grid-cols-2"><div><dt className="font-semibold text-white">Source</dt><dd>{analysis.sourceName}</dd></div><div><dt className="font-semibold text-white">Market</dt><dd>{analysis.market.name}</dd></div><div><dt className="font-semibold text-white">Product / variety</dt><dd>{analysis.productName} · {analysis.variety}</dd></div><div><dt className="font-semibold text-white">Stage</dt><dd>{analysis.stage}</dd></div><div><dt className="font-semibold text-white">Latest reporting date</dt><dd>{formatDate(analysis.latest.startDate)}</dd></div><div><dt className="font-semibold text-white">Currency / unit</dt><dd>{analysis.currency} · {analysis.rawUnit}</dd></div></dl>{analysis.scopeNote && <p className="mt-4 rounded-lg border border-brand/20 p-3"><span className="font-semibold text-white">Scope:</span> {analysis.scopeNote}</p>}<p className="mt-4"><a href={analysis.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">Official source</a></p><details className="mt-5 border-t border-white/10 pt-4"><summary className="cursor-pointer font-semibold text-white">Methodology note</summary><div className="mt-3 space-y-2">{analysis.methodology.map((note, index) => <p key={index}>{note}</p>)}</div></details></section>
    </>}
  </div>;
}
