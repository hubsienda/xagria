import {NextRequest, NextResponse} from 'next/server';
import {getConfig, validPassphrase, createSession, SESSION_COOKIE, cookieOptions, CONFIG_ERROR} from '@/lib/desk/session';
import {isSameOrigin} from '@/lib/desk/http';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Forbidden', {status: 403});
  if (!getConfig()) return new NextResponse(CONFIG_ERROR, {status: 503, headers: {'Cache-Control': 'no-store'}});
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new NextResponse('Unsupported form', {status: 415});
  // Bound body size even when Content-Length is absent or untrusted.
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse('Invalid form', {status: 400});
  let body = ''; let size = 0; const decoder = new TextDecoder();
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); return new NextResponse('Form too large', {status: 413}); }
    body += decoder.decode(value, {stream: true});
  }
  body += decoder.decode();
  const valid = validPassphrase(new URLSearchParams(body).get('passphrase'));
  if (!valid) {
    const response = NextResponse.redirect(new URL('/desk/login?error=invalid', request.url), 303);
    response.cookies.set(SESSION_COOKIE, '', {...cookieOptions, maxAge: 0});
    return response;
  }
  const response = NextResponse.redirect(new URL('/desk', request.url), 303);
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(SESSION_COOKIE, createSession(), {...cookieOptions, expires: new Date(Date.now() + cookieOptions.maxAge * 1000)});
  return response;
}
