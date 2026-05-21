// lib/errors.ts
// Structured errors — every error in Kalipso uses this class.
// Routes catch KalipsoError and translate to JSON responses with
// {error: {code, message, correlationId}} shape.
//
// Non-KalipsoError exceptions are caught at the route boundary and
// re-wrapped as KalipsoError(INTERNAL) — never expose stack traces
// or internal details to clients.

export enum KalipsoErrorCode {
  BAD_STATEMENT = 'BAD_STATEMENT',         // 400 — invalid input
  AGENT_TIMEOUT = 'AGENT_TIMEOUT',         // 504 — Claude or Agent Kit too slow
  AGENT_REFUSED = 'AGENT_REFUSED',         // 422 — Claude refused (content policy)
  HCS_SUBMIT_FAILED = 'HCS_SUBMIT_FAILED', // 502 — Hedera network/fee/key issue
  MIRROR_NODE_DOWN = 'MIRROR_NODE_DOWN',   // 503 — wall couldn't load
  CONFIG_MISSING = 'CONFIG_MISSING',       // 500 — startup misconfig
  INTERNAL = 'INTERNAL',                   // 500 — unexpected catch-all
}

const HTTP_STATUS: Record<KalipsoErrorCode, number> = {
  [KalipsoErrorCode.BAD_STATEMENT]: 400,
  [KalipsoErrorCode.AGENT_TIMEOUT]: 504,
  [KalipsoErrorCode.AGENT_REFUSED]: 422,
  [KalipsoErrorCode.HCS_SUBMIT_FAILED]: 502,
  [KalipsoErrorCode.MIRROR_NODE_DOWN]: 503,
  [KalipsoErrorCode.CONFIG_MISSING]: 500,
  [KalipsoErrorCode.INTERNAL]: 500,
};

export class KalipsoError extends Error {
  public readonly code: KalipsoErrorCode;
  public readonly httpStatus: number;
  public readonly correlationId?: string;
  public readonly cause?: unknown;

  constructor(
    code: KalipsoErrorCode,
    message: string,
    options?: { correlationId?: string; cause?: unknown },
  ) {
    super(message);
    this.name = 'KalipsoError';
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.correlationId = options?.correlationId;
    this.cause = options?.cause;
  }

  /** Format for HTTP response — safe to send to clients. */
  toResponseBody(): { error: { code: string; message: string; correlationId?: string } } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.correlationId ? { correlationId: this.correlationId } : {}),
      },
    };
  }
}

/** Generate a short correlation ID for request tracing. */
export function generateCorrelationId(): string {
  // 8 chars of hex — enough entropy to be unique in logs across a week,
  // short enough to copy/paste comfortably.
  return Math.random().toString(16).slice(2, 10);
}
