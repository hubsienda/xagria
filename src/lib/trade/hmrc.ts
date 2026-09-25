import 'server-only';
import {TradeDataError} from './errors';
import type {ProductSourceMapping, TradeDirection, TradeRecord} from './types';

const HMRC_BASE_URL = 'https://api.uktradeinfo.com';
const HMRC_TIMEOUT_MS = 20_000;
const LATEST_REVALIDATE_SECONDS = 6 * 60 * 60;
const HISTORY_REVALIDATE_SECONDS = 24 * 60 * 60;

type ODataResponse<T> = {value?: T[]; '@odata.nextLink'?: string};
type HmrcCountry = {CountryId?: number; CountryName?: string; CountryCodeAlpha?: string};
type HmrcOts = {MonthId?: number; FlowTypeId?: number; CommodityId?: number; CountryId?: number; Value?: number | null; NetMass?: number | null; SuppressionIndex?: number};

function flowIds(direction: TradeDirection) {
  // OTS distinguishes EU and non-EU flows: 1 EU imports, 2 EU exports,
  // 3 non-EU imports, 4 non-EU exports.
  return direction === 'imports' ? [1, 3] : [2, 4];
}

function monthIdToPeriod(monthId: number) {
  const text = String(monthId);
  return `${text.slice(0, 4)}-${text.slice(4, 6)}`;
}

function periodToMonthId(period: string) {
  return Number(period.replace('-', ''));
}

async function commodityIds(mapping: ProductSourceMapping) {
  if (mapping.commodityField !== 'Hs6Code' && mapping.commodityField !== 'Cn8Code') throw new Error('INVALID_HMRC_MAPPING');
  const params = new URLSearchParams({
    '$filter': mapping.codes.map(code => `${mapping.commodityField} eq '${code}'`).join(' or '),
    '$select': 'CommodityId',
    '$top': '1000',
  });
  const data = await fetchHmrc<{CommodityId?: number}>('/Commodity', params);
  const ids = Array.from(new Set(data.value?.map(row => row.CommodityId).filter((id): id is number => typeof id === 'number') ?? []));
  if (!ids.length) throw new TradeDataError('No UK trade data were returned for this product and period.');
  return ids;
}

function idFilter(ids: number[]) {
  return `(${ids.map(id => `CommodityId eq ${id}`).join(' or ')})`;
}

function flowFilter(direction: TradeDirection) {
  return `(${flowIds(direction).map(id => `FlowTypeId eq ${id}`).join(' or ')})`;
}

async function fetchHmrc<T>(pathOrUrl: string, params?: URLSearchParams, revalidate = HISTORY_REVALIDATE_SECONDS): Promise<ODataResponse<T>> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${HMRC_BASE_URL}${pathOrUrl}${params ? `?${params.toString()}` : ''}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {accept: 'application/json'},
      next: {revalidate},
      signal: AbortSignal.timeout(HMRC_TIMEOUT_MS),
    });
  } catch (error) {
    throw new TradeDataError('UK Trade Info data are temporarily unavailable. Try again shortly.', error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 404) throw new TradeDataError('No UK trade data were returned for this product and period.', `UK Trade Info HTTP ${response.status}`);
    throw new TradeDataError('UK Trade Info data are temporarily unavailable. Try again shortly.', `UK Trade Info HTTP ${response.status}`);
  }
  const data = await response.json() as ODataResponse<T>;
  if (!Array.isArray(data.value)) throw new TradeDataError('UK Trade Info returned an unexpected response. Try again shortly.');
  return data;
}

async function fetchCountries() {
  const params = new URLSearchParams({
    '$select': 'CountryId,CountryName,CountryCodeAlpha',
    '$top': '1000',
  });
  const data = await fetchHmrc<HmrcCountry>('/Country', params, HISTORY_REVALIDATE_SECONDS);
  return new Map((data.value ?? []).filter(country => country.CountryId != null).map(country => [country.CountryId as number, country]));
}

