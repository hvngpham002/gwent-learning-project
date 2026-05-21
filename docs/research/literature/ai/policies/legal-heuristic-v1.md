# Legal Heuristic v1

Date: 2026-05-21

## Purpose

`legal-heuristic-v1` is the first strategic hand-authored AI baseline
above `legal-heuristic-v0`. It is deterministic, hidden-info safe, and
available for product playtesting as of cFp24.1. It is not an ML agent,
search policy, faction specialist, rating system, or product difficulty
tier.

The product Human vs AI flow still defaults to `legal-heuristic-v0`.
Human testers can select `legal-heuristic-v1` from the pre-game `AI
policy` selector or deep-link it with `?ai=legal-heuristic-v1` on `/` or
`/match`. Invalid `ai` query values fall back to v0, and
`legal-first-v0` remains benchmark-only.

## Current State

The policy ID remains `legal-heuristic-v1`. The latest behavior implementation
phase is cFp43: Round-One Overinvestment Guard. The latest analysis phase is
cFp45: Remaining Round-One Overinvestment Calibration. The latest infrastructure
phase is cFp48: Robust Starter Matrix Evaluation Suite, which adds a
25-seed / 1000-record starter matrix, robust failure-mining artifacts, robust
Glicko ratings, a suite-local `cFp48` snapshot, and a deterministic
`cFp48-vs-latest` comparison boundary. cFp47 freezes cFp46 rating artifacts as
named `cFp46` snapshots, adds `ledger.json` per suite, and generates
deterministic `cFp46-vs-latest` comparison artifacts with delta/signal
computation. cFp46 added deterministic rating/RD reports over existing public
benchmark records. The latest committed benchmark artifact refresh is the cFp48
robust 1000-record starter matrix. The behavior stack builds on the cFp27
through cFp43 tuning and diagnostics chain:

- cFp27: linked-card mulligan diagnostics and conservative low-standalone
  redraw scoring.
- cFp28: hand-quality pass calibration.
- cFp29: Medic timing calibration.
- cFp30: weather-aware non-hero unit placement.
- cFp31: round-investment and future-hand preservation.
- cFp32: stop-loss round sacrifice for non-elimination rounds.
- cFp33: Scoia'tael first-turn choice strategy.
- cFp34: automated failure-mining evaluation infrastructure.
- cFp35: failure-mining calibration and tuning queue.
- cFp36: round resource exhaustion budget gate with diagnostics.
- cFp37: pass-decision alignment — narrows the cFp36 resource gate so it only
  allows pass when round-investment recommends preserve or sacrifice, blocking
  it when recommendation is continue, fight_last_gem, or single-move catch-up.
- cFp38: weathered-row low-tempo scoring penalty — penalizes spending printed
  strength ≥ 6 into own weathered rows where effective strength ≤ 3 when a
  clearly better legal line exists. Tactical exceptions: Spy, strong Medic,
  Muster/linked callers, match-winning plays, last-gem catch-up, no-better-line.
  Repair 1: tightened unit-kind guard to `card.kind === "unit"`, fixed
  `betterNonWeatheredAlternativeAvailable` to be independent of exemption status,
  corrected reason strings to distinguish "penalty applied — still best" from
  "no better visible line".
- cFp39: Medic no-target timing guard — -260 delay penalty for no-target Medic
  plays when a useful non-Medic line exists. Six tactical exceptions preserve
  emergency Medic plays. Three new trace booleans. Medic score adjustment in
  round-investment analysis prevents timing penalty from distorting non-Medic
  decisions.

Current cFp43 benchmark totals:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 102 win / 17 loss / 1 draw vs v0.
- Current 120-record failure mining: 300 findings (`suspicious_pass=234`,
  `round_three_low_resource=36`, `weathered_row_play=18`,
  `round_one_overinvestment=6`, `medic_timing_risk=0`), with
  `round_one_overinvestment_pass=81` suppressed as intentional cFp43 passes.
- `benchmark-v1-starter-matrix-expanded-v1`: 400 completed / 0 policy failures /
  0 engine errors, with v1 recording 305 wins, 90 losses, and 5 draws against
  v0.
- `benchmark-v1-starter-matrix-robust-v1`: 1000 completed / 0 policy failures /
  0 engine errors / 0 replay failures, with v1 recording 776 wins, 206 losses,
  and 18 draws against v0.
- Expanded failure mining: 878 findings
  (`suspicious_pass=671`, `round_three_low_resource=86`,
  `weathered_row_play=86`, `round_one_overinvestment=26`,
  `medic_timing_risk=7`), with `round_one_overinvestment_pass=290` suppressed
  as intentional cFp43 passes.
- Robust failure mining: 2301 findings (`suspicious_pass=1752`,
  `weathered_row_play=240`, `round_three_low_resource=226`,
  `round_one_overinvestment=71`, `medic_timing_risk=11`,
  `matchup_skew=1`), with 920 suspicious-pass findings suppressed.

The next behavior decision should monitor the remaining round-one
overinvestment and suspicious-pass signals through the next benchmark refresh
cycle rather than immediately broadening the guard beyond round 1.

cFp41 adds that expanded discovery surface without changing policy behavior:
`benchmark-v1-starter-matrix-expanded-v1` runs the official starter-deck
matrix over 10 deterministic seeds for 400 records. Use
`npm run benchmark:long -- --profile v1-expanded` to produce the expanded
artifact bundle before selecting the next tuning patch.

cFp37 is a behavior repair that fixes the cFp36 pass-policy regression. The
cFp36 resource budget gate was mechanically correct but too broad: it could
force pass even when round-investment said `continue` or `fight_last_gem`.
cFp37 introduces `shouldPassForResourceExhaustion` with 10 hard-block
conditions that prevent the resource gate from overriding continue,
fight_last_gem, and single-move catch-up signals. The change restores
cFp35-level benchmark totals without deleting cFp36 diagnostics.

## Product Playtest Toggle

cFp24.1 adds a product-safe policy registry for playable policies:

- `legal-heuristic-v0`: stable/default product policy.
- `legal-heuristic-v1`: experimental playtest policy backed by the cFp24
  benchmark artifacts.

The selector is intentionally labelled `AI policy`, not difficulty. It
does not add rank, MMR, training mode, or player-facing balance promises.
The selected policy id is public and appears in pre-game, mulligan, and
match surfaces so testers can verify which controller is active.

AI Lab policy status now consumes the same product policy metadata. When
future product policies are registered, `/ai-lab` should derive their
implemented/playtest status from the registry instead of duplicating
status strings by hand.

## Hidden-Info Boundary

v1 receives only `EnginePolicyInput`: the acting seat id, its
`SeatObservation`, and the legal moves produced by the engine. It does
not inspect raw `MatchState`, `cardsById`, command logs, event logs,
opponent hand identities, opponent deck identities/order, or runtime card
instance ids outside legal moves and the acting-seat observation.

cFp24 extends visible `SeatCardSummary` records with public catalog
metadata:

- `linkedSourceIds`
- `deckLimit`

Prompt option summaries may include card summaries only for cards already
exposed by the prompt to the acting seat, such as own hand discard sets,
own discard restore choices, opponent discard choices, deck choices
revealed by the discard/draw leader prompt, or look-three reveal cards.

## Feature Groups

The policy extracts cheap features from the observation:

- score totals, score delta, round, phase, turn, pass flags, and gems;
- own/opponent hand, deck, and discard counts;
- public row totals and row occupancy;
- active weather and visible weather penalties;
- own/opponent leader used and current-round cancellation flags;
- own hand source, kind, ability, strength, link, and deck-limit data;
- legal move groups for mulligan, prompt, play, leader, and pass moves.

