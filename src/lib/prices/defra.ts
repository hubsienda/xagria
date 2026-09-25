import 'server-only';
import {DEFRA_PAGE_URL, DEFRA_SOURCE_NAME, PRICE_REVALIDATE_SECONDS, PRICE_TIMEOUT_MS} from './config';
import {PriceDataError} from './errors';
import {priceProductIdentity, varietyLabel} from './products';
import {normaliseMassPrice, parseReportedPrice} from './units';
import type {PriceMarket, PriceObservation, PriceOptions, PriceProductOption} from './types';

interface DefraRow { category: string; item: string; variety: string; date: string; price: string; unit: string; }

async function fetchText(url: string, message: string) {
  let response: Response;
  try {
    response = await fetch(url, {next: {revalidate: PRICE_REVALIDATE_SECONDS}, signal: AbortSignal.timeout(PRICE_TIMEOUT_MS)});
  } catch (error) {
    throw new PriceDataError(message, error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) throw new PriceDataError(message, `DEFRA HTTP ${response.status}`);
  return response.text();
}

async function currentCsvUrl() {
  const html = await fetchText(DEFRA_PAGE_URL, 'DEFRA wholesale price data are temporarily unavailable. Try again shortly.');
  const decoded = html.replace(/&amp;/g, '&');
  const matches = decoded.match(/https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^"'<>\s]+\/fruitvegprices-[^"'<>\s]+\.csv/gi);
  if (!matches?.length) throw new PriceDataError('DEFRA wholesale price data are temporarily unavailable. Try again shortly.', 'Current machine-readable CSV link not found');
  return matches[0];
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(values => values.some(value => value.trim()));
}

async function defraRows() {
  const url = await currentCsvUrl();
  const text = await fetchText(url, 'DEFRA wholesale price data are temporarily unavailable. Try again shortly.');
  const rows = parseCsv(text);
  const headers = rows.shift()?.map(value => value.trim().toLowerCase()) ?? [];
  const required = ['category', 'item', 'variety', 'date', 'price', 'unit'];
  if (!required.every(name => headers.includes(name))) throw new PriceDataError('DEFRA wholesale price data returned an unexpected structure. Try again shortly.');
  const index = Object.fromEntries(headers.map((name, position) => [name, position]));
  const data: DefraRow[] = rows.map(values => ({
    category: values[index.category] ?? '', item: values[index.item] ?? '', variety: values[index.variety] ?? '', date: values[index.date] ?? '', price: values[index.price] ?? '', unit: values[index.unit] ?? '',
  })).filter(row => row.item && row.variety && /^\d{4}-\d{2}-\d{2}$/.test(row.date));
  return {url, rows: data};
}

export async function getDefraPriceOptions(market: PriceMarket): Promise<PriceOptions> {
  const {rows} = await defraRows();
  type Group = {id: string; name: string; sourceProduct: string; varieties: Map<string, string>};
  const groups = new Map<string, Group>();
  for (const row of rows) {
    const identity = priceProductIdentity(row.item);
    const group = groups.get(row.item) ?? {id: identity.id, name: identity.name, sourceProduct: row.item, varieties: new Map<string, string>()};
    group.varieties.set(row.variety, varietyLabel(row.item, row.variety));
    groups.set(row.item, group);
  }
  const products: PriceProductOption[] = Array.from(groups.values()).map(group => ({
    id: group.id, name: group.name, sourceProduct: group.sourceProduct,
    varieties: Array.from(group.varieties.entries()).map(([value, label]) => ({value, label, stages: ['Wholesale' as const]})).sort((a, b) => a.label.localeCompare(b.label, 'en-GB')),
  })).sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  return {market, sourceName: DEFRA_SOURCE_NAME, products, scopeNote: 'Selected home-grown horticultural produce in England and Wales.'};
}

export async function getDefraPriceObservations(input: {market: PriceMarket; sourceProduct: string; variety: string; stage: 'Wholesale'}) {
  const {rows} = await defraRows();
  const identity = priceProductIdentity(input.sourceProduct);
  const selected = rows.filter(row => row.item === input.sourceProduct && row.variety === input.variety);
  const observations: PriceObservation[] = [];
  for (const row of selected) {
    const rawPrice = parseReportedPrice(row.price);
    if (rawPrice == null || !row.unit) continue;
    const normalised = normaliseMassPrice(rawPrice, 'GBP', row.unit);
    observations.push({
      provider: 'defra', sourceName: DEFRA_SOURCE_NAME, marketCode: input.market.code, marketName: input.market.name,
      productId: identity.id, productName: identity.name, sourceProduct: row.item, variety: varietyLabel(row.item, row.variety), stage: 'Wholesale',
      startDate: row.date, rawPrice, rawCurrency: 'GBP', rawUnit: row.unit, normalisedPrice: normalised?.price ?? null, normalisedUnit: normalised?.unit ?? null,
      periodType: 'Fortnightly', sourceUrl: DEFRA_PAGE_URL,
    });
  }
  return observations;
}

export const DEFRA_SCOPE_NOTE = 'Selected home-grown horticultural produce in England and Wales.';
export const DEFRA_PRICE_METHODOLOGY = [
  'DEFRA reports average wholesale prices for selected home-grown horticultural produce in England and Wales.',
  'The figures are averages of the most usual prices charged by wholesalers at selected wholesale markets and do not represent all UK produce prices.',
  'Product and variety coverage varies. The series is not an imported-produce price index and is not a retail-price series.',
  'The source unit is preserved. Only directly convertible mass units are normalised to a per-kilogram value.',
];
