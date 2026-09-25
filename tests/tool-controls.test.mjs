import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {priceSignalResetSelection, tradeFlowResetSelection} from '../src/lib/desk/tool-defaults.ts';
import {blankPriceSignalSelection, blankTradeFlowSelection, clearPriceSignalSelection, clearTradeFlowSelection, priceSelectionAfterMarketChange, priceSelectionAfterProductChange, priceSelectionAfterVarietyChange} from '../src/lib/desk/selection-transitions.ts';

const blankPrice = {marketCode: '', productId: '', variety: '', stage: '', periodMonths: ''};
const blankTrade = {productId: '', reporterCode: '', direction: '', periodMonths: ''};
assert.deepEqual(priceSignalResetSelection(), blankPrice);
assert.deepEqual(tradeFlowResetSelection(), blankTrade);
assert.deepEqual(blankPriceSignalSelection(), blankPrice);
assert.deepEqual(blankTradeFlowSelection(), blankTrade);

const clearCases = [
  {},
  {marketCode: 'ES'},
  {marketCode: 'ES', productId: 'tomatoes'},
  {marketCode: 'ES', productId: 'tomatoes', variety: 'Tomatoes - Round'},
  {marketCode: 'ES', productId: 'tomatoes', variety: 'Tomatoes - Round', stage: 'Farmgate'},
  {marketCode: 'ES', productId: 'tomatoes', variety: 'Tomatoes - Round', stage: 'Retail', periodMonths: 24},
];
for (const state of clearCases) assert.deepEqual(clearPriceSignalSelection(state), blankPrice, `Price TRUE CLEAR failed from ${JSON.stringify(state)}`);
assert.deepEqual(clearTradeFlowSelection({productId: 'table-grapes', reporterCode: 'DE', direction: 'imports', periodMonths: 12}), blankTrade);

const complete = {marketCode: 'ES', productId: 'tomatoes', variety: 'Tomatoes - Round', stage: 'Retail', periodMonths: 24};
assert.deepEqual(priceSelectionAfterMarketChange(complete, 'IT'), {marketCode: 'IT', productId: '', variety: '', stage: '', periodMonths: 24});
assert.deepEqual(priceSelectionAfterProductChange(complete, 'apples'), {marketCode: 'ES', productId: 'apples', variety: '', stage: '', periodMonths: 24});
assert.deepEqual(priceSelectionAfterVarietyChange(complete, 'Tomatoes - Cherry/Special'), {marketCode: 'ES', productId: 'tomatoes', variety: 'Tomatoes - Cherry/Special', stage: '', periodMonths: 24});

const priceClient = await readFile(new URL('../src/app/desk/(private)/price-signals/PriceSignalsClient.tsx', import.meta.url), 'utf8');
for (const placeholder of ['Select market…', 'Select product…', 'Select variety…', 'Select price stage…', 'Select period…']) assert(priceClient.includes(placeholder));
assert(priceClient.includes('optionsRequestId.current += 1'));
assert(priceClient.includes('analysisRequestId.current += 1'));
assert(priceClient.includes("setMarketCode('')"));
assert(priceClient.includes("setProductId('')"));
assert(priceClient.includes("setVariety('')"));
assert(priceClient.includes("setStage('')"));
assert(priceClient.includes("setPeriodMonths('')"));
assert(priceClient.includes("setOptionsError('')"));
assert(priceClient.includes("setOptionsLoading(false)"));
assert(priceClient.includes('selectedVariety.sourceProduct'));
assert(priceClient.includes('!marketCode || !selectedProduct || !selectedVariety || !stage || !periodMonths'));
assert(!priceClient.includes('firstSelection('), 'Automatic first-product/variety/stage selection must be removed');
assert(!priceClient.includes('<select'), 'Price Signals must use DeskSelect instead of browser-native selects');

const tradeClient = await readFile(new URL('../src/app/desk/(private)/trade-flows/TradeFlowsClient.tsx', import.meta.url), 'utf8');
for (const placeholder of ['Select product…', 'Select reporting market…', 'Select direction…', 'Select period…']) assert(tradeClient.includes(placeholder));
assert(tradeClient.includes('requestId.current += 1'));
assert(tradeClient.includes("setProductId('')"));
assert(tradeClient.includes("setReporterCode('')"));
assert(tradeClient.includes("setDirection('')"));
assert(tradeClient.includes("setPeriodMonths('')"));
assert(tradeClient.includes('!productId || !reporterCode || !direction || !periodMonths'));
assert(!tradeClient.includes('<select'), 'Trade Flows must use DeskSelect instead of browser-native selects');

for (const path of [
  '../src/app/desk/(private)/price-signals/page.tsx',
  '../src/app/desk/(private)/trade-flows/page.tsx',
]) {
  const page = await readFile(new URL(path, import.meta.url), 'utf8');
  assert(page.includes('← BACK TO DESK'));
  assert(page.includes('href="/desk"'));
  assert(page.includes('LOG OUT'));
}

console.log('PASS: TRUE CLEAR from blank/partial/complete states, cascading resets, request invalidation, blank DeskSelect placeholders and BACK TO DESK controls');
