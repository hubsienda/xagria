export type PriceProviderId = 'eu' | 'defra';
export type PriceStage = 'Farmgate' | 'Ex-packaging' | 'Retail' | 'Wholesale';
export type PricePeriod = 12 | 24 | 36;

export interface PriceMarket {
  code: string;
  name: string;
  provider: PriceProviderId;
}

export interface PriceObservation {
  provider: PriceProviderId;
  sourceName: string;
  marketCode: string;
  marketName: string;
  productId: string;
  productName: string;
  sourceProduct: string;
  variety: string;
  stage: PriceStage;
  startDate: string;
  endDate?: string;
  rawPrice: number;
  rawCurrency: string;
  rawUnit: string;
  normalisedPrice: number | null;
  normalisedUnit: string | null;
  periodType?: string;
  sourceUrl: string;
  isCalculated?: string;
  isRegulated?: string;
}

export interface PriceVarietyOption {
  value: string;
  label: string;
  sourceProduct: string;
  stages: PriceStage[];
}

export interface PriceProductOption {
  id: string;
  name: string;
  sourceProducts: string[];
  varieties: PriceVarietyOption[];
}

export interface PriceOptions {
  market: PriceMarket;
  sourceName: string;
  products: PriceProductOption[];
  scopeNote?: string;
}

export interface PriceComparison {
  current: number;
  reference: number;
  changePct: number | null;
  referenceDate?: string;
}

export interface RecentAverageComparison extends PriceComparison {
  observationCount: number;
}

export interface PriceRangeContext {
  average: number;
  high: number;
  low: number;
  distanceFromHighPct: number | null;
  distanceFromLowPct: number | null;
  positionPct: number | null;
  observationCount: number;
}

export interface SeasonalComparison extends PriceComparison {
  observationCount: number;
  referenceYears: number[];
}

export interface PriceSignal {
  kind: 'positive' | 'negative' | 'neutral';
  title: string;
  evidence: string;
}

export interface PriceAnalysis {
  provider: PriceProviderId;
  sourceName: string;
  sourceUrl: string;
  scopeNote?: string;
  methodology: string[];
  market: PriceMarket;
  productId: string;
  productName: string;
  sourceProduct: string;
  variety: string;
  stage: PriceStage;
  currency: string;
  rawUnit: string;
  normalisedUnit: string | null;
  periodMonths: PricePeriod;
  latest: PriceObservation;
  previousComparison: PriceComparison | null;
  yearOnYearComparison: PriceComparison | null;
  recentAverageComparison: RecentAverageComparison | null;
  range12Month: PriceRangeContext | null;
  seasonalComparison: SeasonalComparison | null;
  trend: PriceObservation[];
  signals: PriceSignal[];
  worthInvestigating: string;
}
