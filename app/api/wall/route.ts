// app/api/wall/route.ts
// GET /api/wall?limit=10
//   200: { entries: WallEntry[] }
//   5xx: { error: { code, message, correlationId } }

import { NextRequest, NextResponse } from 'next/server';
import { fetchTopicMessages } from '@/lib/hedera/topic-messages';
import { KalipsoError, KalipsoErrorCode, generateCorrelationId } from '@/lib/errors';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const correlationId = generateCorrelationId();
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  try {
    const entries = await fetchTopicMessages({ limit });
    return NextResponse.json({ entries }, { status: 200 });
  } catch (err) {
    if (err instanceof KalipsoError) {
      return NextResponse.json(err.toResponseBody(), { status: err.httpStatus });
    }

    logger.error({ correlationId, err }, 'wall_route_internal_error');
    const wrapped = new KalipsoError(
      KalipsoErrorCode.INTERNAL,
      'Could not load the ledger.',
      { correlationId },
    );
    return NextResponse.json(wrapped.toResponseBody(), { status: wrapped.httpStatus });
  }
}
