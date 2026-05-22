// lib/hedera/topic-messages.ts
// Mirror-node query for HCS topic messages — returns parsed WallEntry[].
//
// Mirror node REST API: GET /api/v1/topics/{topicId}/messages
// Docs: https://docs.hedera.com/hedera/sdks-and-apis/rest-api
//
// Each message's payload is base64-encoded. We decode it, parse as JSON,
// validate against the Kalipso schema, and skip any messages that don't
// match (in case the topic ever contains foreign data).

import { z } from 'zod';
import { env } from '../env';
import { logger } from '../logger';
import { KalipsoError, KalipsoErrorCode } from '../errors';
import type { WallEntry } from '../types';

const MIRROR_BASE: Record<'testnet' | 'mainnet', string> = {
  testnet: 'https://testnet.mirrornode.hedera.com',
  mainnet: 'https://mainnet-public.mirrornode.hedera.com',
};

const MirrorMessageSchema = z.object({
  consensus_timestamp: z.string(),
  message: z.string(), // base64-encoded
  sequence_number: z.number(),
  payer_account_id: z.string().optional(),
  running_hash: z.string().optional(),
});

const MirrorResponseSchema = z.object({
  messages: z.array(MirrorMessageSchema),
});

const KalipsoPayloadSchema = z.object({
  v: z.literal(1),
  type: z.literal('kalipso_notarization'),
  statement: z.string(),
  aiComment: z.string(),
  register: z.enum(['EVERYDAY', 'SERIOUS']),
  statementHash: z.string(),
  timestamp: z.string(),
});

interface FetchOptions {
  limit?: number;
}

/**
 * Fetch the most recent Kalipso notarizations from the topic.
 * Returns newest-first.
 *
 * Throws KalipsoError(MIRROR_NODE_DOWN) on transport or schema failure.
 */
export async function fetchTopicMessages(opts: FetchOptions = {}): Promise<WallEntry[]> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 100);
  const base = MIRROR_BASE[env.HEDERA_NETWORK];
  const url = `${base}/api/v1/topics/${env.KALIPSO_TOPIC_ID}/messages?limit=${limit}&order=desc`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (transportErr) {
    logger.error({ err: transportErr, url }, 'mirror_fetch_transport_failed');
    throw new KalipsoError(
      KalipsoErrorCode.MIRROR_NODE_DOWN,
      'The ledger is temporarily unreachable.',
      { cause: transportErr },
    );
  }

  if (!response.ok) {
    logger.error({ status: response.status, url }, 'mirror_fetch_status_failed');
    throw new KalipsoError(
      KalipsoErrorCode.MIRROR_NODE_DOWN,
      `Mirror node returned ${response.status}.`,
    );
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new KalipsoError(
      KalipsoErrorCode.MIRROR_NODE_DOWN,
      'Mirror node returned malformed JSON.',
    );
  }

  const parsed = MirrorResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues }, 'mirror_response_schema_failed');
    throw new KalipsoError(
      KalipsoErrorCode.MIRROR_NODE_DOWN,
      'Mirror node response did not match expected schema.',
    );
  }

  // Decode each base64 message, parse JSON, validate the Kalipso schema.
  // Silently skip anything that doesn't match.
  const entries: WallEntry[] = [];

  for (const msg of parsed.data.messages) {
    let decoded: string;
    try {
      decoded = Buffer.from(msg.message, 'base64').toString('utf8');
    } catch {
      continue;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(decoded);
    } catch {
      continue;
    }

    const validated = KalipsoPayloadSchema.safeParse(payload);
    if (!validated.success) {
      continue;
    }

    entries.push({
      statement: validated.data.statement,
      aiComment: validated.data.aiComment,
      consensusTimestamp: msg.consensus_timestamp,
      sequenceNumber: msg.sequence_number,
      // HashScan accepts the bare consensus_timestamp ("seconds.nanos") as
      // a transaction lookup key — verified against live HashScan URLs.
      // E.g. /testnet/transaction/1779443411.293675382 resolves correctly.
      // We store the raw timestamp in transactionId; the UI helper
      // toHashscanUrl() handles both this format and the SDK '@' format.
      transactionId: msg.consensus_timestamp,
    });
  }

  return entries;
}
