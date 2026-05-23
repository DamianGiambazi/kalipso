// lib/hedera/submit.ts
// Deterministic HCS submission — the hybrid pattern.
// The agent generates the comment; this module writes it to chain
// as a guaranteed post-step. No tool-call uncertainty.
//
// The submitted message is a structured JSON payload that includes
// the statement preview, the AI comment, and the canonical hash.
// Mirror node observers can replay these messages to reconstruct
// the full Kalipso ledger.

import { TopicMessageSubmitTransaction, Hbar, Status } from '@hiero-ledger/sdk';
import { hederaClient } from './client';
import { env } from '../env';
import { logger } from '../logger';
import { KalipsoError, KalipsoErrorCode } from '../errors';
import type { Register } from '../types';

const MAX_SUBMIT_FEE_HBAR = 1;
const PREVIEW_MAX_CHARS = 280;
const MESSAGE_SCHEMA_VERSION = 1;

interface SubmitArgs {
  statement: string;
  aiComment: string;
  register: Register;
  statementHash: string;
  timestamp: string;     // ISO-8601 UTC
  correlationId: string;
}

interface SubmitResult {
  transactionId: string;       // canonical consensus_timestamp "SEC.NS" — HashScan-resolvable
  topicId: string;
  consensusTimestamp?: string; // same as transactionId, kept for display semantics
  sequenceNumber: number;
}

/**
 * Submits a Kalipso notarization to the HCS topic. Always-on-chain;
 * never optional. Throws KalipsoError(HCS_SUBMIT_FAILED) on any
 * network, fee, or signature problem.
 *
 * Returns the CANONICAL consensus timestamp as `transactionId`, retrieved
 * from the TransactionRecord (post-consensus). This is the value HashScan
 * resolves via /transaction/{SEC.NS}. The SDK-side "valid-start" id
 * returned by submitted.transactionId is NOT used for the UI link — it
 * differs from the consensus timestamp and HashScan cannot find it.
 */
export async function submitNotarizationToHcs(args: SubmitArgs): Promise<SubmitResult> {
  const { statement, aiComment, register, statementHash, timestamp, correlationId } = args;

  // Build the on-chain message payload.
  // Keep it well under the 1024-byte HCS message limit by capping the preview.
  const preview = statement.length > PREVIEW_MAX_CHARS
    ? statement.slice(0, PREVIEW_MAX_CHARS - 1) + '…'
    : statement;

  const messagePayload = {
    v: MESSAGE_SCHEMA_VERSION,
    type: 'kalipso_notarization',
    statement: preview,
    aiComment: aiComment,
    register: register,
    statementHash: statementHash,
    timestamp: timestamp,
  };

  const messageJson = JSON.stringify(messagePayload);
  const messageBytes = Buffer.byteLength(messageJson, 'utf8');

  if (messageBytes > 1024) {
    throw new KalipsoError(
      KalipsoErrorCode.BAD_STATEMENT,
      `Message payload exceeds HCS 1024-byte limit (${messageBytes} bytes). Truncate the statement.`,
      { correlationId },
    );
  }

  logger.info(
    { correlationId, topicId: env.KALIPSO_TOPIC_ID, bytes: messageBytes, register },
    'hcs_submit_start',
  );

  try {
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(env.KALIPSO_TOPIC_ID)
      .setMessage(messageJson)
      .setMaxTransactionFee(new Hbar(MAX_SUBMIT_FEE_HBAR));

    const submitted = await tx.execute(hederaClient);
    const receipt = await submitted.getReceipt(hederaClient);

    if (receipt.status !== Status.Success) {
      throw new KalipsoError(
        KalipsoErrorCode.HCS_SUBMIT_FAILED,
        `HCS submission failed with status: ${receipt.status.toString()}`,
        { correlationId },
      );
    }

    const sequenceNumber = receipt.topicSequenceNumber?.toNumber();
    if (sequenceNumber === undefined) {
      throw new KalipsoError(
        KalipsoErrorCode.HCS_SUBMIT_FAILED,
        'HCS submission succeeded but no sequence number in receipt',
        { correlationId },
      );
    }

    // Retrieve the canonical consensus timestamp from the TransactionRecord.
    // This is the network-confirmed timestamp set by Hedera consensus, NOT
    // the SDK-side valid-start id. HashScan resolves /transaction/{SEC.NS}
    // against this value.
    let consensusTimestamp: string;
    try {
      const record = await submitted.getRecord(hederaClient);
      const ts = record.consensusTimestamp;
      // Timestamp.seconds is a Long; nanos is a number.
      const seconds = ts.seconds.toString();
      const nanos = String(ts.nanos).padStart(9, '0');
      consensusTimestamp = `${seconds}.${nanos}`;
    } catch (err) {
      logger.error({ correlationId, err }, 'hcs_record_fetch_failed');
      throw new KalipsoError(
        KalipsoErrorCode.HCS_SUBMIT_FAILED,
        'Submission succeeded but record retrieval failed.',
        { correlationId, cause: err },
      );
    }

    logger.info(
      { correlationId, consensusTimestamp, sequenceNumber },
      'hcs_submit_success',
    );

    return {
      transactionId: consensusTimestamp, // HashScan-resolvable
      topicId: env.KALIPSO_TOPIC_ID,
      consensusTimestamp,
      sequenceNumber,
    };
  } catch (err) {
    if (err instanceof KalipsoError) throw err;

    logger.error({ correlationId, err }, 'hcs_submit_failed');
    throw new KalipsoError(
      KalipsoErrorCode.HCS_SUBMIT_FAILED,
      `HCS submission threw: ${err instanceof Error ? err.message : 'unknown error'}`,
      { correlationId, cause: err },
    );
  }
}
