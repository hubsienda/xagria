export function priceSignalResetSelection() {
  return {
    marketCode: 'ES',
    sourceProduct: '',
    variety: '',
    stage: '' as const,
    periodMonths: 24 as const,
  };
}

export function tradeFlowResetSelection() {
  return {
    productId: 'lemons-limes',
    reporterCode: 'DE',
    direction: 'imports' as const,
    periodMonths: 36 as const,
  };
}
