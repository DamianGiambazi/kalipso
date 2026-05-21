// scripts/notarize-test.ts
// Phase 4b verification — full end-to-end notarization against testnet.
//
// Runs three tests:
//   1. An everyday statement
//   2. A statement with mild scepticism trigger (the gym)
//   3. A serious statement (verifies register switch)
//
// Each one produces a real HCS transaction. After running, the
// Kalipso topic 0.0.9020209 will contain 3 messages, verifiable on HashScan.
//
// Run: npx tsx scripts/notarize-test.ts

import { notarize } from '../lib/agent/notarize';
import { logger } from '../lib/logger';

const TEST_STATEMENTS = [
  "I'll respond to my emails today.",
  "I'm going to the gym tomorrow.",
  "I'm going to call my therapist this week.",
];

async function runOne(statement: string, index: number) {
  console.log('');
  console.log(`━━━ Test ${index + 1}/${TEST_STATEMENTS.length} ━━━`);
  console.log(`Statement: "${statement}"`);
  console.log('');

  const start = Date.now();
  const result = await notarize(statement);
  const elapsed = Date.now() - start;

  console.log(`Register:    ${result.register}`);
  console.log(`Response:    ${result.aiComment}`);
  console.log(`Tx ID:       ${result.transactionId}`);
  console.log(`Seq #:       ${result.sequenceNumber}`);
  console.log(`Hash:        ${result.statementHash.slice(0, 16)}…`);
  console.log(`Elapsed:     ${elapsed}ms`);
  console.log(`HashScan:    ${result.hashscanUrl}`);
}

async function main() {
  console.log('🏛️  Kalipso end-to-end notarization test');
  console.log('');

  for (let i = 0; i < TEST_STATEMENTS.length; i++) {
    try {
      await runOne(TEST_STATEMENTS[i], i);
    } catch (err) {
      console.error('');
      console.error(`❌ Test ${i + 1} FAILED:`);
      console.error(err);
      process.exit(1);
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All notarizations succeeded.');
  console.log('');
  console.log('🔗 View all messages on HashScan:');
  console.log('   https://hashscan.io/testnet/topic/0.0.9020209');
  console.log('');
}

main().catch((err) => {
  logger.error({ err }, 'notarize_test_fatal');
  process.exit(1);
});