export async function fetchHmrcLatestAvailableMonth(mapping: ProductSourceMapping, direction: TradeDirection) {
  const ids = await commodityIds(mapping);
  // HMRC rejects an unbounded OTS orderby (HTTP 403). Date is small; probe
  // recent published months from newest to oldest for this commodity and flow.
  const currentYear = new Date().getUTCFullYear();
  const dates = await fetchHmrc<{MonthId?: number}>('/Date', new URLSearchParams({
    '$filter': `MonthId ge ${(currentYear - 2) * 100 + 1}`,
    '$select': 'MonthId',
    '$top': '36',
  }), LATEST_REVALIDATE_SECONDS);
  const months = Array.from(new Set(dates.value?.map(row => row.MonthId).filter((month): month is number => typeof month === 'number') ?? [])).sort((a, b) => b - a);
  for (const month of months.slice(0, 18)) {
    const params = new URLSearchParams({
      '$filter': `MonthId eq ${month} and ${flowFilter(direction)} and ${idFilter(ids)}`,
      '$select': 'MonthId',
      '$top': '1',
    });
    const data = await fetchHmrc<HmrcOts>('/OTS', params, LATEST_REVALIDATE_SECONDS);
    if (data.value?.length) return monthIdToPeriod(month);
  }
  throw new TradeDataError('No recent UK trade data were returned for this product.');
}

export async function fetchHmrcTradeRecords(mapping: ProductSourceMapping, direction: TradeDirection, sinceTimePeriod: string, untilTimePeriod: string): Promise<TradeRecord[]> {
  const ids = await commodityIds(mapping);
  const since = periodToMonthId(sinceTimePeriod);
  const until = periodToMonthId(untilTimePeriod);
  const params = new URLSearchParams({
    '$filter': `${flowFilter(direction)} and MonthId ge ${since} and MonthId le ${until} and ${idFilter(ids)}`,
    '$select': 'MonthId,FlowTypeId,CommodityId,CountryId,Value,NetMass,SuppressionIndex',
    '$top': '40000',
  });

  const raw: HmrcOts[] = [];
  let page: ODataResponse<HmrcOts> | null = await fetchHmrc<HmrcOts>('/OTS', params);
  let pages = 0;
  while (page) {
    raw.push(...(page.value ?? []));
    pages += 1;
    if (!page['@odata.nextLink']) break;
    if (pages >= 10) throw new TradeDataError('UK Trade Info returned too much data for this analysis. Narrow the product or period.');
    page = await fetchHmrc<HmrcOts>(page['@odata.nextLink']);
  }

  const countries = await fetchCountries();
  type Acc = {partnerCode: string; partnerName: string; time: string; tradeValue: number; quantityKg: number; hasValue: boolean; hasQuantity: boolean};
  const rows = new Map<string, Acc>();
  for (const item of raw) {
    if (!item.MonthId || item.CountryId == null || item.CommodityId == null) continue;
    const country = countries.get(item.CountryId);
    const partnerCode = country?.CountryCodeAlpha?.trim() || `UKTI-${item.CountryId}`;
    const partnerName = country?.CountryName?.trim() || partnerCode;
    const time = monthIdToPeriod(item.MonthId);
    const key = `${partnerCode}|${time}|${item.CommodityId}`;
    const row = rows.get(key) ?? {partnerCode, partnerName, time, tradeValue: 0, quantityKg: 0, hasValue: false, hasQuantity: false};
    if (item.Value != null && Number.isFinite(item.Value)) { row.tradeValue += item.Value; row.hasValue = true; }
    if (item.NetMass != null && Number.isFinite(item.NetMass)) { row.quantityKg += item.NetMass; row.hasQuantity = true; }
    rows.set(key, row);
  }

  return Array.from(rows.values()).map(row => ({
    partnerCode: row.partnerCode,
    partnerName: row.partnerName,
    time: row.time,
    tradeValue: row.hasValue ? row.tradeValue : null,
    quantityKg: row.hasQuantity ? row.quantityKg : null,
  }));
}
