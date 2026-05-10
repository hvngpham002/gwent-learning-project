# Legal Heuristic v1

Date: 2026-05-10

## Purpose

`legal-heuristic-v1` is the first strategic hand-authored AI baseline
above `legal-heuristic-v0`. It is deterministic, hidden-info safe, and
benchmark-only in cFp24. It is not an ML agent, search policy, faction
specialist, rating system, or product difficulty tier.

The product Human vs AI flow remains on `legal-heuristic-v0` until a
later product/UI spec decides otherwise.

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

When no linked target is clearly worse than replacement uncertainty, v1
keeps the hand.

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
overkill against a passed opponent, and can pass when it is comfortably
ahead but behind in hand count. It does not bluff, bait Scorch/weather,
or plan multi-turn sacrifice lines.

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

Latest cFp24 results:

- v1 smoke: `legal-heuristic-v1` records 8 wins and 4 losses against v0.
- v1 starter matrix: `legal-heuristic-v1` records 88 wins and 32 losses
  against v0.

These are fixed-suite evidence, not ratings or proof of broad strength.

## Known Limitations

- Immediate tempo and upper-bound estimates are intentionally simple, and
  only count visible linked Muster targets rather than hidden deck
  contents.
- Weather and Scorch scoring use visible row state and current score
  entries, not engine simulation.
- Faction-specific strategy profiles are not implemented.
- v1 can still overcommit or over-pass in lines that require sacrifice,
  baiting, or hand-reading.
- Benchmarks use starter decks and smoke decks only; mechanics stress
  decks and competitive lists remain deferred.
- Glicko, TrueSkill, search, ML training, Python tooling, browser
  benchmark execution, and product difficulty selection remain deferred.

## Planned Follow-Ups

Useful next steps are a narrow v1.1 tuning pass over reviewed v1 ledgers,
mechanics stress suites for Spy/Medic/Muster/Weather/Scorch/Decoy/Leader
behavior, or a later product spec for AI policy selection after benchmark
review.
