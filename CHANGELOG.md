# Changelog

All notable changes to BreakTheGuard are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - Milestone 1 - UX, Onboarding & Accessibility - 2026-11-11

### Summary
Comprehensive user experience overhaul delivering a 5-step guided interactive tour, empirical zero-balance test funds guide, client-side pre-write form validation matching smart contract limits, skeleton loading, accessible error boundaries with retry buttons, clean portal modal architecture with focus trapping and scroll lock, and accessibility improvements resulting in 100/100 Lighthouse accessibility scores across all 9 application routes.

### Before vs After vs Why

#### 1. Onboarding & Tour
- **Before**: First-time visitors arrived at an unguided interface with dense game theory concepts (adversarial guards, deterministic consensus, output filters) and had no guided discovery path.
- **After**: Automatic 5-step interactive `GuidedTour` modal explaining the arena, deployment, adversarial attacks, lineage trees, and consumer protection. Fully dismissible, persisted in `localStorage` with in-memory fallback, and operable by keyboard with re-open triggers in header and footer.
- **Why**: Eliminates cold-start drop-off by orienting reviewers and red-team participants through key user journeys in under 60 seconds.

#### 2. Test Funds & Gasless Execution Clarity
- **Before**: Users did not know how to obtain test funds or whether transactions required gas on the network, leading to hesitation.
- **After**: Built `FundsGuideModal` and reusable `FundsHelpBadge` on all write forms. Displays real-time current balance queries alongside an empirical evidence table proving that on GenLayer Studionet (Preview), gas fee deductions are currently not enforced and accounts with 0 GEN balance can execute contract write transactions directly under validator consensus. Provides direct links to network documentation.
- **Why**: Removes funding uncertainty and allows immediate participant interaction without manual faucet delays.

#### 3. Pre-Write Validation
- **Before**: Submitting invalid guard names, forbidden tokens, oversized attack texts, or duplicate prompts broadcasted raw transactions to the network, resulting in 30-50s delays followed by on-chain contract reverts.
- **After**: Built `preWriteValidation.ts` mirroring Python contract parameter limits (`MAX_NAME_CHARS=60`, `MAX_POLICY_CHARS=600`, `MAX_ATTACK_CHARS=500`, `MAX_ATTEMPTS_PER_GUARD=40`, 64-word token dictionary, pure ASCII check). Provides instant inline error messages, dynamic character counters, and disables submit buttons with explanatory tooltip titles when inputs are invalid.
- **Why**: Protects users from transaction failure and consensus latency by catching syntax and boundary violations locally.

#### 4. Skeletons, Empty States & Error Resilience
- **Before**: Route transitions flashed blank spaces during RPC fetching; failed queries showed raw error logs or false "not found" states; native modal dialogs were prone to occlusion.
- **After**: Implemented dedicated `TableSkeleton`, `CardSkeleton`, structured `EmptyState` with actionable reset links, `ErrorBoundary` with retry capabilities, and friendly RPC error panels with explicit "Retry Query" triggers. Zero native dialogs across the codebase.
- **Why**: Delivers predictable, resilient state feedback during network fluctuations without breaking the layout.

#### 5. Modal Architecture & Z-Index Tokens
- **Before**: Modals were rendered inline inside nested DOM trees with ad-hoc z-index values, risking clipping by parent overflow containers.
- **After**: Created `Modal.tsx` portaling into a dedicated sibling `#modal-root`, setting `inert` on `#app-root`, locking background body scroll, managing focus traps (Tab/Shift+Tab wrapping), restoring trigger focus on Escape or close, and using strict tiered tokens (`src/styles/zIndex.ts`).
- **Why**: Eliminates visual overlap and keyboard trapping issues across all viewport dimensions.

#### 6. Accessibility
- **Before**: Baseline Axe scan reported 7 violations across 5 routes (form elements without associated labels, missing landmarks, poor contrast badges); Lighthouse accessibility scores ranged from 83 to 95.
- **After**: Added accessible skip-to-content links, explicit `<label>` associations on all inputs and selects, standard 2px focus rings on all interactive elements, and resolved landmark hierarchies.
- **Why**: Ensures all features are operable by keyboard and assistive screen-reading tools, achieving 100/100 Lighthouse accessibility across all 9 application routes.

---

## [1.1.0] - Contract Fix Pass & Deterministic Validator Binding - 2026-11-10
- Fixed GuardGate `ask()` validator consensus binding to deterministically enforce reply integrity.
- Refactored GuardArena `register_guard()` utility probe rules and list-equality validators.
- Deployed GuardArena (`0xFcEAb957e1412e063760A534C294B897071E144B`) and GuardGate (`0xCc9086C43D4152A5f5b5eb7fCfDfcd03a1f67AB6`).
