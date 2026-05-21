// lib/hedera/client.ts
// Hedera Client singleton. Constructed once per process at module load.
// All HCS submissions and queries share this instance.

import { Client, AccountId, PrivateKey, Hbar } from '@hiero-ledger/sdk';
import { env } from '../env';
import { logger } from '../logger';

const DEFAULT_MAX_TX_FEE_HBAR = 2;

function buildClient(): Client {
  const accountId = AccountId.fromString(env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromStringECDSA(env.HEDERA_PRIVATE_KEY);

  const client = env.HEDERA_NETWORK === 'mainnet'
    ? Client.forMainnet()
    : Client.forTestnet();

  client.setOperator(accountId, privateKey);
  client.setDefaultMaxTransactionFee(new Hbar(DEFAULT_MAX_TX_FEE_HBAR));

  logger.info(
    { network: env.HEDERA_NETWORK, operator: env.HEDERA_ACCOUNT_ID },
    'hedera_client_initialized',
  );

  return client;
}

/** The singleton Hedera client. Frozen reference. */
export const hederaClient: Client = buildClient();

/** Public key derived from the operator key — useful for setting submit keys, signing checks. */
export const operatorPublicKey = PrivateKey.fromStringECDSA(env.HEDERA_PRIVATE_KEY).publicKey;

/** Account ID parsed from env — useful for tools that need it as an AccountId object. */
export const operatorAccountId = AccountId.fromString(env.HEDERA_ACCOUNT_ID);
