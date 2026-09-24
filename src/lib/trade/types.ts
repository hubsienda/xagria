export type TradeDirection = 'imports' | 'exports';
export type PeriodPreset = 12 | 24 | 36;

export interface TradeProduct {
  id: string;
  name: string;
  codes: string[];
  codeLabel: string;
}

export interface ReporterMarket {
  code: string;
  name: string;
}

export interface TradeRecord {
  partnerCode: string;
  partnerName: string;
  time: string;
  tradeValueEur: number | null;
  quantityKg: number | null;
}

export interface TradeAggregate {
  quantityKg: number;
  tradeValueEur: number;
  unitValueEurKg: number | null;
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
  dataset: string;
  datasetLabel: string;
  sourceUrl: string;
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
