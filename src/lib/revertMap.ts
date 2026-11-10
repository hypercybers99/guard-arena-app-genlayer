/**
 * Friendly mappings for all gl.vm.UserError conditions defined across
 * contracts-reference/GuardArena.py and contracts-reference/GuardGate.py.
 */

export interface RevertRule {
  pattern: RegExp;
  friendly: string | ((match: RegExpMatchArray) => string);
}

export const REVERT_RULES: RevertRule[] = [
  // Registration & Validation
  {
    pattern: /guard name must be string/i,
    friendly: 'Guard name parameter must be a string.',
  },
  {
    pattern: /guard name must be non-empty ascii string/i,
    friendly: 'Guard name must be a non-empty ASCII string.',
  },
  {
    pattern: /guard name exceeds maximum of (\d+) characters/i,
    friendly: (m) => `Guard name exceeds the maximum allowed length of ${m[1]} characters.`,
  },
  {
    pattern: /guard policy must be string/i,
    friendly: 'Guard policy parameter must be a string.',
  },
  {
    pattern: /guard policy must be non-empty ascii string/i,
    friendly: 'Guard policy must be a non-empty ASCII string.',
  },
  {
    pattern: /guard policy exceeds maximum of (\d+) characters/i,
    friendly: (m) => `Guard policy exceeds the maximum allowed length of ${m[1]} characters.`,
  },
  {
    pattern: /token must be string/i,
    friendly: 'Forbidden token parameter must be a string.',
  },
  {
    pattern: /forbidden token must be from approved wordlist/i,
    friendly: 'Forbidden token must be one of the approved 64 words from the TOKEN_WORDLIST.',
  },
  {
    pattern: /parent_guard_id must be string/i,
    friendly: 'Parent guard ID parameter must be a string.',
  },
  {
    pattern: /parent guard not found/i,
    friendly: 'Specified parent guard ID does not exist in GuardArena storage.',
  },
  {
    pattern: /parent guard is not breached/i,
    friendly: 'Lineage Rule: Only guards with a CONFIRMED breach may be chosen as parent; this guard is active/unbreached.',
  },
  {
    pattern: /guard with same policy and token already exists/i,
    friendly: 'A guard with the exact same policy and forbidden token has already been registered.',
  },
  {
    pattern: /guard fails baseline probes/i,
    friendly: 'Probe Failure: Guard policy failed naive baseline probes (it revealed the forbidden token on trivial instructions).',
  },
  {
    pattern: /guard fails utility probe/i,
    friendly: 'Utility Failure: Guard policy failed utility queries (the reply was empty, breached the token, or contained a refusal keyword like cannot/sorry/refuse). The utility probe checks that the reply is non-empty, free of the token and not a refusal by keyword; it does not check factual correctness.',
  },
  {
    pattern: /guard registration failed probes/i,
    friendly: 'Guard registration failed consensus validation probes.',
  },
  {
    pattern: /invalid input types/i,
    friendly: 'Invalid input types provided for contract invocation.',
  },

  // Breach Attempts & Derived Integrity
  {
    pattern: /replies must be list of exactly 3 strings/i,
    friendly: 'Consensus Error: Consensus outcome must be a list of exactly 3 sampled strings.',
  },
  {
    pattern: /each reply must be string/i,
    friendly: 'Consensus Error: Each sampled reply must be a valid string.',
  },
  {
    pattern: /reply exceeds maximum of (\d+) characters/i,
    friendly: (m) => `Sampled reply exceeds the maximum allowed length of ${m[1]} characters.`,
  },
  {
    pattern: /reply is not in canonical normalized form/i,
    friendly: 'Consensus Error: Sampled reply is not in canonical normalized ASCII form.',
  },
  {
    pattern: /reply must be string/i,
    friendly: 'Consensus Error: GuardGate reply must be a valid string.',
  },
  {
    pattern: /breach detected in served reply/i,
    friendly: 'Integrity Violation: Forbidden token was detected in a served response.',
  },
  {
    pattern: /integrity check failed/i,
    friendly: 'Consensus Integrity Check Failed: Consensus payload did not match deterministic derivation.',
  },
  {
    pattern: /attack text must be non-empty ascii string/i,
    friendly: 'Attack prompt must be a non-empty ASCII string.',
  },
  {
    pattern: /attack_text must be string/i,
    friendly: 'Attack payload must be a string.',
  },
  {
    pattern: /attack text exceeds maximum of (\d+) characters/i,
    friendly: (m) => `Attack prompt exceeds the maximum allowed length of ${m[1]} characters.`,
  },
  {
    pattern: /attack already attempted/i,
    friendly: 'Duplicate Attack: This exact attack prompt has already been attempted on this guard.',
  },
  {
    pattern: /maximum attempts \((\d+)\) reached for this guard/i,
    friendly: (m) => `Cap Reached: This guard has reached the maximum cap of ${m[1]} attempts.`,
  },

  // Re-verification
  {
    pattern: /invalid attempt number/i,
    friendly: 'Invalid attempt index specified for re-verification.',
  },
  {
    pattern: /attempt is not unconfirmed breach/i,
    friendly: 'Invalid State: Only attempts currently in BREACHED_UNCONFIRMED state can be re-verified.',
  },
  {
    pattern: /attempt already reverified/i,
    friendly: 'Already Re-verified: This attempt has already been re-verified.',
  },

  // Guard Lookup
  {
    pattern: /guard not found in guardarena/i,
    friendly: 'Guard not found in GuardArena storage.',
  },
  {
    pattern: /guard not found/i,
    friendly: 'The specified guard ID does not exist in GuardArena storage.',
  },

  // GuardGate Specific
  {
    pattern: /guard_id must be non-empty ascii string/i,
    friendly: 'Guard ID must be a non-empty ASCII string.',
  },
  {
    pattern: /message must be non-empty ascii string/i,
    friendly: 'Message must be a non-empty ASCII string.',
  },
  {
    pattern: /message must be string/i,
    friendly: 'Message payload must be a string.',
  },
  {
    pattern: /message exceeds maximum of (\d+) characters/i,
    friendly: (m) => `Message exceeds the maximum allowed length of ${m[1]} characters.`,
  },
  {
    pattern: /guard is not active/i,
    friendly: 'Guard is not active (cannot query a breached guard through GuardGate).',
  },
  {
    pattern: /guard has (\d+) attempts, minimum required is (\d+)/i,
    friendly: (m) => `Guard has only ${m[1]} attempts; GuardGate requires a minimum of ${m[2]} attempts before serving queries.`,
  },
  {
    pattern: /request not found/i,
    friendly: 'Specified request ID was not found in GuardGate records.',
  },

  // System & Clock
  {
    pattern: /datetime must be string/i,
    friendly: 'Consensus clock error: datetime must be a string.',
  },
  {
    pattern: /empty datetime/i,
    friendly: 'Consensus clock error: empty datetime string.',
  },
  {
    pattern: /invalid iso-8601 datetime format/i,
    friendly: 'Consensus clock error: invalid ISO-8601 datetime format.',
  },
  {
    pattern: /clock unavailable/i,
    friendly: 'Consensus clock is temporarily unavailable.',
  },
];

export function explainRevertReason(rawReason: string): string {
  if (!rawReason) return 'Transaction reverted without a specific error message.';
  const clean = rawReason.trim();

  for (const rule of REVERT_RULES) {
    const match = clean.match(rule.pattern);
    if (match) {
      if (typeof rule.friendly === 'function') {
        return rule.friendly(match);
      }
      return rule.friendly;
    }
  }

  // Fallback: return raw clean reason
  return clean;
}
