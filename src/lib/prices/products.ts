const WARE_POTATOES_SOURCE = 'Ware potatoes, size that do not pass a square mesh of 35 mm x 35 mm but can pass a square mesh of 75 mm x 75 mm, in packages below 10 kg';

type Identity = {id: string; name: string};

// Exact, deterministic identities. Current Commission spellings were verified against
// the live products reference endpoint on 25 September 2026. Older simple aliases are
// retained where they are harmless for DEFRA/current source naming.
const aliases: Record<string, Identity> = {
  apples: {id: 'apples', name: 'Apples'},
  artichokes: {id: 'artichokes', name: 'Artichokes'},
  asparagus: {id: 'asparagus', name: 'Asparagus'},
  aubergines: {id: 'aubergines', name: 'Aubergines'},
  'egg plants': {id: 'aubergines', name: 'Aubergines'},
  avocados: {id: 'avocados', name: 'Avocados'},
  capsicum: {id: 'peppers', name: 'Peppers'},
  cherries: {id: 'cherries', name: 'Cherries'},
  clementines: {id: 'mandarins', name: 'Mandarins / clementines'},
  courgettes: {id: 'courgettes', name: 'Courgettes'},
  cucumbers: {id: 'cucumbers', name: 'Cucumbers'},
  grapefruit: {id: 'grapefruit', name: 'Grapefruit'},
  'kiwis hayward': {id: 'kiwifruit', name: 'Kiwifruit'},
  lemons: {id: 'lemons-limes', name: 'Lemons / limes'},
  limes: {id: 'lemons-limes', name: 'Lemons / limes'},
  lettuce: {id: 'lettuce', name: 'Lettuce'},
  lettuces: {id: 'lettuce', name: 'Lettuce'},
  mandarins: {id: 'mandarins', name: 'Mandarins / clementines'},
  melons: {id: 'melons', name: 'Melons'},
  nectarines: {id: 'peaches-nectarines', name: 'Peaches / nectarines'},
  onion: {id: 'onions', name: 'Onions'},
  onions: {id: 'onions', name: 'Onions'},
  oranges: {id: 'oranges', name: 'Oranges'},
  peaches: {id: 'peaches-nectarines', name: 'Peaches / nectarines'},
  pears: {id: 'pears', name: 'Pears'},
  peppers: {id: 'peppers', name: 'Peppers'},
  potatoes: {id: 'potatoes', name: 'Potatoes'},
  [WARE_POTATOES_SOURCE.toLowerCase()]: {id: 'potatoes', name: 'Potatoes'},
  strawberries: {id: 'strawberries', name: 'Strawberries'},
  'table grapes': {id: 'table-grapes', name: 'Table grapes'},
  tomatoes: {id: 'tomatoes', name: 'Tomatoes'},
  watermelons: {id: 'watermelons', name: 'Watermelons'},
  'water melons': {id: 'watermelons', name: 'Watermelons'},
};

export {WARE_POTATOES_SOURCE};

export function slugifyPricePart(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

export function priceProductIdentity(sourceProduct: string) {
  const key = sourceProduct.trim().toLowerCase();
  const aliased = aliases[key];
  if (aliased) return aliased;
  const name = sourceProduct.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  return {id: `price-${slugifyPricePart(sourceProduct)}`, name};
}

export function varietyLabel(sourceProduct: string, variety: string) {
  const prefix = `${sourceProduct} - `;
  const value = variety.startsWith(prefix) ? variety.slice(prefix.length) : variety;
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function sourceAwareVarietyLabel(sourceProduct: string, variety: string, qualifySource: boolean) {
  const label = varietyLabel(sourceProduct, variety);
  return qualifySource ? `${sourceProduct} — ${label}` : label;
}
