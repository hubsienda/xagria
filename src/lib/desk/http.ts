import 'server-only';
import type {NextRequest} from 'next/server';

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (!origin || (fetchSite && fetchSite !== 'same-origin')) return false;
  try {
    const source = new URL(origin);
    // Next can normalise loopback hostnames in nextUrl; use the actual Host.
    return source.origin === origin && source.host === request.headers.get('host') &&
      source.protocol === request.nextUrl.protocol;
  } catch { return false; }
}