It does not simulate future engine states or run lookahead.

## Mulligan

v1 uses `linkedSourceIds` rather than name-prefix matching.

- Roach is redrawn when a `muster_roach` caller such as Geralt or Ciri is
  also in hand.
- One-way Muster callers are kept, while linked targets in hand are
  redrawn. Examples include base Gaunter with Darkness, Cerys with Shield
  Maidens, and Arachas Behemoth with regular Arachas.
- Same-source Muster keeps the first playable copy and redraws duplicates
  beyond the first. Examples include Light Longship, regular Arachas,
  Crones, and Vampires.
- Base Gaunter is treated as the preferred caller for Darkness. Darkness
  without base Gaunter is treated as same-source Muster, keeping one copy
  and redrawing extras.
- Heroes are not redrawn unless they are an explicit linked summoned
  target.
- Low standalone no-ability units (strength ≤ 3, no strategic ability, not
  a Muster caller) are redrawn as a conservative generic class. This
  catches `neutral.roach` when no `muster_roach` caller is in hand,
  without hard-coding a Roach-specific rule.
- Strategically important low-strength cards are NOT redrawn by the low-
  standalone rule: Spies, Medics, Tight Bond pieces, Morale Boost pieces,
  Agile units, Berserker/Mardroeme pieces, Decoy, Scorch, weather/special
  cards, Commander's Horn, Muster callers, and Heroes.

The shared `rankMulliganCandidates` helper (exported from
`legalHeuristicPolicyV1`) produces `LegalHeuristicV1MulliganCandidateRank`
entries with reason kind, confidence, and standalone value. Sort order:
higher confidence first, lower standalone value first, lower printed
strength first, `moveId` as deterministic tie-breaker.

When no redraw candidate exceeds the threshold, v1 keeps the hand.

## Round And Pass Strategy

If the opponent has passed, v1 passes when already ahead. If behind, it
looks for the cheapest known legal play or useful leader action that gets
ahead. If no known catch-up exists and the AI is not on its last gem, it
passes to avoid wasting cards. On the last gem, it passes only when a
simple visible upper-bound estimate still cannot catch the opponent. The
upper bound includes visible linked hand targets for Muster callers, but
does not assume hidden deck contents.

When neither side has passed, v1 scores useful plays and leader actions,
prefers high-impact low-tempo plays such as early Spies, avoids obvious
overkill against a passed opponent, and can voluntarily pass only when
its lead clears a simple hand-pressure safety threshold. cFp24.2 replaced
the earlier `scoreDelta > 12 && ownHandCount < opponentHandCount` rule:
opponent hand count now increases the required lead instead of making a
pass more attractive. The current helper charges 6 points of pressure per
opponent hand card, 8 points per card on v1's last gem, and requires at
least a 24-point lead normally or 36 points on the last gem. A lead in
the 18-30 range is therefore not treated as safe against an active
opponent with 9-12 cards when v1 has useful legal plays. It does not
bluff, bait Scorch/weather, or plan multi-turn sacrifice lines.

## Prompt And Leader Handling

Prompt choices are resolved before normal play:

- `cancel_leader` keeps the blunt v0 reaction behavior and cancels when
  the AI owns the prompt.
- `look_three_cards` chooses the acknowledgement by legal order.
- Medic, restore-discard, draw-opponent-discard, and deck-draw prompts
  use strategic card value rather than raw printed strength only.
- Discard/draw stage 1 discards the lowest-value legal hand set; stage 2
  chooses the highest-value revealed deck option.
- Unknown prompts fall back to exposed target strength, then move id.

Leader moves are scored by visible usefulness. Clear Weather must
materially help the AI more than the opponent. Weather-pulling leaders
must hurt the opponent more than the AI. Row Scorch leaders use exposed
target metadata. Restore/draw/discard/look/cancel leaders receive
conservative value only when their legal metadata indicates a useful
current context.

## Benchmark Suites

cFp24 registers v1 in `defaultBenchmarkPolicies` and adds:

- `benchmark-v1-smoke-v1`: current Northern Realms versus current
  Nilfgaard, `legal-heuristic-v1` versus `legal-heuristic-v0`, six smoke
  seeds, mirrored seats, 12 public records.
- `benchmark-v1-starter-matrix-v1`: five official starter decks, all 10
  unordered pairings, both v1/v0 policy assignments, 3 seeds, mirrored
  seats, 120 public records.

Latest cFp36-repair results (repaired policy code):

- v1 smoke: `legal-heuristic-v1` records 10 wins, 2 losses, and 0 draws
  against v0 (unchanged from cFp35).
- v1 starter matrix: `legal-heuristic-v1` records 89 wins, 29 losses,
  and 2 draws against v0 (120 records). Benchmark progression:
  cFp35 / origin-dev baseline: 102/16/2, pre-repair cFp36 branch:
  88/30/2, repaired cFp36 branch: 89/29/2. cFp36 has a net benchmark
  regression versus the cFp35 baseline. The repair improves the first
  cFp36 implementation by +1 win, recovering one win/loss by allowing
  exception plays to proceed correctly.

These are fixed-suite evidence, not ratings or proof of broad strength.

## Failure Mining (cFp34-cFp35)

