import type {PriceMarket} from './types';

const euMarkets: Array<[string, string]> = [
  ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'], ['CY', 'Cyprus'],
  ['CZ', 'Czechia'], ['DK', 'Denmark'], ['EE', 'Estonia'], ['FI', 'Finland'], ['FR', 'France'],
  ['DE', 'Germany'], ['EL', 'Greece'], ['HU', 'Hungary'], ['IE', 'Ireland'], ['IT', 'Italy'],
  ['LV', 'Latvia'], ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MT', 'Malta'], ['NL', 'Netherlands'],
  ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'], ['SI', 'Slovenia'],
  ['ES', 'Spain'], ['SE', 'Sweden'],
];

export const PRICE_MARKETS: PriceMarket[] = [
  ...euMarkets.map(([code, name]) => ({code, name, provider: 'eu' as const})),
  {code: 'UK', name: 'United Kingdom', provider: 'defra' as const},
].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));

export function getPriceMarket(code: string) {
  return PRICE_MARKETS.find(market => market.code === code) ?? null;
}
