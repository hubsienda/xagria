import type {ReporterMarket} from './types';

const EU_REPORTERS: Array<[string, string]> = [
  ['AT', 'Austria'], ['BE', 'Belgium'], ['BG', 'Bulgaria'], ['HR', 'Croatia'], ['CY', 'Cyprus'],
  ['CZ', 'Czechia'], ['DK', 'Denmark'], ['EE', 'Estonia'], ['FI', 'Finland'], ['FR', 'France'],
  ['DE', 'Germany'], ['EL', 'Greece'], ['HU', 'Hungary'], ['IE', 'Ireland'], ['IT', 'Italy'],
  ['LV', 'Latvia'], ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MT', 'Malta'], ['NL', 'Netherlands'],
  ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SK', 'Slovakia'], ['SI', 'Slovenia'],
  ['ES', 'Spain'], ['SE', 'Sweden'],
];

export const REPORTER_MARKETS: ReporterMarket[] = [
  ...EU_REPORTERS.map(([code, name]) => ({code, name, provider: 'eurostat' as const})),
  {code: 'GB', name: 'United Kingdom', provider: 'hmrc'},
].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));

export function getReporterMarket(code: string) {
  return REPORTER_MARKETS.find(market => market.code === code) ?? null;
}
