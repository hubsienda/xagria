import assert from 'node:assert/strict';
import {analysePriceSignals} from '../src/lib/prices/analysis.ts';
import {priceAnalysisToCsv} from '../src/lib/prices/csv.ts';
import {getDefraPriceOptions, DEFRA_SCOPE_NOTE} from '../src/lib/prices/defra.ts';
import {getPriceOptionsForMarket} from '../src/lib/prices/providers.ts';
import {getPriceMarket} from '../src/lib/prices/markets.ts';

function selection(product, variety) {
  const chosenVariety = variety ?? product?.varieties[0];
  const stage = chosenVariety?.stages[0];
  assert(product && chosenVariety && stage, 'Live price selection must expose product, variety and stage');
  return {sourceProduct: product.sourceProduct, variety: chosenVariety.value, stage};
}

async function runLive(marketCode, choice, label) {
  const analysis = await analysePriceSignals({marketCode, ...choice, periodMonths: 24});
  assert(Number.isFinite(analysis.latest.rawPrice));
  assert(analysis.latest.rawUnit);
  assert(analysis.trend.length > 0);
  assert(analysis.signals.length > 0);
  const csv = priceAnalysisToCsv(analysis);
  assert(csv.includes('"XAGRIA PRICE SIGNALS"'));
  assert(!csv.includes('NaN'));
  assert(!csv.includes('Infinity'));
  console.log(`LIVE ${label}: ${analysis.productName} | ${analysis.market.name} | ${analysis.variety} | ${analysis.stage} | ${analysis.latest.startDate} | ${analysis.latest.rawPrice} ${analysis.latest.rawUnit}`);
  return analysis;
}

const spain = getPriceMarket('ES');
assert(spain && spain.provider === 'eu');
const spainOptions = await getPriceOptionsForMarket('ES');
assert(spainOptions.products.length > 1, 'Spain must expose at least two current price products');

const tomatoes = spainOptions.products.find(product => product.id === 'tomatoes') ?? spainOptions.products[0];
const tomatoFarmgate = tomatoes.varieties.find(option => option.stages.includes('Farmgate'));
const firstSpain = tomatoFarmgate
  ? {sourceProduct: tomatoes.sourceProduct, variety: tomatoFarmgate.value, stage: 'Farmgate'}
  : selection(tomatoes);
const first = await runLive('ES', firstSpain, 'EU 1');
assert.equal(first.provider, 'eu');
assert.equal(first.market.code, 'ES');

const secondProduct = spainOptions.products.find(product => product.sourceProduct !== tomatoes.sourceProduct);
const second = await runLive('ES', selection(secondProduct), 'EU 2');
assert.equal(second.provider, 'eu');
assert.equal(second.market.code, 'ES');

const italy = getPriceMarket('IT');
assert(italy && italy.provider === 'eu');
const italyOptions = await getPriceOptionsForMarket('IT');
assert(italyOptions.products.length > 0, 'Italy must expose at least one current price product');
const third = await runLive('IT', selection(italyOptions.products[0]), 'EU 3');
assert.equal(third.provider, 'eu');
assert.equal(third.market.code, 'IT');

const fourth = await runLive('ES', firstSpain, 'EU 4');
assert.equal(fourth.provider, 'eu');
assert.equal(fourth.market.code, 'ES');

const uk = getPriceMarket('UK');
assert(uk && uk.provider === 'defra');
const ukOptions = await getDefraPriceOptions(uk);
const apples = ukOptions.products.find(product => product.id === 'apples') ?? ukOptions.products[0];
assert(apples, 'DEFRA must expose at least one current product');
const gala = apples.varieties.find(option => option.label.toLowerCase() === 'gala') ?? apples.varieties[0];
const ukAnalysis = await runLive('UK', {sourceProduct: apples.sourceProduct, variety: gala.value, stage: 'Wholesale'}, 'UK');
assert.equal(ukAnalysis.provider, 'defra');
assert.equal(ukAnalysis.latest.rawCurrency, 'GBP');
assert.equal(ukAnalysis.stage, 'Wholesale');
assert.equal(ukAnalysis.scopeNote, DEFRA_SCOPE_NOTE);

console.log('PASS: repeated live Spain/Italy Commission analyses and DEFRA regression');
