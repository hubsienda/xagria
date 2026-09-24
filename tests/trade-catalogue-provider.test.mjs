import assert from 'node:assert/strict';
import {TRADE_PRODUCTS} from '../src/lib/trade/products.ts';
import {REPORTER_MARKETS} from '../src/lib/trade/reporters.ts';
import {TRADE_SOURCES} from '../src/lib/trade/sources.ts';

const oldProductNames = [
  'Apples', 'Artichokes', 'Asparagus', 'Avocados', 'Cherries', 'Courgettes', 'Cucumbers', 'Garlic',
  'Grapefruit', 'Kiwifruit', 'Lemons / limes', 'Lettuce', 'Mandarins / clementines',
  'Melons (excluding watermelons)', 'Onions', 'Oranges', 'Peaches / nectarines', 'Pears',
  'Peppers (Capsicum / Pimenta)', 'Potatoes (excluding seed)', 'Strawberries', 'Table grapes', 'Tomatoes', 'Watermelons',
];
for (const name of oldProductNames) assert(TRADE_PRODUCTS.some(product => product.name === name), `Missing legacy product: ${name}`);
for (const name of ['Aubergines', 'Berries', 'Chillies / chilli peppers', 'Citrus fruit', 'Figs', 'Mangoes', 'Passion fruit / pitahaya & related tropical fruit', 'Specialist / exotic fresh herbs']) {
  assert(TRADE_PRODUCTS.some(product => product.name === name), `Missing supported new product: ${name}`);
}
assert(TRADE_PRODUCTS.some(product => product.id === 'melons'));
assert(TRADE_PRODUCTS.some(product => product.id === 'watermelons'));
assert(TRADE_PRODUCTS.some(product => product.id === 'table-grapes'));

const names = TRADE_PRODUCTS.map(product => product.name);
assert.deepEqual(names, names.slice().sort((a, b) => a.localeCompare(b, 'en-GB')));
assert.equal(new Set(TRADE_PRODUCTS.map(product => product.id)).size, TRADE_PRODUCTS.length);
assert.equal(new Set(names).size, TRADE_PRODUCTS.length);
for (const product of TRADE_PRODUCTS) {
  for (const mapping of Object.values(product.mappings)) {
    if (!mapping) continue;
    assert.equal(new Set(mapping.codes).size, mapping.codes.length, `Duplicate code in ${product.id}`);
  }
}

assert.equal(REPORTER_MARKETS.find(market => market.name === 'Germany')?.provider, 'eurostat');
assert.equal(REPORTER_MARKETS.find(market => market.name === 'Spain')?.provider, 'eurostat');
assert.equal(REPORTER_MARKETS.find(market => market.name === 'United Kingdom')?.provider, 'hmrc');
const marketNames = REPORTER_MARKETS.map(market => market.name);
assert.deepEqual(marketNames, marketNames.slice().sort((a, b) => a.localeCompare(b, 'en-GB')));

assert.equal(TRADE_SOURCES.eurostat.currencyCode, 'EUR');
assert.equal(TRADE_SOURCES.eurostat.currencySymbol, '€');
assert.equal(TRADE_SOURCES.hmrc.currencyCode, 'GBP');
assert.equal(TRADE_SOURCES.hmrc.currencySymbol, '£');
console.log('PASS: product catalogue, provider routing and source currencies');
