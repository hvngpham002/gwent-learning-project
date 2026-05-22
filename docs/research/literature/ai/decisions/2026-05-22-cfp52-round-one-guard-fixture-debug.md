# cFp52: Round-One Guard Fixture Debug

Date: 2026-05-22

Phase: Reproduction / Hidden-Info-Safe Debug (cFp52)

## 1. Decision

Both cFp51 direct candidates reproduce real selected-play contradictions.

The cFp52 debug runner replays only the two robust cFp51
`guard_recommended_play_selected` fixtures. It confirms that both fixtures
contain selected `play_card` decisions where:

- `baseGeometryReached === true`;
- `roundOneOverinvestmentRecommended === true`;
- `selectedKind === "play_card"`.

Fixture A confirms this at decision indices `7`, `10`, and `11`. Fixture B
confirms this at decision index `8`.

Recommended cFp53 scope: write a narrow behavior-repair spec for this exact
public state shape. Do not broaden the board/hand thresholds and do not add
cumulative-spend tuning from cFp52; the reproduction proves a selected-play
contradiction path, not a broad threshold bug.

## 2. Source Fixtures

| Fixture | Finding id | Matchup id | Seed | Mirror | Target seat | Expected policy | Expected faction |
|---|---|---|---|---:|---|---|---|
| A | `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a` | `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | `starter-matrix-robust-017` | 1 | `seat_a` | `legal-heuristic-v1` | `scoiatael` |
| B | `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b` | `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` | `starter-matrix-robust-008` | 0 | `seat_b` | `legal-heuristic-v1` | `skellige` |

Replayed artifact path:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp52/
```

## 3. Hidden-Info Boundary

cFp52 serializes only public fixture ids, target-seat public metadata, match
outcome, scalar public state counts, scalar `roundInvestmentAnalysis` fields,
coarse selected move kind/target kind/target label, and derived booleans.

The debug artifacts do not serialize raw `AiDecisionTrace`, raw
`HeadlessMatchSimulationResult`, `unsafeDebugResults`, `MatchState`, command
logs, event logs, legal move arrays, candidate card labels, private hand arrays,
deck arrays, discard arrays, card source ids, runtime card instance ids, card
names, or action refs.

The cFp52 artifact scanner passed for the generated `manifest.json`,
`cases.json`, and `report.md`. It rejects synthetic card-source ids and raw card
names with punctuation.

## 4. Reproduction Method

The helper uses the existing `benchmark-v1-starter-matrix-robust-v1` suite
definition, finds each exact matchup and seed, applies the requested mirror
assignment, and runs exactly one match per fixture with decision traces and
debug results enabled in memory. It then projects the target v1 seat into the
hidden-info-safe row shape before writing artifacts.

Command:

```bash
npm run benchmark:v1-round-one-guard-debug
```

The command writes:

```text
manifest.json
cases.json
report.md
```

The command was run twice; the deterministic file hashes were byte-identical.

## 5. Fixture A Per-Decision Debug

Fixture A completed as `legal-heuristic-v1` on `scoiatael` with match outcome
`loss`.

| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |
|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| 2 | `play_card` | `own close` | 0 | 1 | 9 | `continue` | no | `none` | no | no | no |
| 3 | `play_card` | `row_horn` | 5 | 4 | 8 | `continue` | no | `none` | no | no | no |
| 4 | `play_card` | `own close` | 10 | 5 | 7 | `continue` | no | `none` | no | no | no |
| 5 | `play_card` | `own close` | 15 | 6 | 6 | `continue` | no | `none` | no | no | no |
| 6 | `play_card` | `own close` | 22 | 7 | 5 | `continue` | no | `none` | no | no | no |
| 7 | `play_card` | `card_instance` | 44 | 9 | 4 | `continue` | yes | `round_one_board_limit` | yes | yes | no |
| 8 | `play_card` | `opponent close` | 29 | 8 | 6 | `continue` | no | `none` | no | no | no |
| 9 | `play_card` | `own ranged` | 20 | 8 | 5 | `continue` | no | `none` | no | no | no |
| 10 | `play_card` | `own close` | 31 | 11 | 4 | `preserve_future_hand` | yes | `round_one_board_limit` | yes | yes | no |
| 11 | `play_card` | `weather` | 39 | 12 | 3 | `preserve_future_hand` | yes | `round_one_board_limit` | yes | yes | no |
| 12 | `pass` | `none` | 27 | 11 | 3 | `preserve_future_hand` | no | `exception_non_play_card` | no | no | no |

