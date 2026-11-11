/**
 * BreakTheGuard - Client-Side Pre-Write Validation Guards
 *
 * Implements strict client-side validation mirroring contract invariants from
 * contracts-reference/GuardArena.py and GuardGate.py.
 * Ensures malformed transactions are prevented BEFORE broadcasting to Studionet validators.
 */

export const TOKEN_WORDLIST: readonly string[] = [
  "apple", "banana", "cherry", "orange", "lemon", "mango", "grape", "peach",
  "melon", "berry", "papaya", "apricot", "plum", "pear", "purple", "yellow",
  "silver", "violet", "indigo", "maroon", "crimson", "scarlet", "turquoise", "magenta",
  "amber", "bronze", "copper", "rabbit", "dolphin", "turtle", "badger", "falcon",
  "walrus", "otter", "beaver", "parrot", "iguana", "hamster", "gecko", "koala",
  "penguin", "ferret", "donkey", "pencil", "bottle", "guitar", "ladder", "mirror",
  "pillow", "blanket", "teacup", "candle", "whistle", "compass", "magnet", "lantern",
  "anchor", "hammer", "bucket", "basket", "shovel", "helmet", "camera", "violin"
] as const;

export const VALIDATION_LIMITS = {
  MAX_NAME_CHARS: 60,
  MAX_POLICY_CHARS: 600,
  MAX_ATTACK_CHARS: 500,
  MAX_MESSAGE_CHARS: 500,
  MAX_ATTEMPTS_PER_GUARD: 40,
  MIN_GATE_ATTEMPTS: 1,
} as const;

/**
 * Checks whether a string contains only ASCII characters (code points 0-127).
 */
export function isAsciiOnly(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}

/**
 * Normalizes text to lowercase ASCII representation.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .trim();
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Pre-write validation for guard registration.
 */
