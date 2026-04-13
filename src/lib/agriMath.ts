export function calculateTankMixProductAmount(
  tankSize: number,
  sprayVolumePerArea: number,
  productDosePerArea: number
): number {
  if (tankSize <= 0 || sprayVolumePerArea <= 0 || productDosePerArea <= 0) {
    return 0;
  }

  return (tankSize / sprayVolumePerArea) * productDosePerArea;
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function estimateHarvestLoss(
  seedsCount: number,
  factor: number
): number {
  if (seedsCount <= 0 || factor <= 0) {
    return 0;
  }

  return seedsCount / factor;
}

export function getHarvestLossFactor(units: 'metric' | 'american'): number {
  return units === 'metric' ? 18 : 20;
}
