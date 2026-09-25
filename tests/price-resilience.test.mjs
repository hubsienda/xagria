import assert from 'node:assert/strict';
import {fetchEuJson} from '../src/lib/prices/eu-request.ts';
import {EU_MAX_RETRY_AFTER_MS, EU_OPTIONS_AVAILABILITY_MONTHS} from '../src/lib/prices/config.ts';
import {PriceDataError} from '../src/lib/prices/errors.ts';

const context = {purpose: 'analysis', path: '/api/fruitAndVegetable/pricesSupplyChain', marketCode: 'ES', product: 'Tomatoes', stage: 'Farmgate price'};
const originalWarn = console.warn;
console.warn = () => {};

try {
  let capturedInit;
  const cached = await fetchEuJson({
    url: 'https://example.test/success', context, revalidateSeconds: 123, expectArray: true,
    fetchImpl: async (_url, init) => { capturedInit = init; return new Response('[]', {status: 200, headers: {'content-type': 'application/json'}}); },
    sleepImpl: async () => {},
  });
  assert.deepEqual(cached, []);
  assert.equal(capturedInit.next.revalidate, 123);
  assert.equal(EU_OPTIONS_AVAILABILITY_MONTHS, 6);

  let calls = 0;
  const retryNetwork = await fetchEuJson({
    url: 'https://example.test/network', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('temporary network failure');
      return new Response('[]', {status: 200});
    },
    sleepImpl: async () => {},
  });
  assert.deepEqual(retryNetwork, []);
  assert.equal(calls, 2);

  calls = 0;
  const sleeps = [];
  const retry429 = await fetchEuJson({
    url: 'https://example.test/429', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return new Response('{}', {status: 429, headers: {'retry-after': '0'}});
      return new Response('[]', {status: 200});
    },
    sleepImpl: async ms => { sleeps.push(ms); },
  });
  assert.deepEqual(retry429, []);
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [0]);

  for (const status of [502, 503, 504]) {
    calls = 0;
    const result = await fetchEuJson({
      url: `https://example.test/${status}`, context, revalidateSeconds: 1, expectArray: true,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) return new Response('{}', {status});
        return new Response('[]', {status: 200});
      },
      sleepImpl: async () => {},
    });
    assert.deepEqual(result, []);
    assert.equal(calls, 2, `HTTP ${status} retries once`);
  }

  calls = 0;
  await assert.rejects(() => fetchEuJson({
    url: 'https://example.test/400', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => { calls += 1; return new Response('{}', {status: 400}); },
    sleepImpl: async () => {},
  }), PriceDataError);
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(() => fetchEuJson({
    url: 'https://example.test/500', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => { calls += 1; return new Response('{}', {status: 500}); },
    sleepImpl: async () => {},
  }), PriceDataError);
  assert.equal(calls, 1);

  calls = 0;
  const noData = await fetchEuJson({
    url: 'https://example.test/404', context, revalidateSeconds: 1, expectArray: true, allowNotFoundEmpty: true,
    fetchImpl: async () => { calls += 1; return new Response('{}', {status: 404}); },
    sleepImpl: async () => {},
  });
  assert.deepEqual(noData, []);
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(() => fetchEuJson({
    url: 'https://example.test/malformed-json', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => { calls += 1; return new Response('not-json', {status: 200}); },
    sleepImpl: async () => {},
  }), PriceDataError);
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(() => fetchEuJson({
    url: 'https://example.test/malformed-shape', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => { calls += 1; return new Response('{"unexpected":true}', {status: 200}); },
    sleepImpl: async () => {},
  }), PriceDataError);
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(() => fetchEuJson({
    url: 'https://example.test/long-retry-after', context, revalidateSeconds: 1, expectArray: true,
    fetchImpl: async () => { calls += 1; return new Response('{}', {status: 429, headers: {'retry-after': String(Math.ceil((EU_MAX_RETRY_AFTER_MS + 10_000) / 1000))}}); },
    sleepImpl: async () => { throw new Error('long Retry-After must not block'); },
  }), PriceDataError);
  assert.equal(calls, 1);

  console.log('PASS: Commission timeout/network, 429, 5xx, retry, no-data, malformed response and cache directives');
} finally {
  console.warn = originalWarn;
}
