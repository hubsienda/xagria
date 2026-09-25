import type {ComparisonBlock, ComparisonMetric, TradeAnalysis} from './types';

type Cell = string | number | null | undefined;

function numeric(value: number | null | undefined): number | '' {
  return value != null && Number.isFinite(value) ? value : '';
}

function csvCell(value: Cell) {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';

  let text = String(value);
  // Prevent spreadsheet formula execution for exported text without altering numeric cells.
  if (/^[\s\x00-\x1f]*[=+@-]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text) || /^\s|\s$/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function comparisonRows(title: string, block: ComparisonBlock | null, currencyCode: string): Cell[][] {
  const metrics: Array<[string, ComparisonMetric | null]> = [
    ['Quantity kg', block?.quantity ?? null],
    [`Trade value ${currencyCode}`, block?.tradeValue ?? null],
    [`Trade unit value ${currencyCode}/kg`, block?.unitValue ?? null],
  ];
  return [
    [title],
    ['Metric', 'Current', 'Previous', 'Change %'],
    ...metrics.map(([label, metric]) => [
      label,
      numeric(metric?.current),
      numeric(metric?.previous),
      numeric(metric?.changePct),
    ]),
  ];
}

function slug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function tradeAnalysisFilename(analysis: TradeAnalysis) {
  return `xagria-trade-flows-${slug(analysis.product.name)}-${slug(analysis.reporter.name)}-${analysis.direction}-${analysis.latestMonth}.csv`;
}

export function tradeAnalysisToCsv(analysis: TradeAnalysis) {
  const rows: Cell[][] = [];
  const add = (...values: Cell[]) => rows.push(values);
  const addBlank = () => rows.push([]);

  add('XAGRIA TRADE FLOWS');
  add('ANALYSIS');
  add('Product', analysis.product.name);
  add('Commodity code / code group', analysis.productCodeLabel);
  add('Product statistical scope note', analysis.productScopeNote ?? '');
  add('Reporting market', analysis.reporter.name);
  add('Trade direction', analysis.direction);
  add('Selected period months', analysis.periodMonths);
  add('Latest available month', analysis.latestMonth);
  add('Source', analysis.sourceName);
  add('Dataset / API', `${analysis.dataset} · ${analysis.datasetLabel}`);
  add('Currency', analysis.currencyCode);

  addBlank();
  add('SUMMARY');
  add('Total quantity kg', numeric(analysis.summary.quantityKg));
  add('Total quantity tonnes', numeric(analysis.summary.quantityKg / 1000));
  add('Total trade value', numeric(analysis.summary.tradeValue));
  add('Trade unit value per kg', numeric(analysis.summary.unitValuePerKg));

  addBlank();
  rows.push(...comparisonRows('LATEST MONTH VS SAME MONTH PREVIOUS YEAR', analysis.latestMonthComparison, analysis.currencyCode));

  addBlank();
  rows.push(...comparisonRows('LATEST 12 MONTHS VS PREVIOUS 12 MONTHS', analysis.rolling12Comparison, analysis.currencyCode));

  addBlank();
  add(analysis.direction === 'imports' ? 'SUPPLIER ORIGINS' : 'DESTINATION MARKETS');
  add('Rank', 'Country code', 'Country', 'Quantity kg', 'Quantity tonnes', 'Trade value', 'Trade unit value per kg', 'Market share %', 'Latest 12-month change %');
  for (const row of analysis.suppliers) {
    add(row.rank, row.originCode, row.origin, numeric(row.quantityKg), numeric(row.quantityKg / 1000), numeric(row.tradeValue), numeric(row.unitValuePerKg), numeric(row.marketSharePct), numeric(row.changePct));
  }

  addBlank();
  add('MONTHLY TREND');
  add('Month', 'Quantity kg', 'Quantity tonnes', 'Trade value', 'Trade unit value per kg');
  for (const row of analysis.monthlyTrend) {
    add(row.month, numeric(row.quantityKg), numeric(row.quantityKg / 1000), numeric(row.tradeValue), numeric(row.unitValuePerKg));
  }

  addBlank();
  add(analysis.direction === 'imports' ? 'ORIGIN EVOLUTION' : 'DESTINATION EVOLUTION');
  add('Country code', 'Country', 'Latest 12-month quantity kg', 'Previous 12-month quantity kg', 'Change %', 'Current share %', 'Previous share %', 'Share change percentage points');
  for (const row of analysis.originEvolution) {
    add(row.originCode, row.origin, numeric(row.latest12QuantityKg), numeric(row.previous12QuantityKg), numeric(row.changePct), numeric(row.currentSharePct), numeric(row.previousSharePct), numeric(row.shareChangePp));
  }

  addBlank();
  add('BROKERAGE SIGNALS');
  add('Signal', 'Evidence');
  if (analysis.signals.length) {
    for (const signal of analysis.signals) add(signal.title, signal.evidence);
  } else {
    add('No threshold-level movement was detected', '');
  }

  addBlank();
  add('WORTH INVESTIGATING');
  add(analysis.worthInvestigating);

  addBlank();
  add('SOURCE INFORMATION');
  add('Source name', analysis.sourceName);
  add('Dataset / API', `${analysis.dataset} · ${analysis.datasetLabel}`);
  add('Reporter', analysis.reporter.name);
  add('Flow', analysis.direction);
  add('Product', analysis.product.name);
  add('Commodity codes', analysis.productCodeLabel);
  add('Latest data month', analysis.latestMonth);
  add('Currency', analysis.currencyCode);
  add('Source URL', analysis.sourceUrl);

  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

// Backwards-compatible export for any existing imports/tests.
export const tradeAnalysisCsv = tradeAnalysisToCsv;
