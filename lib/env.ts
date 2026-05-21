// lib/env.ts
// Validated environment configuration — loaded ONCE at module init.
// Fails at startup if anything is missing or malformed.
// Never use process.env directly anywhere else in the codebase.

import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env.local first (development), fall back to .env (production).
// On Vercel, env vars come from the platform — dotenv is a no-op.
dotenv.config({ path: '.env.local' });

const EnvSchema = z.object({
  HEDERA_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),

  HEDERA_ACCOUNT_ID: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'HEDERA_ACCOUNT_ID must be in format "shard.realm.num" (e.g. "0.0.6298442")'),

  HEDERA_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'HEDERA_PRIVATE_KEY must be a 0x-prefixed 64-char hex string (ECDSA)'),

  KALIPSO_TOPIC_ID: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'KALIPSO_TOPIC_ID must be in format "shard.realm.num"'),

  ANTHROPIC_API_KEY: z
    .string()
    .min(20, 'ANTHROPIC_API_KEY appears too short to be valid'),

  // Set by Vercel automatically in production; defaults to "development" locally.
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  // Fail loud, fail fast. Process dies here if env is broken.
  throw new Error('Invalid environment configuration. See errors above.');
}

export const env = Object.freeze(parsed.data);

export type Env = typeof env;
