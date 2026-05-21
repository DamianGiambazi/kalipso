// lib/shared/claude-query.ts
// Lifted and cleaned from ai-hcs-verifiable-decisions/src/lib/claude.ts
//
// Changes from original:
//   - Model bumped to claude-sonnet-4-6 (current Sonnet, May 2026)
//   - Optional-chain bug fixed with ?? 0 fallbacks
//   - Tightened types, no defensive coercion (SSOT Rule 1)
//   - No singleton; client is constructed per-call (cheap, avoids cross-request state)

import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_MODEL = 'claude-sonnet-4-6' as const;
const MAX_TOKENS = 1000;

export interface ClaudeQueryResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

/**
 * Query Claude with an optional system prompt and a user message.
 * Throws on API error or unexpected response shape. Callers wrap in try/catch
 * and translate to KalipsoError with code AGENT_TIMEOUT or AGENT_REFUSED.
 */
export async function queryClaude(
  userMessage: string,
  systemPrompt?: string,
): Promise<ClaudeQueryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY missing from environment');
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: userMessage }],
  });

  const firstBlock = message.content[0];
  if (!firstBlock || firstBlock.type !== 'text') {
    throw new Error(`Unexpected Claude response shape: type=${firstBlock?.type ?? 'undefined'}`);
  }

  return {
    content: firstBlock.text,
    usage: {
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
    },
    model: message.model,
  };
}
