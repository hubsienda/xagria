import assert from 'node:assert/strict';
import {priceAnalysisFilename, priceAnalysisToCsv} from '../src/lib/prices/csv.ts';

function analysis(overrides = {}) {
  const latest = {
    provider: 'eu', sourceName: 'European Commission', marketCode: 'ES', marketName: 'Spain', productId: 'tomatoes', productName: 'Tomatoes', sourceProduct: 'Tomatoes', variety: 'Round, premium "test"\nline', stage: 'Farmgate',
    startDate: '2026-09-13', endDate: '2026-09-19', rawPrice: 155.51, rawCurrency: 'EUR', rawUnit: '€/100Kg', normalisedPrice: 1.5551, normalisedUnit: 'EUR/kg', periodType: 'Week', sourceUrl: 'https://example.test',
  };
  return {
    provider: 'eu', sourceName: 'European Commission', sourceUrl: 'https://example.test', scopeNote: undefined, methodology: ['Official, reported "series"\nwith detail'],
    market: {code: 'ES', name: 'Spain', provider: 'eu'}, productId: 'tomatoes', productName: 'Tomatoes', sourceProduct: 'Tomatoes', variety: latest.variety, stage: 'Farmgate', currency: 'EUR', rawUnit: '€/100Kg', normalisedUnit: 'EUR/kg', periodMonths: 24,
    latest,
    previousComparison: {current: 1.5551, reference: 1.4, changePct: 11.0785714286, referenceDate: '2026-09-06'},
    yearOnYearComparison: null,
    recentAverageComparison: {current: 1.5551, reference: 1.3, changePct: 19.623, observationCount: 4},
    range12Month: {average: 1.4, high: 1.6, low: 1.0, distanceFromHighPct: 2.80625, distanceFromLowPct: 55.51, positionPct: 92.5167, observationCount: 30},
    seasonalComparison: null,
    trend: [latest, {...latest, startDate: '2026-09-06', rawPrice: 140, normalisedPrice: 1.4}],
    signals: [{kind: 'positive', title: 'Price strengthening', evidence: '=SUM(1,1), quoted "evidence"\nnext'}],
    worthInvestigating: 'Review supply conditions, not a forecast.',
    ...overrides,
  };
}

const eu = analysis();
const csv = priceAnalysisToCsv(eu);
assert(csv.startsWith('\uFEFF"XAGRIA PRICE SIGNALS"\r\n'));
assert(csv.includes('"Currency","EUR"'));
assert(csv.includes('"Original unit","€/100Kg"'));
assert(csv.includes('"Normalised unit","EUR/kg"'));
assert(csv.includes('"HISTORICAL SERIES"'));
assert(csv.includes('"Price strengthening"'));
assert(csv.includes('"WORTH INVESTIGATING"'));
assert(csv.includes('"Round, premium ""test""\nline"'));
assert(csv.includes("'\'=SUM") === false);
assert(csv.includes("' =SUM") === false);
assert(csv.includes("'=SUM(1,1), quoted \"\"evidence\"\"\nnext"));
assert(!csv.includes('NaN'));
assert(!csv.includes('Infinity'));
assert.equal(priceAnalysisFilename(eu), 'xagria-price-signals-tomatoes-spain-farmgate-2026-09-13.csv');

const ukLatest = {...eu.latest, provider: 'defra', sourceName: 'DEFRA', marketCode: 'UK', marketName: 'United Kingdom', productId: 'apples', productName: 'Apples', sourceProduct: 'apples', variety: 'Gala', stage: 'Wholesale', rawPrice: 1.43, rawCurrency: 'GBP', rawUnit: 'kg', normalisedPrice: 1.43, normalisedUnit: 'GBP/kg', startDate: '2026-09-14', endDate: undefined};
const uk = analysis({provider: 'defra', sourceName: 'DEFRA', scopeNote: 'Selected home-grown horticultural produce in England and Wales.', market: {code: 'UK', name: 'United Kingdom', provider: 'defra'}, productId: 'apples', productName: 'Apples', sourceProduct: 'apples', variety: 'Gala', stage: 'Wholesale', currency: 'GBP', rawUnit: 'kg', normalisedUnit: 'GBP/kg', latest: ukLatest, trend: [ukLatest], previousComparison: null, yearOnYearComparison: null, recentAverageComparison: null, range12Month: null, seasonalComparison: null});
const ukCsv = priceAnalysisToCsv(uk);
assert(ukCsv.includes('"Currency","GBP"'));
assert(ukCsv.includes('"Scope","Selected home-grown horticultural produce in England and Wales."'));
assert(ukCsv.includes('"Normalised unit","GBP/kg"'));
assert.equal(priceAnalysisFilename(uk), 'xagria-price-signals-apples-united-kingdom-wholesale-2026-09-14.csv');

const missing = analysis({range12Month: {average: Number.NaN, high: Number.POSITIVE_INFINITY, low: 1, distanceFromHighPct: null, distanceFromLowPct: undefined, positionPct: null, observationCount: 1}});
const missingCsv = priceAnalysisToCsv(missing);
assert(!missingCsv.includes('NaN'));
assert(!missingCsv.includes('Infinity'));

console.log('PASS: Price Signals CSV covers EU/UK metadata, units, trend, signals, escaping, missing values and filenames');
