# cFp42 Decision Note: Round Resource Exhaustion Casebook

Date: 2026-05-20

## Summary

cFp42 reviews the committed cFp41.2 expanded benchmark artifacts before
changing `legal-heuristic-v1` behavior again. The expanded failure-mining queue
labels `round_resource_exhaustion` as the top next scope, but the underlying
findings are not uniform:

- `round_one_overinvestment`: 51 findings. This is the more
  behavior-actionable signal: 48 of 51 cases end in a v1 match loss and the
  finding directly points at early round-1 hand depletion.
- `round_three_low_resource`: 97 findings. This is mostly a watch/noise signal:
  81 of 97 cases end in a v1 match win, all 97 selected `pass`, and most show no
  visible unit tempo left in the terminal round.

The next behavior spec should target deterministic round-one overinvestment
loss fixtures, not a broad suspicious-pass or broad resource-exhaustion tuning
patch.

## Source Artifacts

Only committed public artifacts were used:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/
```

The reviewed failure artifact is:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/findings.jsonl
```

## Hidden-Info Boundary

The casebook uses only the committed failure-mining rows: public suite ids,
matchup ids, deterministic seeds, mirror indices, deck preset ids, faction
labels, finding kinds, severities, and aggregate evidence fields. It does not
read raw `MatchState`, card instance ids, hands, decks, command logs, event logs,
or hidden AI observations.

## Aggregate Split

| Signal | Findings | Severity | Outcome split | Initial read |
| --- | ---: | --- | --- | --- |
| `round_one_overinvestment` | 51 | 38 warning / 13 watch | 48 loss / 3 draw / 0 win | Actionable loss signal |
| `round_three_low_resource` | 97 | 12 warning / 85 watch | 81 win / 12 loss / 4 draw | Mostly watch/noise |
| Combined | 148 | 50 warning / 98 watch | 81 win / 60 loss / 7 draw | Too broad for direct tuning |

## Faction And Deck Split

Combined `round_resource_exhaustion` findings:

| Faction | Findings |
| --- | ---: |
| Skellige | 36 |
| Scoia'tael | 34 |
| Monsters | 32 |
| Nilfgaard | 25 |
| Northern Realms | 21 |

`round_one_overinvestment` only:

| Faction | Findings |
| --- | ---: |
| Scoia'tael | 16 |
| Nilfgaard | 13 |
| Northern Realms | 11 |
| Monsters | 6 |
| Skellige | 5 |

`round_three_low_resource` only:

| Faction | Findings |
| --- | ---: |
| Skellige | 31 |
| Monsters | 26 |
| Scoia'tael | 18 |
| Nilfgaard | 12 |
| Northern Realms | 10 |

## Matchup Concentration

Top combined matchup ids:

