import 'server-only';
import {fetchLatestAvailableMonth, fetchTradeRecords} from './comext';
import {fetchHmrcLatestAvailableMonth, fetchHmrcTradeRecords} from './hmrc';
import {getProductMapping} from './products';
import {TRADE_SOURCES} from './sources';
import type {ReporterMarket, TradeDirection, TradeProduct, TradeProviderId} from './types';

export interface TradeDataProvider {
  id: TradeProviderId;
  fetchLatestAvailableMonth(reporter: ReporterMarket, product: TradeProduct, direction: TradeDirection): Promise<string>;
  fetchTradeRecords(reporter: ReporterMarket, product: TradeProduct, direction: TradeDirection, sinceTimePeriod: string, untilTimePeriod: string): ReturnType<typeof fetchTradeRecords>;
}

const eurostatProvider: TradeDataProvider = {
  id: 'eurostat',
  async fetchLatestAvailableMonth(reporter, product, direction) {
    const mapping = getProductMapping(product, 'eurostat');
    if (!mapping) throw new Error('UNSUPPORTED_PRODUCT');
    return fetchLatestAvailableMonth(reporter.code, mapping.codes, direction);
  },
  async fetchTradeRecords(reporter, product, direction, sinceTimePeriod, untilTimePeriod) {
    const mapping = getProductMapping(product, 'eurostat');
    if (!mapping) throw new Error('UNSUPPORTED_PRODUCT');
    return fetchTradeRecords(reporter.code, mapping.codes, direction, sinceTimePeriod, untilTimePeriod);
  },
};

const hmrcProvider: TradeDataProvider = {
  id: 'hmrc',
  async fetchLatestAvailableMonth(_reporter, product, direction) {
    const mapping = getProductMapping(product, 'hmrc');
    if (!mapping) throw new Error('UNSUPPORTED_PRODUCT');
    return fetchHmrcLatestAvailableMonth(mapping, direction);
  },
  async fetchTradeRecords(_reporter, product, direction, sinceTimePeriod, untilTimePeriod) {
    const mapping = getProductMapping(product, 'hmrc');
    if (!mapping) throw new Error('UNSUPPORTED_PRODUCT');
    return fetchHmrcTradeRecords(mapping, direction, sinceTimePeriod, untilTimePeriod);
  },
};

export function getTradeProvider(reporter: ReporterMarket) {
  return reporter.provider === 'hmrc' ? hmrcProvider : eurostatProvider;
}

export function getTradeSource(reporter: ReporterMarket) {
  return TRADE_SOURCES[reporter.provider];
}
