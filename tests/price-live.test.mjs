import assert from 'node:assert/strict';
import {getDefraPriceObservations, getDefraPriceOptions, DEFRA_SCOPE_NOTE} from '../src/lib/prices/defra.ts';
import {getEuPriceObservations, getEuPriceOptions} from '../src/lib/prices/eu.ts';
import {getPriceMarket} from '../src/lib/prices/markets.ts';

const latest = rows => rows.slice().sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1);

const spain = getPriceMarket('ES');
assert(spain && spain.provider === 'eu');
const euOptions = await getEuPriceOptions(spain);
const tomatoes = euOptions.products.find(product => product.id === 'tomatoes');
assert(tomatoes, 'Spain must currently expose Tomatoes in the Commission price source');
const farmgate = tomatoes.varieties.find(option => option.stages.includes('Farmgate'));
assert(farmgate, 'Spain Tomatoes must currently expose at least one Farmgate variety');
const euRows = await getEuPriceObservations({market: spain, sourceProduct: tomatoes.sourceProduct, variety: farmgate.value, stage: 'Farmgate'});
const euLatest = latest(euRows);
assert(euLatest && Number.isFinite(euLatest.rawPrice));
assert.equal(euLatest.rawCurrency, 'EUR');
assert(euLatest.rawUnit);
assert.equal(euLatest.stage, 'Farmgate');
assert.equal(euLatest.marketCode, 'ES');
console.log(`LIVE EU: ${euLatest.productName} | Spain | ${euLatest.variety} | Farmgate | ${euLatest.startDate} | ${euLatest.rawPrice} ${euLatest.rawUnit}`);

const uk = getPriceMarket('UK');
assert(uk && uk.provider === 'defra');
const ukOptions = await getDefraPriceOptions(uk);
const apples = ukOptions.products.find(product => product.id === 'apples');
assert(apples, 'DEFRA must currently expose apples');
const gala = apples.varieties.find(option => option.label.toLowerCase() === 'gala') ?? apples.varieties[0];
assert(gala && gala.stages.includes('Wholesale'));
const ukRows = await getDefraPriceObservations({market: uk, sourceProduct: apples.sourceProduct, variety: gala.value, stage: 'Wholesale'});
const ukLatest = latest(ukRows);
assert(ukLatest && Number.isFinite(ukLatest.rawPrice));
assert.equal(ukLatest.rawCurrency, 'GBP');
assert(ukLatest.rawUnit);
assert.equal(ukLatest.stage, 'Wholesale');
assert.equal(ukLatest.marketCode, 'UK');
assert.equal(DEFRA_SCOPE_NOTE, 'Selected home-grown horticultural produce in England and Wales.');
console.log(`LIVE UK: ${ukLatest.productName} | United Kingdom | ${ukLatest.variety} | Wholesale | ${ukLatest.startDate} | ${ukLatest.rawPrice} ${ukLatest.rawUnit}`);

console.log('PASS: live European Commission and DEFRA Price Signals providers');
