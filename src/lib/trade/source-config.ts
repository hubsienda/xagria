import type {TradeProviderId} from './types';

export const TRADE_SOURCE_CONFIG: Record<TradeProviderId, {currencyCode: 'EUR' | 'GBP'; currencySymbol: '€' | '£'}> = {
  eurostat: {currencyCode: 'EUR', currencySymbol: '€'},
  hmrc: {currencyCode: 'GBP', currencySymbol: '£'},
};
