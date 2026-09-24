import type {
  BrokerageSignal,
  ComparisonBlock,
  ComparisonMetric,
  MonthlyTrendRow,
  OriginEvolutionRow,
  SupplierRow,
  TradeAggregate,
  TradeRecord,
  TradeDirection,
} from './types';

export const SIGNAL_THRESHOLDS = {
  meaningfulVolumeChangePct: 10,
  meaningfulShareChangePp: 3,
  meaningfulUnitValueChangePct: 8,
  unusualRecentMovementPct: 20,
  emergingPreviousSharePct: 1,
  emergingCurrentSharePct: 3,
} as const;

export function tradeUnitValue(tradeValue: number | null | undefined, quantityKg: number | null | undefined) {
  if (!Number.isFinite(tradeValue) || !Number.isFinite(quantityKg) || !quantityKg || quantityKg <= 0) return null;
  return (tradeValue as number) / quantityKg;
}

export function percentageChange(current: number | null | undefined, previous: number | null | undefined) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0 || previous == null) return null;
  return (((current as number) - previous) / Math.abs(previous)) * 100;
}

export function marketShare(quantity: number | null | undefined, totalQuantity: number | null | undefined) {
  if (!Number.isFinite(quantity) || !Number.isFinite(totalQuantity) || !totalQuantity || totalQuantity <= 0) return null;
  return ((quantity as number) / totalQuantity) * 100;
}

export function isCountryPartner(code: string) {
  const normalised = code.toUpperCase();
  return /^[A-Z]{2}$/.test(normalised) && !normalised.startsWith('Q') && normalised !== 'EU' && normalised !== 'EA';
}

export function aggregateRecords(records: TradeRecord[]): TradeAggregate {
  let quantityKg = 0;
  let tradeValue = 0;
  let hasQuantity = false;
  let hasValue = false;
  for (const record of records) {
    if (record.quantityKg != null && Number.isFinite(record.quantityKg)) {
      quantityKg += record.quantityKg;
      hasQuantity = true;
    }
    if (record.tradeValue != null && Number.isFinite(record.tradeValue)) {
      tradeValue += record.tradeValue;
      hasValue = true;
    }
  }
  const unitValueComplete = records.length > 0 && records.every(record =>
    record.quantityKg != null && Number.isFinite(record.quantityKg) &&
    record.tradeValue != null && Number.isFinite(record.tradeValue),
  );
  return {
    quantityKg: hasQuantity ? quantityKg : 0,
    tradeValue: hasValue ? tradeValue : 0,
    unitValuePerKg: unitValueComplete ? tradeUnitValue(tradeValue, quantityKg) : null,
  };
}

