// app/api/notarize/route.ts
// HTTP adapter for the notarize flow. Thin shim.
//
// POST /api/notarize
//   Body: { statement: string }
//   200: KalipsoNotarization
//   4xx/5xx: { error: { code, message, correlationId } }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notarize } from '@/lib/agent/notarize';
import { KalipsoError, KalipsoErrorCode, generateCorrelationId } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Force Node runtime — Hedera SDK depends on Node crypto, not edge runtime.
export const runtime = 'nodejs';
// No caching — every notarisation is unique.
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  statement: z.string(),
});

export async function POST(req: NextRequest) {
  // Generate correlation ID at the route boundary so even parse errors carry one.
  const routeCorrelationId = generateCorrelationId();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const err = new KalipsoError(
      KalipsoErrorCode.BAD_STATEMENT,
      'Request body is not valid JSON',
      { correlationId: routeCorrelationId },
    );
    return NextResponse.json(err.toResponseBody(), { status: err.httpStatus });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const err = new KalipsoError(
      KalipsoErrorCode.BAD_STATEMENT,
      `Invalid request: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      { correlationId: routeCorrelationId },
    );
    return NextResponse.json(err.toResponseBody(), { status: err.httpStatus });
  }

  try {
    const result = await notarize(parsed.data.statement);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof KalipsoError) {
      return NextResponse.json(err.toResponseBody(), { status: err.httpStatus });
    }

    // Unexpected error — log it, wrap as INTERNAL, never leak internals.
    logger.error({ correlationId: routeCorrelationId, err }, 'notarize_route_internal_error');
    const wrapped = new KalipsoError(
      KalipsoErrorCode.INTERNAL,
      'An unexpected error occurred. Please try again.',
      { correlationId: routeCorrelationId },
    );
    return NextResponse.json(wrapped.toResponseBody(), { status: wrapped.httpStatus });
  }
}
