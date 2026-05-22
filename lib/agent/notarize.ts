// lib/agent/notarize.ts
// The single public business-logic function.
// Orchestrates the full Kalipso notarization flow.
//
// Flow:
//   1. Validate the statement (length, non-empty)
//   2. Classify register (EVERYDAY | SERIOUS)
//   3. Query Claude with the appropriate persona prompt
//   4. Compute canonical hash
//   5. Submit to HCS deterministically (hybrid pattern)
//   6. Return the full KalipsoNotarization to the caller
//
// This function is the only place that knows the full flow.
// Routes call this and return its result. Tests call this directly.

import { queryClaude } from '../shared/claude-query';
import { generateNotarizationHash } from '../shared/decision-hash';
import { classifyStatement } from '../serious-classifier';
import { systemPromptFor } from '../kalipso-prompt';
import { submitNotarizationToHcs } from '../hedera/submit';
import { env } from '../env';
import { logger } from '../logger';
import { KalipsoError, KalipsoErrorCode, generateCorrelationId } from '../errors';
import type { KalipsoNotarization } from '../types';

const STATEMENT_MIN_CHARS = 1;
const STATEMENT_MAX_CHARS = 500;
const CLAUDE_TIMEOUT_MS = 25_000;

/**
 * Notarise a statement: generate Kalipso's response, hash, and write to HCS.
 * Returns the full notarization record.
 *
 * Throws KalipsoError on any failure. Caller (API route) translates
 * to HTTP response.
 */
export async function notarize(rawStatement: unknown): Promise<KalipsoNotarization> {
  const correlationId = generateCorrelationId();

  // --- 1. Validate input ---
  if (typeof rawStatement !== 'string') {
    throw new KalipsoError(
      KalipsoErrorCode.BAD_STATEMENT,
      'Statement must be a string',
      { correlationId },
    );
  }

  const statement = rawStatement.trim();
  if (statement.length < STATEMENT_MIN_CHARS) {
    throw new KalipsoError(
      KalipsoErrorCode.BAD_STATEMENT,
      'Statement is empty',
      { correlationId },
    );
  }
  if (statement.length > STATEMENT_MAX_CHARS) {
    throw new KalipsoError(
      KalipsoErrorCode.BAD_STATEMENT,
      `Statement too long (${statement.length} chars, max ${STATEMENT_MAX_CHARS})`,
      { correlationId },
    );
  }

  logger.info(
    { correlationId, length: statement.length },
    'notarize_start',
  );

  // --- 2. Classify ---
  const register = classifyStatement(statement);
  logger.debug({ correlationId, register }, 'notarize_classified');

  // --- 3. Query Claude with the appropriate persona ---
  let aiComment: string;
  try {
    const claudeResult = await Promise.race([
      queryClaude(statement, systemPromptFor(register)),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Claude timed out after ${CLAUDE_TIMEOUT_MS}ms`)),
          CLAUDE_TIMEOUT_MS,
        ),
      ),
    ]);

    aiComment = claudeResult.content.trim();

    logger.info(
      {
        correlationId,
        inputTokens: claudeResult.usage.inputTokens,
        outputTokens: claudeResult.usage.outputTokens,
      },
      'claude_query_complete',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';

    // Anthropic 529 — service overloaded, retry-friendly
    if (message.includes('529') || message.toLowerCase().includes('overloaded')) {
      logger.warn({ correlationId }, 'claude_overloaded');
      throw new KalipsoError(
        KalipsoErrorCode.AGENT_UNAVAILABLE,
        'Kalipso is briefly overloaded. Please try again in a moment.',
        { correlationId, cause: err },
      );
    }

    // Anthropic 429 — rate limited
    if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
      logger.warn({ correlationId }, 'claude_rate_limited');
      throw new KalipsoError(
        KalipsoErrorCode.AGENT_UNAVAILABLE,
        'Kalipso is receiving too many requests right now. Please try again in a moment.',
        { correlationId, cause: err },
      );
    }

    // Our explicit timeout
    if (message.includes('timed out')) {
      throw new KalipsoError(
        KalipsoErrorCode.AGENT_TIMEOUT,
        'Kalipso took too long to respond. Please try again.',
        { correlationId, cause: err },
      );
    }

    // Anything else — log full error, return generic refused message
    logger.error({ correlationId, err }, 'claude_query_failed');
    throw new KalipsoError(
      KalipsoErrorCode.AGENT_REFUSED,
      `Kalipso could not respond: ${message}`,
      { correlationId, cause: err },
    );
  }

  if (!aiComment) {
    throw new KalipsoError(
      KalipsoErrorCode.AGENT_REFUSED,
      'Kalipso returned an empty response',
      { correlationId },
    );
  }

  // --- 4. Hash ---
  const timestamp = new Date().toISOString();
  const statementHash = generateNotarizationHash(statement, aiComment, timestamp);

  // --- 5. Submit to HCS (deterministic — always happens) ---
  const submission = await submitNotarizationToHcs({
    statement,
    aiComment,
    register,
    statementHash,
    timestamp,
    correlationId,
  });

  // --- 6. Build result ---
  const hashscanUrl = `https://hashscan.io/${env.HEDERA_NETWORK}/transaction/${submission.transactionId}`;

  const result: KalipsoNotarization = {
    statement,
    register,
    aiComment,
    transactionId: submission.transactionId,
    topicId: submission.topicId,
    sequenceNumber: submission.sequenceNumber,
    consensusTimestamp: submission.consensusTimestamp ?? timestamp,
    hashscanUrl,
    statementHash,
    correlationId,
  };

  logger.info(
    {
      correlationId,
      transactionId: result.transactionId,
      sequenceNumber: result.sequenceNumber,
      register: result.register,
    },
    'notarize_complete',
  );

  return result;
}
