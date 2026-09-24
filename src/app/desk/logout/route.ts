import {NextRequest, NextResponse} from 'next/server';
import {hasDeskSession} from '@/lib/desk/auth';
import {SESSION_COOKIE, cookieOptions} from '@/lib/desk/session';
import {isSameOrigin} from '@/lib/desk/http';
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new NextResponse('Forbidden', {status: 403});
  const authenticated = await hasDeskSession();
  const response = authenticated
    ? NextResponse.redirect(new URL('/desk/login', request.url), 303)
    : new NextResponse('Unauthorised', {status: 401});
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(SESSION_COOKIE, '', {...cookieOptions, maxAge: 0, expires: new Date(0)});
  return response;
}