cFp34 adds `npm run benchmark:v1-failure-mining`, which reruns
`benchmark-v1-starter-matrix-v1` with opt-in in-memory v1 decision traces and
writes hidden-info-safe findings to:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/
```

The artifact bundle contains `manifest.json`, `summary.json`, `findings.jsonl`,
`report.md`, and cFp35's `tuning-queue.md`. It is intended as evidence for
future tuning specs and is not a policy change. cFp34's first artifact reported
388 findings over 120 records, including 315 broad `suspicious_pass` findings.
cFp35 recalibrates that evaluator so `suspicious_pass` is not emitted solely
because `stopLossRecommended === false`; the refreshed artifact reports 295
findings, including 222 calibrated suspicious-pass findings and 93 suppressed
broad-pass candidates recorded only as aggregate analyzer-noise counts.

The cFp35 tuning queue ranked `round_resource_exhaustion`,
`weathered_row_low_tempo`, `medic_no_target_timing`, `skellige_matchup_skew`,
and `remaining_suspicious_pass`. That queue has since been partially worked
through by cFp36 through cFp43: round-resource/pass-priority, weathered-row
low-tempo, Medic timing, expanded failure-mining, the cFp42 casebook, and the
cFp43 round-one overinvestment guard are all now recorded as completed phases.
`leader_underuse` remains deferred until a safe public leader-availability
summary exists. H100/Slurm is still not involved; the command is CPU/Node
benchmark infrastructure.

## Known Limitations

- Immediate tempo and upper-bound estimates are intentionally simple, and
  only count visible linked Muster targets rather than hidden deck
  contents.
- Weather and Scorch scoring use visible row state and current score
  entries, not engine simulation.
- Faction-specific strategy profiles are not implemented.
- v1 can still overcommit or over-pass in lines that require sacrifice,
   baiting, hand-reading, or multi-turn valuation beyond the cFp31 round-
   investment and future-hand preservation gate.
- Benchmarks use starter decks and smoke decks only; mechanics stress
  decks and competitive lists remain deferred.
- Glicko, TrueSkill, search, ML training, Python tooling, browser
  benchmark execution, and product difficulty tiers remain deferred.

## Decision Tracing (cFp25)

cFp25 adds a hidden-info-safe decision trace layer that records why v1
chose each move, without exposing opponent hand identities, AI deck
order, or raw engine state.

Trace contract:

- `src/game/ai/decisionTrace.ts` defines the `AiDecisionTrace` schema
  (`ai-decision-trace-v1`), including public state, pass analysis,
  selected move summary, top candidate summaries (redacted), and a
  human-readable reason string.
- `src/game/ai/explainLegalHeuristicV1Decision` is a pure function that
  calls `legalHeuristicPolicyV1.selectMove` and returns both the same
  move and a trace. Policy parity is tested: `explainLegalHeuristicV1Decision(input).move`
  must equal `legalHeuristicPolicyV1.selectMove(input)` for mulligan,
  prompt, pass, play card, leader, and round-end cases.
- Traces are accumulated in the Redux engine slice (`diagnosticTraces`)
  during product matches and reset on rematch/setup.
- The product match screen (`AuthenticMatchScreen.tsx`) collects traces
  after each AI decision, provides `copy diagnostics` and
  `download diagnostics` controls near the battle log, and generates a
  versioned `gwent-product-playtest-diagnostics-v1` export that includes
  metadata, command/event summaries, decision traces, and a hidden-info
  safety scan result.
- Candidate summaries redact unplayed AI hand card names to
  `"hidden hand play"`, preventing human players from learning the AI's
  hidden hand.

### Selected Move Label Redaction

All selected move labels are redacted via `safeSelectedMoveLabel` to
prevent card name leakage from the AI's hidden hand:

- `play_card` → `"hidden hand play"` (never `"Play <card name>"`)
- `choose_mulligan` → `"mulligan hidden card"` or `"keep hand"`
- `choose_prompt_option` → `"resolve prompt option"`
- `use_leader` → `"use leader"`
- `pass` → `"pass"`
- `resolve_round_end` → `"resolve round end"`

The `optionId` field was replaced with `optionRef` in `AiDecisionSelectedMove`
to avoid exposing any potential engine identifiers. `optionRef` is a
deterministic local diagnostic reference (`option_<decision action index>`)
and is never derived from the raw engine prompt option ID, because some prompt
option IDs embed card instance tokens such as revive/restore/discard-draw
targets.

### Policy Last-Gem Upper Bound

cFp25 repair exports `uniqueCardTempoUpperBound` from
`legalHeuristicPolicyV1` and stores `ownScore + uniqueCardTempoUpperBound` as
`policyLastGemUpperBound` in the pass analysis. This matches the policy's own
surrender gate logic
(`ownScore + uniqueCardTempoUpperBound`), replacing the previous
approximate heuristic (`ownScore + opponentHandCount * 50`). The heuristic
value is still available as `diagnosticApproxUpperBound` for reference.
`lastGemSurrenderAllowed` is based on `policyLastGemUpperBound`.

### Nilfgaard Tie-Aware Catch-Up (cFp26)

cFp26 repairs two issues exposed by a product playtest export:

1. `legal-heuristic-v1` previously treated a reachable tied score as
   insufficient when deciding whether catch-up is possible. This is wrong
   for Nilfgaard, because Nilfgaard wins tied rounds when exactly one
   seat is Nilfgaard.
2. The diagnostic reason text could say `"catch-up move"` even when the
   selected move was `pass`.

The fix adds public faction awareness (`ownFaction`, `opponentFaction`) to
`SeatObservation` and introduces tie-aware helpers in the v1 policy:

```ts
const ownWinsTiedRound = (features) =>
  features.input.observation.ownFaction === "nilfgaard" &&
  features.input.observation.opponentFaction !== "nilfgaard";

const minimumScoreToWinRound = (features) =>
  ownWinsTiedRound(features)
    ? features.opponentScore         // tie is enough — Nilfgaard wins
    : features.opponentScore + 1;    // must exceed — draw loses
