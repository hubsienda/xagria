import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createSession, verifySession, validPassphrase, getConfig, SESSION_SECONDS} from '../src/lib/desk/session.ts';

// Test credentials exist only in this process and its local test server.
process.env.XAGRIA_DESK_PASSPHRASE = randomBytes(24).toString('hex');
process.env.XAGRIA_SESSION_SECRET = randomBytes(32).toString('hex');
const passphrase = process.env.XAGRIA_DESK_PASSPHRASE;
const secret = process.env.XAGRIA_SESSION_SECRET;
const now = Math.floor(Date.now() / 1000);
assert(validPassphrase(passphrase));
assert(!validPassphrase('invalid'));
const token = createSession(now);
assert(verifySession(token, now));
assert(!verifySession(token, now + SESSION_SECONDS));
assert(!verifySession(token, now - 1));
assert(!verifySession(token + 'x', now));
assert(!verifySession('bad.token', now));
process.env.XAGRIA_DESK_PASSPHRASE = randomBytes(24).toString('hex');
assert(!verifySession(token, now));
process.env.XAGRIA_DESK_PASSPHRASE = passphrase;
process.env.XAGRIA_SESSION_SECRET = 'short';
assert.equal(getConfig(), null);
assert(!verifySession(token, now));
assert.throws(() => createSession());
process.env.XAGRIA_SESSION_SECRET = secret;
console.log('PASS: session signing, expiry, tampering, credential rotation and invalid configuration');

const originalError = console.error;
const diagnostics = [];
console.error = (...args) => diagnostics.push(args.join(' '));
try {
  const cases = [
    ['', secret, 'PASSPHRASE_MISSING_OR_EMPTY'],
    ['short', secret, 'PASSPHRASE_BELOW_MINIMUM'],
    ['x'.repeat(1025), secret, 'PASSPHRASE_ABOVE_MAXIMUM'],
    [passphrase, '', 'SESSION_SECRET_MISSING_OR_EMPTY'],
    [passphrase, 'short', 'SESSION_SECRET_BELOW_MINIMUM'],
    [passphrase, 'x'.repeat(4097), 'SESSION_SECRET_ABOVE_MAXIMUM'],
    [passphrase, passphrase, 'CREDENTIALS_IDENTICAL']
  ];
  for (const [p, s, code] of cases) {
    process.env.XAGRIA_DESK_PASSPHRASE = p;
    process.env.XAGRIA_SESSION_SECRET = s;
    assert.equal(getConfig(), null);
    assert.equal(diagnostics.at(-1), '[XAGRIA_DESK_CONFIG_INVALID] ' + code);
    const count = diagnostics.length;
    assert.equal(getConfig(), null);
    assert.equal(diagnostics.length, count);
  }
} finally {
  console.error = originalError;
  process.env.XAGRIA_DESK_PASSPHRASE = passphrase;
  process.env.XAGRIA_SESSION_SECRET = secret;
}
assert(getConfig());
assert(diagnostics.every(line => !line.includes(passphrase) && !line.includes(secret)));
console.log('PASS: all configuration failure codes, log deduplication and no credential disclosure');


