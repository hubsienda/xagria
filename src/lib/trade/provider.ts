import 'server-only';
import {COMEXT_DATASET, COMEXT_DATASET_LABEL, COMEXT_SOURCE_URL} from './config';
import {fetchLatestAvailableMonth, fetchTradeRecords} from './comext';
import {fetchHmrcLatestAvailableMonth, fetchHmrcTradeRecords, HMRC_DATASET, HMRC_DATASET_LABEL, HMRC_SOURCE_URL} from './hmrc';
import {getProductMapping} from './products';
import {TRADE_SOURCE_CONFIG} from './source-config';
import type {ReporterMarket, TradeDirection, TradeProduct, TradeProviderResult} from './types';

export async function fetchProviderTradeData(
  reporter: ReporterMarket,
  product: TradeProduct,
  direction: TradeDirection,
  sinceMonthFor: (latestMonth: string) => string,
): Promise<TradeProviderResult> {
  const mapping = getProductMapping(product, reporter.provider);
  if (!mapping) throw new Error('UNSUPPORTED_PRODUCT_SOURCE');

  if (reporter.provider === 'hmrc') {
    const latestMonth = await fetchHmrcLatestAvailableMonth(mapping.codes, direction);
    const records = await fetchHmrcTradeRecords(mapping.codes, direction, sinceMonthFor(latestMonth), latestMonth);
    return {
      latestMonth,
      records,
      source: {
        provider: 'hmrc',
        sourceName: 'HMRC / UK Trade Info — UK Overseas Trade Statistics',
        dataset: HMRC_DATASET,
        datasetLabel: HMRC_DATASET_LABEL,
        sourceUrl: HMRC_SOURCE_URL,
        ...TRADE_SOURCE_CONFIG.hmrc,
        codeLabel: mapping.codeLabel,
        productNote: mapping.note,
        methodology: [
          'Statistical value comes from official UK Overseas Trade Statistics and is reported in pounds sterling.',
          'Net mass comes from HMRC OTS records and is normalised to kilograms. HMRC describes net mass as the weight of goods including immediate packaging.',
          'Trade unit value is statistical value divided by net mass. It is not a wholesale, retail, producer or transaction market price.',
          'Recent statistics may be revised. Confidentiality and commodity-classification changes can affect detailed results.',
          'Country rankings use individual partner-country records. Aggregate, unknown or suppressed partner detail is excluded from rankings and their market-share denominator.',
        ],
      },
    };
  }

  const latestMonth = await fetchLatestAvailableMonth(reporter.code, mapping.codes, direction);
  const records = await fetchTradeRecords(reporter.code, mapping.codes, direction, sinceMonthFor(latestMonth), latestMonth);
  return {
    latestMonth,
    records,
    source: {
      provider: 'eurostat',
      sourceName: 'Eurostat Comext — International trade in goods',
      dataset: COMEXT_DATASET,
      datasetLabel: COMEXT_DATASET_LABEL,
      sourceUrl: COMEXT_SOURCE_URL,
      ...TRADE_SOURCE_CONFIG.eurostat,
      codeLabel: mapping.codeLabel,
      productNote: mapping.note,
      methodology: [
        'Trade value is Eurostat international-trade statistical value and is reported in euros.',
        'Quantity is derived from Comext quantity reported in 100 kg and converted to kilograms.',
        'Trade unit value is statistical value divided by net mass. It is not a wholesale, retail, producer or transaction market price.',
        'Recent months may be revised. Missing or confidential trade can affect detailed totals, and Combined Nomenclature classifications can change between years.',
        'Partner rankings and market shares use individual-country partner flows; World, EU and other aggregate or special partner codes are excluded to prevent double counting.',
      ],
    },
  };
}
