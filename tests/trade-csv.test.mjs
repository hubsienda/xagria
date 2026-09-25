import assert from 'node:assert/strict';
import {tradeAnalysisCsv} from '../src/lib/trade/csv.ts';

const analysis = {
  product: {id: 'table-grapes', name: 'Table grapes'}, reporter: {code: 'GB', name: 'United Kingdom'},
  direction: 'imports', periodMonths: 12, latestMonth: '2026-07', productCodeLabel: '08061010',
  productScopeNote: 'Fresh table grapes', sourceName: 'HMRC', dataset: 'OTS', datasetLabel: 'Overseas Trade Statistics',
  sourceUrl: 'https://www.uktradeinfo.com/api-documentation', currencyCode: 'GBP',
  summary: {quantityKg: 1234, tradeValue: 5678, unitValuePerKg: 5678 / 1234},
  latestMonthComparison: null,
  rolling12Comparison: {quantity: {current: 1234, previous: 1000, changePct: 23.4}, tradeValue: {current: 5678, previous: 4500, changePct: 26.17}, unitValue: {current: 4.6, previous: 4.5, changePct: 2.22}},
  suppliers: [{origin: 'Spain', rank: 1, originCode: 'ES', quantityKg: 1234, tradeValue: 5678, unitValuePerKg: 4.6, marketSharePct: 100, changePct: 23.4}],
  monthlyTrend: [{month: '2026-07', quantityKg: 1234, tradeValue: 5678, unitValuePerKg: 4.6}],
  originEvolution: [], signals: [{title: 'Volume rising', evidence: 'Up 23.4%'}],
  worthInvestigating: '=SUM(1,1)',
};
const csv = tradeAnalysisCsv(analysis);
assert(csv.startsWith('\uFEFF"XAGRIA Trade Flows analysis"\r\n'));
assert(csv.includes('"Summary","Quantity (kg)","Trade value (GBP)"'));
assert(csv.includes('"Spain","1","ES","1234","5678"'));
assert(csv.includes('"2026-07","1234","5678"'));
assert(csv.includes('"Worth investigating","\'=SUM(1,1)"'));
assert(csv.includes('"Insufficient comparable data"'));
console.log('PASS: Trade Flows CSV includes source, tables, comparisons and spreadsheet-safe text');
