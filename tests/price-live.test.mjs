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
  return {sourceProduct: chosenVariety.sourceProduct, variety: chosenVariety.value, stage};
}

async function runLive(marketCode, choice, label) {
  const analysis = await analysePriceSignals({marketCode, ...choice, periodMonths: 24});
  assert(Number.isFinite(analysis.latest.rawPrice));
  assert(analysis.latest.rawUnit);
  assert(analysis.trend.length > 0);
  assert(analysis.signals.length > 0);
  const csv = priceAnalysisToCsv(analysis);
  assert(csv.includes('"XAGRIA PRICE SIGNALS"'));
  assert(csv.includes('"Source product"'));
  assert(!csv.includes('NaN'));
  assert(!csv.includes('Infinity'));
  console.log(`LIVE ${label}: ${analysis.productName} | ${analysis.market.name} | ${analysis.variety} | ${analysis.stage} | ${analysis.latest.startDate} | ${analysis.latest.rawPrice} ${analysis.latest.rawUnit}`);
  return analysis;
}

const spain = getPriceMarket('ES');
assert(spain && spain.provider === 'eu');
const spainOptions = await getPriceOptionsForMarket('ES');
assert(spainOptions.products.length > 1, 'Spain must expose current Commission price products');
const spainIds = new Set(spainOptions.products.map(product => product.id));
for (const id of ['potatoes', 'tomatoes', 'table-grapes', 'aubergines', 'lettuce', 'watermelons']) assert(spainIds.has(id), `Spain current Commission availability should expose canonical ${id}`);
console.log(`LIVE Spain Artichokes: ${spainIds.has('artichokes') ? 'available' : 'not present in current Commission availability'}`);

const tomatoes = spainOptions.products.find(product => product.id === 'tomatoes');
assert(tomatoes, 'Spain must currently expose Tomatoes');
const multiStageTomato = tomatoes.varieties.find(option => option.stages.length >= 2);
assert(multiStageTomato, 'Spain Tomatoes must expose at least one current multi-stage variety');
assert(multiStageTomato.stages.includes('Farmgate'));
assert(multiStageTomato.stages.includes('Ex-packaging'));
assert(multiStageTomato.stages.includes('Retail'));
for (const stage of multiStageTomato.stages) {
  const analysis = await runLive('ES', {sourceProduct: multiStageTomato.sourceProduct, variety: multiStageTomato.value, stage}, `Spain Tomatoes ${stage}`);
  assert.equal(analysis.stage, stage, 'Deliberately selected stage must persist through analysis');
  assert.equal(analysis.provider, 'eu');
}

const grapes = spainOptions.products.find(product => product.id === 'table-grapes');
assert(grapes);
const grapeAnalysis = await runLive('ES', selection(grapes), 'Spain Table grapes');
assert.equal(grapeAnalysis.productName, 'Table grapes');

const potatoes = spainOptions.products.find(product => product.id === 'potatoes');
assert(potatoes);
const potatoAnalysis = await runLive('ES', selection(potatoes), 'Spain Potatoes');
assert.equal(potatoAnalysis.productName, 'Potatoes');
assert(potatoAnalysis.sourceProduct.toLowerCase().startsWith('ware potatoes'));

const italy = getPriceMarket('IT');
assert(italy && italy.provider === 'eu');
const italyOptions = await getPriceOptionsForMarket('IT');
assert(italyOptions.products.length > 0, 'Italy must expose at least one current price product');
const italyTomatoes = italyOptions.products.find(product => product.id === 'tomatoes') ?? italyOptions.products[0];
const italyAnalysis = await runLive('IT', selection(italyTomatoes), 'Italy');
assert.equal(italyAnalysis.provider, 'eu');
assert.equal(italyAnalysis.market.code, 'IT');

const uk = getPriceMarket('UK');
assert(uk && uk.provider === 'defra');
const ukOptions = await getDefraPriceOptions(uk);
const apples = ukOptions.products.find(product => product.id === 'apples') ?? ukOptions.products[0];
assert(apples, 'DEFRA must expose at least one current product');
const gala = apples.varieties.find(option => option.label.toLowerCase() === 'gala') ?? apples.varieties[0];
assert(gala && gala.stages.includes('Wholesale'));
const ukAnalysis = await runLive('UK', {sourceProduct: gala.sourceProduct, variety: gala.value, stage: 'Wholesale'}, 'UK');
assert.equal(ukAnalysis.provider, 'defra');
assert.equal(ukAnalysis.latest.rawCurrency, 'GBP');
assert.equal(ukAnalysis.stage, 'Wholesale');
assert.equal(ukAnalysis.scopeNote, DEFRA_SCOPE_NOTE);

console.log('PASS: live Spain canonical coverage and explicit multi-stage selection, Italy Commission analysis, and UK DEFRA regression');
