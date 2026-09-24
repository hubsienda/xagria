// Verified against the official Eurostat Comext catalogue/API in September 2026.
// DS-045409: EU trade since 1988 by HS2-4-6 and CN8.
export const COMEXT_DATASET = 'DS-045409';
export const COMEXT_DATASET_LABEL = 'EU trade since 1988 by HS2-4-6 and CN8';
export const COMEXT_BASE_URL = 'https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data';
export const COMEXT_SOURCE_URL = 'https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/comext-database';
export const COMEXT_REVALIDATE_SECONDS = 6 * 60 * 60;
export const COMEXT_TIMEOUT_MS = 20_000;