```

These helpers are used in both the catch-up candidate filter and the
last-gem impossible-pass gate. The engine rule is: if exactly one seat is
Nilfgaard, that Nilfgaard seat wins tied rounds; if neither or both are
Nilfgaard, the round is a draw.

The diagnostic reason text was also fixed: it now checks whether the
*selected* move is a non-pass catch-up play rather than claiming
catch-up based on the top sorted candidate alone.

What tracing CAN explain:
- Which move was selected and its score relative to alternatives.
- Why pass was safe or unsafe (score delta, opponent hand pressure,
  required lead, last-gem status).
- Whether a move was a catch-up attempt or a voluntary pass.

What tracing CANNOT explain (by design):
- Exact opponent hand composition (hidden info).
- Future hidden deck contents beyond a conservative upper-bound estimate.
- Hidden opponent leader abilities beyond usage/turn metadata.
- Multi-turn lookahead that v1 does not compute.

cFp25 is a diagnostics phase, not a tuning phase. No constants,
thresholds, or decision logic were changed.

### Pass Decision Diagnostics (cFp26.1)

cFp26.1 exports structured pass-decision diagnostics from the v1 policy
for decision traces and product diagnostics. These diagnostics explain
why v1 chose to pass, without changing any selected-move behavior.

The pass diagnostics include:

- `ownWinsTiedRound` — whether this seat is the sole Nilfgaard faction
- `minimumScoreToWinRound` — opponent score (Nilfgaard tie wins) or
  opponent score + 1 (must exceed)
- `policyUpperBound` — `ownScore + uniqueCardTempoUpperBound`,
  matching the last-gem surrender gate
- `policyUpperBoundCanWinRound` — whether `policyUpperBound >= minimumScoreToWinRound`
- `hasSingleMoveCatchUp` — whether any single play/leader move can reach
  `minimumScoreToWinRound`
- `bestSingleMoveCatchUpScore` / `Tempo` / `Kind` — metadata for the
  best single-move catch-up candidate (null when none exists)
- `preserveHandPassRecommended` — whether v1 would pass to preserve its
  hand (requires: opponent passed, scoreDelta ≤ 0, no single-move
  catch-up, ownGems > 1, pass is legal)

These fields are exposed on `AiDecisionPassAnalysis` and available in
product diagnostic exports via `passAnalysis`.

cFp26.1 is a diagnostics-only addition. No v1 decision logic changed.

### Mulligan Diagnostics (cFp27)

cFp27 adds hidden-info-safe mulligan diagnostics and conservative low-
standalone redraw scoring to the v1 policy. The mulligan diagnostics
explain why v1 chose a redraw target (or kept the hand) without exposing
AI hand card names, source IDs, or instance IDs.

The mulligan diagnostics are exposed as `mulliganAnalysis` on
`AiDecisionTrace` (null during playing phase) and include:

- `mulliganLegal` — whether a mulligan move is legal
- `selectedCardCount` — number of cards in the selected mulligan redraw
- `candidateCount` — number of ranked redraw candidates considered
- `selectedReasonKind` — one of `"linked_payload"`, `"muster_duplicate"`,
  `"low_standalone_unit"`, `"keep_hand"`, or `"unknown"`
- `selectedConfidence` — confidence score (0-100) of the selected redraw,
  or null for keep-hand
- `selectedStandaloneValueBucket` — `"low"` (< 80), `"medium"` (80-179),
  `"high"` (≥ 180), or null for keep-hand
- `topCandidateConfidence` — confidence of the best redraw candidate
- `topCandidateReasonKind` — reason kind of the best redraw candidate

Internal reason kinds are mapped to exported categories:
- `linked_roach_payload` / `one_way_linked_payload` → `"linked_payload"`
- `same_source_muster_duplicate` → `"muster_duplicate"`
- `low_standalone_unit` → `"low_standalone_unit"` (broad quality class,
  not a named card)

### Hand-Quality Pass Calibration (cFp28)

cFp28 calibrates voluntary safe-pass decisions against future-round hand
quality. Motivated by a product playtest export in which a `+29` round-1
lead (just above `requiredLead` of `24`) was voluntarily passed, leaving
the AI with no unit cards for a future must-win round.

Two new diagnostic types classify aggregate hand shape:

- `AiDecisionHandQuality`: `"empty"` (no cards), `"poor"` (no units, only
  specials/weather), `"thin"` (exactly one unit in 3+ cards), `"healthy"`
  (otherwise).
- `AiDecisionTempoBucket`: `"none"` (≤ 0), `"low"` (1-5), `"medium"`
  (6-10), `"high"` (≥ 11).

`AiDecisionHandShapeAnalysis` is a hidden-info-safe struct exposed on
playing-phase `AiDecisionTrace` via `handShapeAnalysis`. It counts unit,
hero, and special/weather cards in hand, buckets best tempo values, and
classifies future-round viability. No card names, source IDs, instance
IDs, cardIds, linkedSourceIds, or raw abilities are included.

Voluntary pass now requires extra safety buffer when the future hand is
poor or thin:

- `poor` future hand: `scoreDelta >= requiredLead + 18`
- `thin` future hand: `scoreDelta >= requiredLead + 10`
- `healthy` or `empty` future hand: unchanged (`scoreDelta >= requiredLead`)

This gate only applies when `opponentPassed === false`, `isLastGem ===
false`, and the pass is voluntary (not forced by catch-up impossibility).
The last-gem catch-up-impossible pass and opponent-passed pass behavior
are unchanged.

When hand quality blocks a voluntary pass, v1 selects the best positive
useful play. If no positive play exists, passing is still allowed.

cFp28 is still a heuristic, not lookahead or search. It only considers
aggregate hand shape for the next round, not multi-round simulation or
exact card sequencing.

### cFp28 Benchmark Results

Because selected-move behavior changed, benchmark artifacts were refreshed:

- Smoke benchmark: `legal-heuristic-v1` records 6 wins and 6 losses
  against v0 (changed from 5/7 after cFp27).
- Starter matrix: `legal-heuristic-v1` records 88 wins and 32 losses
  against v0 (changed from 89/31 after cFp27).

### cFp28 Repair: Hand-Shape Field Semantics

A follow-up repair aligned the hand-shape diagnostic fields with their
documented semantics:

- `unitCardCount` now strictly counts cards with `kind === "unit"`. Hero
  cards are no longer included in this count.
- `heroCardCount` tracks `kind === "hero"` cards separately.
- `futureRoundHandQuality` uses `unitTempoCardCount` (= `unitCardCount +
  heroCardCount`) rather than `unitCardCount` alone, so heroes continue to
  contribute to future-round viability assessment.
- `specialOnlyHand` is `true` only when the hand contains zero units AND
  zero heroes (i.e. only specials/weather remain).
- `noUnitFutureRisk` is `true` only when `unitTempoCardCount === 0` and
   the hand is non-empty.
- Pass-buffer constants (`EXTRA_BUFFER_POOR` = 18, `EXTRA_BUFFER_THIN` =
   10) and the `getFutureHandExtraBuffer` helper were extracted from inline
   code into `decisionTrace.ts` and shared by both the policy and
   explanation modules to prevent divergence.

### Medic Timing Calibration (cFp29)

cFp29 calibrates Medic source card valuation based on own-discard revive
target availability. Motivated by a product playtest in which the AI played
a Medic source early with no meaningful revive target in its own discard
pile, because `cardStrategicValue(...)` gave every Medic card a flat `+260`
bonus regardless of whether the ability could actually convert value.

Key changes:

- `SeatObservation` now includes `ownDiscard: SeatCardSummary[]`, populated
  from the engine discard pile. This is safe because own-discard is public
  game information visible to the acting seat.
- `cardStrategicValue(...)` accepts `{ includeMedicAbilityBonus? }` option.
  The flat `+260` bonus is now gated behind this option (defaults to `true`).
  `scorePlayMove(...)` passes `{ includeMedicAbilityBonus: false }` for
  Medic sources, replacing the flat bonus with contextual utility.
- `medicSourceUtility(...)` replaces the flat bonus with discard-aware
  utility: negative penalty when no revive targets exist, scaled positive
  utility when targets are available.
- `medicReviveTempoForSource(...)` injects expected revive tempo into
  `estimateImmediateTempo(...)` for own-row Medic plays.
- `AiDecisionMedicTimingAnalysis` is a hidden-info-safe struct exposed on
  playing-phase traces via `medicTimingAnalysis`. It includes:
  - `medicPlayLegal`: whether at least one Medic play-card move is legal
  - `medicPlayCandidateCount`: unique Medic source cards in hand
  - `ownDiscardReviveCandidateCount`: unique revive targets in own discard
  - `bestReviveStrengthBucket`: bucketed best non-Spy printed strength
  - `bestReviveValueBucket`: `none` / `weak` / `medium` / `strong`
  - `noTargetMedicRisk`: true when Medic is legal but discard is empty
  - `selectedMedicWithNoTarget`: true when selected move is a no-target Medic
- No card names, source IDs, instance IDs, cardIds, linkedSourceIds, or raw
  abilities are included in the diagnostic trace.
- Prompt-target Medic value is preserved; `promptCardValue(...)` continues to
  use the full `includeMedicAbilityBonus` default so Medic targets remain
  attractive when resolving a Medic prompt.

### cFp29 Benchmark Results

Because selected move scoring changed, the v1 benchmark artifacts were
refreshed after the cFp29 review repairs:

- Smoke benchmark (`benchmark-v1-smoke-v1`): v1 records 10 wins, 2 losses,
  and 0 draws against v0.
- Starter matrix (`benchmark-v1-starter-matrix-v1`): v1 records 90 wins,
  29 losses, and 1 draw against v0.

### Weather-Aware Unit Placement (cFp30)

cFp30 calibrates non-hero unit placement tempo based on active weather on
the target row. Motivated by a product playtest diagnostic export in which
the AI repeatedly played high-value non-hero units into its own weathered
rows, reducing their effective board value from full printed strength to 1.

Key changes:

- `estimateImmediateTempo(...)` now uses weather-adjusted effective strength
  for board-row placements of non-hero units. Active weather rows are derived
  from `observation.weather`, excluding `clear_weather` entries.
- Non-hero units placed on weathered rows use base placed strength `1` instead
  of printed strength. Heroes remain weather-immune and keep printed strength.
- Commander's Horn on a weathered row doubles the weather-adjusted strength
  (so a non-hero on a weathered horned row scores about `2`, not `20`).
- Spy placement on opponent weathered rows uses weather-adjusted signed tempo
  (e.g., `-1` not `-4` for strength-4 Spy into Fogged ranged row).
- `AiDecisionWeatherPlacementAnalysis` is a hidden-info-safe struct exposed on
  playing-phase traces via `weatherPlacementAnalysis`. It includes:
  - `selectedMoveIntoWeatheredRow`: whether the selected move targets a weathered row
  - `selectedMoveSide` / `selectedMoveRow`: placement target metadata
  - `selectedPrintedStrengthBucket` / `selectedEffectiveStrengthBucket`: strength
    buckets before/after weather adjustment
  - `ownWeatheredRows` / `opponentWeatheredRows`: public row names only
  - `candidateWeatheredOwnRowPlayCount` / `candidateWeatheredOpponentRowPlayCount`:
    counts of candidates that place into weathered rows
- `scanWeatherPlacementAnalysis` in `matchDiagnostics.ts` provides targeted
  hidden-info scanning for weather-placement diagnostics, catching source IDs
  and ability arrays within the weather-placement subtree.
- No card names, source IDs, instance IDs, cardIds, linkedSourceIds, or raw
  abilities are included in the diagnostic trace.

Weather adjustment logic mirrors engine scoring:

- Biting Frost affects close combat rows.
- Impenetrable Fog affects ranged rows.
- Torrential Rain affects siege rows.
- Skellige Storm affects ranged and siege rows.
- Clear Weather removes weather but is not itself an active row penalty.
- King Bran weather reduction is deferred (not readily available via public
   leader metadata in the observation).

### cFp30 Benchmark Results

Because selected move scoring changed, the v1 benchmark artifacts were
refreshed after cFp30:

- Smoke benchmark (`benchmark-v1-smoke-v1`): v1 records 9 wins, 3 losses,
  and 0 draws against v0 (changed from cFp29 10/2/0).
- Starter matrix (`benchmark-v1-starter-matrix-v1`): v1 records 96 wins,
  23 losses, and 1 draw against v0 (changed from cFp29 90/29/1).

### Round Investment Preservation (cFp31)

cFp31 adds round-investment awareness to prevent v1 from overcommitting
Round 1 and exhausting its hand, leaving Rounds 2/3 as low-card
formalities. Motivated by product playtest diagnostics showing v1
refusing to pass unless its lead exceeded the safety threshold, then
passing Rounds 2/3 because it had burned all useful cards.

Key changes:

- `AiDecisionRoundInvestmentRisk` enum: `"none"`, `"watch"`, `"high"`,
  `"critical"` — classifies future-hand depletion risk.
- `AiDecisionRoundInvestmentRecommendation` enum: `"none"`,
  `"preserve_future_hand"`, `"sacrifice_round"`, `"fight_last_gem"`,
  `"continue"`.
- `AiDecisionRoundInvestmentAnalysis` struct exposed on playing-phase
  traces via `roundInvestmentAnalysis`. It includes:
  - Board investment counts (own units, heroes, horns, total cards)
  - Positive future move counts (unit and non-unit)
  - Future-round hand quality classification
  - Current and estimated-after-move hand counts
  - Selected move flags (spends hand card, card-advantage, would leave
    no positive unit move, would leave no unit tempo card)
  - Non-elimination round flag, score delta, risk, and recommendation
- `shouldPassForRoundInvestment(...)` gates `choosePlayingMove` before
  returning the best useful play. It checks:
  - **Critical risk**: estimated hand after move ≤ 1, no positive unit
    moves remain, hand was large enough that preservation matters
    (`ownHandCount > 2`). Exception: if the move wins the match, play it.
  - **Preservation**: ahead or near-even (`scoreDelta >= -10`), continuing
    would leave no positive future plays, and estimated hand after move ≥ 2.
  - **Sacrifice**: behind (`scoreDelta < 0`), no single-move catch-up,
    and future-hand risk is `high`.
- **Exceptions**: Last-gem rounds always fight. Single-card hands always
  play. Card-advantage moves (Spy) are never blocked.
- `scanRoundInvestmentAnalysis` in `matchDiagnostics.ts` validates hidden-
  info safety for round-investment diagnostics.
- No card names, source IDs, instance IDs, cardIds, linkedSourceIds, or raw
  abilities are included in the diagnostic trace.
- `policy-round-investment` reason kind added to trace explanation for
  round-investment pass decisions.

### cFp31 Benchmark Results

cFp31.1 refreshed the cFp31 benchmark artifacts on macOS after the
Windows `tsx` binary resolution issue blocked the original cFp31 branch
from regenerating them:

- Smoke benchmark (`benchmark-v1-smoke-v1`): 9 wins, 3 losses, 0 draws
   against v0.
- Starter matrix (`benchmark-v1-starter-matrix-v1`): 103 wins, 15 losses,
   2 draws against v0.

### Stop-Loss Round Sacrifice (cFp32)

cFp32 adds a stop-loss gate that triggers `sacrifice_round` for non-elimination
rounds where catch-up is publicly impossible or too expensive and the selected
move would burn scarce future hand. Motivated by a product playtest diagnostic
export (`gwent-diagnostics-ep4-mp6cglwp.json`) in which v1 spent cards in
Round 1 despite being behind by 12, having no single-move catch-up, and having
`policyUpperBoundCanWinRound === false`.

Key changes:

- `catchUpStatus` field on `AiDecisionRoundInvestmentAnalysis`: `"single_move_catch_up"` /
  `"upper_bound_possible"` / `"upper_bound_impossible"`.
- `stopLossRecommended` boolean and `stopLossReason` string (`"none"`,
  `"upper_bound_impossible"`, `"low_hand_no_clean_catch_up"`,
  `"weathered_low_tempo"`, `"medium_medic_target"`).
- `shouldPassForRoundInvestment` now checks `stopLossRecommended` before
  returning the best useful play. The stop-loss gate fires when:
  - legal pass exists, opponent has not passed
  - `ownGems > 1` (last-gem rounds stay under existing logic)
  - score delta < 0 (behind)
  - no single-move catch-up
  - upper-bound cannot win OR the selected move burns the last useful unit
  - hand size ≤ 4 OR weathered low-tempo placement OR medium-or-worse Medic target
- **Exceptions**: Last-gem rounds, opponent-passed rounds, Spy/card-advantage
  moves, and single-card hands are never blocked by the stop-loss gate.
- Explanation layer updated with "stop-loss" reason strings that mirror the
  policy's `stopLossReason` field.
- `policy-round-investment` reason kind used for stop-loss pass decisions.

### cFp32 Benchmark Results

- Smoke benchmark (`benchmark-v1-smoke-v1`): 10 wins, 2 losses, 0 draws
  against v0 (changed from cFp31 9/3/0).
- Starter matrix (`benchmark-v1-starter-matrix-v1`): 102 wins, 16 losses,
  2 draws against v0 (changed from cFp31 103/15/2).

### Scoia'tael First-Player Prompt (cCp32.1)

cCp32.1 moves the Scoia'tael faction first-player choice from pre-game setup
to a post-mulligan engine prompt. `legal-heuristic-v1` resolves
`scoiatael_choose_first` deterministically with `scoiatael-first-player:self`
for now. This is intentionally simple: no faction-specific mulligan/first-turn
strategy has been tuned yet.

The public seat observation now exposes:

- `ownHasPostMulliganFirstPlayerChoice`
- `opponentHasPostMulliganFirstPlayerChoice`

Both fields are derived only from public faction identity. They exist so a
future Cluster F phase can make mulligan decisions with the first-player choice
in mind without leaking hidden cards.

### Scoia'tael First-Turn Choice (cFp33)

cFp33 replaces `legal-heuristic-v1`'s deterministic
`scoiatael-first-player:self` prompt fallback with a deterministic
post-mulligan hand-shape heuristic. The decision is based only on:

- **Legal prompt moves** (presence of self/opponent options)
- **Own hand summary** (counts by ability bucket, best opening tempo)
- **Public state** (no opponent hand, no deck contents)

Hand shape features computed from `SeatCardSummary`:

- Spy count (`"spy"` ability) → +35 initiative
- Muster/Muster Roach count (`"muster"`, `"muster_roach"`) → +25 initiative
- Best opening printed strength → +25 for 8+, +12 for 5-7
- Commander's Horn + 3+ proactive cards → +8 initiative
- Scorch count → +28 reaction
- Weather count (2+) → +24 reaction, (1) → +10 reaction
- Decoy without Spy → +8 reaction
- Medic count → +6 reaction
- Weak proactive (strength ≤ 4) + reactive density (≥ 2) → +18 reaction

Decision threshold: `reactionScore >= initiativeScore + 12` → choose opponent.
Ties default to `self` for stability.

Reason kinds (hidden-info-safe enums):

- `spy_or_card_advantage_opener` — go first with Spy
- `muster_or_thinning_opener` — go first with Muster/thinning
- `strong_tempo_opener` — go first with 8+ best opening
- `reactive_weather_or_scorch` — let opponent start with weather/scorch
- `weak_proactive_reactive_hand` — let opponent start for weak+reactive
- `default_go_first` — tie/bias → self
- `only_legal_option` — single option available

`AiDecisionScoiataelFirstTurnAnalysis` exposes counts, scores, tempo bucket,
and reason kind — never card names, source IDs, instance IDs, or ability
arrays. A targeted `scanScoiataelFirstTurnAnalysis` scanner rejects raw
source IDs, card names, instance IDs, and ability arrays in the analysis
subtree.

`v0` remains unchanged with its deterministic `self` fallback.

### Round Resource Exhaustion Tuning (cFp36)

cFp36 adds a conservative non-elimination round resource budget gate to
`legal-heuristic-v1`. The policy becomes more willing to pass or sacrifice a
non-elimination round when board investment already exceeds the budget for the
current hand quality and round.

Budget calculation:

- `AiDecisionHandQuality` classification determines the base budget:
  `"healthy"` → 5 board cards, `"thin"` → 4, `"poor"` → 3.
- Floor: 2, cap: 6.
- Round 2: -1 adjustment if own gems > opponent gems (safer to preserve).
- Score delta >= 10: -1 adjustment (already favorable).
- Score delta < -15: +1 (behind, may need more investment).
- Round 3: budget set to maximum cap (6) — no resource preservation needed.
- Last-gem (ownGems <= 1): budget set to cap (6) — always fight.
- Opponent passed or own passed: budget set to cap (6) — no preservation needed.

Resource pressure:

- `AiDecisionRoundResourcePressure` enum: `"none"`, `"watch"`, `"high"`, `"critical"`.
- Pressure only applies when board investment >= budget.
- Under-budget investment returns `"none"`.
- At budget: `"watch"`. Over by 1: `"high"`. Over by 2+: `"critical"`.

Resource exhaustion decision:

- `resourceExhaustionRecommended` is `true` ONLY when the budget is exceeded
  with a budget-exceeded reason: `"round_budget_exceeded"`, `"thin_future_hand"`,
  `"poor_future_hand"`, `"last_useful_unit"`.
- Exception reasons produce `resourceExhaustionRecommended === false`:
  `"exception_last_gem"`, `"exception_card_advantage"`,
  `"exception_leader"`, `"exception_match_winning_play"`, `"round_three_no_budget"`.

Exceptions preserved (never block play):

- Last-gem rounds: always fight.
- Spy/card-advantage moves: always play.
- Free leader actions (use_leader): always play.
- Match-winning play: if opponent is on last gem and this move reaches
  minimumScoreToWinRound, always play.
- Cheap single-move catch-up: if the candidate catches up to
  minimumScoreToWinRound with overkill <= 3 and doesn't leave no future unit
  tempo, allow it.
- Single-card hand: nothing meaningful to preserve.
- Round 3: no resource preservation.
- Opponent already passed: no preservation needed.

New diagnostic fields on `AiDecisionRoundInvestmentAnalysis`:

- `roundResourceBudget`: calculated budget (2-6).
- `roundResourcePressure`: `"none"` / `"watch"` / `"high"` / `"critical"`.
- `resourceExhaustionRecommended`: boolean.
- `resourceExhaustionReason`: reason enum.

### cFp36 Repair

A follow-up repair fixed four issues:

1. `buildRoundResourcePressure` now correctly returns `"none"` when board
   investment is under budget (floor budget caused false pressure signals).
   Removed the unused `_selectedMove` parameter to fix lint error.
2. Exception reasons now produce `resourceExhaustionRecommended === false`;
   only budget-exceeded reasons set it to `true`.
3. Added `exception_match_winning_play` check and cheap single-move catch-up
   logic to `buildRoundResourceExhaustionDecision` and
   `shouldPassForRoundInvestment`.
4. Moved the play-card exception reason check in
   `explainLegalHeuristicV1Decision.ts` before the `bestMove` block so that
   exception reason strings (e.g. "round resource pressure ignored — card
   advantage move") can actually appear in the trace reason when a useful
   play_card is selected and an exception applies.

Benchmark progression (v1 starter matrix, 120 records): cFp35 / origin-dev
baseline: 102/16/2, pre-repair cFp36 branch: 88/30/2, repaired cFp36 branch:
89/29/2. cFp36 has a net benchmark regression versus the cFp35 baseline.
The pre-repair cFp36 branch (88/30/2) was lower than the baseline due to
a separate code path in the initial implementation. The repair improves the
first cFp36 implementation by +1 win, recovering one win/loss by allowing
exception plays to proceed correctly. The tuning queue still ranks
`round_resource_exhaustion` as #1 for further tuning.

### Pass Decision Alignment (cFp37)

cFp37 keeps the cFp36 round-resource diagnostics but narrows the resource-gate
pass decision. `shouldPassForResourceExhaustion` only allows pass when
round-investment already recommends `preserve_future_hand` or
`sacrifice_round`, and blocks the resource gate when the diagnostic says
`continue`, `fight_last_gem`, or when a single-move catch-up with public
upper-bound viability still exists.

Benchmark totals after cFp37:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 102 win / 16 loss / 2 draw vs v0.
- Failure mining: 295 findings; suspicious_pass = 222.

cFp37 restores the cFp35 benchmark/failure-mining baseline without deleting
cFp36 diagnostics.

### Weathered Row Low-Tempo Tuning (cFp38)

cFp38 implements the narrow second-pass weathered-row guard from
`docs/spec/2026-05-18-cFp38-specs.md`. It penalizes own-side non-hero unit
placements with printed strength >= 6 when weather collapses effective strength
to <= 3 and a clearly better legal line exists. It preserves tactical
exceptions for Spy/card-advantage, strong Medic value, Muster/linked callers,
match-winning lines, last-gem catch-up, and no-better-line cases.

Benchmark totals remain at the cFp37 baseline:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 102 win / 16 loss / 2 draw vs v0.
- Failure mining: 295 findings; weathered_row_play = 21.

### Medic No-Target Timing Guard (cFp39)

cFp39 implements the narrow no-target Medic delay guard from
`docs/spec/2026-05-18-cFp39-specs.md`. It adds a -260 delay penalty (`MEDIC_NO_TARGET_DELAY_PENALTY`)
when a no-target Medic source play is selected and a useful non-Medic line exists
(score >= 25 among non-Medic play_card moves and leader moves). Six tactical
exceptions prevent the penalty from blocking emergency or match-winning plays:

1. Medic is the only legal non-pass play
2. Last-gem catch-up (ownGems <= 1, scoreDelta < 0, candidate reaches minimumScoreToWinRound)
3. Match-winning play (opponent on last gem, candidate reaches minimumScoreToWinRound)
4. Round 3 with low hand count (ownHandCount <= 2)
5. Opponent passed and Medic play reaches minimumScoreToWinRound
6. No useful non-Medic line exists (hasUsefulNonMedicLine returns false)

Key implementation details:

- `isNoTargetMedicSourcePlay(...)` identifies Medic plays with zero revive candidates.
- `hasUsefulNonMedicLine(...)` checks non-Medic play_card and leader moves for score >= 25.
- `shouldApplyNoTargetMedicDelayPenalty(...)` combines the above with exception checks.
- Medic scores are conditionally adjusted (+260) in
  `buildLegalHeuristicV1RoundInvestmentAnalysis` when computing
  `positiveUnitSourceCardIds` — only when
  `shouldApplyNoTargetMedicDelayPenalty(features, move)` returns true. Medic cards
  that do not trigger the cFp39 penalty (e.g. no useful non-Medic line exists) are
  scored at their raw `scoreMove` value for this computation.
- A Medic-specific clear-round-benefit exception in
  `shouldPassForRoundInvestment` is placed **before** `shouldPassForResourceExhaustion`,
  allowing no-target Medic plays that clearly put the AI ahead when behind to bypass
  resource exhaustion blocking.
- `AiDecisionMedicTimingAnalysis` gains three new booleans:
  `selectedNoTargetMedicDelayRisk`, `betterNonMedicAlternativeAvailable`,
  `noTargetMedicDelayPenaltyApplied`.
- Product diagnostics remain hidden-info safe (no card names, source IDs, or raw abilities).

Benchmark totals:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 104 win / 14 loss / 2 draw vs v0.
- Failure mining: 296 findings (suspicious_pass=225, weathered_row_play=22,
  medic_timing_risk=3, round_one_overinvestment=9, round_three_low_resource=34).

cFp39 adds 10 fixture tests to `engineAiPolicy.test.ts` covering:
- No-target Medic delay penalty when useful non-Medic line exists
- Medic-only hand exception
- Strong revive target preservation
- Prompt ranking unchanged
- Opponent-passed catch-up
- Last-gem emergency
- Select/explain parity
- Hidden-info safety
- Conditional Medic score compensation in positiveUnitSourceCardIds (repair)
- Weak no-target Medic without penalty not incorrectly compensated (repair)

### Recursive Scoring Guard (cFp41.1)

cFp41.1 repairs a stack overflow found by the cFp41 expanded benchmark
(`benchmark-v1-starter-matrix-expanded-v1`, matchup
`starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0`, seed
`starter-matrix-expanded-010`, mirror index `0`,
`policy_select_failed`, `Maximum call stack size exceeded`).

Root cause: cFp38/cFp39 alternative-line helpers called full recursive
scoring. `hasUsefulNonMedicLine` called `scorePlayMove(candidate)`, and
`hasClearlyBetterNonWeatheredLine` called `scoreMove(candidate)`. Both
`scorePlayMove` and `scoreMove` re-entered the same guards
(`shouldApplyNoTargetMedicDelayPenalty` → `hasUsefulNonMedicLine`,
`hasClearlyBetterNonWeatheredLine` → `scoreMove` → `scorePlayMove`),
creating an infinite recursion loop that blew the call stack.

Fix: added `scorePlayMoveForAlternativeScan`, a non-recursive tempo-based
helper that computes `cardStrategicValue + tempo * 14` without calling any
cFp38/cFp39 guard helpers. Rewrote `hasUsefulNonMedicLine` to use it for
play-card candidates. Rewrote `hasClearlyBetterNonWeatheredLine`'s
different-card branch to use `scorePlayMoveForAlternativeScan` instead of
`scoreMove`. The same-card +4 effective strength branch already used
non-recursive `effectivePlacedStrengthForPolicy` and was unchanged.

No constants, thresholds, scoring formulas, or AI policy tuning changed.
The alternative-scan helper preserves the rough threshold meaning of
`MIN_USEFUL_MOVE_SCORE` but does not include cFp38/cFp39 contextual
penalties because it is only deciding whether an alternative line exists.

cFp41.1 adds:
- 1 exact expanded-run regression test in `benchmarkHarness.test.ts`.
- 1 helper-level recursion guard test in `engineAiPolicy.test.ts` with
  no-target Medic + weathered low-tempo placement fixture.
- Stale `Recommended cFp36 Scope` heading in `failureMining.ts` replaced
  with `Recommended Next Scope`.

### Expanded Benchmark Artifact Refresh (cFp41.2)

cFp41.2 commits the post-cFp41.1 expanded artifact boundary generated by:

```bash
npm run benchmark:long -- --profile v1-expanded
```

The durable artifact set lives under:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/
```

