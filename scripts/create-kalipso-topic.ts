// scripts/create-kalipso-topic.ts
// One-shot provisioner: creates the Kalipso HCS topic on Hedera testnet
// and prints the topic ID for the .env.local file.
//
// Run with: npx tsx scripts/create-kalipso-topic.ts
//
// Idempotency: this script is NOT idempotent. Running it twice creates
// two topics. Run it ONCE; copy the topic ID into .env.local; never
// run it again unless you genuinely want a fresh topic.

import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
  Hbar,
  Status,
} from '@hiero-ledger/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TOPIC_MEMO = 'Kalipso :: permanent ledger of human intentions';
const MAX_FEE_HBAR = 5;

async function main() {
  // --- Validate environment ---
  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK ?? 'testnet';

  if (!accountIdStr || !privateKeyStr) {
    console.error('❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env.local');
    process.exit(1);
  }

  if (network !== 'testnet') {
    console.error(`❌ Refusing to create topic on network "${network}". This script is testnet-only.`);
    process.exit(1);
  }

  console.log('🏛️  Kalipso topic provisioner');
  console.log(`    Network:    ${network}`);
  console.log(`    Operator:   ${accountIdStr}`);
  console.log(`    Memo:       "${TOPIC_MEMO}"`);
  console.log('');

  // --- Configure client ---
  const accountId = AccountId.fromString(accountIdStr);
  const privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(MAX_FEE_HBAR));

  // --- Create topic ---
  // Submit key locked to the operator's public key — only Kalipso's
  // operator account can submit messages. Prevents random
  // third-party graffiti on the topic.
  console.log('⏳ Submitting TopicCreateTransaction...');

  const tx = new TopicCreateTransaction()
    .setTopicMemo(TOPIC_MEMO)
    .setSubmitKey(privateKey.publicKey)
    .setMaxTransactionFee(new Hbar(MAX_FEE_HBAR));

  const submitted = await tx.execute(client);
  const receipt = await submitted.getReceipt(client);

  if (receipt.status !== Status.Success) {
    console.error(`❌ Topic creation failed with status: ${receipt.status.toString()}`);
    process.exit(1);
  }

  const topicId = receipt.topicId?.toString();
  if (!topicId) {
    console.error('❌ Topic created but no topic ID in receipt. Unexpected.');
    process.exit(1);
  }

  const txId = submitted.transactionId.toString();

  // --- Report ---
  console.log('');
  console.log('✅ Topic created successfully!');
  console.log('');
  console.log(`    Topic ID:        ${topicId}`);
  console.log(`    Transaction ID:  ${txId}`);
  console.log('');
  console.log('🔗 Verify on HashScan:');
  console.log(`    https://hashscan.io/testnet/topic/${topicId}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log(`    1. Add this line to your .env.local:`);
  console.log('');
  console.log(`       KALIPSO_TOPIC_ID=${topicId}`);
  console.log('');
  console.log(`    2. Do NOT run this script again — it would create a second topic.`);
  console.log('');

  client.close();
}

main().catch((err) => {
  console.error('❌ Unexpected error:');
  console.error(err);
  process.exit(1);
});
