import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {priceSignalResetSelection, tradeFlowResetSelection} from '../src/lib/desk/tool-defaults.ts';

assert.deepEqual(priceSignalResetSelection(), {
  marketCode: 'ES', sourceProduct: '', variety: '', stage: '', periodMonths: 24,
});
assert.deepEqual(tradeFlowResetSelection(), {
  productId: 'lemons-limes', reporterCode: 'DE', direction: 'imports', periodMonths: 36,
});

const priceClient = await readFile(new URL('../src/app/desk/(private)/price-signals/PriceSignalsClient.tsx', import.meta.url), 'utf8');
assert(priceClient.includes('>CLEAR</button>'));
assert(priceClient.includes("setPeriodMonths(defaults.periodMonths)"));
assert(priceClient.includes('analysisRequestId.current += 1'));
assert(priceClient.includes("if (marketCode === defaults.marketCode) setOptionsReloadKey"));
assert(!priceClient.includes("setAnalysis(null); setAnalysisError(error"), 'transient repeat failure should not erase a valid same-selection result');

const tradeClient = await readFile(new URL('../src/app/desk/(private)/trade-flows/TradeFlowsClient.tsx', import.meta.url), 'utf8');
assert(tradeClient.includes('>CLEAR</button>'));
assert(tradeClient.includes('requestId.current += 1'));
assert(tradeClient.includes('setProductId(defaults.productId)'));
assert(tradeClient.includes('setReporterCode(defaults.reporterCode)'));
assert(tradeClient.includes('setDirection(defaults.direction)'));
assert(tradeClient.includes('setPeriodMonths(defaults.periodMonths)'));

for (const path of [
  '../src/app/desk/(private)/price-signals/page.tsx',
  '../src/app/desk/(private)/trade-flows/page.tsx',
]) {
  const page = await readFile(new URL(path, import.meta.url), 'utf8');
  assert(page.includes('← BACK TO DESK'));
  assert(page.includes('href="/desk"'));
  assert(page.includes('LOG OUT'));
}

console.log('PASS: Price Signals and Trade Flows reset defaults, CLEAR request invalidation and BACK TO DESK controls');
