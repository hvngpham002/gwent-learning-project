# cFp53 Round-One Guard Fixture Debug

## Summary

Schema version: `round-one-guard-debug-v1`

| Fixture | Status | Verdict | Target policy | Target faction | Outcome | Play-card rows | Contradictions | Suppressed passes |
|---|---|---|---|---|---|---:|---:|---:|
| Fixture A | completed | suppressed_pass_after_overinvestment | legal-heuristic-v1 | scoiatael | win | 5 | 0 | 1 |
| Fixture B | completed | suppressed_pass_after_overinvestment | legal-heuristic-v1 | skellige | loss | 7 | 0 | 1 |

## Per-Fixture Decision Rows

### Fixture A

Finding: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a`

Verdict: `suppressed_pass_after_overinvestment`

| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |
|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| 2 | play_card | own close | 0 | 1 | 9 | continue | no | none | no | no | no |
| 3 | play_card | row_horn | 5 | 4 | 8 | continue | no | none | no | no | no |
| 4 | play_card | own close | 10 | 5 | 7 | continue | no | none | no | no | no |
| 5 | play_card | own close | 15 | 6 | 6 | continue | no | none | no | no | no |
| 6 | play_card | own close | 22 | 7 | 5 | continue | no | none | no | no | no |
| 7 | pass | none | 44 | 9 | 4 | continue | yes | round_one_board_limit | no | no | yes |

### Fixture B

Finding: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b`

Verdict: `suppressed_pass_after_overinvestment`

| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |
|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| 1 | play_card | own ranged | -10 | 1 | 9 | continue | no | none | no | no | no |
| 2 | play_card | own close | -10 | 2 | 8 | continue | no | none | no | no | no |
| 3 | play_card | none | -8 | 3 | 7 | continue | no | none | no | no | no |
| 4 | play_card | own close | -6 | 3 | 6 | continue | no | none | no | no | no |
| 5 | play_card | own close | -3 | 4 | 5 | continue | no | none | no | no | no |
| 6 | play_card | own close | 8 | 5 | 4 | continue | no | none | no | no | no |
| 7 | play_card | own ranged | 25 | 6 | 3 | preserve_future_hand | no | none | no | no | no |
| 8 | pass | none | 32 | 8 | 2 | preserve_future_hand | yes | round_one_board_limit | no | no | yes |

## Post-Repair Assessment

cFp53 post-repair artifacts show zero selected-play contradictions for the two cFp52 fixtures. Any active round-one guard intervention is represented as a selected pass/suppressed-pass diagnostic instead of an overinvesting selected play.

## Hidden-Info Boundary

cFp53 round-one guard debug artifacts contain public fixture IDs, target-seat public metadata, scalar decision diagnostics, coarse target labels, and derived booleans only. Raw traces, raw engine state, commands, events, legal moves, private zones, card IDs, source IDs, instance IDs, action refs, and card names are intentionally omitted.
