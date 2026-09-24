import {COMEXT_DATASET, COMEXT_DATASET_LABEL, COMEXT_SOURCE_URL} from './config';
import {fetchLatestAvailableMonth, fetchTradeRecords} from './comext';
import {getTradeProduct} from './products';
import {getReporterMarket} from './reporters';
import {aggregateRecords, buildBrokerageSignals, buildMonthComparison, buildMonthlyTrend, buildOriginEvolution, buildRolling12Comparison, buildSuppliers, buildWorthInvestigating, isCountryPartner, monthsEndingAt, previousMonth} from './calculations';
import type {PeriodPreset, TradeAnalysis, TradeDirection} from './types';

const VALID_PERIODS = new Set<number>([12, 24, 36]);

export async function analyseTradeFlows(input: {productId: string; reporterCode: string; direction: TradeDirection; periodMonths: number}): Promise<TradeAnalysis> {
  const product = getTradeProduct(input.productId);
  if (!product) throw new Error('INVALID_PRODUCT');
  const reporter = getReporterMarket(input.reporterCode);
  if (!reporter) throw new Error('INVALID_REPORTER');
  if (input.direction !== 'imports' && input.direction !== 'exports') throw new Error('INVALID_DIRECTION');
  if (!VALID_PERIODS.has(input.periodMonths)) throw new Error('INVALID_PERIOD');
  const periodMonths = input.periodMonths as PeriodPreset;
  const latestMonth = await fetchLatestAvailableMonth(reporter.code, product.codes, input.direction);
  const historyMonths = Math.max(periodMonths, 24);
  const sinceMonth = previousMonth(latestMonth, historyMonths - 1);
  const records = await fetchTradeRecords(reporter.code, product.codes, input.direction, sinceMonth, latestMonth);
  const countryRecords = records.filter(record => isCountryPartner(record.partnerCode));
  if (!countryRecords.length) throw new Error('NO_RESULTS');
  const selectedMonths = new Set(monthsEndingAt(latestMonth, periodMonths));
  const selectedRecords = countryRecords.filter(record => selectedMonths.has(record.time));
  const summary = aggregateRecords(selectedRecords);
  if (summary.quantityKg === 0 && summary.tradeValueEur === 0) throw new Error('NO_RESULTS');
  const latestMonthComparison = buildMonthComparison(countryRecords, latestMonth);
  const rolling12Comparison = buildRolling12Comparison(countryRecords, latestMonth);
  const originEvolution = buildOriginEvolution(countryRecords, latestMonth);
  const signals = buildBrokerageSignals(rolling12Comparison, latestMonthComparison, originEvolution, input.direction);
  return {
    dataset: COMEXT_DATASET,
    datasetLabel: COMEXT_DATASET_LABEL,
    sourceUrl: COMEXT_SOURCE_URL,
    latestMonth,
    reporter,
    direction: input.direction,
    product,
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
