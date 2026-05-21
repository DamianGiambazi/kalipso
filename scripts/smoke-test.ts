// scripts/smoke-test.ts
// Phase 4a verification: prove env, logger, client all work together
// by querying real testnet data.
//
// Run: npx tsx scripts/smoke-test.ts

import { AccountBalanceQuery } from '@hiero-ledger/sdk';
import { hederaClient, operatorAccountId } from '../lib/hedera/client';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

async function main() {
  logger.info('smoke_test_start');

  logger.info(
    {
      network: env.HEDERA_NETWORK,
      operator: env.HEDERA_ACCOUNT_ID,
      topic: env.KALIPSO_TOPIC_ID,
    },
    'config_loaded',
  );

  // Query the operator account balance from the live network.
  const balance = await new AccountBalanceQuery()
    .setAccountId(operatorAccountId)
    .execute(hederaClient);

  logger.info(
    {
      hbar: balance.hbars.toString(),
      tokens: balance.tokens?.size ?? 0,
    },
    'balance_query_success',
  );

  console.log('');
  console.log('✅ Phase 4a foundation verified.');
  console.log(`   Account:  ${env.HEDERA_ACCOUNT_ID}`);
  console.log(`   Balance:  ${balance.hbars.toString()}`);
  console.log(`   Topic:    ${env.KALIPSO_TOPIC_ID}`);
  console.log('');

  hederaClient.close();
}

main().catch((err) => {
  logger.error({ err }, 'smoke_test_failed');
  process.exit(1);
});