The run completed 400/400 matches with 0 policy failures, 0 engine errors, and
0 replay failures. `legal-heuristic-v1` recorded 310 wins, 85 losses, and 5
draws against `legal-heuristic-v0`. Expanded failure mining reported 964
findings, with the top queue still pointing at round-resource exhaustion:
148 combined round-one overinvestment / round-three low-resource findings,
followed by weathered-row low-tempo (86), Medic no-target timing (11),
Skellige matchup skew (72), and remaining calibrated suspicious-pass
contradictions (717).

cFp41.2 does not change AI behavior, engine rules, legal moves, UI behavior,
catalog data, deck presets, benchmark suite shape, ratings, search, training, or
product difficulty. It updates committed artifacts plus AI Lab/product metadata
so `/ai-lab` shows the exact expanded result instead of the earlier cFp41.1
guard-only status string.

### Round Resource Exhaustion Casebook (cFp42)

cFp42 reads the committed cFp41.2 public expanded artifacts and creates the
decision note:

```text
docs/research/literature/ai/decisions/2026-05-20-cfp42-round-resource-casebook.md
```

The casebook splits the broad `round_resource_exhaustion` queue into two
sub-signals:

- `round_one_overinvestment`: 51 findings, 38 warning / 13 watch, and
  48 loss / 3 draw / 0 win. This is the behavior-actionable signal because it
  points at early round-1 hand depletion before later match loss.
