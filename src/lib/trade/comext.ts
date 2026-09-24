import 'server-only';
import {COMEXT_BASE_URL, COMEXT_DATASET, COMEXT_REVALIDATE_SECONDS, COMEXT_TIMEOUT_MS} from './config';
import {TradeDataError} from './errors';
import type {TradeDirection, TradeRecord} from './types';

interface JsonStatDimension { category?: {index?: Record<string, number> | string[]; label?: Record<string, string>}; }
interface JsonStatResponse { id?: string[]; size?: number[]; value?: number[] | Record<string, number>; dimension?: Record<string, JsonStatDimension>; error?: {status?: string | number; label?: string}; warning?: {status?: string | number; label?: string}; }
type ValidJsonStatResponse = JsonStatResponse & {id: string[]; size: number[]; dimension: Record<string, JsonStatDimension>};

const flowCode = (direction: TradeDirection) => direction === 'imports' ? '1' : '2';
function addFilters(params: URLSearchParams, name: string, values: string[]) { for (const value of values) params.append(name, value); }
function categoryCodes(dimension?: JsonStatDimension) {
  const index = dimension?.category?.index;
  if (Array.isArray(index)) return index;
  if (!index) return [];
  return Object.entries(index).sort((a, b) => a[1] - b[1]).map(([code]) => code);
}
function valueEntries(value: JsonStatResponse['value']) {
  if (Array.isArray(value)) return value.map((cell, index) => [index, cell] as const).filter(([, cell]) => cell != null);
  if (value && typeof value === 'object') return Object.entries(value).map(([index, cell]) => [Number(index), cell] as const);
  return [];
}
function decodeIndex(flatIndex: number, sizes: number[]) {
  const positions = new Array(sizes.length).fill(0);
  let remaining = flatIndex;
  for (let dimension = sizes.length - 1; dimension >= 0; dimension--) { positions[dimension] = remaining % sizes[dimension]; remaining = Math.floor(remaining / sizes[dimension]); }
  return positions;
}

async function fetchJsonStat(params: URLSearchParams): Promise<ValidJsonStatResponse> {
  const url = `${COMEXT_BASE_URL}/${COMEXT_DATASET}?${params.toString()}`;
  let response: Response;
  try {
    response = await fetch(url, {headers: {accept: 'application/json'}, next: {revalidate: COMEXT_REVALIDATE_SECONDS}, signal: AbortSignal.timeout(COMEXT_TIMEOUT_MS)});
  } catch (error) {
    throw new TradeDataError('Eurostat data are temporarily unavailable. Try again shortly.', error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) {
    if (response.status === 404 || response.status === 400) throw new TradeDataError('No trade data were returned for this product, market and period.');
    throw new TradeDataError('Eurostat data are temporarily unavailable. Try again shortly.', `Comext HTTP ${response.status}`);
  }
  const data = await response.json() as JsonStatResponse;
  if (data.error) throw new TradeDataError('No trade data were returned for this product, market and period.', data.error.label);
  if (data.warning) throw new TradeDataError('Eurostat data are temporarily unavailable. Try again shortly.', data.warning.label);
  if (!data.id || !data.size || !data.dimension) throw new TradeDataError('Eurostat returned an unexpected response. Try again shortly.');
  return data as ValidJsonStatResponse;
}

export async function fetchLatestAvailableMonth(reporter: string, productCodes: string[], direction: TradeDirection) {
  const params = new URLSearchParams({format: 'JSON', lang: 'EN', freq: 'M', reporter, flow: flowCode(direction), partner: 'WORLD', indicators: 'VALUE_IN_EUROS', lastTimePeriod: '18'});
  addFilters(params, 'product', productCodes);
  const data = await fetchJsonStat(params);
  const times = categoryCodes(data.dimension?.time ?? data.dimension?.time_period);
  const entries = valueEntries(data.value);
  if (!entries.length || !times.length) throw new TradeDataError('No trade data were returned for this product and market.');
  const timeDimensionIndex = data.id.findIndex(id => id === 'time' || id === 'time_period');
  if (timeDimensionIndex < 0) throw new TradeDataError('Eurostat returned an unexpected response. Try again shortly.');
  let latest = '';
  for (const [flatIndex] of entries) {
    const position = decodeIndex(flatIndex, data.size)[timeDimensionIndex];
    const time = times[position];
    if (time && time > latest) latest = time;
  }
  if (!latest) throw new TradeDataError('No trade data were returned for this product and market.');
  return latest;
}

export async function fetchTradeRecords(reporter: string, productCodes: string[], direction: TradeDirection, sinceTimePeriod: string, untilTimePeriod: string): Promise<TradeRecord[]> {
  const params = new URLSearchParams({format: 'JSON', lang: 'EN', freq: 'M', reporter, flow: flowCode(direction), sinceTimePeriod, untilTimePeriod});
  addFilters(params, 'product', productCodes);
  addFilters(params, 'indicators', ['VALUE_IN_EUROS', 'QUANTITY_IN_100KG']);
  const data = await fetchJsonStat(params);
  const dimensions = data.id;
  const positionsByDimension = new Map(dimensions.map(id => [id, categoryCodes(data.dimension?.[id])]));
  const labelsByDimension = new Map(dimensions.map(id => [id, data.dimension?.[id]?.category?.label ?? {}]));
  const partnerDim = dimensions.indexOf('partner');
  const productDim = dimensions.indexOf('product');
  const indicatorDim = dimensions.indexOf('indicators');
  const timeDim = dimensions.findIndex(id => id === 'time' || id === 'time_period');
  if ([partnerDim, productDim, indicatorDim, timeDim].some(index => index < 0)) throw new TradeDataError('Eurostat returned an unexpected response. Try again shortly.');

  type Acc = {partnerCode: string; partnerName: string; time: string; tradeValue: number; quantityKg: number; hasValue: boolean; hasQuantity: boolean};
  const rows = new Map<string, Acc>();
  for (const [flatIndex, rawValue] of valueEntries(data.value)) {
    if (!Number.isFinite(rawValue)) continue;
    const coordinates = decodeIndex(flatIndex, data.size);
    const partnerCode = positionsByDimension.get('partner')?.[coordinates[partnerDim]];
    const productCode = positionsByDimension.get('product')?.[coordinates[productDim]];
    const timeId = dimensions[timeDim];
    const time = positionsByDimension.get(timeId)?.[coordinates[timeDim]];
    const indicator = positionsByDimension.get('indicators')?.[coordinates[indicatorDim]];
    if (!partnerCode || !productCode || !time || !indicator) continue;
    const label = labelsByDimension.get('partner')?.[partnerCode] ?? partnerCode;
    const key = `${partnerCode}|${time}|${productCode}`;
    const row = rows.get(key) ?? {partnerCode, partnerName: label, time, tradeValue: 0, quantityKg: 0, hasValue: false, hasQuantity: false};
    if (indicator === 'VALUE_IN_EUROS') { row.tradeValue += rawValue; row.hasValue = true; }
    else if (indicator === 'QUANTITY_IN_100KG') { row.quantityKg += rawValue * 100; row.hasQuantity = true; }
    rows.set(key, row);
  }
  return Array.from(rows.values()).map(row => ({partnerCode: row.partnerCode, partnerName: row.partnerName, time: row.time, tradeValue: row.hasValue ? row.tradeValue : null, quantityKg: row.hasQuantity ? row.quantityKg : null}));
}
