import type {PricePeriod, PriceStage} from '../prices/types';

export interface PriceSignalSelection {
  marketCode: string;
  productId: string;
  variety: string;
  stage: PriceStage | '';
  periodMonths: PricePeriod | '';
}

export interface TradeFlowSelection {
  productId: string;
  reporterCode: string;
  direction: 'imports' | 'exports' | '';
  periodMonths: 12 | 24 | 36 | '';
}

export const blankPriceSignalSelection = (): PriceSignalSelection => ({marketCode: '', productId: '', variety: '', stage: '', periodMonths: ''});
export const blankTradeFlowSelection = (): TradeFlowSelection => ({productId: '', reporterCode: '', direction: '', periodMonths: ''});

export function priceSelectionAfterMarketChange(current: PriceSignalSelection, marketCode: string): PriceSignalSelection {
  return {...current, marketCode, productId: '', variety: '', stage: ''};
}

export function priceSelectionAfterProductChange(current: PriceSignalSelection, productId: string): PriceSignalSelection {
  return {...current, productId, variety: '', stage: ''};
}

export function priceSelectionAfterVarietyChange(current: PriceSignalSelection, variety: string): PriceSignalSelection {
  return {...current, variety, stage: ''};
}
