export function priceSignalResetSelection() {
  return {
    marketCode: '',
    productId: '',
    variety: '',
    stage: '' as const,
    periodMonths: '' as const,
  };
}

export function tradeFlowResetSelection() {
  return {
    productId: '',
    reporterCode: '',
    direction: '' as const,
    periodMonths: '' as const,
  };
}
