import {EU_MAX_RETRY_AFTER_MS, EU_RETRY_DELAY_MS, PRICE_TIMEOUT_MS} from './config';
import {PriceDataError} from './errors';

export type EuRequestPurpose = 'metadata' | 'options' | 'analysis';

export interface EuRequestContext {
  purpose: EuRequestPurpose;
  path: string;
  marketCode?: string;
  product?: string;
  stage?: string;
}

type FetchLike = typeof fetch;
type Sleep = (ms: number) => Promise<void>;

const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);
const DEFAULT_MESSAGE = 'European Commission price data are temporarily unavailable. Try again shortly.';
const MALFORMED_MESSAGE = 'European Commission price data returned an unexpected response. Try again shortly.';

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function retryAfterMs(value: string | null, now = Date.now()) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, date - now);
}

function logFailure(context: EuRequestContext, detail: {status?: number; durationMs: number; attempt: number; category: string}) {
  console.warn('[Price Signals][European Commission]', {
    provider: 'eu',
    endpoint: context.path,
    purpose: context.purpose,
    marketCode: context.marketCode,
    product: context.product,
    stage: context.stage,
    status: detail.status,
    durationMs: detail.durationMs,
    attempt: detail.attempt,
    timeoutMs: PRICE_TIMEOUT_MS,
    category: detail.category,
  });
}

export async function fetchEuJson<T>(input: {
  url: string;
  context: EuRequestContext;
  revalidateSeconds: number;
  allowNotFoundEmpty?: boolean;
  expectArray?: boolean;
  fetchImpl?: FetchLike;
  sleepImpl?: Sleep;
}): Promise<T> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const sleepImpl = input.sleepImpl ?? sleep;

  for (let attempt = 0; attempt < 2; attempt++) {
    const started = Date.now();
    try {
      const response = await fetchImpl(input.url, {
        headers: {accept: 'application/json'},
        next: {revalidate: input.revalidateSeconds},
        signal: AbortSignal.timeout(PRICE_TIMEOUT_MS),
      });
      const durationMs = Date.now() - started;

      if (response.status === 404 && input.allowNotFoundEmpty) return [] as T;

      if (!response.ok) {
        const isTransient = TRANSIENT_STATUSES.has(response.status);
        const retryAfter = retryAfterMs(response.headers.get('retry-after'));
        logFailure(input.context, {
          status: response.status,
          durationMs,
          attempt: attempt + 1,
          category: isTransient ? 'transient-http' : 'permanent-http',
        });

        if (isTransient && attempt === 0) {
          const delay = retryAfter ?? EU_RETRY_DELAY_MS;
          if (delay <= EU_MAX_RETRY_AFTER_MS) {
            await sleepImpl(delay);
            continue;
          }
        }
        throw new PriceDataError(DEFAULT_MESSAGE, `EU price API HTTP ${response.status}`);
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        logFailure(input.context, {durationMs, attempt: attempt + 1, category: 'malformed-json'});
        throw new PriceDataError(MALFORMED_MESSAGE, 'EU price API returned invalid JSON');
      }

      if (input.expectArray && !Array.isArray(json)) {
        logFailure(input.context, {durationMs, attempt: attempt + 1, category: 'malformed-shape'});
        throw new PriceDataError(MALFORMED_MESSAGE, 'EU price API returned a non-array payload');
      }

      return json as T;
    } catch (error) {
      if (error instanceof PriceDataError) throw error;
      const durationMs = Date.now() - started;
      const name = error instanceof Error ? error.name : '';
      const category = /timeout|abort/i.test(name) ? 'timeout' : 'network';
      logFailure(input.context, {durationMs, attempt: attempt + 1, category});
      if (attempt === 0) {
        await sleepImpl(EU_RETRY_DELAY_MS);
        continue;
      }
      throw new PriceDataError(DEFAULT_MESSAGE, error instanceof Error ? error.message : String(error));
    }
  }

  throw new PriceDataError(DEFAULT_MESSAGE);
}
