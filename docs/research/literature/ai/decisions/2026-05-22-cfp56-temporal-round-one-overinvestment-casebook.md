# cFp56: Temporal Round-One Overinvestment Casebook

Date: 2026-05-22

Phase: Analysis-only casebook over cFp55 robust `round_one_overinvestment`
findings.

## Decision

cFp56 changes no `legal-heuristic-v1` behavior. It classifies exactly 70
committed robust `round_one_overinvestment` findings from:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/findings.jsonl
```

Filter used:

- `kind === "round_one_overinvestment"`
- `policyId === "legal-heuristic-v1"`
- `suiteId === "benchmark-v1-starter-matrix-robust-v1"`

All 70 filtered rows were classified exactly once. The classification uses only
public scalar evidence already present on each finding plus public finding
metadata (`findingId`, `faction`, `deckPresetId`, `matchupId`, and
`matchOutcome`). It does not read or quote raw traces, private zones,
`unsafeDebugResults`, `cardsById`, command logs, final engine state, action
refs, raw move labels, card names, source IDs, runtime card IDs, or instance
IDs.

## Classification Method

Bucket precedence follows the cFp56 spec:

1. `telemetry_unavailable_or_other` if
   `roundOneGuardTelemetryAvailable !== true`.
2. `no_suppressed_pass_selected_base_geometry_present` if no first suppressed
   pass exists and selected play-card base geometry exists.
3. `late_guard_intervention` if a first suppressed pass exists.
4. `no_suppressed_pass_cumulative_continue_candidate` if no first suppressed
   pass exists, selected play-card base geometry is absent, and cumulative
   spend evidence is present.
5. `no_suppressed_pass_geometry_absent_low_confidence` otherwise.

Secondary flags are overlays only. They do not change top-level bucket
assignment.

## Count By Top-Level Bucket

| Bucket | Count | Share |
| --- | ---: | ---: |
| `late_guard_intervention` | 48 | 68.6% |
| `no_suppressed_pass_cumulative_continue_candidate` | 21 | 30.0% |
| `no_suppressed_pass_selected_base_geometry_present` | 1 | 1.4% |
| `no_suppressed_pass_geometry_absent_low_confidence` | 0 | 0.0% |
| `telemetry_unavailable_or_other` | 0 | 0.0% |

## Count By Bucket And Sub-Label

| Bucket | Sub-label | Count |
| --- | --- | ---: |
| `late_guard_intervention` | `board_floor_before_pass_without_base_geometry` | 8 |
| `late_guard_intervention` | `hand_cap_before_pass_without_base_geometry` | 24 |
| `late_guard_intervention` | `selected_base_geometry_before_pass` | 3 |
| `late_guard_intervention` | `suppressed_pass_without_selected_geometry` | 13 |
| `no_suppressed_pass_cumulative_continue_candidate` | `board_floor_never_reached` | 20 |
| `no_suppressed_pass_cumulative_continue_candidate` | `hand_cap_never_reached` | 3 |
| `no_suppressed_pass_selected_base_geometry_present` | `recommendation_absent` | 1 |

`no_suppressed_pass_cumulative_continue_candidate` sub-label counts exceed the
bucket row count because rows can carry more than one required sub-label.

## Count By Secondary Flag

| Secondary flag | Count |
| --- | ---: |
| `ahead_at_first_suppressed_pass` | 19 |
| `behind_at_first_suppressed_pass` | 28 |
| `catch_up_pressure` | 62 |
| `exception_sequence_pressure` | 27 |
| `selected_base_geometry_missing` | 66 |
| `selected_base_geometry_seen` | 4 |
| `selected_card_advantage_pressure` | 54 |
| `tied_at_first_suppressed_pass` | 1 |

The secondary overlay is heavy: 62/70 rows have catch-up pressure, 54/70 have
selected card-advantage pressure, 27/70 have exception sequence pressure, and
66/70 are missing selected play-card base geometry.

## Count By Bucket And Match Outcome

| Bucket | Match outcome | Count |
| --- | --- | ---: |
| `late_guard_intervention` | `draw` | 2 |
| `late_guard_intervention` | `loss` | 46 |
| `no_suppressed_pass_cumulative_continue_candidate` | `loss` | 21 |
| `no_suppressed_pass_selected_base_geometry_present` | `loss` | 1 |

## Count By Bucket And Faction

| Bucket | Faction | Count |
| --- | --- | ---: |
| `late_guard_intervention` | `monsters` | 2 |
| `late_guard_intervention` | `nilfgaard` | 18 |
| `late_guard_intervention` | `northern_realms` | 19 |
| `late_guard_intervention` | `scoiatael` | 6 |
| `late_guard_intervention` | `skellige` | 3 |
| `no_suppressed_pass_cumulative_continue_candidate` | `nilfgaard` | 13 |
| `no_suppressed_pass_cumulative_continue_candidate` | `northern_realms` | 7 |
| `no_suppressed_pass_cumulative_continue_candidate` | `scoiatael` | 1 |
| `no_suppressed_pass_selected_base_geometry_present` | `nilfgaard` | 1 |

## Count By Bucket And Deck Preset

| Bucket | Deck preset | Count |
| --- | --- | ---: |
| `late_guard_intervention` | `official-monsters-starter` | 2 |
| `late_guard_intervention` | `official-nilfgaard-starter` | 18 |
| `late_guard_intervention` | `official-northern-realms-starter` | 19 |
| `late_guard_intervention` | `official-scoiatael-starter` | 6 |
| `late_guard_intervention` | `official-skellige-starter` | 3 |
| `no_suppressed_pass_cumulative_continue_candidate` | `official-nilfgaard-starter` | 13 |
| `no_suppressed_pass_cumulative_continue_candidate` | `official-northern-realms-starter` | 7 |
| `no_suppressed_pass_cumulative_continue_candidate` | `official-scoiatael-starter` | 1 |
| `no_suppressed_pass_selected_base_geometry_present` | `official-nilfgaard-starter` | 1 |

## Count By Bucket And Matchup

| Bucket | Matchup | Count |
| --- | --- | ---: |
| `late_guard_intervention` | `starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1` | 2 |
| `late_guard_intervention` | `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | 4 |
| `late_guard_intervention` | `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | 2 |
| `late_guard_intervention` | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 8 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1` | 2 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1` | 4 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | 3 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` | 3 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0` | 5 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0` | 1 |
| `late_guard_intervention` | `starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` | 13 |
| `late_guard_intervention` | `starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0` | 1 |
| `no_suppressed_pass_cumulative_continue_candidate` | `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | 4 |
| `no_suppressed_pass_cumulative_continue_candidate` | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 9 |
| `no_suppressed_pass_cumulative_continue_candidate` | `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | 1 |
| `no_suppressed_pass_cumulative_continue_candidate` | `starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0` | 3 |
| `no_suppressed_pass_cumulative_continue_candidate` | `starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` | 4 |
| `no_suppressed_pass_selected_base_geometry_present` | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 1 |

