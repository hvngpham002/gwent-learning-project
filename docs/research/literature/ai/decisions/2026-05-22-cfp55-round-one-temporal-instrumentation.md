# cFp55: Round-One Temporal Spend Instrumentation

Date: 2026-05-22

Phase: Instrumentation / Hidden-Info-Safe Failure-Mining Evidence (cFp55)

## Decision

cFp55 changes no `legal-heuristic-v1` behavior. It adds scalar temporal and
cumulative round-one spend evidence to existing `round_one_overinvestment`
failure-mining findings so a future cFp56 casebook can decide whether the
remaining robust signal is late intervention, missing selected play-card
geometry, cumulative continue-phase spend, or exception-heavy pre-pass spending.

The implementation is additive inside `src/game/benchmark/failureMining.ts`.
It does not change AI policy behavior, engine rules, legal moves, benchmark
suite definitions, benchmark records, ratings, debug artifacts, UI gameplay
behavior, catalog data, deck presets, search/training code, or product
difficulty.

## Added Evidence Fields

All new fields are scalar `number | boolean | null` values. They are derived
from public `AiDecisionRoundInvestmentAnalysis` diagnostics already available
to failure mining and do not write raw traces, card names, source IDs, runtime
card IDs, instance IDs, action refs, move labels, command logs, final state, or
private-zone payloads.

### First-Event Indexes

- `roundOneFirstPlayCardDecisionIndex`
- `roundOneFirstBoardFloorDecisionIndex`
- `roundOneFirstHandCapDecisionIndex`
- `roundOneFirstBaseGeometryDecisionIndex`
- `roundOneFirstRecommendedDecisionIndex`
- `roundOneFirstSuppressedPassDecisionIndex`

### First-Suppressed-Pass Context

- `roundOnePlayCardCountBeforeFirstSuppressedPass`
- `roundOneBoardAfterSelectedMoveAtFirstSuppressedPass`
- `roundOneHandAfterSelectedMoveAtFirstSuppressedPass`
- `roundOneScoreDeltaAtFirstSuppressedPass`
- `roundOneFirstPlayToFirstSuppressedPassDecisionGap`
- `roundOneFirstBoardFloorToFirstSuppressedPassDecisionGap`
- `roundOneFirstHandCapToFirstSuppressedPassDecisionGap`
- `roundOneFirstBaseGeometryToFirstSuppressedPassDecisionGap`

### Continue And Post-Geometry Spend

- `roundOneContinuePlayCardTraceCount`
- `roundOneContinuePlayCardTraceCountBeforeFirstSuppressedPass`
- `roundOnePlayCardCountAfterFirstBaseGeometryBeforeFirstSuppressedPass`
- `roundOnePlayCardCountAfterFirstBoardFloorBeforeFirstSuppressedPass`
- `roundOnePlayCardCountAfterFirstHandCapBeforeFirstSuppressedPass`

### Score-Delta Sequence Counts

- `roundOneScoreDeltaBehindBeforeFirstSuppressedPassCount`
- `roundOneScoreDeltaTiedBeforeFirstSuppressedPassCount`
- `roundOneScoreDeltaAheadBeforeFirstSuppressedPassCount`
- `roundOneScoreDeltaBehindAfterFirstSuppressedPassCount`
- `roundOneScoreDeltaTiedAfterFirstSuppressedPassCount`
- `roundOneScoreDeltaAheadAfterFirstSuppressedPassCount`

### Exception Sequence Counts Before First Suppressed Pass

- `roundOneExceptionCardAdvantageBeforeFirstSuppressedPassCount`
- `roundOneExceptionSingleMoveCatchUpBeforeFirstSuppressedPassCount`
- `roundOneExceptionNonPlayCardBeforeFirstSuppressedPassCount`
- `roundOneSelectedCardAdvantageBeforeFirstSuppressedPassCount`
- `roundOneCatchUpSingleMoveBeforeFirstSuppressedPassCount`

Telemetry-unavailable rows keep the existing unavailable evidence and expose
safe `null` defaults for first-event, first-pass context, gap, and
count-before-style fields where a count would be misleading without trace data.
Rows with no first suppressed pass also use `null` for first-suppressed-pass
count-style fields such as `roundOnePlayCardCountBeforeFirstSuppressedPass` and
`roundOneContinuePlayCardTraceCountBeforeFirstSuppressedPass`. Score-delta
before counts and exception-before counts intentionally still cover all
round-one traces when no first suppressed pass exists.

