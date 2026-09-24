export type TradeDirection = 'imports' | 'exports';
export type PeriodPreset = 12 | 24 | 36;
export type TradeProviderId = 'eurostat' | 'hmrc';
export type CurrencyCode = 'EUR' | 'GBP';
export type CommodityField = 'product' | 'Hs6Code' | 'Cn8Code';

export interface ProductSourceMapping {
  codes: string[];
  codeLabel: string;
  commodityField?: CommodityField;
  scopeNote?: string;
}

export interface TradeProduct {
  id: string;
  name: string;
  mappings: Partial<Record<TradeProviderId, ProductSourceMapping>>;
  selectorNote?: string;
  scopeNote?: string;
}

export interface ReporterMarket {
  code: string;
  name: string;
  provider: TradeProviderId;
}

export interface TradeRecord {
  partnerCode: string;
  partnerName: string;
  time: string;
  tradeValue: number | null;
  quantityKg: number | null;
}

export interface TradeAggregate {
  quantityKg: number;
  tradeValue: number;
  unitValuePerKg: number | null;
}

export interface ComparisonMetric {
  current: number | null;
  previous: number | null;
  changePct: number | null;
}

export interface ComparisonBlock {
  quantity: ComparisonMetric;
  tradeValue: ComparisonMetric;
  unitValue: ComparisonMetric;
}

export interface SupplierRow extends TradeAggregate {
  rank: number;
  originCode: string;
  origin: string;
  marketSharePct: number | null;
  changePct: number | null;
}

export interface MonthlyTrendRow extends TradeAggregate {
  month: string;
}

export interface OriginEvolutionRow {
  originCode: string;
  origin: string;
  latest12QuantityKg: number;
  previous12QuantityKg: number;
  changePct: number | null;
  currentSharePct: number | null;
  previousSharePct: number | null;
  shareChangePp: number | null;
}

export interface BrokerageSignal {
  kind: 'positive' | 'negative' | 'neutral';
  title: string;
  evidence: string;
}

export interface TradeAnalysis {
  provider: TradeProviderId;
  sourceName: string;
  dataset: string;
  datasetLabel: string;
  sourceUrl: string;
  currencyCode: CurrencyCode;
  currencySymbol: '€' | '£';
  latestMonth: string;
  reporter: ReporterMarket;
  direction: TradeDirection;
  product: TradeProduct;
  productCodeLabel: string;
  productScopeNote?: string;
  periodMonths: PeriodPreset;
  summary: TradeAggregate;
  latestMonthComparison: ComparisonBlock | null;
  rolling12Comparison: ComparisonBlock | null;
  suppliers: SupplierRow[];
  monthlyTrend: MonthlyTrendRow[];
  originEvolution: OriginEvolutionRow[];
  signals: BrokerageSignal[];
  worthInvestigating: string;
}
