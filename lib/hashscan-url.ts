// lib/hashscan-url.ts
// Single source of truth for building HashScan transaction URLs.
//
// HashScan accepts two equivalent forms for HCS transaction lookups:
//   1. The bare consensus timestamp:  "1779443411.293675382"
//   2. The full SDK transaction id:   "0.0.6298442@1779443411.293675382"
//
// Both forms appear in our codebase:
//   - submit.ts (server)            returns the SDK '@' form
//   - topic-messages.ts (mirror)    returns the bare timestamp
//
// HashScan's working URL pattern is /{network}/transaction/{consensusTimestamp}
// where {consensusTimestamp} is the "seconds.nanoseconds" portion only.
//
// This helper normalises both inputs into a working URL.

const FALLBACK_NETWORK = 'testnet';

export function toHashscanTransactionUrl(transactionIdOrTimestamp: string): string {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK ?? FALLBACK_NETWORK;
    const consensusTimestamp = extractConsensusTimestamp(transactionIdOrTimestamp);
    return `https://hashscan.io/${network}/transaction/${consensusTimestamp}`;
}

/**
 * Extract the consensus-timestamp portion ("seconds.nanoseconds") from
 * either a bare timestamp or an SDK-form transaction id.
 */
function extractConsensusTimestamp(input: string): string {
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
        const parts = trimmed.split('@');
        return parts[1] ?? trimmed;
    }
    return trimmed;
}