export function validateRegisterGuard(params: {
  name: string;
  policy: string;
  token: string;
  parentGuardId?: string;
  parentGuard?: { status?: string } | null;
  existingGuards?: Array<{ policy: string; token: string }>;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const cleanName = params.name.trim();
  const cleanPolicy = params.policy.trim();
  const cleanToken = params.token.trim().toLowerCase();

  // 1. Guard Name validation
  if (!cleanName) {
    errors.name = 'Guard name is required.';
  } else if (!isAsciiOnly(cleanName)) {
    errors.name = 'Guard name must contain pure ASCII characters only.';
  } else if (cleanName.length > VALIDATION_LIMITS.MAX_NAME_CHARS) {
    errors.name = `Guard name cannot exceed ${VALIDATION_LIMITS.MAX_NAME_CHARS} characters (currently ${cleanName.length}).`;
  }

  // 2. Policy validation
  if (!cleanPolicy) {
    errors.policy = 'Guard policy instructions are required.';
  } else if (!isAsciiOnly(cleanPolicy)) {
    errors.policy = 'Guard policy must contain pure ASCII characters only.';
  } else if (cleanPolicy.length > VALIDATION_LIMITS.MAX_POLICY_CHARS) {
    errors.policy = `Guard policy cannot exceed ${VALIDATION_LIMITS.MAX_POLICY_CHARS} characters (currently ${cleanPolicy.length}).`;
  }

  // 3. Secret Token validation
  if (!cleanToken) {
    errors.token = 'Secret token must be selected.';
  } else if (!TOKEN_WORDLIST.includes(cleanToken)) {
    errors.token = `Secret token must be one of the 64 approved dictionary words.`;
  }

  // 4. Duplicate Policy+Token validation
  if (cleanPolicy && cleanToken && params.existingGuards) {
    const normKey = `${normalizeText(cleanPolicy)}::${cleanToken}`;
    const duplicate = params.existingGuards.some(
      (g) => `${normalizeText(g.policy)}::${normalizeText(g.token)}` === normKey
    );
    if (duplicate) {
      errors.policy = 'A guard with this identical policy and token already exists.';
    }
  }

  // 5. Parent guard validation (if specified)
  const cleanParent = params.parentGuardId?.trim() || '';
  if (cleanParent) {
    if (params.parentGuard === null) {
      errors.parentGuardId = 'Specified parent guard ID does not exist.';
    } else if (params.parentGuard && params.parentGuard.status !== 'BREACHED') {
      errors.parentGuardId = 'Parent guard must be in BREACHED status to spawn a lineage child.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Pre-write validation for adversarial attack attempt.
 */
export function validateAttackGuard(params: {
  attackText: string;
  guard: {
    status?: string;
    attempts_total?: number;
    attempts?: Array<{ attack_text?: string; attack_text_excerpt?: string }>;
  } | null;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const cleanAttack = params.attackText.trim();

  if (!params.guard) {
    errors.guard = 'Guard could not be loaded.';
    return { isValid: false, errors };
  }

  // 1. Guard state validation
  const totalAttempts = params.guard.attempts_total ?? params.guard.attempts?.length ?? 0;
  if (totalAttempts >= VALIDATION_LIMITS.MAX_ATTEMPTS_PER_GUARD) {
    errors.guard = `Guard has reached the maximum cap of ${VALIDATION_LIMITS.MAX_ATTEMPTS_PER_GUARD} attempts.`;
  }

  // 2. Attack text validation
  if (!cleanAttack) {
    errors.attackText = 'Adversarial attack prompt cannot be empty.';
  } else if (!isAsciiOnly(cleanAttack)) {
    errors.attackText = 'Attack prompt must contain pure ASCII characters only.';
  } else if (cleanAttack.length > VALIDATION_LIMITS.MAX_ATTACK_CHARS) {
    errors.attackText = `Attack prompt cannot exceed ${VALIDATION_LIMITS.MAX_ATTACK_CHARS} characters (currently ${cleanAttack.length}).`;
  }

  // 3. Duplicate attack text check
  if (cleanAttack && params.guard.attempts) {
    const normAttack = normalizeText(cleanAttack);
    const isDup = params.guard.attempts.some(
      (prev) => normalizeText(prev.attack_text || prev.attack_text_excerpt || '') === normAttack
    );
    if (isDup) {
      errors.attackText = 'This exact attack prompt has already been attempted on this guard.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Pre-write validation for reverify attempt.
 */
export function validateReverifyAttempt(
  guard: { attempts?: Array<{ n: number; state: string; reverify?: any }> } | null,
  attemptN: number
): { isValid: boolean; error?: string } {
  if (!guard || !guard.attempts) {
    return { isValid: false, error: 'Guard details unavailable.' };
  }

  const attempt = guard.attempts.find((a) => a.n === attemptN);
  if (!attempt) {
    return { isValid: false, error: `Attempt #${attemptN} does not exist.` };
  }

  if (attempt.state !== 'BREACHED_UNCONFIRMED') {
    return {
      isValid: false,
      error: `Attempt #${attemptN} is '${attempt.state}', only BREACHED_UNCONFIRMED attempts can be reverified.`,
    };
  }

  if (attempt.reverify !== null && attempt.reverify !== undefined) {
    return { isValid: false, error: `Attempt #${attemptN} has already been reverified.` };
  }

  return { isValid: true };
}

/**
 * Pre-write validation for GuardGate ask query.
 */
export function validateGuardGateAsk(params: {
  guardId: string;
  message: string;
  guard?: {
    status?: string;
    attempts_total?: number;
    attempts?: any[];
  } | null;
  minGuardAttempts?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const cleanId = params.guardId.trim();
  const cleanMsg = params.message.trim();
  const minRequired = params.minGuardAttempts ?? VALIDATION_LIMITS.MIN_GATE_ATTEMPTS;

  // 1. Guard ID
  if (!cleanId) {
    errors.guardId = 'Target guard ID is required.';
  } else if (!isAsciiOnly(cleanId)) {
    errors.guardId = 'Guard ID must be pure ASCII string.';
  }

  // 2. Message
  if (!cleanMsg) {
    errors.message = 'Query message is required.';
  } else if (!isAsciiOnly(cleanMsg)) {
    errors.message = 'Query message must contain pure ASCII characters only.';
  } else if (cleanMsg.length > VALIDATION_LIMITS.MAX_MESSAGE_CHARS) {
    errors.message = `Query message cannot exceed ${VALIDATION_LIMITS.MAX_MESSAGE_CHARS} characters (currently ${cleanMsg.length}).`;
  }

  // 3. Guard threshold
  if (params.guard) {
    const attempts = params.guard.attempts_total ?? params.guard.attempts?.length ?? 0;
    if (attempts < minRequired) {
      errors.guardId = `Guard has only ${attempts} attempt(s); GuardGate requires at least ${minRequired} tested attempts.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
