import assert from 'node:assert/strict';
import {buildPriceSignals, mean, percentageChange, previousObservationComparison, range12MonthContext, recentFourAverageComparison, seasonalComparison, yearOnYearComparison} from '../src/lib/prices/calculations.ts';
import {getPriceMarket} from '../src/lib/prices/markets.ts';
import {comparableSeriesForLatest} from '../src/lib/prices/series.ts';
import {normaliseMassPrice, parseReportedPrice} from '../src/lib/prices/units.ts';

assert.equal(percentageChange(110, 100), 10);
assert.equal(percentageChange(90, 100), -10);
assert.equal(percentageChange(10, 0), null);
assert.equal(percentageChange(null, 10), null);
assert.equal(mean([1, 2, 3, 4]), 2.5);

assert.deepEqual(normaliseMassPrice(200, 'EUR', '€/100Kg'), {price: 2, unit: 'EUR/kg'});
assert.deepEqual(normaliseMassPrice(1.35, 'GBP', 'kg'), {price: 1.35, unit: 'GBP/kg'});
assert.equal(normaliseMassPrice(0.8, 'GBP', 'head'), null);
assert.equal(normaliseMassPrice(1, 'GBP', ''), null);
assert.equal(normaliseMassPrice(Number.NaN, 'EUR', '€/kg'), null);
assert.equal(parseReportedPrice('€155.51'), 155.51);

assert.equal(getPriceMarket('ES')?.provider, 'eu');
assert.equal(getPriceMarket('DE')?.provider, 'eu');
assert.equal(getPriceMarket('IT')?.provider, 'eu');
assert.equal(getPriceMarket('UK')?.provider, 'defra');

const base = {
  provider: 'eu', sourceName: 'EU', marketCode: 'ES', marketName: 'Spain', productId: 'tomatoes', productName: 'Tomatoes', sourceProduct: 'Tomatoes', variety: 'Round', stage: 'Farmgate',
  endDate: undefined, rawCurrency: 'EUR', rawUnit: '€/100Kg', normalisedUnit: 'EUR/kg', periodType: 'Week', sourceUrl: 'https://example.test',
};
const observation = (startDate, price, overrides = {}) => ({...base, startDate, rawPrice: price * 100, normalisedPrice: price, ...overrides});

const five = [
  observation('2026-08-16', 8), observation('2026-08-23', 9), observation('2026-08-30', 10), observation('2026-09-06', 11), observation('2026-09-13', 12),
];
const previous = previousObservationComparison(five);
assert(previous);
assert.equal(previous.reference, 11);
assert(Math.abs(previous.changePct - 9.090909090909092) < 1e-9);
const recent = recentFourAverageComparison(five);
assert(recent);
assert.equal(recent.reference, 9.5);
assert.equal(recent.observationCount, 4);
assert(Math.abs(recent.changePct - 26.31578947368421) < 1e-9);

const range = range12MonthContext(five);
assert(range);
assert.equal(range.high, 12);
assert.equal(range.low, 8);
assert.equal(range.average, 10);
assert.equal(range.positionPct, 100);

const yoyRows = [observation('2025-09-14', 10), observation('2026-09-13', 12)];
const yoy = yearOnYearComparison(yoyRows);
assert(yoy);
assert.equal(yoy.referenceDate, '2025-09-14');
assert.equal(yoy.changePct, 20);

const seasonalRows = [observation('2024-09-08', 8), observation('2024-09-15', 10), observation('2025-09-07', 10), observation('2025-09-14', 12), observation('2026-09-13', 13)];
const seasonal = seasonalComparison(seasonalRows);
assert(seasonal);
assert.deepEqual(seasonal.referenceYears, [2025, 2024]);
assert.equal(seasonal.reference, 10);
assert.equal(seasonal.changePct, 30);
assert.equal(seasonalComparison([observation('2025-09-14', 10), observation('2026-09-13', 12)]), null);

const mixed = [
  observation('2026-09-01', 10, {variety: 'Round', stage: 'Farmgate'}),
  observation('2026-09-08', 20, {variety: 'Vine', stage: 'Farmgate'}),
  observation('2026-09-10', 30, {variety: 'Round', stage: 'Retail'}),
  observation('2026-09-13', 12, {variety: 'Round', stage: 'Farmgate'}),
];
const comparable = comparableSeriesForLatest(mixed);
assert.equal(comparable.length, 2);
assert(comparable.every(row => row.variety === 'Round' && row.stage === 'Farmgate'));

const signals = buildPriceSignals({
  productName: 'Tomatoes', marketName: 'Spain', stage: 'Farmgate',
  previous: {current: 110, reference: 100, changePct: 10},
  recentAverage: {current: 110, reference: 100, changePct: 10, observationCount: 4},
  yearOnYear: {current: 120, reference: 100, changePct: 20},
  seasonal: {current: 120, reference: 100, changePct: 20, observationCount: 2, referenceYears: [2025, 2024]},
  range12: {average: 100, high: 121, low: 80, distanceFromHighPct: 0.826, distanceFromLowPct: 50, positionPct: 97, observationCount: 20},
});
assert(signals.some(signal => signal.title === 'Price strengthening'));
assert(signals.some(signal => signal.title === 'Sharp recent rise'));
assert(signals.some(signal => signal.title === 'Above previous-year level'));
assert(signals.some(signal => signal.title === 'Above seasonal level'));
assert(signals.some(signal => signal.title === 'Near 12-month high'));

console.log('PASS: Price Signals calculations, units, provider routing, series separation and signal thresholds');
