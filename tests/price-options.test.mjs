import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildEuPriceOptions, sourceProductForVariety} from '../src/lib/prices/eu-options.ts';
import {priceProductIdentity, WARE_POTATOES_SOURCE} from '../src/lib/prices/products.ts';

const fixture = JSON.parse(await readFile(new URL('./fixtures/eu-price-metadata-2026-09-25.json', import.meta.url), 'utf8'));
const market = {code: 'ES', name: 'Spain', provider: 'eu'};
const options = buildEuPriceOptions({market, sourceName: 'EU fixture', products: fixture.products, varieties: fixture.varieties, productStages: fixture.productStages, rows: fixture.spainRows});

const mapped = new Map([
  ['Egg Plants', ['aubergines', 'Aubergines']],
  [WARE_POTATOES_SOURCE, ['potatoes', 'Potatoes']],
  ['Tomatoes', ['tomatoes', 'Tomatoes']],
  ['Table Grapes', ['table-grapes', 'Table grapes']],
  ['Lettuces', ['lettuce', 'Lettuce']],
  ['Water Melons', ['watermelons', 'Watermelons']],
  ['Kiwis Hayward', ['kiwifruit', 'Kiwifruit']],
]);
for (const [source, [id, name]] of mapped) assert.deepEqual(priceProductIdentity(source), {id, name}, `Canonical mapping failed for ${source}`);

assert(!fixture.products.some(product => /artich/i.test(product)), '25 Sep 2026 Commission product metadata contains no artichoke product');
assert.equal(sourceProductForVariety('Bananas – EU – All types and varieties', fixture.products), 'Bananas', 'Verified en-dash variety must still map through a controlled product boundary');
assert.equal(sourceProductForVariety('Potato-ish unrelated text', fixture.products), null, 'Matching must not become arbitrary substring matching');

for (const id of ['apples', 'asparagus', 'aubergines', 'avocados', 'cherries', 'courgettes', 'cucumbers', 'lemons-limes', 'lettuce', 'mandarins', 'melons', 'onions', 'peaches-nectarines', 'pears', 'peppers', 'potatoes', 'strawberries', 'table-grapes', 'tomatoes', 'watermelons']) {
  assert(options.products.some(product => product.id === id), `Expected mapped Spain fixture product ${id}`);
}

const potatoes = options.products.find(product => product.id === 'potatoes');
assert(potatoes);
assert.equal(potatoes.name, 'Potatoes');
assert.deepEqual(potatoes.sourceProducts, [WARE_POTATOES_SOURCE]);
assert.deepEqual(potatoes.varieties[0].stages, ['Ex-packaging'], 'Retail selling price is a distinct source stage and must not be relabelled Retail');

const tomatoes = options.products.find(product => product.id === 'tomatoes');
assert(tomatoes);
assert.deepEqual(tomatoes.varieties[0].stages, ['Farmgate', 'Ex-packaging', 'Retail']);
const grapes = options.products.find(product => product.id === 'table-grapes');
assert.deepEqual(grapes.varieties[0].stages, ['Ex-packaging']);

const productNames = options.products.map(product => product.name);
assert.deepEqual(productNames, productNames.slice().sort((a, b) => a.localeCompare(b, 'en-GB')), 'Visible products must be alphabetical');
assert.equal(new Set(options.products.map(product => product.id)).size, options.products.length, 'Canonical aliases must not create duplicate visible products');
for (const product of options.products) {
  const labels = product.varieties.map(item => item.label);
  assert.deepEqual(labels, labels.slice().sort((a, b) => a.localeCompare(b, 'en-GB')), `${product.name} varieties must be alphabetical`);
}

const stageFixture = (rawStages) => buildEuPriceOptions({
  market,
  sourceName: 'stage fixture',
  products: ['Tomatoes'],
  varieties: ['Tomatoes - Round'],
  productStages: fixture.productStages,
  rows: rawStages.map(productStage => ({variety: 'Tomatoes - Round', productStage})),
}).products[0].varieties[0].stages;
assert.deepEqual(stageFixture(['Ex-packaging station price']), ['Ex-packaging']);
assert.deepEqual(stageFixture(['Ex-packaging station price', 'Farmgate price']), ['Farmgate', 'Ex-packaging']);
assert.deepEqual(stageFixture(['Retail buying price', 'Ex-packaging station price', 'Farmgate price']), ['Farmgate', 'Ex-packaging', 'Retail']);

const aliasOptions = buildEuPriceOptions({
  market,
  sourceName: 'alias fixture',
  products: ['Peaches', 'Nectarines', 'Mandarins', 'Clementines'],
  varieties: ['Peaches - Yellow flesh', 'Nectarines - Yellow flesh', 'Mandarins - All types and varieties', 'Clementines - All types and varieties'],
  productStages: ['Ex-packaging station price'],
  rows: [
    {variety: 'Peaches - Yellow flesh', productStage: 'Ex-packaging station price'},
    {variety: 'Nectarines - Yellow flesh', productStage: 'Ex-packaging station price'},
    {variety: 'Mandarins - All types and varieties', productStage: 'Ex-packaging station price'},
    {variety: 'Clementines - All types and varieties', productStage: 'Ex-packaging station price'},
  ],
});
const stone = aliasOptions.products.find(product => product.id === 'peaches-nectarines');
assert(stone);
assert.deepEqual(stone.sourceProducts, ['Nectarines', 'Peaches']);
assert(stone.varieties.some(item => item.sourceProduct === 'Peaches'));
assert(stone.varieties.some(item => item.sourceProduct === 'Nectarines'));
assert(stone.varieties.every(item => item.label.includes('—')), 'Grouped source categories must remain distinguishable through variety labels');
const mandarins = aliasOptions.products.find(product => product.id === 'mandarins');
assert.equal(mandarins.sourceProducts.length, 2);
assert.equal(aliasOptions.products.filter(product => product.id === 'mandarins').length, 1);

console.log('PASS: verified Commission product identities, metadata relationship matching, canonical grouping, alphabetical options and 1/2/3-stage modelling');
