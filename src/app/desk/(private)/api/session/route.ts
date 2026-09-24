import {NextResponse} from 'next/server';
import {hasDeskSession} from '@/lib/desk/auth';
export async function GET() {
  // Layouts do not protect route handlers. Always authorise here too.
  if (!await hasDeskSession()) return NextResponse.json({error: 'Unauthorised'}, {status: 401, headers: {'Cache-Control': 'no-store'}});
  return NextResponse.json({authenticated: true}, {headers: {'Cache-Control': 'no-store'}});
}
