import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getConfig, SESSION_COOKIE, verifySession} from './session';

export async function hasDeskSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

// Call in every private page and server action, before reading or changing data.
// Route handlers must call hasDeskSession themselves and return 401 on failure.
export async function requireDeskSession() {
  if (!getConfig()) redirect('/desk/login?error=configuration');
  if (!await hasDeskSession()) redirect('/desk/login');
}
