// lib/types.ts
// All shared types in one file. SSOT §2.4.
// Add types here, never duplicate elsewhere.

export type Statement = string; // raw user input, 1-500 chars

export type Register = 'EVERYDAY' | 'SERIOUS';

export interface KalipsoNotarization {
  statement: string;          // echoed back, trimmed
  register: Register;         // which voice was used
  aiComment: string;          // Kalipso's response
  transactionId: string;      // Hedera tx ID, e.g. "0.0.6298442@1779351807.157308108"
  topicId: string;            // e.g. "0.0.9020209"
  sequenceNumber: number;     // monotonic per topic
  consensusTimestamp: string; // ISO-8601 from mirror node or chain
  hashscanUrl: string;        // pre-built convenience URL for the UI
  statementHash: string;      // SHA-256 hex
  correlationId: string;      // for debugging
}

export interface WallEntry {
  statement: string;          // truncated preview, <=280 chars
  aiComment: string;
  consensusTimestamp: string;
  sequenceNumber: number;
  transactionId: string;
}
