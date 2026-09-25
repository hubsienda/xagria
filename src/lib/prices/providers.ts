import 'server-only';
import {getDefraPriceObservations, getDefraPriceOptions} from './defra';
import {getEuPriceObservations, getEuPriceOptions} from './eu';
import {getPriceMarket} from './markets';
import type {PricePeriod, PriceStage} from './types';

export async function getPriceOptionsForMarket(marketCode: string) {
  const market = getPriceMarket(marketCode);
  if (!market) throw new Error('INVALID_MARKET');
  return market.provider === 'defra' ? getDefraPriceOptions(market) : getEuPriceOptions(market);
}

export async function getPriceObservations(input: {marketCode: string; sourceProduct: string; variety: string; stage: PriceStage; periodMonths: PricePeriod}) {
  const market = getPriceMarket(input.marketCode);
  if (!market) throw new Error('INVALID_MARKET');
  if (market.provider === 'defra') {
    if (input.stage !== 'Wholesale') throw new Error('INVALID_STAGE');
    return getDefraPriceObservations({market, sourceProduct: input.sourceProduct, variety: input.variety, stage: 'Wholesale'});
  }
  if (input.stage === 'Wholesale') throw new Error('INVALID_STAGE');
  return getEuPriceObservations({market, sourceProduct: input.sourceProduct, variety: input.variety, stage: input.stage});
}
