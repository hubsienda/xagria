import {aggregateRecords, buildBrokerageSignals, buildMonthComparison, buildMonthlyTrend, buildOriginEvolution, buildRolling12Comparison, buildSuppliers, buildWorthInvestigating, isCountryPartner, monthsEndingAt, previousMonth} from './calculations';
import {getProductMapping, getTradeProduct} from './products';
import {getTradeProvider, getTradeSource} from './providers';
import {getReporterMarket} from './reporters';
import type {PeriodPreset, TradeAnalysis, TradeDirection} from './types';

const VALID_PERIODS = new Set<number>([12, 24, 36]);

export async function analyseTradeFlows(input: {productId: string; reporterCode: string; direction: TradeDirection; periodMonths: number}): Promise<TradeAnalysis> {
  const product = getTradeProduct(input.productId);
  if (!product) throw new Error('INVALID_PRODUCT');
  const reporter = getReporterMarket(input.reporterCode);
  if (!reporter) throw new Error('INVALID_REPORTER');
  if (input.direction !== 'imports' && input.direction !== 'exports') throw new Error('INVALID_DIRECTION');
  if (!VALID_PERIODS.has(input.periodMonths)) throw new Error('INVALID_PERIOD');

  const mapping = getProductMapping(product, reporter.provider);
  if (!mapping) throw new Error('UNSUPPORTED_PRODUCT');
  const provider = getTradeProvider(reporter);
  const source = getTradeSource(reporter);
  const periodMonths = input.periodMonths as PeriodPreset;
  const latestMonth = await provider.fetchLatestAvailableMonth(reporter, product, input.direction);
  const historyMonths = Math.max(periodMonths, 24);
  const sinceMonth = previousMonth(latestMonth, historyMonths - 1);
  const records = await provider.fetchTradeRecords(reporter, product, input.direction, sinceMonth, latestMonth);
  const countryRecords = records.filter(record => isCountryPartner(record.partnerCode));
  if (!countryRecords.length) throw new Error('NO_RESULTS');

  const selectedMonths = new Set(monthsEndingAt(latestMonth, periodMonths));
  const selectedRecords = countryRecords.filter(record => selectedMonths.has(record.time));
  const summary = aggregateRecords(selectedRecords);
  if (summary.quantityKg === 0 && summary.tradeValue === 0) throw new Error('NO_RESULTS');

  const latestMonthComparison = buildMonthComparison(countryRecords, latestMonth);
  const rolling12Comparison = buildRolling12Comparison(countryRecords, latestMonth);
  const originEvolution = buildOriginEvolution(countryRecords, latestMonth);
  const signals = buildBrokerageSignals(rolling12Comparison, latestMonthComparison, originEvolution, input.direction);
  return {
    provider: source.id,
    sourceName: source.sourceName,
    dataset: source.dataset,
    datasetLabel: source.datasetLabel,
    sourceUrl: source.sourceUrl,
    currencyCode: source.currencyCode,
    currencySymbol: source.currencySymbol,
    latestMonth,
    reporter,
    direction: input.direction,
    product,
    productCodeLabel: mapping.codeLabel,
    productScopeNote: mapping.scopeNote ?? product.scopeNote,
    periodMonths,
    summary,
    latestMonthComparison,
    rolling12Comparison,
    suppliers: buildSuppliers(countryRecords, latestMonth, periodMonths),
    monthlyTrend: buildMonthlyTrend(countryRecords, latestMonth, periodMonths),
    originEvolution,
    signals,
    worthInvestigating: buildWorthInvestigating(signals, originEvolution, input.direction),
  };
}
