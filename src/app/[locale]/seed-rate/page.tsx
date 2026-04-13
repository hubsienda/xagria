export function calculateSeedRateKgHa(
  targetPlantsPerM2: number,
  thousandGrainWeightG: number,
  germinationPercent: number,
  fieldEstablishmentPercent: number
): number {
  if (
    targetPlantsPerM2 <= 0 ||
    thousandGrainWeightG <= 0 ||
    germinationPercent <= 0 ||
    fieldEstablishmentPercent <= 0
  ) {
    return 0;
  }

  const effectiveEstablishment =
    (germinationPercent / 100) * (fieldEstablishmentPercent / 100);

  if (effectiveEstablishment <= 0) {
    return 0;
  }

  const seedsNeededPerM2 = targetPlantsPerM2 / effectiveEstablishment;
  return (seedsNeededPerM2 * thousandGrainWeightG) / 100;
}

export function calculateFertiliserRate(
  targetNutrientRate: number,
  nutrientPercent: number
): number {
  if (targetNutrientRate <= 0 || nutrientPercent <= 0) {
    return 0;
  }

  return targetNutrientRate / (nutrientPercent / 100);
}

export function calculateMoistureCorrection(
  actualValue: number,
  actualMoisturePercent: number,
  targetMoisturePercent: number
): number {
  if (
    actualValue <= 0 ||
    actualMoisturePercent < 0 ||
    targetMoisturePercent < 0 ||
    actualMoisturePercent >= 100 ||
    targetMoisturePercent >= 100
  ) {
    return 0;
  }

  return (
    actualValue * (100 - actualMoisturePercent) / (100 - targetMoisturePercent)
  );
}

export function calculateSprayerRateMetric(
  nozzleFlowLMin: number,
  speedKmH: number,
  nozzleSpacingCm: number
): number {
  if (nozzleFlowLMin <= 0 || speedKmH <= 0 || nozzleSpacingCm <= 0) {
    return 0;
  }

  return (600 * nozzleFlowLMin) / (speedKmH * nozzleSpacingCm);
}

export function calculateSprayerRateUS(
  nozzleFlowGpm: number,
  speedMph: number,
  nozzleSpacingIn: number
): number {
  if (nozzleFlowGpm <= 0 || speedMph <= 0 || nozzleSpacingIn <= 0) {
    return 0;
  }

  return (5940 * nozzleFlowGpm) / (speedMph * nozzleSpacingIn);
}

export function kgHaToLbAc(value: number): number {
  return value * 0.892179;
}

export function lbAcToKgHa(value: number): number {
  return value / 0.892179;
}
