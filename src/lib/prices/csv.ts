import type {PriceAnalysis} from './types';
import {slugifyPricePart} from './products';

type Cell = string | number | null | undefined;

function safeNumber(value: number | null | undefined): number | '' {
  return value != null && Number.isFinite(value) ? value : '';
}

function csvCell(value: Cell) {
  if (value == null) return '""';
  const raw = typeof value === 'number' && !Number.isFinite(value) ? '' : String(value);
  const protectedText = typeof value === 'string' && /^[\s\x00-\x1f]*[=+@\-]/.test(raw) ? `'${raw}` : raw;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

export function priceAnalysisFilename(analysis: PriceAnalysis) {
  return `xagria-price-signals-${slugifyPricePart(analysis.productName)}-${slugifyPricePart(analysis.market.name)}-${slugifyPricePart(analysis.stage)}-${analysis.latest.startDate}.csv`;
}

export function priceAnalysisToCsv(analysis: PriceAnalysis) {
  const rows: Cell[][] = [];
  const add = (...cells: Cell[]) => rows.push(cells);
  const comparison = (heading: string, data: {current: number; reference: number; changePct: number | null; referenceDate?: string} | null, referenceLabel: string) => {
    add(heading);
    add('Current price', data ? safeNumber(data.current) : '');
    add(referenceLabel, data ? safeNumber(data.reference) : '');
    add('Reference date', data?.referenceDate ?? '');
    add('Change %', data ? safeNumber(data.changePct) : '');
  };

  add('XAGRIA PRICE SIGNALS');
  add('ANALYSIS');
  add('Market', analysis.market.name);
  add('Product', analysis.productName);
  add('Source product', analysis.sourceProduct);
  add('Variety', analysis.variety);
  add('Price stage', analysis.stage);
  add('Selected period (months)', analysis.periodMonths);
  add('Latest reporting date', analysis.latest.startDate);
  add('Source', analysis.sourceName);
  add('Currency', analysis.currency);
  add('Original unit', analysis.rawUnit);
  add('Normalised unit', analysis.normalisedUnit ?? '');
  add('Scope', analysis.scopeNote ?? '');
  add();

  add('LATEST PRICE');
  add('Raw reported price', safeNumber(analysis.latest.rawPrice));
  add('Normalised price', safeNumber(analysis.latest.normalisedPrice));
  add();

  add('COMPARISONS');
  comparison('Latest vs previous observation', analysis.previousComparison, 'Previous price');
  add();
  comparison('Latest vs comparable period last year', analysis.yearOnYearComparison, 'Comparable previous-year price');
  add();
  comparison('Latest vs previous 4-observation average', analysis.recentAverageComparison, 'Previous 4-observation average');
  add();

  add('12-MONTH CONTEXT');
  add('Average', analysis.range12Month ? safeNumber(analysis.range12Month.average) : '');
  add('High', analysis.range12Month ? safeNumber(analysis.range12Month.high) : '');
  add('Low', analysis.range12Month ? safeNumber(analysis.range12Month.low) : '');
  add('Distance from high %', analysis.range12Month ? safeNumber(analysis.range12Month.distanceFromHighPct) : '');
  add('Distance from low %', analysis.range12Month ? safeNumber(analysis.range12Month.distanceFromLowPct) : '');
  add('Position within range %', analysis.range12Month ? safeNumber(analysis.range12Month.positionPct) : '');
  add();

  add('SEASONAL COMPARISON');
  add('Seasonal reference', analysis.seasonalComparison ? safeNumber(analysis.seasonalComparison.reference) : '');
  add('Current price', analysis.seasonalComparison ? safeNumber(analysis.seasonalComparison.current) : '');
  add('Difference %', analysis.seasonalComparison ? safeNumber(analysis.seasonalComparison.changePct) : '');
  add('Reference years', analysis.seasonalComparison?.referenceYears.join(' + ') ?? '');
  add();

  add('HISTORICAL SERIES');
  add('Date', 'End date', 'Raw price', 'Raw currency', 'Raw unit', 'Normalised price', 'Normalised unit', 'Variety', 'Stage');
  for (const row of analysis.trend) add(row.startDate, row.endDate ?? '', safeNumber(row.rawPrice), row.rawCurrency, row.rawUnit, safeNumber(row.normalisedPrice), row.normalisedUnit ?? '', row.variety, row.stage);
  add();

  add('PRICE SIGNALS');
  add('Signal', 'Evidence');
  for (const signal of analysis.signals) add(signal.title, signal.evidence);
  add();

  add('WORTH INVESTIGATING');
  add(analysis.worthInvestigating);
  add();

  add('SOURCE AND METHODOLOGY');
  add('Source', analysis.sourceName);
  add('Official source', analysis.sourceUrl);
  for (const note of analysis.methodology) add('Methodology', note);

  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
