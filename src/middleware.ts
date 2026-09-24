import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const publicLocaleMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // These are deliberately unlocalised. Authorisation happens on the server
  // in each desk page/handler, independently of middleware execution.
  if (path === '/' || path === '/desk' || path.startsWith('/desk/')) {
    const response = NextResponse.next();
    if (path.startsWith('/desk')) {
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }
  return publicLocaleMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};
