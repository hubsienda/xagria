import assert from 'node:assert/strict';
import {tradeAnalysisFilename, tradeAnalysisToCsv} from '../src/lib/trade/csv.ts';

function makeAnalysis(currencyCode = 'GBP') {
  const isGbp = currencyCode === 'GBP';
  return {
    provider: isGbp ? 'hmrc' : 'eurostat',
    product: {id: 'table-grapes', name: 'Table grapes'},
    reporter: {code: isGbp ? 'GB' : 'DE', name: isGbp ? 'United Kingdom' : 'Germany', provider: isGbp ? 'hmrc' : 'eurostat'},
    direction: 'imports', periodMonths: 12, latestMonth: '2026-07', productCodeLabel: '08061010',
    productScopeNote: 'Fresh table grapes, "dessert" category\nOfficial statistical scope',
    sourceName: isGbp ? 'HMRC / UK Trade Info — UK Overseas Trade Statistics' : 'Eurostat Comext — International trade in goods',
    dataset: isGbp ? 'OTS' : 'DS-045409',
    datasetLabel: isGbp ? 'Overseas Trade Statistics API' : 'EU trade since 1988 by HS2-4-6 and CN8',
    sourceUrl: isGbp ? 'https://www.uktradeinfo.com/api-documentation' : 'https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/comext-database',
    currencyCode,
    currencySymbol: isGbp ? '£' : '€',
    summary: {quantityKg: 1234, tradeValue: 5678, unitValuePerKg: 5678 / 1234},
    latestMonthComparison: null,
    rolling12Comparison: {
      quantity: {current: 1234, previous: 1000, changePct: 23.4},
      tradeValue: {current: 5678, previous: 4500, changePct: 26.1777777778},
      unitValue: {current: 4.6, previous: 4.5, changePct: 2.2222222222},
    },
    suppliers: [{origin: 'Spain, mainland', rank: 1, originCode: 'ES', quantityKg: 1234, tradeValue: 5678, unitValuePerKg: 4.6, marketSharePct: 100, changePct: 23.4}],
    monthlyTrend: [{month: '2026-07', quantityKg: 1234, tradeValue: 5678, unitValuePerKg: 4.6}],
    originEvolution: [{origin: 'Spain', originCode: 'ES', latest12QuantityKg: 1234, previous12QuantityKg: 1000, changePct: 23.4, currentSharePct: 100, previousSharePct: 95, shareChangePp: 5}],
    signals: [{title: 'Volume rising', evidence: 'Up 23.4%, with "strong" movement'}],
    worthInvestigating: '=SUM(1,1)',
  };
}

const gbp = makeAnalysis('GBP');
const csv = tradeAnalysisToCsv(gbp);
assert(csv.startsWith('\uFEFFXAGRIA TRADE FLOWS\r\nANALYSIS\r\n'));
assert(csv.includes('Product,Table grapes'));
assert(csv.includes('Reporting market,United Kingdom'));
assert(csv.includes('Currency,GBP'));
assert(csv.includes('SUMMARY\r\nTotal quantity kg,1234\r\nTotal quantity tonnes,1.234\r\nTotal trade value,5678'));
assert(csv.includes('LATEST MONTH VS SAME MONTH PREVIOUS YEAR\r\nMetric,Current,Previous,Change %\r\nQuantity kg,,,\r\nTrade value GBP,,,\r\nTrade unit value GBP/kg,,,'));
assert(csv.includes('SUPPLIER ORIGINS\r\nRank,Country code,Country,Quantity kg,Quantity tonnes,Trade value,Trade unit value per kg,Market share %,Latest 12-month change %'));
assert(csv.includes('1,ES,"Spain, mainland",1234,1.234,5678,4.6,100,23.4'));
assert(csv.includes('MONTHLY TREND\r\nMonth,Quantity kg,Quantity tonnes,Trade value,Trade unit value per kg\r\n2026-07,1234,1.234,5678,4.6'));
assert(csv.includes('ORIGIN EVOLUTION'));
assert(csv.includes('BROKERAGE SIGNALS\r\nSignal,Evidence'));
assert(csv.includes('"Up 23.4%, with ""strong"" movement"'));
assert(csv.includes('WORTH INVESTIGATING\r\n\'=SUM(1,1)'));
assert(csv.includes('SOURCE INFORMATION'));
assert(csv.includes('Dataset / API,OTS · Overseas Trade Statistics API'));
assert(csv.includes('"Fresh table grapes, ""dessert"" category\nOfficial statistical scope"'));
assert(!csv.includes('Insufficient comparable data'));
assert(!csv.includes('NaN'));
assert(!csv.includes('Infinity'));
assert(!csv.includes('undefined'));
assert(!csv.includes(',null'));
assert.equal(tradeAnalysisFilename(gbp), 'xagria-trade-flows-table-grapes-united-kingdom-imports-2026-07.csv');

const eur = makeAnalysis('EUR');
const eurCsv = tradeAnalysisToCsv(eur);
assert(eurCsv.includes('Currency,EUR'));
assert(eurCsv.includes('Trade value EUR'));
assert(eurCsv.includes('Trade unit value EUR/kg'));
assert(eurCsv.includes('Source name,Eurostat Comext — International trade in goods'));
assert.equal(tradeAnalysisFilename(eur), 'xagria-trade-flows-table-grapes-germany-imports-2026-07.csv');

const missing = makeAnalysis('GBP');
missing.summary.unitValuePerKg = Number.NaN;
missing.suppliers[0].changePct = null;
missing.monthlyTrend[0].unitValuePerKg = Number.POSITIVE_INFINITY;
const missingCsv = tradeAnalysisToCsv(missing);
assert(!missingCsv.includes('NaN'));
assert(!missingCsv.includes('Infinity'));
assert(missingCsv.includes('1,ES,"Spain, mainland",1234,1.234,5678,4.6,100,'));
assert(missingCsv.includes('2026-07,1234,1.234,5678,'));

console.log('PASS: Trade Flows CSV metadata, currencies, sections, escaping, missing values, BOM and filenames');
