export const PRICE_SIGNAL_THRESHOLDS = {
  previousObservationPct: 7.5,
  recentAveragePct: 7.5,
  yearOnYearPct: 10,
  seasonalPct: 15,
  nearRangePct: 5,
} as const;

export const PRICE_REVALIDATE_SECONDS = 6 * 60 * 60;
export const PRICE_TIMEOUT_MS = 20_000;

export const EU_PRICE_BASE_URL = 'https://api.tech.ec.europa.eu/agrifood';
export const EU_PRICE_SOURCE_URL = 'https://agriculture.ec.europa.eu/farming/crops/fruit-and-vegetables_en';
export const EU_PRICE_SOURCE_NAME = 'European Commission Agri-food Data Portal — Fruit and vegetables supply-chain prices';

export const DEFRA_PAGE_URL = 'https://www.gov.uk/government/statistical-data-sets/wholesale-fruit-and-vegetable-prices-weekly-average';
export const DEFRA_SOURCE_NAME = 'DEFRA — Wholesale fruit and vegetable prices';
