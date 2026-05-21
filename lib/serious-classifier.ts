// lib/serious-classifier.ts
// Pre-flight classifier — routes statements to EVERYDAY or SERIOUS register
// BEFORE the LLM is invoked. This is belt-and-braces safety: even if
// the LLM misses a cue, the classifier catches obvious ones.
//
// Tuned from Gemini's SERIOUS_TRIGGERS list, with additions from
// Qwen's routing logic. Lowercase substring match, broad rather than narrow
// — false positives are fine (a serious response is always safe);
// false negatives are the failure mode we must avoid.

import type { Register } from './types';

const SERIOUS_KEYWORDS: readonly string[] = [
  // Mental health
  'depress', 'anxiet', 'panic', 'suicid', 'self-harm', 'self harm',
  'therap', 'counsel', 'psych', 'mental health', 'breakdown',
  'crisis', 'overwhelm',

  // Addiction & recovery
  'sober', 'sobriety', 'alcohol', 'drinking', 'quit drink',
  'addict', 'recovery', 'relapse', 'overdose', 'rehab', 'clinic',

  // Illness
  'cancer', 'diagnos', 'chronic', 'terminal', 'illness',
  'hospital', 'surgery', 'tumor', 'tumour',

  // Grief & loss
  'grief', 'griev', 'mourn', 'funeral', 'died', 'death',
  'passed away', 'lost my', 'losing my',

  // Relationships
  'divorce', 'breakup', 'break up', 'broke up',
  'leaving him', 'leaving her', 'leaving them',
  'ending my marriage', 'ending the marriage',
  'separation', 'separated',

  // Vulnerable disclosures
  'abuse', 'abused', 'assault', 'trauma', 'ptsd',
  'told my parents', 'came out', 'coming out',
  'gender', 'transition',

  // Safety
  'unsafe', 'in danger', 'hurt myself', 'hurt me',
  'safe place', 'shelter',

  // Significant commitments / milestones
  'i quit', "i've been sober", 'months sober', 'years sober',
  'months clean', 'years clean',
];

/**
 * Classifies a statement by lowercase substring search against
 * the SERIOUS_KEYWORDS list.
 *
 * False positives (everyday statements classified as serious) are
 * acceptable — the serious-register response is always respectful
 * and won't read as wrong.
 *
 * False negatives (serious statements missed by the classifier) are
 * caught by the LLM's own step-out instruction in the system prompt.
 */
export function classifyStatement(statement: string): Register {
  const lower = statement.toLowerCase();
  for (const keyword of SERIOUS_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'SERIOUS';
    }
  }
  return 'EVERYDAY';
}
