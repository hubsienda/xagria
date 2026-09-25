export interface NormalisedPrice {
  price: number;
  unit: string;
}

function unitKey(unit: string) {
  return unit.toLowerCase().replace(/\s+/g, '').replace(/kilograms?/g, 'kg').replace(/kgs?/g, 'kg');
}

export function normaliseMassPrice(rawPrice: number, currency: string, rawUnit: string): NormalisedPrice | null {
  if (!Number.isFinite(rawPrice) || !rawUnit || !currency) return null;
  const key = unitKey(rawUnit);
  if (key === 'kg' || key.includes('/kg')) return {price: rawPrice, unit: `${currency}/kg`};
  if (key.includes('/100kg') || key === '100kg') return {price: rawPrice / 100, unit: `${currency}/kg`};
  if (key.includes('/tonne') || key.includes('/ton') || key === 'tonne' || key === 'ton') return {price: rawPrice / 1000, unit: `${currency}/kg`};
  return null;
}

export function inferCurrency(priceText: string, unit: string, fallback: string) {
  const combined = `${priceText} ${unit}`;
  if (combined.includes('€') || /\bEUR\b/i.test(combined)) return 'EUR';
  if (combined.includes('£') || /\bGBP\b/i.test(combined)) return 'GBP';
  return fallback;
}

export function parseReportedPrice(value: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = value.trim().replace(/[^0-9,.-]/g, '');
  if (!text) return null;
  if (text.includes(',') && !text.includes('.')) text = text.replace(',', '.');
  else text = text.replace(/,/g, '');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}
