import 'server-only';
import type {TradeDirection, TradeRecord} from './types';

export const HMRC_BASE_URL = 'https://api.uktradeinfo.com';
export const HMRC_SOURCE_URL = 'https://www.uktradeinfo.com/api-documentation';
export const HMRC_DATASET = 'OTS';
export const HMRC_DATASET_LABEL = 'UK Overseas Trade Statistics';
const REVALIDATE_SECONDS = 6 * 60 * 60;
const TIMEOUT_MS = 20_000;
const MAX_PAGES = 100;

interface ODataResponse<T> {
  value?: T[];
  '@odata.nextLink'?: string;
}

interface HmrcCountry {
  CountryId?: number;
  CountryName?: string;
  CountryCodeAlpha?: string;
}

interface HmrcAggregateRow {
  CountryId?: number;
  MonthId?: number;
  CommodityId?: number;
  SuppressionIndex?: number;
  TradeValue?: number | null;
  QuantityKg?: number | null;
}

export class HmrcError extends Error {
  constructor(public userMessage: string, message?: string) {
    super(message ?? userMessage);
    this.name = 'HmrcError';
  }
}

function flowFilter(direction: TradeDirection) {
  return direction === 'imports'
    ? '(FlowTypeId eq 1 or FlowTypeId eq 3)'
    : '(FlowTypeId eq 2 or FlowTypeId eq 4)';
}

function commodityClause(code: string) {
  if (/^\d{8}$/.test(code)) return `Commodity/Cn8Code eq '${code}'`;
  if (/^\d{6}$/.test(code)) return `Commodity/Hs6Code eq '${code}'`;
  if (/^\d{4}$/.test(code)) return `Commodity/Hs4Code eq '${code}'`;
  if (/^\d{2}$/.test(code)) return `Commodity/Hs2Code eq '${code}'`;
  throw new HmrcError('This product cannot currently be isolated reliably in the selected trade dataset.', `Unsupported HMRC commodity code ${code}`);
}

function productFilter(codes: string[]) {
  return `(${codes.map(commodityClause).join(' or ')})`;
}

function monthId(month: string) {
  return Number(month.replace('-', ''));
}

function monthString(value: number) {
  const raw = String(value);
  if (!/^\d{6}$/.test(raw)) throw new HmrcError('UK Trade Info returned an unexpected response. Try again shortly.');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

async function fetchPage<T>(url: string): Promise<ODataResponse<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {accept: 'application/json'},
      next: {revalidate: REVALIDATE_SECONDS},
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new HmrcError('UK Trade Info data are temporarily unavailable. Try again shortly.', error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 404) throw new HmrcError('No UK trade data were returned for this product and period.', `HMRC HTTP ${response.status}`);
    throw new HmrcError('UK Trade Info data are temporarily unavailable. Try again shortly.', `HMRC HTTP ${response.status}`);
  }
  const data = await response.json() as ODataResponse<T>;
  if (!Array.isArray(data.value)) throw new HmrcError('UK Trade Info returned an unexpected response. Try again shortly.');
  return data;
}

async function fetchOData<T>(path: string, params: URLSearchParams): Promise<ODataResponse<T>> {
  let nextUrl: string | undefined = `${HMRC_BASE_URL}/${path}?${params.toString()}`;
  const values: T[] = [];
  let pageCount = 0;
  while (nextUrl) {
    pageCount += 1;
    if (pageCount > MAX_PAGES) throw new HmrcError('UK Trade Info returned an unexpectedly large response. Try a narrower query.');
    const page: ODataResponse<T> = await fetchPage<T>(nextUrl);
    values.push(...(page.value ?? []));
    const continuation: string | undefined = page['@odata.nextLink'];
    if (!continuation) {
      nextUrl = undefined;
    } else {
      const resolved: URL = new URL(continuation, HMRC_BASE_URL);
      if (resolved.origin !== new URL(HMRC_BASE_URL).origin) throw new HmrcError('UK Trade Info returned an unexpected response. Try again shortly.');
      nextUrl = resolved.toString();
    }
  }
  return {value: values};
}

async function fetchCountryMap() {
  const params = new URLSearchParams({'$select': 'CountryId,CountryName,CountryCodeAlpha'});
  const data = await fetchOData<HmrcCountry>('Country', params);
  const countries = new Map<number, {code: string; name: string}>();
  for (const row of data.value ?? []) {
    const code = row.CountryCodeAlpha?.toUpperCase();
    if (row.CountryId == null || !code || !/^[A-Z]{2}$/.test(code) || !row.CountryName) continue;
    countries.set(row.CountryId, {code, name: row.CountryName});
  }
  return countries;
}

export async function fetchHmrcLatestAvailableMonth(productCodes: string[], direction: TradeDirection) {
  const params = new URLSearchParams({
    '$filter': `${productFilter(productCodes)} and ${flowFilter(direction)}`,
    '$orderby': 'MonthId desc',
    '$top': '1',
    '$select': 'MonthId',
  });
  const data = await fetchOData<{MonthId?: number}>('OTS', params);
  const latest = data.value?.[0]?.MonthId;
  if (!latest) throw new HmrcError('No UK trade data were returned for this product and period.');
  return monthString(latest);
}

export async function fetchHmrcTradeRecords(productCodes: string[], direction: TradeDirection, sinceMonth: string, untilMonth: string): Promise<TradeRecord[]> {
  const filter = `${productFilter(productCodes)} and ${flowFilter(direction)} and MonthId ge ${monthId(sinceMonth)} and MonthId le ${monthId(untilMonth)}`;
  const apply = `filter(${filter})/groupby((CountryId,MonthId,CommodityId,SuppressionIndex),aggregate(Value with sum as TradeValue,NetMass with sum as QuantityKg))`;
  const [data, countries] = await Promise.all([
    fetchOData<HmrcAggregateRow>('OTS', new URLSearchParams({'$apply': apply})),
    fetchCountryMap(),
  ]);
  const records: TradeRecord[] = [];
  for (const row of data.value ?? []) {
    if (row.CountryId == null || row.MonthId == null) continue;
    const country = countries.get(row.CountryId);
    if (!country) continue;
    const suppression = row.SuppressionIndex ?? 0;
    const quantitySuppressed = suppression === 3 || suppression === 4 || suppression === 5;
    records.push({
      partnerCode: country.code,
      partnerName: country.name,
      time: monthString(row.MonthId),
      tradeValue: row.TradeValue != null && Number.isFinite(row.TradeValue) ? row.TradeValue : null,
      quantityKg: !quantitySuppressed && row.QuantityKg != null && Number.isFinite(row.QuantityKg) ? row.QuantityKg : null,
    });
  }
  return records;
}
