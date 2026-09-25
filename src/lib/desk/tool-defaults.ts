import {blankPriceSignalSelection, blankTradeFlowSelection} from './selection-transitions';

export function priceSignalResetSelection() {
  return blankPriceSignalSelection();
}

export function tradeFlowResetSelection() {
  return blankTradeFlowSelection();
}