- `round_three_low_resource`: 97 findings, 12 warning / 85 watch, and
  81 win / 12 loss / 4 draw. This is mostly a watch/noise signal because all 97
  selected `pass`, most had no positive unit tempo available, and the finding
  appears mostly in v1 wins.

The decision is to use cFp43 for narrow round-one overinvestment fixtures, not a
broad suspicious-pass rewrite and not a broad resource-exhaustion constant
tuning pass. cFp42 does not change `legal-heuristic-v1` behavior, engine rules,
legal moves, benchmark suite shape, UI behavior, catalog data, deck presets,
ratings, search, training, or product difficulty.

### Round-One Overinvestment Guard (cFp43)

cFp43 adds a narrow round-1-only overinvestment guard to
`legal-heuristic-v1`. The guard can choose pass instead of another
hand-spending `play_card` when the selected play would push the AI to at least
7 own board cards in round 1 while leaving 4 or fewer hand cards for later
rounds. It does not change engine rules, legal moves, v0 behavior, UI behavior,
catalog data, deck presets, benchmark suite shape, ratings, search, training, or
product difficulty.

The guard preserves tactical exceptions for last-gem fights, opponent-passed
states, non-play-card/free actions such as leader use, card-advantage plays,
match-winning plays, cheap single-move catch-up, and single-card hands.
Diagnostics add `roundOneBoardAfterSelectedMove`,
`roundOneOverinvestmentRecommended`, and `roundOneOverinvestmentReason` to
`AiDecisionRoundInvestmentAnalysis`. `roundOneOverinvestmentRecommended` is
true only for actual guard-pass recommendations; exception reasons stay false.
The trace enum still reserves `round_one_low_future_hand`, but the current
helper emits `round_one_board_limit` for the active geometry because the guard
requires both board and hand thresholds simultaneously.

