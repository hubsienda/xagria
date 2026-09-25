import assert from 'node:assert/strict';
import {analyseTradeFlows} from '../src/lib/trade/analysis.ts';
import {tradeAnalysisToCsv} from '../src/lib/trade/csv.ts';

async function run(reporterCode, label, expectedCurrency) {
  const analysis = await analyseTradeFlows({productId: 'table-grapes', reporterCode, direction: 'imports', periodMonths: 12});
  assert.equal(analysis.product.id, 'table-grapes');
  assert.equal(analysis.direction, 'imports');
  assert.equal(analysis.periodMonths, 12);
  assert.equal(analysis.currencyCode, expectedCurrency);
  assert(analysis.monthlyTrend.length > 0);
  assert(analysis.summary.tradeValue > 0);
  const csv = tradeAnalysisToCsv(analysis);
  assert(csv.includes('XAGRIA'));
  assert(csv.includes('Table grapes'));
  assert(!csv.includes('NaN'));
  assert(!csv.includes('Infinity'));
  console.log(`LIVE ${label}: ${analysis.product.name} | ${analysis.reporter.name} | ${analysis.latestMonth} | ${analysis.currencyCode} | ${analysis.summary.tradeValue}`);
  return analysis;
}

const eu = await run('DE', 'EU Trade Flows', 'EUR');
assert.equal(eu.provider, 'eurostat');
const uk = await run('UK', 'UK Trade Flows', 'GBP');
assert.equal(uk.provider, 'hmrc');

console.log('PASS: live Table grapes → Germany/United Kingdom → Imports → 12 months with currency and CSV regression');