| Matchup id | Findings |
| --- | ---: |
| `starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0` | 12 |
| `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` | 11 |
| `starter-monsters-heuristic-v0-vs-skellige-heuristic-v1` | 10 |
| `starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0` | 9 |
| `starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1` | 9 |
| `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 9 |
| `starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1` | 9 |

The signal is not isolated to one faction, but Skellige appears frequently in
both directions: as a v1 low-resource faction and as a v0 opponent in
overinvestment losses.

## Round-One Overinvestment Details

Round-one play-card count distribution:

| Round 1 play-card count | Findings |
| ---: | ---: |
| 7 | 11 |
| 8 | 22 |
| 9 | 6 |
| 10 | 5 |
| 11 | 6 |
| 13 | 1 |

Resolved-round split:

| Resolved rounds | Findings |
| ---: | ---: |
| 2 | 21 |
| 3 | 30 |

Representative deterministic cases:

| Finding id | Faction | Matchup | Seed | Mirror | Round 1 plays | Outcome |
| --- | --- | --- | --- | ---: | ---: | --- |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0__starter-matrix-expanded-004__1__seat-b` | Northern Realms | NR v1 vs Nilfgaard v0 | 004 | 1 | 13 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-010__0__seat-b` | Scoia'tael | Nilfgaard v0 vs Scoia'tael v1 | 010 | 0 | 11 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-010__1__seat-a` | Monsters | NR v0 vs Monsters v1 | 010 | 1 | 11 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-001__1__seat-a` | Nilfgaard | NR v0 vs Nilfgaard v1 | 001 | 1 | 11 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-003__1__seat-a` | Nilfgaard | NR v0 vs Nilfgaard v1 | 003 | 1 | 11 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-006__1__seat-a` | Nilfgaard | NR v0 vs Nilfgaard v1 | 006 | 1 | 11 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-010__0__seat-b` | Skellige | NR v0 vs Skellige v1 | 010 | 0 | 11 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-010__1__seat-a` | Scoia'tael | Nilfgaard v0 vs Scoia'tael v1 | 010 | 1 | 10 | loss |

Interpretation: this group is a good cFp43 candidate because it has a direct
action surface: constrain early round-1 spending when v1 is not on its last gem
and the selected move is not a card-advantage play, match-winning play, or
single-move catch-up. The examples above are deterministic enough to turn into
focused fixtures before changing constants.

## Round-Three Low-Resource Details

Hand-quality split:

| Future round hand quality | Findings |
| --- | ---: |
| poor | 68 |
| empty | 20 |
| thin | 9 |

Other public evidence:

| Field | Split |
| --- | --- |
| selected move kind | `pass`: 97 |
| unit card count | 0: 88, 1: 9 |
| hero card count | 0: 97 |
| positive unit move count | 0: 95, 1: 2 |
| special-only hand | true: 68, false: 29 |
| outcome | 81 win / 12 loss / 4 draw |

Representative loss cases:

| Finding id | Faction | Matchup | Seed | Mirror | Quality | Units | Special-only | Outcome |
| --- | --- | --- | --- | ---: | --- | ---: | --- | --- |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-005__0__seat-a__13` | Monsters | Monsters v1 vs Skellige v0 | 005 | 0 | poor | 0 | true | loss |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-009__1__seat-b__12` | Monsters | Monsters v1 vs Skellige v0 | 009 | 1 | poor | 0 | true | loss |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-005__1__seat-b__18` | Nilfgaard | Nilfgaard v1 vs Skellige v0 | 005 | 1 | poor | 0 | true | loss |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0__starter-matrix-expanded-004__1__seat-b__18` | Northern Realms | NR v1 vs Nilfgaard v0 | 004 | 1 | poor | 0 | true | loss |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-002__0__seat-a__14` | Northern Realms | NR v1 vs Skellige v0 | 002 | 0 | poor | 0 | true | loss |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-002__0__seat-b__15` | Scoia'tael | Nilfgaard v0 vs Scoia'tael v1 | 002 | 0 | poor | 0 | true | loss |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-009__0__seat-a__14` | Scoia'tael | Scoia'tael v1 vs Skellige v0 | 009 | 0 | empty | 0 | false | loss |

Interpretation: do not tune directly against all 97 round-three low-resource
findings. Most are wins, all are pass decisions, and most have no visible unit
tempo. The loss rows are useful as downstream validation for any round-one
resource patch, but by themselves they do not identify a legal move the AI
should have selected in round 3.

## Noise And False-Positive Assessment

The cFp36 regression showed that broad resource-pressure gates are dangerous:
they can preserve cards by suppressing otherwise useful plays. cFp42 confirms
that the current broad `round_resource_exhaustion` queue mixes at least two
different phenomena:

1. Early hand depletion that correlates with later losses.
2. Terminal round-3 pass states where v1 often already wins and has no unit
   tempo left.

There are 10 match-seat cases where both finding kinds appear, which likely
represent the true causal chain: round-one overinvestment creates a later
round-three low-resource state. That supports tuning from the round-one cause,
not from the round-three symptom.

## Recommendation

cFp43 should be a behavior phase named around round-one overinvestment, for
example `cFp43: Round-One Overinvestment Guard`.

Recommended cFp43 scope:

- build 5-8 deterministic policy fixtures from the representative
  `round_one_overinvestment` rows above;
- add a public trace field only if the existing round-investment analysis cannot
  explain the gate;
- constrain round-1 non-elimination spending only when v1 has already played a
  high number of cards and the selected move lacks a tactical exception;
- preserve Spy/card-advantage, leader, match-winning, last-gem, and
  single-move catch-up exceptions;
- prove the patch does not reintroduce the cFp36 broad resource-gate regression.

Do not use cFp43 for a broad suspicious-pass rewrite, broad resource-exhaustion
constant tuning, search, ratings, training, or new benchmark suite shape.
