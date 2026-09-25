import {PRICE_SIGNAL_THRESHOLDS} from './config';
import type {PriceComparison, PriceObservation, PriceRangeContext, PriceSignal, RecentAverageComparison, SeasonalComparison} from './types';

export function percentageChange(current: number | null | undefined, reference: number | null | undefined) {
  if (!Number.isFinite(current) || !Number.isFinite(reference) || reference == null || reference === 0) return null;
  return (((current as number) - reference) / Math.abs(reference)) * 100;
}

export function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function observationPrice(observation: PriceObservation) {
  return observation.normalisedPrice ?? observation.rawPrice;
}

function dateMs(value: string) { return new Date(`${value}T00:00:00Z`).getTime(); }
function daysBetween(a: string, b: string) { return Math.abs(dateMs(a) - dateMs(b)) / 86_400_000; }
function yearOf(value: string) { return Number(value.slice(0, 4)); }

export function sortObservations(observations: PriceObservation[]) {
  return [...observations].sort((a, b) => dateMs(a.startDate) - dateMs(b.startDate));
}

export function previousObservationComparison(observations: PriceObservation[]): PriceComparison | null {
  const valid = sortObservations(observations).filter(row => Number.isFinite(observationPrice(row)));
  if (valid.length < 2) return null;
  const current = valid[valid.length - 1];
  const previous = valid[valid.length - 2];
  const currentPrice = observationPrice(current);
  const previousPrice = observationPrice(previous);
  return {current: currentPrice, reference: previousPrice, changePct: percentageChange(currentPrice, previousPrice), referenceDate: previous.startDate};
}

export function recentFourAverageComparison(observations: PriceObservation[]): RecentAverageComparison | null {
  const valid = sortObservations(observations).filter(row => Number.isFinite(observationPrice(row)));
  if (valid.length < 5) return null;
  const current = valid[valid.length - 1];
  const previousFour = valid.slice(-5, -1).map(observationPrice);
  const average = mean(previousFour);
  if (average == null) return null;
  const currentPrice = observationPrice(current);
  return {current: currentPrice, reference: average, changePct: percentageChange(currentPrice, average), observationCount: 4};
}

export function yearOnYearComparison(observations: PriceObservation[]): PriceComparison | null {
  const valid = sortObservations(observations).filter(row => Number.isFinite(observationPrice(row)));
  if (valid.length < 2) return null;
  const current = valid[valid.length - 1];
  const currentDate = new Date(`${current.startDate}T00:00:00Z`);
  const target = new Date(Date.UTC(currentDate.getUTCFullYear() - 1, currentDate.getUTCMonth(), currentDate.getUTCDate()));
  const targetIso = target.toISOString().slice(0, 10);
  const tolerance = /week|fortnight/i.test(current.periodType ?? '') ? 21 : 45;
  const candidates = valid.slice(0, -1).filter(row => yearOf(row.startDate) === target.getUTCFullYear() && daysBetween(row.startDate, targetIso) <= tolerance);
  if (!candidates.length) return null;
  const reference = candidates.sort((a, b) => daysBetween(a.startDate, targetIso) - daysBetween(b.startDate, targetIso))[0];
  const currentPrice = observationPrice(current);
  const referencePrice = observationPrice(reference);
  return {current: currentPrice, reference: referencePrice, changePct: percentageChange(currentPrice, referencePrice), referenceDate: reference.startDate};
}

export function range12MonthContext(observations: PriceObservation[]): PriceRangeContext | null {
  const valid = sortObservations(observations).filter(row => Number.isFinite(observationPrice(row)));
  if (valid.length < 2) return null;
  const latest = valid[valid.length - 1];
  const cutoff = dateMs(latest.startDate) - 365 * 86_400_000;
  const window = valid.filter(row => dateMs(row.startDate) >= cutoff && dateMs(row.startDate) <= dateMs(latest.startDate));
  if (window.length < 2) return null;
  const prices = window.map(observationPrice);
  const average = mean(prices);
  if (average == null) return null;
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const current = observationPrice(latest);
  return {
    average,
    high,
    low,
    distanceFromHighPct: high === 0 ? null : ((high - current) / Math.abs(high)) * 100,
    distanceFromLowPct: low === 0 ? null : ((current - low) / Math.abs(low)) * 100,
    positionPct: high === low ? null : ((current - low) / (high - low)) * 100,
    observationCount: window.length,
  };
}

export function seasonalComparison(observations: PriceObservation[]): SeasonalComparison | null {
  const valid = sortObservations(observations).filter(row => Number.isFinite(observationPrice(row)));
  if (valid.length < 3) return null;
  const latest = valid[valid.length - 1];
  const latestDate = new Date(`${latest.startDate}T00:00:00Z`);
  const latestYear = latestDate.getUTCFullYear();
  const samples: PriceObservation[] = [];
  const years: number[] = [];
  for (const targetYear of [latestYear - 1, latestYear - 2]) {
    const target = new Date(Date.UTC(targetYear, latestDate.getUTCMonth(), latestDate.getUTCDate())).toISOString().slice(0, 10);
    const nearby = valid.filter(row => yearOf(row.startDate) === targetYear && daysBetween(row.startDate, target) <= 14);
    if (nearby.length) { samples.push(...nearby); years.push(targetYear); }
  }
  if (years.length < 2 || !samples.length) return null;
  const reference = median(samples.map(observationPrice));
  if (reference == null) return null;
  const current = observationPrice(latest);
  return {current, reference, changePct: percentageChange(current, reference), observationCount: samples.length, referenceYears: years};
}

