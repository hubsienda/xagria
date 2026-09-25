import {NextResponse} from 'next/server';
import {hasDeskSession} from '@/lib/desk/auth';
import {analysePriceSignals} from '@/lib/prices/analysis';
import {PriceDataError} from '@/lib/prices/errors';
import {getPriceOptionsForMarket} from '@/lib/prices/providers';
import type {PriceStage} from '@/lib/prices/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!await hasDeskSession()) return NextResponse.json({error: 'Unauthorised'}, {status: 401});
  let body: {mode?: unknown; marketCode?: unknown; sourceProduct?: unknown; variety?: unknown; stage?: unknown; periodMonths?: unknown};
  try { body = await request.json(); }
  catch { return NextResponse.json({error: 'Invalid request.'}, {status: 400}); }

  if (body.mode === 'options') {
    if (typeof body.marketCode !== 'string') return NextResponse.json({error: 'Invalid Price Signals market.'}, {status: 400});
    try {
      const options = await getPriceOptionsForMarket(body.marketCode);
      return NextResponse.json({options});
    } catch (error) {
      if (error instanceof PriceDataError) return NextResponse.json({error: error.userMessage}, {status: 503});
      if (error instanceof Error && error.message === 'INVALID_MARKET') return NextResponse.json({error: 'Invalid Price Signals market.'}, {status: 400});
      console.error('Price Signals options failed', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({error: 'Price data are temporarily unavailable. Try again shortly.'}, {status: 503});
    }
  }

  if (body.mode !== 'analyse' || typeof body.marketCode !== 'string' || typeof body.sourceProduct !== 'string' || typeof body.variety !== 'string' || typeof body.stage !== 'string' || typeof body.periodMonths !== 'number') {
    return NextResponse.json({error: 'Invalid Price Signals selection.'}, {status: 400});
  }
  try {
    const analysis = await analysePriceSignals({marketCode: body.marketCode, sourceProduct: body.sourceProduct, variety: body.variety, stage: body.stage as PriceStage, periodMonths: body.periodMonths});
    return NextResponse.json({analysis});
  } catch (error) {
    if (error instanceof PriceDataError) return NextResponse.json({error: error.userMessage}, {status: 503});
    if (error instanceof Error && ['INVALID_MARKET', 'INVALID_SELECTION', 'INVALID_STAGE', 'INVALID_PERIOD'].includes(error.message)) return NextResponse.json({error: 'Invalid Price Signals selection.'}, {status: 400});
    if (error instanceof Error && error.message === 'NO_RESULTS') return NextResponse.json({error: 'No price series is available for this product, market and stage.'}, {status: 404});
    console.error('Price Signals analysis failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({error: 'Price data are temporarily unavailable. Try again shortly.'}, {status: 503});
  }
}