cFp43 also updates failure mining with the
`round_one_overinvestment_pass` suppression category so intentional cFp43 passes
do not inflate the remaining `suspicious_pass` queue. Post-cFp43 current
failure mining reports 300 findings, and expanded failure mining reports 878
findings. The expanded round-one overinvestment signal drops from 51 to 26; the
starter-matrix strength regresses from the cFp41.2 expanded artifact
(`310/85/5`) to `305/90/5`, so future changes should watch whether the reduced
failure-mining signal is worth that tradeoff.

### Post-cFp43 Failure-Mining Casebook (cFp44)

cFp44 is an analysis/documentation phase. It reads the stable post-cFp43 public
benchmark artifacts and the expanded failure-mining findings to decide whether
the remaining `round_one_overinvestment` cases justify another behavior patch
or whether v1 heuristic tuning should pause for ratings/search.

Post-cFp43 findings (parsed from committed `findings.jsonl`):
- Current (120 records): 300 findings
  (`suspicious_pass=234`, `round_three_low_resource=36`,
  `weathered_row_play=18`, `round_one_overinvestment=6`, `medic_timing_risk=0`),
  with `round_one_overinvestment_pass=81` suppressed.
- Expanded (400 records): 878 findings
  (`suspicious_pass=671`, `round_three_low_resource=86`, `weathered_row_play=86`,
  `round_one_overinvestment=26`, `medic_timing_risk=7`),
  with `round_one_overinvestment_pass=290` suppressed.