## Bucket C: Late Guard Intervention

| Metric | Value |
| --- | ---: |
| Total rows | 48 |
| Average `roundOnePlayCardCountBeforeFirstSuppressedPass` | 7.85 |
| Range `roundOnePlayCardCountBeforeFirstSuppressedPass` | 7-11 |
| Average `roundOneFirstPlayToFirstSuppressedPassDecisionGap` | 8.15 |
| Range `roundOneFirstPlayToFirstSuppressedPassDecisionGap` | 7-13 |
| Rows with selected base-geometry-to-pass gap | 3 |
| Score delta at first suppressed pass: behind | 28 |
| Score delta at first suppressed pass: tied | 1 |
| Score delta at first suppressed pass: ahead | 19 |

Interpretation: this is the largest bucket, but it is not behavior-ready by
itself. The guard-visible selected pass usually appears only after substantial
round-one spending, and only 3/48 rows expose selected play-card base geometry
before that pass. The rest are board-floor-only, hand-cap-only, or geometry-
absent late interventions.

## Buckets D/E: No Suppressed Pass, Geometry Absent

| Bucket | Rows | Sub-label counts | Avg/range `roundOneContinuePlayCardTraceCount` | Avg/range `round1PlayCardCount` |
| --- | ---: | --- | --- | --- |
| `no_suppressed_pass_cumulative_continue_candidate` | 21 | `board_floor_never_reached=20`, `hand_cap_never_reached=3` | 8.57 (7-11) | 8.67 (7-11) |
| `no_suppressed_pass_geometry_absent_low_confidence` | 0 | none | n/a | n/a |

Interpretation: the cumulative bucket is real but not dominant. It is also
mostly selected-play base-geometry absent because the board floor is never
reached in 20/21 rows. A broad cumulative rule over these rows would interact
with strong catch-up/card-advantage pressure rather than isolate a clean
overinvestment mistake.

## Bucket B: High-Priority Debug Candidate