## Regenerated Artifacts

Only failure-mining artifacts were regenerated:

| Suite | Path | Findings | `round_one_overinvestment` |
|---|---|---:|---:|
| current | `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/` | 300 | 6 |
| expanded | `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/` | 878 | 26 |
| robust | `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/` | 2301 | 70 |

Finding counts did not change. The committed artifact diffs are additive
evidence-field changes in `findings.jsonl`; `summary.json` changes only because
its `topFindings` entries embed those findings.

Robust repeated hashes matched:

| File | SHA-256 |
|---|---|
| `manifest.json` | `fa98fde885e26edad42b27c4a1a787f5fe97b556db54b6c4d2b6fad891a8fc7e` |
| `summary.json` | `fa3975dba5686e280ee8c79d61e4fca31d21fd814fbd6a03bfdf39b92f3d337e` |
| `findings.jsonl` | `0e7efee5556ed77921efcdb1fbc690a902d678844c26ae7a427d4bc35cefd1b9` |
| `report.md` | `c862b0eced54c1b0759caeb04e45c3565855cd43a7e6f34f52b7772d5485fa4e` |
| `tuning-queue.md` | `3497ae323abf880f07c8dc1e2d8afaf4590320f9a9a7582902884e7dd603e93c` |

## First Robust Readout

The regenerated robust artifact has exactly 70 `round_one_overinvestment`
findings for `legal-heuristic-v1`: 68 losses and 2 draws.

New temporal/cumulative readout:

| Metric | Value |
|---|---:|
| Rows with first suppressed overinvestment pass | 48 |
| Rows without first suppressed overinvestment pass | 22 |
| Rows missing selected play-card board-floor index | 57 |
| Rows missing selected play-card hand-cap index | 24 |
| Rows missing selected play-card base-geometry index | 66 |
| Avg play-card count before first suppressed pass | 7.85 |
| Play-card count before first suppressed pass range | 7-11 |
| Avg first-play-to-first-suppressed-pass gap | 8.15 |
| First-play-to-first-suppressed-pass gap range | 7-13 |
| Rows with base-geometry-to-first-suppressed-pass gap | 3 |
| Avg base-geometry-to-first-suppressed-pass gap | 1.33 |
| Base-geometry-to-first-suppressed-pass gap range | 1-2 |
| Avg total continue play-card count | 8.09 |
| Total continue play-card count range | 6-11 |
| Rows with continue play-card count before first suppressed pass | 48 |
| Avg continue play-card count before first suppressed pass | 7.83 |
| Continue play-card count before first suppressed pass range | 6-11 |
| Total play cards after first base geometry before first suppressed pass | 1 |

Score-delta direction counts before the first suppressed pass across all robust
rows:

| Direction | Count |
|---|---:|
| Behind | 469 |
| Tied | 51 |
| Ahead | 91 |

Exception/selection counts before the first suppressed pass across all robust
rows:

| Field | Count |
|---|---:|
| `roundOneExceptionCardAdvantageBeforeFirstSuppressedPassCount` | 0 |
| `roundOneExceptionSingleMoveCatchUpBeforeFirstSuppressedPassCount` | 5 |
| `roundOneExceptionNonPlayCardBeforeFirstSuppressedPassCount` | 26 |
| `roundOneSelectedCardAdvantageBeforeFirstSuppressedPassCount` | 73 |
| `roundOneCatchUpSingleMoveBeforeFirstSuppressedPassCount` | 264 |

Interpretation: cFp55 confirms that the remaining robust rows now expose the
temporal evidence cFp54 lacked. The first robust readout points toward a mix of
late suppressed passes, strict selected play-card geometry absence, and
catch-up/card-advantage-heavy pre-pass sequences. This is still not a behavior
patch by itself.

## cFp56 Use

cFp56 can classify the 70 robust findings with the new fields and decide:

- whether already-guarded rows are mostly late-intervention rows;
- whether missing selected play-card geometry means threshold widening would be
  too broad;
- whether cumulative continue-phase spend appears before the first suppressed
  pass;
- whether score-delta and exception sequences explain why continued play was
  reasonable before the first guard-visible pass;
- whether any narrow behavior rule is justified without touching existing
  tactical exceptions.

cFp56 should continue to avoid raw traces, private state, card identities,
benchmark record regeneration, ratings, debug artifacts, search/training code,
and product difficulty changes unless a later spec explicitly scopes them.
