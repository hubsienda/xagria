import {NextResponse} from 'next/server';
import {hasDeskSession} from '@/lib/desk/auth';
import {analyseTradeFlows} from '@/lib/trade/analysis';
import {ComextError} from '@/lib/trade/comext';
import type {TradeDirection} from '@/lib/trade/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!await hasDeskSession()) return NextResponse.json({error: 'Unauthorised'}, {status: 401});
  let body: {productId?: unknown; reporterCode?: unknown; direction?: unknown; periodMonths?: unknown};
  try { body = await request.json(); } catch { return NextResponse.json({error: 'Invalid request.'}, {status: 400}); }
  if (typeof body.productId !== 'string' || typeof body.reporterCode !== 'string' || (body.direction !== 'imports' && body.direction !== 'exports') || typeof body.periodMonths !== 'number') {
    return NextResponse.json({error: 'Invalid Trade Flows selection.'}, {status: 400});
  }
  try {
    const analysis = await analyseTradeFlows({productId: body.productId, reporterCode: body.reporterCode, direction: body.direction as TradeDirection, periodMonths: body.periodMonths});
    return NextResponse.json({analysis});
  } catch (error) {
    if (error instanceof ComextError) return NextResponse.json({error: error.userMessage}, {status: 503});
    if (error instanceof Error && ['INVALID_PRODUCT', 'INVALID_REPORTER', 'INVALID_DIRECTION', 'INVALID_PERIOD'].includes(error.message)) return NextResponse.json({error: 'Invalid Trade Flows selection.'}, {status: 400});
    if (error instanceof Error && error.message === 'NO_RESULTS') return NextResponse.json({error: 'No trade data were returned for this product, market and period.'}, {status: 404});
    console.error('Trade Flows analysis failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({error: 'Eurostat data are temporarily unavailable. Try again shortly.'}, {status: 503});
  }
}