const port = 3198;
const origin = `http://localhost:${port}`;
async function withServer(env, run) {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {env: {...process.env, ...env}, stdio: ['ignore', 'pipe', 'pipe']});
  let output = '';
  server.stdout.on('data', data => {output += data;});
  server.stderr.on('data', data => {output += data;});
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error('Test server exited: ' + output);
      if (output.includes('Ready')) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(output.includes('Ready'), 'Server readiness');
    await run();
  } finally {
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
    }
  }
}
const request = (path, options = {}) => fetch(origin + path, {redirect: 'manual', ...options});
const post = (path, body, cookie, extra = {}) => request(path, {method: 'POST', headers: {origin, 'content-type': 'application/x-www-form-urlencoded', ...(cookie ? {cookie} : {}), ...extra}, body});
await withServer({}, async () => {
  const gateway = await request('/');
  assert.equal(gateway.status, 200);
  const html = await gateway.text();
  assert(html.includes('href="/desk"') && html.includes('href="/en"'));
  for (const locale of ['en', 'es', 'it']) {
    const home = await request('/' + locale);
    assert.equal(home.status, 200, locale);
    for (const tool of ['tank-mix', 'harvest-loss', 'seed-rate', 'fertiliser-rate', 'sprayer-calibration', 'moisture-correction']) {
      assert.equal((await request(`/${locale}/${tool}`)).status, 200, `${locale}/${tool}`);
    }
    const detected = await request('/', {headers: {'accept-language': locale}});
    assert((await detected.text()).includes(`href="/${locale}"`));
  }
  assert((await request('/tank-mix', {headers: {'accept-language': 'es'}})).headers.get('location')?.endsWith('/es/tank-mix'));
  const denied = await request('/desk');
  assert.equal(denied.status, 307);
  assert(!(await denied.text()).includes('Agricultural Intelligence Desk'));
  assert.equal((await request('/desk/trade-flows')).status, 307);
  assert.equal((await request('/desk/api/session')).status, 401);
  assert.equal((await request('/desk/api/trade-flows', {method: 'POST', headers: {origin, 'content-type': 'application/json'}, body: '{}'})).status, 401);
  // Even bypassing route middleware must not bypass server authorisation.
  assert.equal((await request('/desk/api/session', {headers: {'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware'}})).status, 401);
  assert.equal((await request('/desk/login')).status, 200);
  const invalid = await post('/desk/login/submit', new URLSearchParams({passphrase: 'wrong'}));
  assert.equal(invalid.status, 303);
  assert(invalid.headers.get('location').includes('error=invalid'));
  assert.equal((await post('/desk/login/submit', '', undefined, {origin: 'https://other.example'})).status, 403);
  const login = await post('/desk/login/submit', new URLSearchParams({passphrase}));
  assert.equal(login.status, 303);
  assert(login.headers.get('location').endsWith('/desk'));
  const setCookie = login.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=strict', 'Path=/desk', 'Max-Age=28800']) assert(setCookie.includes(flag), flag);
  const cookie = setCookie.split(';')[0];
  const desk = await request('/desk', {headers: {cookie}});
  assert.equal(desk.status, 200);
  const deskHtml = await desk.text();
  assert(deskHtml.includes('Agricultural Intelligence Desk'));
  assert(deskHtml.includes('LIVE'));
  assert(deskHtml.includes('href="/desk/trade-flows"'));
  assert(deskHtml.includes('Planned'));
  assert(!deskHtml.includes(passphrase) && !deskHtml.includes(secret));
  const tradeFlows = await request('/desk/trade-flows', {headers: {cookie}});
  assert.equal(tradeFlows.status, 200);
  const tradeFlowsHtml = await tradeFlows.text();
  assert(tradeFlowsHtml.includes('Trade Flows'));
  assert(!tradeFlowsHtml.includes(passphrase) && !tradeFlowsHtml.includes(secret));
  assert.equal((await request('/desk/api/session', {headers: {cookie}})).status, 200);
  for (const value of [createSession(now - SESSION_SECONDS), token + 'x']) {
    const headers = {cookie: `xagria_desk=${value}`};
    assert.equal((await request('/desk', {headers})).status, 307);
    assert.equal((await request('/desk/trade-flows', {headers})).status, 307);
    assert.equal((await request('/desk/api/session', {headers})).status, 401);
  }
  assert.equal((await post('/desk/logout', '', undefined)).status, 401);
  const logout = await post('/desk/logout', '', cookie);
  assert.equal(logout.status, 303);
  assert(logout.headers.get('set-cookie').includes('Max-Age=0'));
  const clearedCookie = logout.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/desk', {headers: {cookie: clearedCookie}})).status, 307);
  assert.equal((await request('/desk/trade-flows', {headers: {cookie: clearedCookie}})).status, 307);
  assert.equal((await request('/desk/api/session', {headers: {cookie: clearedCookie}})).status, 401);
  console.log('PASS: gateway, 18 calculator routes, three locale homepages/detection, login, Trade Flows protection, cookie flags, tampering/expiry and logout');
});
await withServer({XAGRIA_SESSION_SECRET: ''}, async () => {
  assert.equal((await request('/desk/api/session', {headers: {cookie: `xagria_desk=${token}`}})).status, 401);
  assert.equal((await request('/desk')).status, 307);
  assert.equal((await request('/desk/trade-flows')).status, 307);
  const login = await request('/desk/login');
  assert((await login.text()).includes('must configure the server'));
  assert.equal((await post('/desk/login/submit', new URLSearchParams({passphrase}))).status, 503);
  console.log('PASS: missing configuration fails closed in pages, login and private endpoint');
});
