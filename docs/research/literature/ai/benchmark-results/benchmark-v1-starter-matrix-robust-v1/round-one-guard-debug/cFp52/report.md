# cFp52 Round-One Guard Fixture Debug

## Summary

Schema version: `round-one-guard-debug-v1`

| Fixture | Status | Verdict | Target policy | Target faction | Outcome | Play-card rows | Contradictions | Suppressed passes |
|---|---|---|---|---|---|---:|---:|---:|
| Fixture A | completed | confirmed_policy_contradiction | legal-heuristic-v1 | scoiatael | loss | 10 | 3 | 0 |
| Fixture B | completed | confirmed_policy_contradiction | legal-heuristic-v1 | skellige | loss | 9 | 1 | 1 |

## Per-Fixture Decision Rows

### Fixture A

Finding: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a`

Verdict: `confirmed_policy_contradiction`

| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |
|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| 2 | play_card | own close | 0 | 1 | 9 | continue | no | none | no | no | no |
| 3 | play_card | row_horn | 5 | 4 | 8 | continue | no | none | no | no | no |
| 4 | play_card | own close | 10 | 5 | 7 | continue | no | none | no | no | no |
| 5 | play_card | own close | 15 | 6 | 6 | continue | no | none | no | no | no |
| 6 | play_card | own close | 22 | 7 | 5 | continue | no | none | no | no | no |
| 7 | play_card | card_instance | 44 | 9 | 4 | continue | yes | round_one_board_limit | yes | yes | no |
| 8 | play_card | opponent close | 29 | 8 | 6 | continue | no | none | no | no | no |
| 9 | play_card | own ranged | 20 | 8 | 5 | continue | no | none | no | no | no |
| 10 | play_card | own close | 31 | 11 | 4 | preserve_future_hand | yes | round_one_board_limit | yes | yes | no |
| 11 | play_card | weather | 39 | 12 | 3 | preserve_future_hand | yes | round_one_board_limit | yes | yes | no |
| 12 | pass | none | 27 | 11 | 3 | preserve_future_hand | no | exception_non_play_card | no | no | no |

### Fixture B

Finding: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b`

Verdict: `confirmed_policy_contradiction`

| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |
|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| 1 | play_card | own ranged | -10 | 1 | 9 | continue | no | none | no | no | no |
| 2 | play_card | own close | -10 | 2 | 8 | continue | no | none | no | no | no |
| 3 | play_card | none | -8 | 3 | 7 | continue | no | none | no | no | no |
| 4 | play_card | own close | -6 | 3 | 6 | continue | no | none | no | no | no |
| 5 | play_card | own close | -3 | 4 | 5 | continue | no | none | no | no | no |
| 6 | play_card | own close | 8 | 5 | 4 | continue | no | none | no | no | no |
| 7 | play_card | own ranged | 25 | 6 | 3 | preserve_future_hand | no | none | no | no | no |
| 8 | play_card | card_instance | 32 | 8 | 2 | preserve_future_hand | yes | round_one_board_limit | yes | yes | no |
| 9 | play_card | opponent siege | 24 | 7 | 4 | continue | no | exception_card_advantage | yes | no | no |
| 10 | pass | none | 17 | 7 | 3 | continue | yes | round_one_board_limit | no | no | yes |

## cFp53 Recommendation

cFp53 should be a narrow behavior-repair spec for the exact selected-play contradiction shape reproduced here: round 1, selected play_card, base geometry reached, and roundOneOverinvestmentRecommended true. Do not broaden thresholds or add cumulative-spend tuning from cFp52.

## Hidden-Info Boundary

cFp52 round-one guard debug artifacts contain public fixture IDs, target-seat public metadata, scalar decision diagnostics, coarse target labels, and derived booleans only. Raw traces, raw engine state, commands, events, legal moves, private zones, card IDs, source IDs, instance IDs, action refs, and card names are intentionally omitted.
