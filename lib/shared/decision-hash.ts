// lib/shared/decision-hash.ts
// Lifted from ai-hcs-verifiable-decisions/src/lib/hederaService.ts
//
// This is the canonical Kalipso hashing function. Single source of truth.
// All weeks (1-5) use this function. Never write a second SHA-256
// implementation anywhere else in the codebase.
//
// Algorithm: SHA-256 over a pipe-delimited string of fields, in order.
// Pipe-delimited (rather than JSON.stringify) avoids field-ordering and
// whitespace ambiguity. Deterministic across re-hashes.

import { createHash } from 'node:crypto';

/**
 * Generate a deterministic SHA-256 hash for a statement notarization.
 *
 * @param statement   The user's raw input, trimmed.
 * @param aiComment   Kalipso's response, trimmed.
 * @param timestamp   ISO-8601 timestamp string (UTC recommended).
 * @returns           Hex-encoded SHA-256 digest (64 chars).
 */
export function generateNotarizationHash(
  statement: string,
  aiComment: string,
  timestamp: string,
): string {
  const content = `${statement.trim()}|${aiComment.trim()}|${timestamp}`;
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Validate a hash by recomputing it from the original fields and
 * comparing. Used for downstream verification (Week 5 audit trail).
 *
 * @returns true if the recomputed hash matches the expected hash exactly.
 */
export function validateNotarizationHash(
  statement: string,
  aiComment: string,
  timestamp: string,
  expectedHash: string,
): boolean {
  const recomputed = generateNotarizationHash(statement, aiComment, timestamp);
  return recomputed === expectedHash;
}