const pctText = (value: number) => `${Math.abs(value).toFixed(1)}%`;

export function buildPriceSignals(input: {
  productName: string;
  marketName: string;
  stage: string;
  previous: PriceComparison | null;
  yearOnYear: PriceComparison | null;
  recentAverage: RecentAverageComparison | null;
  range12: PriceRangeContext | null;
  seasonal: SeasonalComparison | null;
}): PriceSignal[] {
  const signals: PriceSignal[] = [];
  const prefix = `${input.marketName} ${input.productName.toLowerCase()} ${input.stage.toLowerCase()} price`;
  const previousChange = input.previous?.changePct;
  if (previousChange != null && Math.abs(previousChange) >= PRICE_SIGNAL_THRESHOLDS.previousObservationPct) {
    signals.push({kind: previousChange > 0 ? 'positive' : 'negative', title: previousChange > 0 ? 'Price strengthening' : 'Price weakening', evidence: `${prefix} is ${pctText(previousChange)} ${previousChange > 0 ? 'above' : 'below'} the previous reported observation.`});
  }
  const recentChange = input.recentAverage?.changePct;
  if (recentChange != null && Math.abs(recentChange) >= PRICE_SIGNAL_THRESHOLDS.recentAveragePct) {
    signals.push({kind: recentChange > 0 ? 'positive' : 'negative', title: recentChange > 0 ? 'Sharp recent rise' : 'Sharp recent fall', evidence: `The latest ${input.stage.toLowerCase()} price is ${pctText(recentChange)} ${recentChange > 0 ? 'above' : 'below'} the average of the previous four reported observations.`});
  }
  const yearChange = input.yearOnYear?.changePct;
  if (yearChange != null && Math.abs(yearChange) >= PRICE_SIGNAL_THRESHOLDS.yearOnYearPct) {
    signals.push({kind: yearChange > 0 ? 'positive' : 'negative', title: yearChange > 0 ? 'Above previous-year level' : 'Below previous-year level', evidence: `${prefix} is ${pctText(yearChange)} ${yearChange > 0 ? 'above' : 'below'} the closest comparable reporting period last year.`});
  }
  const seasonalChange = input.seasonal?.changePct;
  if (seasonalChange != null && Math.abs(seasonalChange) >= PRICE_SIGNAL_THRESHOLDS.seasonalPct) {
    signals.push({kind: seasonalChange > 0 ? 'positive' : 'negative', title: seasonalChange > 0 ? 'Above seasonal level' : 'Below seasonal level', evidence: `The latest price is ${pctText(seasonalChange)} ${seasonalChange > 0 ? 'above' : 'below'} the comparable seasonal reference from the previous two years.`});
  }
  const highDistance = input.range12?.distanceFromHighPct;
  const lowDistance = input.range12?.distanceFromLowPct;
  if (highDistance != null && highDistance >= 0 && highDistance <= PRICE_SIGNAL_THRESHOLDS.nearRangePct) {
    signals.push({kind: 'positive', title: 'Near 12-month high', evidence: `The latest reported price is ${highDistance.toFixed(1)}% below the highest observation recorded during the past 12 months.`});
  } else if (lowDistance != null && lowDistance >= 0 && lowDistance <= PRICE_SIGNAL_THRESHOLDS.nearRangePct) {
    signals.push({kind: 'negative', title: 'Near 12-month low', evidence: `The latest reported price is ${lowDistance.toFixed(1)}% above the lowest observation recorded during the past 12 months.`});
  }
  if (!signals.length) signals.push({kind: 'neutral', title: 'Broadly stable', evidence: 'No configured threshold-level movement is visible in the available comparable observations.'});
  return signals;
}

export function buildWorthInvestigating(signals: PriceSignal[]) {
  const titles = new Set(signals.map(signal => signal.title));
  if (titles.has('Sharp recent rise') || titles.has('Above seasonal level') || titles.has('Above previous-year level')) return 'Prices are elevated against at least one recent or historical comparison. Review supply conditions and current buyer requirements.';
  if (titles.has('Sharp recent fall') || titles.has('Below seasonal level') || titles.has('Below previous-year level')) return 'Prices are lower against at least one recent or historical comparison. Review current market conditions and buyer requirements before drawing a commercial conclusion.';
  if (titles.has('Near 12-month high')) return 'The latest price is close to the top of its recent observed range. Check current supply conditions and buyer requirements.';
  if (titles.has('Near 12-month low')) return 'The latest price is close to the bottom of its recent observed range. Check current market conditions before drawing a commercial conclusion.';
  return 'Current prices are close to their recent range and no strong movement is visible in the available data.';
}
