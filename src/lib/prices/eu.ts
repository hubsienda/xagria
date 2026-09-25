import 'server-only';
import {EU_METADATA_REVALIDATE_SECONDS, EU_OPTIONS_AVAILABILITY_MONTHS, EU_PRICE_BASE_URL, EU_PRICE_SOURCE_NAME, EU_PRICE_SOURCE_URL, PRICE_REVALIDATE_SECONDS} from './config';
import {buildEuPriceOptions, EU_SOURCE_STAGE_MAP, sourceStageForPriceStage, type EuOptionRow} from './eu-options';
import {fetchEuJson, type EuRequestPurpose} from './eu-request';
import {priceProductIdentity, varietyLabel} from './products';
import {inferCurrency, normaliseMassPrice, parseReportedPrice} from './units';
import type {PriceMarket, PriceObservation, PriceOptions, PriceStage} from './types';

interface EuRow extends EuOptionRow {
  memberStateCode?: string;
  memberStateName?: string;
  beginDate?: string;
  endDate?: string;
  price?: string;
  unit?: string;
  periodType?: string;
  period?: number;
  year?: number;
  market?: string;
  isCalculated?: string;
  isRegulated?: string;
}

function ddmmyyyy(date: Date) {
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
}

function isoFromEu(value: string | undefined) {
  if (!value) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function monthsAgo(count: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count, now.getUTCDate()));
}

async function euReferenceValues(path: '/products' | '/varieties' | '/productStages') {
  return fetchEuJson<string[]>({
    url: `${EU_PRICE_BASE_URL}/api/fruitAndVegetable/pricesSupplyChain${path}`,
    context: {purpose: 'metadata', path: `/api/fruitAndVegetable/pricesSupplyChain${path}`},
    revalidateSeconds: EU_METADATA_REVALIDATE_SECONDS,
    expectArray: true,
  });
}

async function euRows(
  marketCode: string,
  beginDate: Date,
  filters?: {product?: string; variety?: string; stage?: string},
  purpose: EuRequestPurpose = 'analysis',
) {
  const path = '/api/fruitAndVegetable/pricesSupplyChain';
  const params = new URLSearchParams({memberStateCodes: marketCode, beginDate: ddmmyyyy(beginDate), endDate: ddmmyyyy(new Date())});
  if (filters?.product) params.set('products', filters.product);
  if (filters?.variety) params.set('varieties', filters.variety);
  if (filters?.stage) params.set('productStages', filters.stage);
  return fetchEuJson<EuRow[]>({
    url: `${EU_PRICE_BASE_URL}${path}?${params.toString()}`,
    context: {purpose, path, marketCode, product: filters?.product, stage: filters?.stage},
    revalidateSeconds: PRICE_REVALIDATE_SECONDS,
    allowNotFoundEmpty: true,
    expectArray: true,
  });
}

export async function getEuPriceOptions(market: PriceMarket): Promise<PriceOptions> {
  const [products, varieties, productStages, rows] = await Promise.all([
    euReferenceValues('/products'),
    euReferenceValues('/varieties'),
    euReferenceValues('/productStages'),
    euRows(market.code, monthsAgo(EU_OPTIONS_AVAILABILITY_MONTHS), undefined, 'options'),
  ]);
  return buildEuPriceOptions({market, sourceName: EU_PRICE_SOURCE_NAME, products, varieties, productStages, rows});
}

export async function getEuPriceObservations(input: {market: PriceMarket; sourceProduct: string; variety: string; stage: PriceStage}) {
  const sourceStage = sourceStageForPriceStage(input.stage);
  if (!sourceStage || input.stage === 'Wholesale') throw new Error('INVALID_STAGE');
  const identity = priceProductIdentity(input.sourceProduct);
  const rows = await euRows(input.market.code, monthsAgo(40), {product: input.sourceProduct, variety: input.variety, stage: sourceStage}, 'analysis');
  const observations: PriceObservation[] = [];
  for (const row of rows) {
    const startDate = isoFromEu(row.beginDate);
    const endDate = isoFromEu(row.endDate ?? row.beginDate);
    const rawPrice = parseReportedPrice(row.price ?? '');
    if (!startDate || rawPrice == null || !row.unit || !row.variety || !row.productStage || EU_SOURCE_STAGE_MAP[row.productStage] !== input.stage) continue;
    const currency = inferCurrency(row.price ?? '', row.unit, 'EUR');
    const normalised = normaliseMassPrice(rawPrice, currency, row.unit);
    observations.push({
      provider: 'eu', sourceName: EU_PRICE_SOURCE_NAME, marketCode: input.market.code, marketName: row.memberStateName ?? input.market.name,
      productId: identity.id, productName: identity.name, sourceProduct: input.sourceProduct, variety: varietyLabel(input.sourceProduct, row.variety), stage: input.stage,
      startDate, endDate: endDate ?? undefined, rawPrice, rawCurrency: currency, rawUnit: row.unit,
      normalisedPrice: normalised?.price ?? null, normalisedUnit: normalised?.unit ?? null, periodType: row.periodType,
      sourceUrl: EU_PRICE_SOURCE_URL, isCalculated: row.isCalculated, isRegulated: row.isRegulated,
    });
  }
  return observations;
}

export const EU_PRICE_METHODOLOGY = [
  'Official supply-chain price series reported by EU Member States and published by the European Commission Agri-food Data Portal.',
  'Product, variety and price stage define the series being measured; Farmgate, Ex-packaging and Retail are separate series and are not treated as equivalent prices.',
  'Member State coverage and reporting frequency vary, and historical observations may be revised.',
  'Where a directly convertible mass unit is reported, XAGRIA also shows a normalised price per kg while retaining the original price and unit.',
];
