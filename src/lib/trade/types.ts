export type TradeDirection = 'imports' | 'exports';
export type PeriodPreset = 12 | 24 | 36;
export type TradeProviderId = 'eurostat' | 'hmrc';

export interface ProductSourceMapping {
  codes: string[];
  codeLabel: string;
  note?: string;
}

export interface TradeProduct {
  id: string;
  name: string;
  sources: Partial<Record<TradeProviderId, ProductSourceMapping>>;
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
  unitValue: number | null;
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

export interface TradeSourceMetadata {
  provider: TradeProviderId;
  sourceName: string;
  dataset: string;
  datasetLabel: string;
  sourceUrl: string;
  currencyCode: 'EUR' | 'GBP';
  currencySymbol: '€' | '£';
  codeLabel: string;
  productNote?: string;
  methodology: string[];
}

export interface TradeAnalysis {
  source: TradeSourceMetadata;
  latestMonth: string;
  reporter: ReporterMarket;
  direction: TradeDirection;
  product: TradeProduct;
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

export interface TradeProviderResult {
  latestMonth: string;
  records: TradeRecord[];
  source: TradeSourceMetadata;
}
