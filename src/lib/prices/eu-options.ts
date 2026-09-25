import {priceProductIdentity, sourceAwareVarietyLabel} from './products';
import type {PriceMarket, PriceOptions, PriceStage} from './types';

export interface EuOptionRow {
  variety?: string;
  productStage?: string;
}

export const EU_SOURCE_STAGE_MAP: Readonly<Record<string, PriceStage>> = {
  'Farmgate price': 'Farmgate',
  'Ex-packaging station price': 'Ex-packaging',
  'Retail buying price': 'Retail',
};

const STAGE_ORDER: PriceStage[] = ['Farmgate', 'Ex-packaging', 'Retail', 'Wholesale'];

export function sortPriceStages(stages: Iterable<PriceStage>) {
  return Array.from(new Set(stages)).sort((a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b));
}

export function sourceStageForPriceStage(stage: PriceStage) {
  return Object.entries(EU_SOURCE_STAGE_MAP).find(([, mapped]) => mapped === stage)?.[0] ?? null;
}

function relationshipText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-GB');
}

export function sourceProductForVariety(variety: string, products: string[]) {
  const normalisedVariety = relationshipText(variety);
  return products
    .slice()
    .sort((a, b) => relationshipText(b).length - relationshipText(a).length)
    .find(product => {
      const normalisedProduct = relationshipText(product);
      return normalisedVariety === normalisedProduct || normalisedVariety.startsWith(`${normalisedProduct} - `);
    }) ?? null;
}

export function buildEuPriceOptions(input: {
  market: PriceMarket;
  sourceName: string;
  products: string[];
  varieties: string[];
  productStages: string[];
  rows: EuOptionRow[];
}): PriceOptions {
  type VarietyGroup = {value: string; sourceProduct: string; stages: Set<PriceStage>};
  type ProductGroup = {id: string; name: string; sourceProducts: Set<string>; varieties: Map<string, VarietyGroup>};

  const knownVarieties = new Set(input.varieties);
  const knownStages = new Set(input.productStages);
  const grouped = new Map<string, ProductGroup>();

  for (const row of input.rows) {
    if (!row.variety || !row.productStage || !knownVarieties.has(row.variety) || !knownStages.has(row.productStage)) continue;
    const stage = EU_SOURCE_STAGE_MAP[row.productStage];
    if (!stage) continue;
    const sourceProduct = sourceProductForVariety(row.variety, input.products);
    if (!sourceProduct) continue;
    const identity = priceProductIdentity(sourceProduct);
    const group = grouped.get(identity.id) ?? {id: identity.id, name: identity.name, sourceProducts: new Set<string>(), varieties: new Map<string, VarietyGroup>()};
    group.sourceProducts.add(sourceProduct);
    const varietyKey = `${sourceProduct}\u0000${row.variety}`;
    const variety = group.varieties.get(varietyKey) ?? {value: row.variety, sourceProduct, stages: new Set<PriceStage>()};
    variety.stages.add(stage);
    group.varieties.set(varietyKey, variety);
    grouped.set(identity.id, group);
  }

  const products = Array.from(grouped.values()).map(group => {
    const sourceProducts = Array.from(group.sourceProducts).sort((a, b) => a.localeCompare(b, 'en-GB'));
    const qualifySource = sourceProducts.length > 1;
    return {
      id: group.id,
      name: group.name,
      sourceProducts,
      varieties: Array.from(group.varieties.values()).map(item => ({
        value: item.value,
        sourceProduct: item.sourceProduct,
        label: sourceAwareVarietyLabel(item.sourceProduct, item.value, qualifySource),
        stages: sortPriceStages(item.stages),
      })).sort((a, b) => a.label.localeCompare(b.label, 'en-GB')),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));

  return {market: input.market, sourceName: input.sourceName, products};
}