| findingId | matchOutcome | faction | `round1PlayCardCount` | `roundOneContinuePlayCardTraceCount` | first board floor | first hand cap | first base geometry | first recommended | first suppressed pass | catch-up before | selected-card-advantage before | exception before |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-018__0__seat-a` | `loss` | `nilfgaard` | 10 | 10 | 12 | 12 | 12 | null | null | 2 | 2 | 2 |

Interpretation: selected play-card base geometry exists but no first
recommended decision and no first suppressed pass exist. This is the only
Bucket B row. It is the highest-priority replay target if v1 round-one tuning
continues, but a one-row debug candidate is not enough to justify immediate
behavior.

## Bucket D: Cumulative Candidates

| findingId | faction | `round1PlayCardCount` | `roundOneContinuePlayCardTraceCount` | first board floor | first hand cap | after board floor | after hand cap | catch-up before | selected-card-advantage before | exception before |
| --- | --- | ---: | ---: | --- | --- | --- | --- | ---: | ---: | ---: |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-007__1__seat-b` | `nilfgaard` | 10 | 9 | null | 6 | null | 4 | 11 | 0 | 2 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-015__1__seat-b` | `nilfgaard` | 10 | 10 | null | 10 | null | 0 | 1 | 2 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-017__1__seat-b` | `nilfgaard` | 10 | 10 | null | 10 | null | 0 | 1 | 2 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-018__0__seat-a` | `nilfgaard` | 10 | 10 | null | 12 | null | 0 | 1 | 2 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-003__1__seat-b` | `nilfgaard` | 8 | 8 | null | null | null | null | 1 | 2 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-005__0__seat-a` | `nilfgaard` | 11 | 11 | null | null | null | null | 1 | 3 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-009__1__seat-b` | `nilfgaard` | 9 | 9 | null | 9 | null | 1 | 1 | 2 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-010__0__seat-a` | `nilfgaard` | 8 | 8 | null | 9 | null | 0 | 4 | 1 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-015__1__seat-b` | `nilfgaard` | 8 | 8 | null | 9 | null | 0 | 1 | 1 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-016__0__seat-a` | `nilfgaard` | 8 | 8 | null | 8 | null | 0 | 1 | 1 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-020__1__seat-b` | `nilfgaard` | 10 | 10 | null | 11 | null | 0 | 3 | 2 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-024__1__seat-b` | `nilfgaard` | 10 | 9 | null | 6 | null | 4 | 11 | 0 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-015__0__seat-a` | `northern_realms` | 8 | 8 | null | 10 | null | 0 | 1 | 1 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-018__0__seat-a` | `northern_realms` | 8 | 8 | null | 9 | null | 0 | 0 | 1 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-025__1__seat-b` | `northern_realms` | 9 | 9 | null | 10 | null | 0 | 6 | 2 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-005__1__seat-b` | `northern_realms` | 10 | 10 | null | 10 | null | 0 | 1 | 2 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-004__1__seat-b` | `nilfgaard` | 7 | 7 | null | 6 | null | 1 | 6 | 0 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-019__0__seat-b` | `scoiatael` | 7 | 7 | 6 | null | 3 | null | 8 | 1 | 0 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-011__0__seat-a` | `northern_realms` | 7 | 7 | null | 6 | null | 1 | 9 | 0 | 1 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-015__1__seat-b` | `northern_realms` | 7 | 7 | null | 7 | null | 1 | 5 | 0 | 2 |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-017__0__seat-a` | `northern_realms` | 7 | 7 | null | 6 | null | 1 | 3 | 0 | 1 |

Interpretation: these 21 rows are possible cumulative-spend candidates under
the spec, but they are not clean behavior fixtures. Most never reach the board
floor, most are carrying catch-up or selected-card-advantage pressure, and the
bucket is only 30.0% of the robust signal.

## Recommendation

Do not write a cFp57 behavior patch for `legal-heuristic-v1` from this
casebook.

The only bucket above the 60% dominance threshold is
`late_guard_intervention` at 48/70, but it is not an actionable public scalar
rule: 45/48 late rows do not expose selected play-card base geometry before the
suppressed pass, and the secondary flags show broad catch-up/card-advantage/
exception pressure. The cumulative bucket is smaller at 21/70 and mostly lacks
selected base geometry. A behavior patch would therefore need either broad
cumulative spending limits or weaker tactical exceptions, both of which cFp56
explicitly does not support.

Recommendation: pause hand-tuned v1 round-one heuristic tuning and move the
next Cluster F work toward non-v1-tuning evaluation depth, specifically
multi-period rating snapshots or search-readiness/ISMCTS probe design grounded
in the existing Batch A and Batch B research notes. If round-one tuning is
reopened later, replay the single Bucket B public fixture above before any
behavior change.
