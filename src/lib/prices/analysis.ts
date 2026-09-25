import 'server-only';
import {DEFRA_PRICE_METHODOLOGY, DEFRA_SCOPE_NOTE} from './defra';
import {EU_PRICE_METHODOLOGY} from './eu';
import {getPriceMarket} from './markets';
import {buildPriceSignals, buildWorthInvestigating, observationPrice, previousObservationComparison, range12MonthContext, recentFourAverageComparison, seasonalComparison, yearOnYearComparison} from './calculations';
import {getPriceObservations} from './providers';
import {comparableSeriesForLatest} from './series';
import type {PriceAnalysis, PriceObservation, PricePeriod, PriceStage} from './types';

const VALID_PERIODS = new Set<number>([12, 24, 36]);
const VALID_STAGES = new Set<PriceStage>(['Farmgate', 'Ex-packaging', 'Retail', 'Wholesale']);

function monthsBefore(iso: string, count: number) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 - count, day));
  return date.toISOString().slice(0, 10);
}

export async function analysePriceSignals(input: {marketCode: string; sourceProduct: string; variety: string; stage: PriceStage; periodMonths: number}): Promise<PriceAnalysis> {
  const market = getPriceMarket(input.marketCode);
  if (!market) throw new Error('INVALID_MARKET');
  if (!input.sourceProduct || !input.variety || !VALID_STAGES.has(input.stage)) throw new Error('INVALID_SELECTION');
  if (!VALID_PERIODS.has(input.periodMonths)) throw new Error('INVALID_PERIOD');
  const periodMonths = input.periodMonths as PricePeriod;
  const fetched = await getPriceObservations({marketCode: market.code, sourceProduct: input.sourceProduct, variety: input.variety, stage: input.stage, periodMonths});
  const observations = comparableSeriesForLatest(fetched);
  if (!observations.length) throw new Error('NO_RESULTS');
  const latest = observations[observations.length - 1];
  const cutoff = monthsBefore(latest.startDate, periodMonths);
  const trend = observations.filter(row => row.startDate >= cutoff && row.startDate <= latest.startDate);
  if (!trend.length) throw new Error('NO_RESULTS');
  const previousComparison = previousObservationComparison(observations);
  const yearOnYear = yearOnYearComparison(observations);
  const recentAverage = recentFourAverageComparison(observations);
  const range12 = range12MonthContext(observations);
  const seasonal = seasonalComparison(observations);
  const signals = buildPriceSignals({productName: latest.productName, marketName: latest.marketName, stage: latest.stage, previous: previousComparison, yearOnYear, recentAverage, range12, seasonal});
  return {
    provider: latest.provider,
    sourceName: latest.sourceName,
    sourceUrl: latest.sourceUrl,
    scopeNote: latest.provider === 'defra' ? DEFRA_SCOPE_NOTE : undefined,
    methodology: latest.provider === 'defra' ? DEFRA_PRICE_METHODOLOGY : EU_PRICE_METHODOLOGY,
    market,
    productId: latest.productId,
    productName: latest.productName,
    sourceProduct: latest.sourceProduct,
    variety: latest.variety,
    stage: latest.stage,
    currency: latest.rawCurrency,
    rawUnit: latest.rawUnit,
    normalisedUnit: latest.normalisedUnit,
    periodMonths,
    latest,
    previousComparison,
    yearOnYearComparison: yearOnYear,
    recentAverageComparison: recentAverage,
    range12Month: range12,
    seasonalComparison: seasonal,
    trend,
    signals,
    worthInvestigating: buildWorthInvestigating(signals),
  };
}

export function priceBasisValue(observation: PriceObservation) { return observationPrice(observation); }