export function previousMonth(month: string, count = 1) {
  const [year, rawMonth] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, rawMonth - 1 - count, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthsEndingAt(latestMonth: string, count: number) {
  return Array.from({length: count}, (_, index) => previousMonth(latestMonth, count - 1 - index));
}

function aggregateForMonths(records: TradeRecord[], months: Set<string>) {
  return aggregateRecords(records.filter(record => months.has(record.time)));
}

function hasEveryMonth(records: TradeRecord[], months: Set<string>) {
  const available = new Set(records.map(record => record.time));
  return Array.from(months).every(month => available.has(month));
}

function metric(current: number | null, previous: number | null): ComparisonMetric {
  return {current, previous, changePct: percentageChange(current, previous)};
}

export function comparison(current: TradeAggregate, previous: TradeAggregate): ComparisonBlock {
  return {
    quantity: metric(current.quantityKg, previous.quantityKg),
    tradeValue: metric(current.tradeValue, previous.tradeValue),
    unitValue: metric(current.unitValuePerKg, previous.unitValuePerKg),
  };
}

export function buildMonthComparison(records: TradeRecord[], latestMonth: string) {
  const previousYearMonth = previousMonth(latestMonth, 12);
  const currentMonths = new Set([latestMonth]);
  const previousMonths = new Set([previousYearMonth]);
  if (!hasEveryMonth(records, currentMonths) || !hasEveryMonth(records, previousMonths)) return null;
  const current = aggregateForMonths(records, currentMonths);
  const previous = aggregateForMonths(records, previousMonths);
  if (current.quantityKg === 0 && current.tradeValue === 0) return null;
  if (previous.quantityKg === 0 && previous.tradeValue === 0) return null;
  return comparison(current, previous);
}

export function buildRolling12Comparison(records: TradeRecord[], latestMonth: string) {
  const latestMonths = new Set(monthsEndingAt(latestMonth, 12));
  const previousMonths = new Set(monthsEndingAt(previousMonth(latestMonth, 12), 12));
  if (!hasEveryMonth(records, latestMonths) || !hasEveryMonth(records, previousMonths)) return null;
  const current = aggregateForMonths(records, latestMonths);
  const previous = aggregateForMonths(records, previousMonths);
  if (current.quantityKg === 0 && current.tradeValue === 0) return null;
  if (previous.quantityKg === 0 && previous.tradeValue === 0) return null;
  return comparison(current, previous);
}

export function buildMonthlyTrend(records: TradeRecord[], latestMonth: string, periodMonths: number): MonthlyTrendRow[] {
  return monthsEndingAt(latestMonth, periodMonths).map(month => ({month, ...aggregateForMonths(records, new Set([month]))}));
}

export function buildSuppliers(records: TradeRecord[], latestMonth: string, periodMonths: number): SupplierRow[] {
  const displayMonths = new Set(monthsEndingAt(latestMonth, periodMonths));
  const latest12 = new Set(monthsEndingAt(latestMonth, 12));
  const previous12 = new Set(monthsEndingAt(previousMonth(latestMonth, 12), 12));
  const byPartner = new Map<string, TradeRecord[]>();
  for (const record of records) {
    if (!isCountryPartner(record.partnerCode)) continue;
    const rows = byPartner.get(record.partnerCode) ?? [];
    rows.push(record);
    byPartner.set(record.partnerCode, rows);
  }
  const total = aggregateForMonths(records.filter(record => isCountryPartner(record.partnerCode)), displayMonths).quantityKg;
  const rows = Array.from(byPartner.entries()).map(([code, partnerRecords]) => {
    const selected = aggregateForMonths(partnerRecords, displayMonths);
    const current = aggregateForMonths(partnerRecords, latest12);
    const previous = aggregateForMonths(partnerRecords, previous12);
    return {
      rank: 0,
      originCode: code,
      origin: partnerRecords[0]?.partnerName ?? code,
      ...selected,
      marketSharePct: marketShare(selected.quantityKg, total),
      changePct: percentageChange(current.quantityKg, previous.quantityKg),
    };
  }).filter(row => row.quantityKg > 0 || row.tradeValue > 0)
    .sort((a, b) => b.quantityKg - a.quantityKg || b.tradeValue - a.tradeValue);
  return rows.map((row, index) => ({...row, rank: index + 1}));
}

export function buildOriginEvolution(records: TradeRecord[], latestMonth: string, limit = 10): OriginEvolutionRow[] {
  const latest12 = new Set(monthsEndingAt(latestMonth, 12));
  const previous12 = new Set(monthsEndingAt(previousMonth(latestMonth, 12), 12));
  const countryRecords = records.filter(record => isCountryPartner(record.partnerCode));
  const currentTotal = aggregateForMonths(countryRecords, latest12).quantityKg;
  const previousTotal = aggregateForMonths(countryRecords, previous12).quantityKg;
  const byPartner = new Map<string, TradeRecord[]>();
  for (const record of countryRecords) {
    const rows = byPartner.get(record.partnerCode) ?? [];
    rows.push(record);
    byPartner.set(record.partnerCode, rows);
  }
  return Array.from(byPartner.entries()).map(([code, partnerRecords]) => {
    const current = aggregateForMonths(partnerRecords, latest12);
    const previous = aggregateForMonths(partnerRecords, previous12);
    const currentSharePct = marketShare(current.quantityKg, currentTotal);
    const previousSharePct = marketShare(previous.quantityKg, previousTotal);
    return {
      originCode: code,
      origin: partnerRecords[0]?.partnerName ?? code,
      latest12QuantityKg: current.quantityKg,
      previous12QuantityKg: previous.quantityKg,
      changePct: percentageChange(current.quantityKg, previous.quantityKg),
      currentSharePct,
      previousSharePct,
      shareChangePp: currentSharePct != null && previousSharePct != null ? currentSharePct - previousSharePct : null,
    };
  }).filter(row => row.latest12QuantityKg > 0 || row.previous12QuantityKg > 0)
    .sort((a, b) => b.latest12QuantityKg - a.latest12QuantityKg)
    .slice(0, limit);
}

const fmtPct = (value: number) => `${Math.abs(value).toFixed(1)}%`;
const fmtShare = (value: number) => `${value.toFixed(1)}%`;

export function buildBrokerageSignals(
  rolling: ComparisonBlock | null,
  monthly: ComparisonBlock | null,
  origins: OriginEvolutionRow[],
  direction: TradeDirection = 'imports',
): BrokerageSignal[] {
  const signals: BrokerageSignal[] = [];
  const flowLabel = direction === 'imports' ? 'Import' : 'Export';
  const volumeNoun = direction === 'imports' ? 'Imported' : 'Exported';
  const partnerNoun = direction === 'imports' ? 'origin' : 'destination';
  const partnerShareNoun = direction === 'imports' ? 'imported' : 'exported';
  const volumeChange = rolling?.quantity.changePct;
  if (volumeChange != null && Math.abs(volumeChange) >= SIGNAL_THRESHOLDS.meaningfulVolumeChangePct) {
    signals.push({kind: volumeChange > 0 ? 'positive' : 'negative', title: `${flowLabel} volume ${volumeChange > 0 ? 'increasing' : 'decreasing'}`, evidence: `${volumeNoun} volume during the latest 12 months was ${fmtPct(volumeChange)} ${volumeChange > 0 ? 'higher' : 'lower'} than during the preceding 12 months.`});
  }
  const unitChange = rolling?.unitValue.changePct;
  if (unitChange != null && Math.abs(unitChange) >= SIGNAL_THRESHOLDS.meaningfulUnitValueChangePct) {
    signals.push({kind: unitChange > 0 ? 'positive' : 'negative', title: unitChange > 0 ? 'Trade unit value strengthening' : 'Trade unit value weakening', evidence: `Trade unit value during the latest 12 months was ${fmtPct(unitChange)} ${unitChange > 0 ? 'higher' : 'lower'} than during the preceding 12 months.`});
  }
  for (const origin of origins.slice(0, 8)) {
    if (origin.shareChangePp == null || origin.currentSharePct == null || origin.previousSharePct == null) continue;
    if (origin.previousSharePct < SIGNAL_THRESHOLDS.emergingPreviousSharePct && origin.currentSharePct >= SIGNAL_THRESHOLDS.emergingCurrentSharePct) {
      signals.push({kind: 'positive', title: `New or emerging ${partnerNoun}`, evidence: `${origin.origin} represented ${fmtShare(origin.currentSharePct)} of ${partnerShareNoun} volume in the latest 12 months, compared with ${fmtShare(origin.previousSharePct)} previously.`});
    } else if (Math.abs(origin.shareChangePp) >= SIGNAL_THRESHOLDS.meaningfulShareChangePp) {
      signals.push({kind: origin.shareChangePp > 0 ? 'positive' : 'negative', title: origin.shareChangePp > 0 ? `${partnerNoun[0].toUpperCase()}${partnerNoun.slice(1)} gaining share` : `${partnerNoun[0].toUpperCase()}${partnerNoun.slice(1)} losing share`, evidence: `${origin.origin} represented ${fmtShare(origin.currentSharePct)} of ${partnerShareNoun} volume in the latest 12 months, compared with ${fmtShare(origin.previousSharePct)} during the preceding 12 months.`});
    }
    if (signals.length >= 5) break;
  }
  const latestMonthChange = monthly?.quantity.changePct;
  if (latestMonthChange != null && Math.abs(latestMonthChange) >= SIGNAL_THRESHOLDS.unusualRecentMovementPct && signals.length < 6) {
    signals.push({kind: latestMonthChange > 0 ? 'positive' : 'negative', title: 'Unusual recent movement', evidence: `Latest-month volume was ${fmtPct(latestMonthChange)} ${latestMonthChange > 0 ? 'higher' : 'lower'} than the same month a year earlier.`});
  }
  return signals;
}

export function buildWorthInvestigating(signals: BrokerageSignal[], origins: OriginEvolutionRow[], direction: TradeDirection = 'imports') {
  const volumeUp = signals.some(signal => signal.title.endsWith('volume increasing'));
  const volumeDown = signals.some(signal => signal.title.endsWith('volume decreasing'));
  const partnerWord = direction === 'imports' ? 'Origin' : 'Destination';
  const losingShare = signals.some(signal => signal.title === `${partnerWord} losing share`);
  const gainingShare = signals.some(signal => signal.title === `${partnerWord} gaining share` || signal.title === `New or emerging ${partnerWord.toLowerCase()}`);
  if (direction === 'imports') {
    if (volumeUp && losingShare) return 'Import volume is increasing while at least one leading origin is losing share. Review alternative suppliers and current buyer requirements.';
    if (volumeUp && gainingShare) return 'Import volume is increasing and supplier shares are shifting. Review which origins are gaining ground and whether the change is commercially relevant.';
    if (volumeDown) return 'Import volume is lower than in the preceding comparable period. Check seasonality, buyer requirements and supply conditions before drawing a commercial conclusion.';
    if (origins.some(origin => origin.shareChangePp != null && Math.abs(origin.shareChangePp) >= SIGNAL_THRESHOLDS.meaningfulShareChangePp)) return 'Overall import volume is not showing a large move, but supplier shares are changing. The origin shift is worth checking against current market conditions.';
    return 'Trade volumes are broadly stable and no large origin-share movement is visible in the comparable period.';
  }
  if (volumeUp && losingShare) return 'Export volume is increasing while at least one leading destination is losing share. Review which destination markets are changing and whether the shift is commercially relevant.';
  if (volumeUp && gainingShare) return 'Export volume is increasing and destination shares are shifting. Review which markets are gaining ground and whether the change is commercially relevant.';
  if (volumeDown) return 'Export volume is lower than in the preceding comparable period. Check seasonality and destination-market conditions before drawing a commercial conclusion.';
  if (origins.some(origin => origin.shareChangePp != null && Math.abs(origin.shareChangePp) >= SIGNAL_THRESHOLDS.meaningfulShareChangePp)) return 'Overall export volume is not showing a large move, but destination shares are changing. The market shift is worth checking against current conditions.';
  return 'Trade volumes are broadly stable and no large destination-share movement is visible in the comparable period.';
}
