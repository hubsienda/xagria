import type {CurrencyCode, TradeProviderId} from './types';

export interface TradeSourceMetadata {
  id: TradeProviderId;
  sourceName: string;
  dataset: string;
  datasetLabel: string;
  sourceUrl: string;
  currencyCode: CurrencyCode;
  currencySymbol: '€' | '£';
}

export const TRADE_SOURCES: Record<TradeProviderId, TradeSourceMetadata> = {
  eurostat: {
    id: 'eurostat',
    sourceName: 'Eurostat Comext — International trade in goods',
    dataset: 'DS-045409',
    datasetLabel: 'EU trade since 1988 by HS2-4-6 and CN8',
    sourceUrl: 'https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/comext-database',
    currencyCode: 'EUR',
    currencySymbol: '€',
  },
  hmrc: {
    id: 'hmrc',
    sourceName: 'HMRC / UK Trade Info — UK Overseas Trade Statistics',
    dataset: 'UK Trade Info OTS API',
    datasetLabel: 'Overseas Trade Statistics (OTS)',
    sourceUrl: 'https://www.uktradeinfo.com/api-documentation',
    currencyCode: 'GBP',
    currencySymbol: '£',
  },
};
