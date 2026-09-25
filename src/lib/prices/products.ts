const aliases: Record<string, {id: string; name: string}> = {
  apples: {id: 'apples', name: 'Apples'},
  artichokes: {id: 'artichokes', name: 'Artichokes'},
  asparagus: {id: 'asparagus', name: 'Asparagus'},
  aubergines: {id: 'aubergines', name: 'Aubergines'},
  avocados: {id: 'avocados', name: 'Avocados'},
  capsicum: {id: 'peppers', name: 'Peppers'},
  courgettes: {id: 'courgettes', name: 'Courgettes'},
  cucumbers: {id: 'cucumbers', name: 'Cucumbers'},
  grapefruit: {id: 'grapefruit', name: 'Grapefruit'},
  lemons: {id: 'lemons-limes', name: 'Lemons / limes'},
  limes: {id: 'lemons-limes', name: 'Lemons / limes'},
  lettuce: {id: 'lettuce', name: 'Lettuce'},
  mandarins: {id: 'mandarins', name: 'Mandarins / clementines'},
  melons: {id: 'melons', name: 'Melons'},
  onion: {id: 'onions', name: 'Onions'},
  onions: {id: 'onions', name: 'Onions'},
  oranges: {id: 'oranges', name: 'Oranges'},
  pears: {id: 'pears', name: 'Pears'},
  peppers: {id: 'peppers', name: 'Peppers'},
  potatoes: {id: 'potatoes', name: 'Potatoes'},
  strawberries: {id: 'strawberries', name: 'Strawberries'},
  'table grapes': {id: 'table-grapes', name: 'Table grapes'},
  tomatoes: {id: 'tomatoes', name: 'Tomatoes'},
  watermelons: {id: 'watermelons', name: 'Watermelons'},
};

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
