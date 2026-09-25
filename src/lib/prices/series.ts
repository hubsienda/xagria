import {sortObservations} from './calculations';
import type {PriceObservation} from './types';

export function comparableSeriesForLatest(observations: PriceObservation[]) {
  const ordered = sortObservations(observations);
  const latest = ordered[ordered.length - 1];
  if (!latest) return [];
  return ordered.filter(row => {
    if (row.sourceProduct !== latest.sourceProduct || row.variety !== latest.variety || row.stage !== latest.stage || row.rawCurrency !== latest.rawCurrency) return false;
    if (latest.normalisedPrice != null && latest.normalisedUnit) return row.normalisedPrice != null && row.normalisedUnit === latest.normalisedUnit;
    return row.normalisedPrice == null && row.rawUnit === latest.rawUnit;
  });
}