Key findings (exact JSONL values):
- Expanded `round_one_overinvestment`: 26 total, 25 loss / 1 draw.
  Faction split: nilfgaard=10, northern_realms=11, scoiatael=3, skellige=2, monsters=0.
  Loss rate: 25/26 ≈ 96.2%. The cFp43 guard has coverage gaps in its geometry
  (board >= 7, hand <= 4).
- Expanded `round_three_low_resource`: 86 total, 75 win / 6 loss / 5 draw.
  84/86 have positiveUnitMoveCount=0, 2 have positiveUnitMoveCount=1.
  Win rate: 75/86 ≈ 87.2%. Watch/noise — not actionable.
- Current `round_three_low_resource`: 36 total, 32 win / 4 loss.
  35/36 have positiveUnitMoveCount=0, 1 has positiveUnitMoveCount=1.
  Win rate: 32/36 ≈ 88.9%. Watch/noise — not actionable.
- Expanded `weathered_row_play`: 86 total, faction split nilfgaard=40,
  northern_realms=22, monsters=19, skellige=3, scoiatael=2. Stable since cFp41.2.
  cFp38 guard is in place.
- Expanded `medic_timing_risk`: 7 total. 1 is true no-target Medic
  (ownDiscardReviveCandidateCount=0); 6 have revive candidates.
  Faction split: nilfgaard=3, scoiatael=2, northern_realms=2.
  cFp39's -260 delay covers the no-target case. Low confidence signal.
- Broad `suspicious_pass` (671) is too large for direct tuning and needs a classifier pass.

Recommendation: The next behavior spec should target the remaining
`round_one_overinvestment` cases. If those 26 cases are edge cases not worth
complexity, pause v1 heuristic tuning and move toward ratings/search.

cFp44 does not change AI behavior, engine rules, legal moves, UI behavior,
catalog data, deck presets, benchmark suite shape, failure-mining classifiers,
ratings, search, training, or product difficulty.

### Remaining Round-One Overinvestment Calibration (cFp45)

cFp45 is an analysis-only follow-up to cFp44. It reads the 26 remaining
expanded `round_one_overinvestment` findings from the committed public
failure-mining artifact and creates the decision note:

```text
docs/research/literature/ai/decisions/2026-05-21-cfp45-round-one-overinvestment-calibration.md
```

Because the existing `findings.jsonl` artifact exposes only aggregate public
fields, not per-play `AiDecisionTrace` guard evaluation data, cFp45 treats the
case split as a proxy classification rather than a definitive trace-level
diagnosis:

- 15/26 cases look like `handAfter <= 4` was not reached early enough to stop
  cumulative round-1 spending.
- 11/26 cases look like `boardAfter >= 7` was not reached until the final or
  near-final round-1 play.
- No exception-specific pattern can be proven from the current artifact.

Decision: no behavior change. The two proxy groups do not support a single safe
one-step threshold calibration, and cFp43 already produced a +5 loss tradeoff
while reducing the expanded signal from 51 to 26. The recommended next step is
to pause hand-tuned v1 heuristic work for ratings/search, or first add
trace-level guard telemetry to failure mining before attempting another
round-investment patch.

cFp45 updates AI Lab/product metadata so `/ai-lab` points at the latest analysis
phase. It does not change AI behavior, engine rules, legal moves, UI behavior,
catalog data, deck presets, benchmark suite shape, failure-mining classifiers,
ratings, search, training, or product difficulty.

### Glicko Rating Layer For Benchmark Artifacts (cFp46)

cFp46 adds a deterministic, research-local Glicko-style rating layer over
existing public benchmark `records.jsonl` artifacts. It does not change AI
behavior, engine rules, legal moves, UI behavior, catalog data, deck presets,
benchmark suite definitions, failure-mining classifiers, search, training, or
product difficulty.

The rating layer:

- Reads `BenchmarkMatchRecord` rows from the committed records.jsonl files.
- Filters to eligible records (status=`completed`, winner not null, both seat
  results not `none`, replayStatus not `failed`).
- Treats each artifact as one rating period per scope.
- Initializes entities to rating=1500, RD=350, then computes Glicko-1 updates
  using pre-period ratings for all opponents.
- Produces three required scopes: `policy`, `policy_deck`, `policy_faction`
  (plus optional `policy_matchup`).
- Writes rating artifacts under `benchmark-results/<suiteId>/ratings/latest/`
  including manifest.json, ratings.json, and report.md.
- Includes interpretation warnings: ratings are not exploitability, high RD
  means uncertain, do not compare across suite pools, research-local only.

Rating artifacts generated:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/ratings/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/ratings/latest/`

No AI policy, engine rule, UI, or difficulty behavior changed.

### Robust Starter Matrix Evaluation Suite (cFp48)

cFp48 adds `benchmark-v1-starter-matrix-robust-v1`, a deterministic
25-seed / 20-matchup / mirrored starter matrix that produces 1000 public
records. It reuses the same five official starter deck descriptors and the same
v1-vs-v0 matchup builder as the current and expanded starter-matrix suites.

Generated robust artifacts:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/snapshots/cFp48/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/comparisons/cFp48-vs-latest/`

The robust policy-level rating report has `legal-heuristic-v1` at rating
1795.34 / RD 30 over 1000 games and `legal-heuristic-v0` at rating 1204.66 /
RD 30 over the same suite. These are suite-local fixed-matrix ratings, not
exploitability, human difficulty, or a behavior change.

No AI policy behavior, engine rule, legal move, UI gameplay behavior, catalog
data, deck preset, Glicko formula, comparison threshold, search, training, or
product difficulty behavior changed.
