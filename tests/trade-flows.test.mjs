import assert from 'node:assert/strict';
import {aggregateRecords, buildBrokerageSignals, buildOriginEvolution, buildRolling12Comparison, buildSuppliers, isCountryPartner, marketShare, percentageChange, tradeUnitValue} from '../src/lib/trade/calculations.ts';
import {REPORTER_MARKETS} from '../src/lib/trade/reporters.ts';

assert.equal(tradeUnitValue(250, 100), 2.5);
assert.equal(tradeUnitValue(250, 0), null);
assert.equal(tradeUnitValue(250, null), null);
assert.equal(aggregateRecords([
  {partnerCode: 'ES', partnerName: 'Spain', time: '2025-01', quantityKg: 100, tradeValue: 200},
  {partnerCode: 'ZA', partnerName: 'South Africa', time: '2025-01', quantityKg: null, tradeValue: 50},
]).unitValuePerKg, null);
assert.equal(percentageChange(120, 100), 20);
assert.equal(percentageChange(80, 100), -20);
assert.equal(percentageChange(100, 0), null);
assert.equal(percentageChange(100, null), null);
assert.equal(marketShare(25, 100), 25);
assert.equal(marketShare(25, 0), null);
assert.equal(isCountryPartner('ES'), true);
assert.equal(isCountryPartner('WORLD'), false);
assert.equal(isCountryPartner('EU'), false);
assert.equal(isCountryPartner('QR'), false);
assert.equal(isCountryPartner('UKTI-1'), false);
assert.equal(REPORTER_MARKETS.find(market => market.name === 'Greece')?.code, 'EL');

const months = Array.from({length: 24}, (_, i) => { const d = new Date(Date.UTC(2024, i, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; });
const records = [];
for (const [i, month] of months.entries()) {
  const latest = i >= 12;
  records.push({partnerCode: 'ES', partnerName: 'Spain', time: month, quantityKg: latest ? 1200 : 1000, tradeValue: latest ? 2400 : 1800});
  records.push({partnerCode: 'ZA', partnerName: 'South Africa', time: month, quantityKg: latest ? 800 : 1000, tradeValue: latest ? 1600 : 1800});
  records.push({partnerCode: 'WORLD', partnerName: 'All countries of the world', time: month, quantityKg: 2000, tradeValue: latest ? 4000 : 3600});
}
const countryRecords = records.filter(r => isCountryPartner(r.partnerCode));
const rolling = buildRolling12Comparison(countryRecords, '2025-12');
assert(rolling);
assert.equal(rolling.quantity.changePct, 0);
assert(Math.abs(rolling.tradeValue.changePct - 11.11111111111111) < 1e-9);
assert.equal(buildRolling12Comparison(countryRecords.filter(r => r.time !== '2024-06'), '2025-12'), null);
const suppliers = buildSuppliers(records, '2025-12', 12);
assert.equal(suppliers.length, 2);
assert.equal(suppliers[0].origin, 'Spain');
assert.equal(suppliers[0].marketSharePct, 60);
assert.equal(suppliers[1].marketSharePct, 40);
assert.equal(aggregateRecords(records.filter(r => isCountryPartner(r.partnerCode) && r.time >= '2025-01')).quantityKg, 24000);
const origins = buildOriginEvolution(records, '2025-12');
const spain = origins.find(row => row.originCode === 'ES');
assert(spain);
assert.equal(spain.currentSharePct, 60);
assert.equal(spain.previousSharePct, 50);
assert.equal(spain.shareChangePp, 10);
const demandUp = {quantity: {current: 120, previous: 100, changePct: 20}, tradeValue: {current: 120, previous: 100, changePct: 20}, unitValue: {current: 1, previous: 1, changePct: 0}};
const signals = buildBrokerageSignals(demandUp, null, origins);
assert(signals.some(signal => signal.title === 'Import volume increasing'));
assert(signals.some(signal => signal.title === 'Origin gaining share'));
const exportSignals = buildBrokerageSignals(demandUp, null, origins, 'exports');
assert(exportSignals.some(signal => signal.title === 'Destination gaining share'));
console.log('PASS: Trade Flows calculations, comparisons, aggregate exclusion and deterministic signals');
