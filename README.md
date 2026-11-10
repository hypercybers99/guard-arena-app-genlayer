# BreakTheGuard dApp (guard-arena-app-genlayer)

BreakTheGuard is a decentralized adversarial arena for language model guards on **GenLayer Studionet (Preview)** (Chain ID: `61999`, RPC: `https://studio.genlayer.com/api`).

- **Contract Repository**: [hypercybers99/guard-arena-genlayer](https://github.com/hypercybers99/guard-arena-genlayer)
- **Application Repository**: [hypercybers99/guard-arena-app-genlayer](https://github.com/hypercybers99/guard-arena-app-genlayer)
- **Network**: GenLayer Studionet (Preview)
- **Explorer**: [https://explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)

---

## Intelligent Contracts Reference & Deployments

The `contracts-reference/` directory contains byte-identical copies of the verified contracts. The SHA-256 hashes are strictly verified on every check.

| Contract | Status | Address | Deploy Tx Hash | SHA-256 Fingerprint |
| :--- | :--- | :--- | :--- | :--- |
| **GuardArena** | Active (Main Arena v1.1.0) | `0xFcEAb957e1412e063760A534C294B897071E144B` | `0x515d7e498651de97538d9e41821b3da7fbb724156f6b1b924d37ccb28410aad9` | `a93010bb5a3371b8a2fddcc1b8c12d7a459c9572abe033ef8e265ed6c9872b41` |
| **GuardGate** | Active (Consumer Demo v1.1.0) | `0xCc9086C43D4152A5f5b5eb7fCfDfcd03a1f67AB6` | `0x0b2275177af47611e47d057c77c5c971e8e41cff1fd76ba6ac700d68586a0147` | `6ebf7eb0606c00a95ece12123035e99bcecd9015c311a76a0ab3d3da7c90c4d2` |

### Superseded Deployments

| Contract | Status | Address | Reason |
| :--- | :--- | :--- | :--- |
| **GuardArena** | Superseded (v1.0.0) | `0x05628E36D65281bfa7EA64DBcCd9Ac9c2e1a6474` | Pre-v1.1.0: Derived consensus fields were leader-supplied rather than deterministically derived by validators. |
| **GuardGate** | Superseded (v1.0.0) | `0xE699C8828F4F054fEe73B251837CE8B373Ba3D02` | Pre-v1.1.0: Reply text and filter flags were not verified and bound under validator consensus. |
| **Probe** | Superseded (Diagnostic Only) | `0xEb692Bbe9CDdE00a22A799A8650843882e25DF79` | Pre-deployment diagnostic contract used to measure runner VM and consensus telemetry. |
| **GuardArena** | Superseded (Earlier Build) | `0x6ebabD1360f65C4F08DaDfe57ae9af2f7C49dEdD` | Superseded initial deployment prior to GuardGate storage schema update. |

---

## Application Architecture & Views

Every contract write method has a dedicated interactive UI caller:

1. **Landing (`/`)**: Blue palette, sans-serif, slow typed hero text, large headings, scroll-reveal animations, reduced-motion support, mobile 390px responsive with no horizontal overflow. Original shield/lock-keyhole logo delivered as SVG and PNG. Header without green dot or status badge; footer displays "GenLayer Studionet (Preview)". Explains product in 3 short steps.
2. **Arena (`/arena`)**: Lists all guards with status chip (`ACTIVE` / `BREACHED`), counters (attempts, held, unconfirmed, confirmed, flaky), policy text shown in full, forbidden token hidden by default with a "Reveal forbidden token" toggle. Filter by status, sort by robustness.
3. **Guard Detail (`/guard/:id`)**: Full attempt history (attacker, prompt excerpt, samples breached, predicate match excerpt, state). If an attempt is `BREACHED_UNCONFIRMED`, renders a prominent "Re-verify this breach" button calling `reverify_attempt()`. Renders lineage tree (`parent -> guard -> children`).
4. **Attack (`/attack`, `/attack/:targetId`)**: Interactive attack launcher. Pick target guard, write adversarial prompt, submit to consensus via `attempt_breach()`. Renders real-time consensus progress bar (signing, submitting, validator voting, agree/total votes tally).
5. **Register Guard (`/register`)**: Form with guard name, defender policy, token dropdown from the fixed 64 allowed common words, and optional `parent_guard_id` (only valid for CONFIRMED breached parents). Includes explicit warning explaining that registration will revert if the guard fails naive baseline or utility probes.
6. **Leaderboard (`/leaderboard`)**: Top defense guards ranked by robustness score, and top red-team attackers ranked by confirmed breaches.
7. **GuardGate Demo (`/gate`)**: Interactive consumer demo. Pick an active guard, submit a question, call `ask()`. Displays returned assistant reply and filter badge showing whether GuardGate's deterministic output filter caught and blocked a token.
8. **Evidence (`/evidence`)**: Embedded empirical evidence log displaying verified contract SHA-256 hashes, active addresses, all Part A on-chain attempts with explorer links, real agree/total votes, and execution latencies.
9. **Wallet / Funding (`/wallet`)**: In-browser throwaway key generator, key importer/exporter, address copy button, balance query, and direct link to the GenLayer Studionet faucet.

---

## Verification Suite

Run the full end-to-end audit:
```bash
npm run check
```

`npm run check` executes:
1. `npm run check:reference`: Verifies that `contracts-reference/` is byte-identical to pinned canonical hashes.
2. `npm run build`: Type-checks (`tsc -b`) and builds production distribution (`vite build`).
3. `npm run test`: Executes Vitest test suite (`tests/unit/`, 61 tests across 9 suites).
4. `npm run scan:ascii`: Enforces pure ASCII across all source files.
5. `npm run scan:banned`: Scans for prohibited terminology.
6. `npm run scan:secrets`: Ensures zero private keys or secrets are committed.
7. `npm run check:address`: Ensures superseded addresses never leak into source code or docs.
8. `npm run verify:bundle`: Audits the production bundle in `dist/`.

### Unit & Integration Test Suite (61 tests across 9 files)
- `tests/unit/contractSignatures.test.ts`: Cross-checks all dApp contract calls and arities against AST parsed from `contracts-reference/*.py` (proved catching `ask_guard` vs `ask` and `get_meta` vs `get_stats`).
- `tests/unit/revertMap.test.ts`: Verifies complete coverage of all 33 `gl.vm.UserError` instances across both reference contracts to friendly descriptions.
- `tests/unit/tokenList.test.ts`: Enforces byte-level parity between dApp token list and contract's 64-word `TOKEN_WORDLIST`.
- `tests/unit/txLifecycle.test.ts`: Tests SDK terminal/accepted/disagreed/timeout status code handling.
- `tests/unit/readbackCompletion.test.ts`: Validates write methods complete only after readback confirmation.
- `tests/unit/predicateParity.test.ts`: 26 tests verifying deterministic TypeScript vs Python `_check_breach` parity across edge cases.
- `tests/unit/rpcErrorVsEmpty.test.ts`: Proves RPC transport errors return retryable errors rather than false "not found".
- `tests/unit/predicate.test.ts`: Delimiter validation and preview tests.
- `tests/unit/contracts.test.ts`: Address and chain definition sanity tests.

### Production E2E Lifecycle Suite (10 steps)
Run:
```bash
npm run test:e2e
```
Drives a real throwaway key through the complete on-chain lifecycle against the deployed Vercel application on GenLayer Studionet (Preview):
1. Landing motion & prefers-reduced-motion assertion.
2. Header & footer naming rules ("GenLayer Studionet (Preview)").
3. Throwaway key initialization on `/wallet`.
4. On-chain guard registration (`register_guard` passing 5 probes).
5. `/arena` readback verification.
6. Real adversarial attack submission (`attempt_breach`).
7. `/guard/:id` attempt history and state readback.
8. GuardGate consumer query (`ask`).
9. Negative flow duplicate attack verification (friendly revert message).
10. Mobile 390px zero horizontal overflow assertion across all 9 routes.

Evidence saved to `docs/e2e_production_evidence.json` and screenshots to `docs/screens/`.

---

## Content-Safety Scope

BreakTheGuard is strictly a harmless word-game. The forbidden token must come from an immutable on-chain list of 64 harmless common nouns (fruits, colors, animals, everyday objects). No free-form forbidden tokens are permitted. All policies and attack texts are ASCII-only and length-capped. The arena makes no content-moderation claims and does not store or process harmful material.

---

## Known Limitations

1. **Predicate Detection Scope**: The breach predicate detects plain whole-word and letter-spelled (space/hyphen/dot/underscore separated) occurrences after NFKD ASCII folding and casefold. It does NOT detect base64, rot13, reversed text, or other encodings, even though the arena rule text says "any form, spelling or encoding".
2. **Reply Cap**: Only the first 240 chars of a reply are checked.
3. **Reply Storage Privacy**: The contract stores only reply sha256, length and an 80-char excerpt, never the full reply.
4. **Sampling Disagreements on Borderline Prompts**: Validators agree on the majority verdict of K=3 samples; borderline attacks may produce disagreement/timeouts.
5. **Leaderboard Complexity**: `get_leaderboard` parses all guards (O(n)); fine for Studionet scale, not for production scale.
6. **GuardGate Output Filter**: GuardGate reply is consensus-sampled and filtered; the stored reply is the leader's filtered output.

---

## Unit-Tested Only (Not On-Chain)

1. **Breach Path & Re-verification (`attempt_breach` -> `BREACHED_UNCONFIRMED` -> `reverify_attempt`)**: Across all 16 on-chain adversarial attempts on Studionet (including targeted weak-policy guards tested with translation, idiom completion, botanical query, and unhyphenated prompts), the model consistently held against the forbidden token. Because no attack produced a majority breach, the breach path and subsequent re-verification flow remain unit-tested only. Exhaustively verified in `tests/test_layer2_mocked.py::test_reverify_flow_confirmed_vs_flaky`.
2. **Lineage Child Registration (`register_guard` with `parent_guard_id`)**: Because `parent_guard_id` strictly requires a prior CONFIRMED breach (`parent guard is not breached`), child registration could not be executed on-chain without an honest breach. Exhaustively verified in `tests/test_layer2_mocked.py::test_lineage_rules_and_parent_constraint`.
3. **Maximum Attempts Cap (40 attempts)**: Submitting 40 consecutive transactions per guard was omitted to conserve Studionet execution time. Exhaustively verified in `tests/test_layer2_mocked.py::test_attempts_cap_enforcement`.
