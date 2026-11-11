# Milestone 1: UX, Onboarding, Test Funds Guide & Accessibility

**Repository**: `hypercybers99/guard-arena-app-genlayer`  
**Target Environment**: GenLayer Studionet (Preview) (Chain ID: 61999, RPC: `https://studio.genlayer.com/api`)  
**Production Site**: [https://guard-arena-app-genlayer.vercel.app](https://guard-arena-app-genlayer.vercel.app)  
**Contracts Pinned & Verified Byte-Identical**:
- **GuardArena**: `0xFcEAb957e1412e063760A534C294B897071E144B` (SHA-256: `a93010bb5a3371b8a2fddcc1b8c12d7a459c9572abe033ef8e265ed6c9872b41`)
- **GuardGate**: `0xCc9086C43D4152A5f5b5eb7fCfDfcd03a1f67AB6` (SHA-256: `6ebf7eb0606c00a95ece12123035e99bcecd9015c311a76a0ab3d3da7c90c4d2`)

---

## 1. Executive Summary

Milestone 1 implements an end-to-end upgrade to the BreakTheGuard decentralized adversarial arena dApp. The update introduces:
1. **Interactive Guided Tour**: A 5-step onboarding overlay walking new participants through platform capabilities, guard mechanics, adversarial prompts, lineage evolution, and consumer protection.
2. **Zero-Balance Execution & Test Funds Guide**: A modal providing current RPC balance checks and an empirical evidence table proving that write operations execute under validator consensus with a 0 GEN account balance.
3. **Pre-Write Client Validation**: Input guardrails mirroring Python contract constants (`MAX_NAME_CHARS=60`, `MAX_POLICY_CHARS=600`, `MAX_ATTACK_CHARS=500`, `MAX_ATTEMPTS=40`, pure ASCII check, and duplicate prompt detection) with inline errors and disabled buttons.
4. **Resilient Loading & State Presentation**: Card and table skeleton screens, structured empty states, and error boundaries with retry mechanisms.
5. **Clean Portal Modal Architecture**: Sibling DOM portal (`#app-root` and `#modal-root`), `inert` attribute management, body scroll locking, and Tab/Shift+Tab focus trapping.
6. **Accessibility Overhaul**: Standard visible focus rings, explicit label associations, and skip navigation, elevating Lighthouse accessibility scores to **100/100 across all 9 application routes**.

---

## 2. Before vs After Empirical Measurements

### 2.1 Lighthouse Accessibility Matrix (Real Production Audits)

| Route | Desktop Before | Desktop After | Mobile Before | Mobile After |
| :--- | :---: | :---: | :---: | :---: |
| `/` | 94 / 100 | **100 / 100** | 94 / 100 | **100 / 100** |
| `/arena` | 83 / 100 | **100 / 100** | 83 / 100 | **100 / 100** |
| `/guard/c6d699d5a2ed` | 94 / 100 | **100 / 100** | 94 / 100 | **100 / 100** |
| `/attack` | 88 / 100 | **100 / 100** | 88 / 100 | **100 / 100** |
| `/register` | 89 / 100 | **100 / 100** | 89 / 100 | **100 / 100** |
| `/leaderboard` | 93 / 100 | **100 / 100** | 93 / 100 | **100 / 100** |
| `/gate` | 88 / 100 | **100 / 100** | 88 / 100 | **100 / 100** |
| `/evidence` | 94 / 100 | **100 / 100** | 95 / 100 | **100 / 100** |
| `/wallet` | 95 / 100 | **100 / 100** | 95 / 100 | **100 / 100** |


*Note: All scores were audited directly against production URL `https://guard-arena-app-genlayer.vercel.app` using Lighthouse CLI with headless Chrome. Raw reports are packaged in `docs/milestones/m1/lighthouse_reports.zip`.*

### 2.2 Axe Accessibility Violation Scan (Matrix across 9 Routes x 3 Viewports)

| Route | Viewport | Baseline Violations | Milestone 1 Violations | Status |
| :--- | :---: | :---: | :---: | :---: |
| `/` | 1440px | 0 | **0** | PASS |
| `/` | 500px | 0 | **0** | PASS |
| `/` | 390px | 0 | **0** | PASS |
| `/arena` | 1440px | 2 | **0** | PASS |
| `/arena` | 500px | 2 | **0** | PASS |
| `/arena` | 390px | 2 | **0** | PASS |
| `/guard/c6d699d5a2ed` | 1440px | 0 | **0** | PASS |
| `/guard/c6d699d5a2ed` | 500px | 0 | **0** | PASS |
| `/guard/c6d699d5a2ed` | 390px | 0 | **0** | PASS |
| `/attack` | 1440px | 1 | **0** | PASS |
| `/attack` | 500px | 1 | **0** | PASS |
| `/attack` | 390px | 1 | **0** | PASS |
| `/register` | 1440px | 1 | **0** | PASS |
| `/register` | 500px | 1 | **0** | PASS |
| `/register` | 390px | 1 | **0** | PASS |
| `/leaderboard` | 1440px | 2 | **0** | PASS |
| `/leaderboard` | 500px | 2 | **0** | PASS |
| `/leaderboard` | 390px | 2 | **0** | PASS |
| `/gate` | 1440px | 1 | **0** | PASS |
| `/gate` | 500px | 1 | **0** | PASS |
| `/gate` | 390px | 1 | **0** | PASS |
| `/evidence` | 1440px | 0 | **0** | PASS |
| `/evidence` | 500px | 0 | **0** | PASS |
| `/evidence` | 390px | 0 | **0** | PASS |
| `/wallet` | 1440px | 0 | **0** | PASS |
| `/wallet` | 500px | 0 | **0** | PASS |
| `/wallet` | 390px | 0 | **0** | PASS |


*Total Violations*: Baseline **7 violations** -> Milestone 1 **0 violations** across all 27 route/viewport combinations and 6 modal state evaluations.

### 2.3 Interactive Control Traversal

| Route | Baseline Controls | Milestone 1 Controls | Focusable Verified |
| :--- | :---: | :---: | :---: |
| `/` | 17 | **23** | Yes |
| `/arena` | 34 | **25** | Yes |
| `/guard/c6d699d5a2ed` | 16 | **20** | Yes |
| `/attack` | 17 | **23** | Yes |
| `/register` | 19 | **26** | Yes |
| `/leaderboard` | 0 | **20** | Yes |
| `/gate` | 17 | **23** | Yes |
| `/evidence` | 25 | **31** | Yes |
| `/wallet` | 22 | **29** | Yes |


---

## 3. Automated Test Verification Results

| Suite | Runner / Engine | Scenarios Tested | Passed | Failed | Output Artifact |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Unit & Logic Tests** | Vitest (17 files) | AST parity, tour state, funds guide, error boundary, signatures | 92 | 0 | `npm run test` |
| **Occlusion Matrix (T1)** | Chromium, Firefox, WebKit | Center-point hit tests across 3 engines x 9 viewports x 2 modals | 216 | 0 | `docs/milestones/m1/occlusion_results.json` |
| **Keyboard Traversal (T2)** | Playwright (Chromium) | Skip link, focus traps, Shift+Tab wrapping, trigger restoration | 31 | 0 | `docs/milestones/m1/keyboard_results.json` |
| **Axe Scan Matrix (T3)** | Axe-Core Playwright | 9 routes x 3 viewports + 2 modals across 3 viewports | 33 | 0 | `docs/milestones/m1/axe_matrix.json` |
| **Production Lifecycle E2E** | Playwright (Headless) | Real on-chain register, attack, ask, and pre-write rejection | 10 | 0 | `docs/e2e_production_evidence.json` |

---

## 4. Empirical Zero-Balance Execution Evidence

On GenLayer Studionet (Preview) (Chain ID: 61999), gas deductions are currently not enforced. The following write operations were broadcasted and accepted by multi-validator consensus using throwaway accounts with an initial balance of 0 GEN:

### Step 0c Measurement Key (`0xd9699178B03D9E6671904345ddf431419FA9Eb7c`)
- **register_guard**: `0x4194687a8edff116798eac748ec0ab50eaaa42180c876419a1e6b1a127220b3f` (Accepted by validators, 3/5 agreed)
- **attempt_breach**: `0x6d9bc8690a634218b5bd0dd2cdc8221408f12a00a3cc56a6bf4dc60dd148a090` (Accepted by validators, 3/5 agreed)
- **guard_gate_ask**: `0x42fa431930e6eb8554efcc1b9d9cdecc2eaee19741d05566edec705a0f1bdaa3` (Accepted by validators, 3/5 agreed)

### Post-Deployment Production E2E Key (`0xF6667d0DF47D0f144DF786714C881A70642AEE9d`)
- **register_guard** (`Guard_dt35`, ID `fa0529b66312`): `0x0d6670e5f8d1d470db42dc918b644637580ef19fa6b2ec0ed7acfdc76db207bb` (Accepted by validators in 30s)
- **attempt_breach**: `0xe4db23068a9432ab4b2eb79237fc9bf79d6aa368afa3f11b6e45f252c3e96419` (Accepted by validators in 23s)
- **guard_gate_ask**: `0x93d5ee1632fc2b57651b961c61114026911126ba2efa59a202a76778d799a989` (Accepted by validators in 21s)

---

## 5. Visual Evidence & Screenshots

Ten paired before and after screenshots are cataloged in `docs/milestones/m1/`:
- **Landing (1440px / 390px)**: `docs/milestones/m1/before/01_landing_*.png` vs `docs/milestones/m1/after/01_landing_*.png`
- **Arena (1440px / 390px)**: `docs/milestones/m1/before/02_arena_*.png` vs `docs/milestones/m1/after/02_arena_*.png`
- **Register (1440px / 390px)**: `docs/milestones/m1/before/03_register_*.png` vs `docs/milestones/m1/after/03_register_*.png`
- **Attack (1440px / 390px)**: `docs/milestones/m1/before/04_attack_*.png` vs `docs/milestones/m1/after/04_attack_*.png`
- **Wallet (1440px / 390px)**: `docs/milestones/m1/before/05_wallet_*.png` vs `docs/milestones/m1/after/05_wallet_*.png`

---

## 6. How to Reproduce All Results Locally

```bash
# 1. Install dependencies
npm ci

# 2. Verify smart contract reference source integrity & run all unit tests
npm run check

# 3. Build production bundle
npm run build

# 4. Run automated test suites
npm run test:occlusion   # 216/216 checks pass across Chromium, Firefox, WebKit
npm run test:keyboard    # 31/31 keyboard traversal & focus trap checks pass
npm run test:axe         # 33/33 accessibility scans pass with 0 violations

# 5. Run full production lifecycle E2E (requires internet connection to Studionet RPC)
npm run test:e2e         # Executes stranger flow on deployed production site
```