Fixture A summary: `traceDecisionCount=11`, `playCardTraceCount=10`,
`baseGeometryCount=3`, `recommendedPlayContradictionCount=3`, and
`suppressedPassCount=0`.

## 6. Fixture B Per-Decision Debug

Fixture B completed as `legal-heuristic-v1` on `skellige` with match outcome
`loss`.

| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |
|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| 1 | `play_card` | `own ranged` | -10 | 1 | 9 | `continue` | no | `none` | no | no | no |
| 2 | `play_card` | `own close` | -10 | 2 | 8 | `continue` | no | `none` | no | no | no |
| 3 | `play_card` | `none` | -8 | 3 | 7 | `continue` | no | `none` | no | no | no |
| 4 | `play_card` | `own close` | -6 | 3 | 6 | `continue` | no | `none` | no | no | no |
| 5 | `play_card` | `own close` | -3 | 4 | 5 | `continue` | no | `none` | no | no | no |
| 6 | `play_card` | `own close` | 8 | 5 | 4 | `continue` | no | `none` | no | no | no |
| 7 | `play_card` | `own ranged` | 25 | 6 | 3 | `preserve_future_hand` | no | `none` | no | no | no |
| 8 | `play_card` | `card_instance` | 32 | 8 | 2 | `preserve_future_hand` | yes | `round_one_board_limit` | yes | yes | no |
| 9 | `play_card` | `opponent siege` | 24 | 7 | 4 | `continue` | no | `exception_card_advantage` | yes | no | no |
| 10 | `pass` | `none` | 17 | 7 | 3 | `continue` | yes | `round_one_board_limit` | no | no | yes |

Fixture B summary: `traceDecisionCount=10`, `playCardTraceCount=9`,
`baseGeometryCount=2`, `recommendedPlayContradictionCount=1`, and
`suppressedPassCount=1`.

## 7. Contradiction Assessment

Yes, both fixtures reproduce selected play-card decisions with
`baseGeometryReached === true`, `roundOneOverinvestmentRecommended === true`,
and `selectedKind === "play_card"`.

Fixture A contradiction indices: `7`, `10`, and `11`.

Fixture B contradiction index: `8`.

The recommendations were not only later paired with selected pass rows:

- Fixture A continues playing after the first contradiction, selects two more
  contradiction plays, and only then passes at decision `12`; that pass no
  longer carries `roundOneOverinvestmentRecommended === true`.
- Fixture B selects the contradiction play at decision `8`, then selects a
  card-advantage exception play at decision `9`, then selects a pass at decision
  `10` where the guard recommendation is visible as a suppressed pass.

This confirms the cFp51 aggregate signal is not merely lossy case-level
aggregation. There is a real policy contradiction in the selected-play path.

## 8. Analyzer Calibration Assessment

Analyzer calibration is not the primary cFp53 direction for these two direct
cases. The debug rows show actual selected-play contradictions, not just late
suppressed passes or board-floor artifacts.

Analyzer calibration may still be useful later for the broader robust
`round_one_overinvestment` queue, because cFp51 showed most remaining rows are
late suppressed passes or board-floor misses. cFp52, however, should not convert
these two direct candidates into an analyzer-only finding.

## 9. Recommended cFp53 Scope

cFp53 should be a narrow behavior-repair phase for the exact reproduced state:

```text
round === 1
selectedKind === "play_card"
baseGeometryReached === true
roundOneOverinvestmentRecommended === true
```

The repair spec should inspect why the policy can still select that play when
the round-one guard analysis recommends preserving the future hand. It should
not change scoring constants, widen `ROUND_ONE_OVERINVESTMENT_BOARD_AFTER_FLOOR`
or `ROUND_ONE_OVERINVESTMENT_HAND_AFTER_CAP`, add cumulative-spend tuning, alter
failure-mining classifiers, or change engine rules.

Threshold widening is explicitly rejected from cFp52. The reproduced problem is
not that the guard thresholds are too narrow; it is that the current selected
move can carry an active guard recommendation and still be selected. A broad
threshold or cumulative-spend patch would reach beyond the evidence and risks
reintroducing the cFp36 broad-resource-gate failure mode.
