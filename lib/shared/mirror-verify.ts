// lib/shared/mirror-verify.ts
// Lifted from ai-hcs-verifiable-decisions/src/lib/hederaService.ts
//
// Changes from original:
//   - Removed class wrapper and singleton export (SSOT Rule 4)
//   - Added Zod validation of mirror node response (SSOT Rule 1)
//   - Network parameter explicit (no env coupling — caller decides)
//   - Returns typed result, never null; throws on transport errors

import { z } from 'zod';

export type HederaNetwork = 'testnet' | 'mainnet';

const MIRROR_BASE: Record<HederaNetwork, string> = {
  testnet: 'https://testnet.mirrornode.hedera.com',
  mainnet: 'https://mainnet-public.mirrornode.hedera.com',
};

// Mirror node response shape — only the fields we care about.
const MirrorTransactionSchema = z.object({
  transactions: z
    .array(
      z.object({
        consensus_timestamp: z.string(),
        transaction_id: z.string(),
        result: z.string(),
        // sequence_number is on topic-message lookups, not transaction lookups
      }),
    )
    .min(0),
});

export interface VerificationResult {
  verified: boolean;
  consensusTimestamp?: string;
  result?: string;
  error?: string;
}

/**
 * Verify a Hedera transaction by ID against the public mirror node.
 *
 * IMPORTANT: there is a 3-8 second lag between transaction submission
 * and mirror-node availability. Callers handling fresh transactions
 * should retry with backoff, or treat `verified: false` with no error
 * as "pending consensus" rather than a failure.
 *
 * @param transactionId Hedera tx ID in canonical form
 *                      (e.g. "0.0.6298442@1747834234.567890123")
 *                      or hyphen form ("0.0.6298442-1747834234-567890123")
 * @param network       'testnet' (Kalipso default) or 'mainnet'
 */
export async function verifyTransactionOnMirror(
  transactionId: string,
  network: HederaNetwork = 'testnet',
): Promise<VerificationResult> {
  // Mirror node accepts hyphen-form IDs in URL paths.
  // Convert "0.0.X@SEC.NS" to "0.0.X-SEC-NS" if needed.
  const normalizedId = transactionId.replace('@', '-').replace(/\.(\d+)$/, '-$1');

  const url = `${MIRROR_BASE[network]}/api/v1/transactions/${normalizedId}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (transportError) {
    return {
      verified: false,
      error: `Mirror node unreachable: ${transportError instanceof Error ? transportError.message : 'unknown'}`,
    };
  }

  if (response.status === 404) {
    // Transaction not yet visible on mirror node — pending consensus.
    return { verified: false };
  }

  if (!response.ok) {
    return {
      verified: false,
      error: `Mirror node returned ${response.status}`,
    };
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return { verified: false, error: 'Mirror node returned malformed JSON' };
  }

  const parsed = MirrorTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      verified: false,
      error: `Mirror node response did not match expected schema`,
    };
  }

  const first = parsed.data.transactions[0];
  if (!first) {
    return { verified: false };
  }

  return {
    verified: true,
    consensusTimestamp: first.consensus_timestamp,
    result: first.result,
  };
}
