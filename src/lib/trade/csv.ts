import type {ComparisonBlock, TradeAnalysis} from './types';

type Cell = string | number | null | undefined;

function cell(value: Cell) {
  if (value == null) return '';
  const text = String(value);
  // Spreadsheet applications may evaluate imported cells beginning with these characters.
  const safe = /^[\s\x00-\x1f]*[=+@\-]/.test(text) && typeof value === 'string' ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function tradeAnalysisCsv(analysis: TradeAnalysis) {
  const rows: Cell[][] = [];
  const add = (...values: Cell[]) => rows.push(values);
  const comparison = (title: string, block: ComparisonBlock | null) => {
    add('Comparison', title, 'Metric', 'Current', 'Previous', 'Change %');
    if (!block) { add('', '', 'Insufficient comparable data'); return; }
    for (const [label, metric] of [['Quantity (kg)', block.quantity], [`Trade value (${analysis.currencyCode})`, block.tradeValue], [`Unit value (${analysis.currencyCode}/kg)`, block.unitValue]] as const) {
      add('', '', label, metric.current, metric.previous, metric.changePct);
    }
  };

  add('XAGRIA Trade Flows analysis');
  add('Product', analysis.product.name);
  add('Reporting market', analysis.reporter.name);
  add('Direction', analysis.direction);
  add('Period (months)', analysis.periodMonths);
  add('Latest data month', analysis.latestMonth);
  add('Commodity codes', analysis.productCodeLabel);
  add('Product scope', analysis.productScopeNote);
  add('Source', analysis.sourceName);
  add('Dataset', analysis.dataset, analysis.datasetLabel);
  add('Source URL', analysis.sourceUrl);
  add('Currency', analysis.currencyCode);
  add();
  add('Summary', 'Quantity (kg)', `Trade value (${analysis.currencyCode})`, `Unit value (${analysis.currencyCode}/kg)`);
  add('', analysis.summary.quantityKg, analysis.summary.tradeValue, analysis.summary.unitValuePerKg);
  add();
  comparison('Latest month vs same month previous year', analysis.latestMonthComparison);
  add();
  comparison('Latest 12 months vs previous 12 months', analysis.rolling12Comparison);
  add();
  add(analysis.direction === 'imports' ? 'Supplier origins' : 'Destination markets', 'Rank', 'Country code', 'Quantity (kg)', `Trade value (${analysis.currencyCode})`, `Unit value (${analysis.currencyCode}/kg)`, 'Share %', 'Latest 12m change %');
  for (const row of analysis.suppliers) add(row.origin, row.rank, row.originCode, row.quantityKg, row.tradeValue, row.unitValuePerKg, row.marketSharePct, row.changePct);
  add();
  add('Monthly trend', 'Quantity (kg)', `Trade value (${analysis.currencyCode})`, `Unit value (${analysis.currencyCode}/kg)`);
  for (const row of analysis.monthlyTrend) add(row.month, row.quantityKg, row.tradeValue, row.unitValuePerKg);
  add();
  add('Origin / destination evolution', 'Country code', 'Latest 12m (kg)', 'Previous 12m (kg)', 'Change %', 'Current share %', 'Previous share %', 'Share change (pp)');
  for (const row of analysis.originEvolution) add(row.origin, row.originCode, row.latest12QuantityKg, row.previous12QuantityKg, row.changePct, row.currentSharePct, row.previousSharePct, row.shareChangePp);
  add();
  add('Brokerage signals', 'Evidence');
  for (const signal of analysis.signals) add(signal.title, signal.evidence);
  add('Worth investigating', analysis.worthInvestigating);
  add();
  add('Methodology', 'Trade unit value is statistical value divided by net mass; it is not a market price. Country rankings exclude aggregate and special partner codes. Recent statistics can be revised.');
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
