import {getTradeProduct} from './products';
import {getReporterMarket} from './reporters';
import {fetchProviderTradeData} from './provider';
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
  const historyMonths = Math.max(periodMonths, 24);
  const providerResult = await fetchProviderTradeData(
    reporter,
    product,
    input.direction,
    latestMonth => previousMonth(latestMonth, historyMonths - 1),
  );
  const countryRecords = providerResult.records.filter(record => isCountryPartner(record.partnerCode));
  if (!countryRecords.length) throw new Error('NO_RESULTS');
  const selectedMonths = new Set(monthsEndingAt(providerResult.latestMonth, periodMonths));
  const selectedRecords = countryRecords.filter(record => selectedMonths.has(record.time));
  const summary = aggregateRecords(selectedRecords);
  if (summary.quantityKg === 0 && summary.tradeValue === 0) throw new Error('NO_RESULTS');
  const latestMonthComparison = buildMonthComparison(countryRecords, providerResult.latestMonth);
  const rolling12Comparison = buildRolling12Comparison(countryRecords, providerResult.latestMonth);
  const originEvolution = buildOriginEvolution(countryRecords, providerResult.latestMonth);
  const signals = buildBrokerageSignals(rolling12Comparison, latestMonthComparison, originEvolution, input.direction);
  return {
    source: providerResult.source,
    latestMonth: providerResult.latestMonth,
    reporter,
    direction: input.direction,
    product,
    periodMonths,
    summary,
    latestMonthComparison,
    rolling12Comparison,
    suppliers: buildSuppliers(countryRecords, providerResult.latestMonth, periodMonths),
    monthlyTrend: buildMonthlyTrend(countryRecords, providerResult.latestMonth, periodMonths),
    originEvolution,
    signals,
    worthInvestigating: buildWorthInvestigating(signals, originEvolution, input.direction),
  };
}
