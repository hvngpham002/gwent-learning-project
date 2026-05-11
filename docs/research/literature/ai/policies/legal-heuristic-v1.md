# Legal Heuristic v1

Date: 2026-05-10

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

Latest cFp24.2 results:

- v1 smoke: `legal-heuristic-v1` records 6 wins and 6 losses against v0.
- v1 starter matrix: `legal-heuristic-v1` records 88 wins and 32 losses
  against v0; deck and matchup distributions changed from cFp24 after
  the pass-safety patch.

These are fixed-suite evidence, not ratings or proof of broad strength.

## Known Limitations

- Immediate tempo and upper-bound estimates are intentionally simple, and
  only count visible linked Muster targets rather than hidden deck
  contents.
- Weather and Scorch scoring use visible row state and current score
  entries, not engine simulation.
- Faction-specific strategy profiles are not implemented.
- v1 can still overcommit or over-pass in lines that require sacrifice,
  baiting, hand-reading, or multi-turn valuation beyond the cFp24.2
  hand-pressure helper.
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
to avoid exposing any potential engine identifiers. Prompt option IDs are
prompt-local (e.g. `"medic-revive"`, `"clear-weather"`) and do not contain
card names, but `optionRef` provides an extra safety boundary.

### Policy Last-Gem Upper Bound

cFp25 repair exports `uniqueCardTempoUpperBound` from
`legalHeuristicPolicyV1` and uses it as `policyLastGemUpperBound` in the
pass analysis. This matches the policy's own surrender gate logic
(`ownScore + uniqueCardTempoUpperBound`), replacing the previous
approximate heuristic (`ownScore + opponentHandCount * 50`). The heuristic
value is still available as `diagnosticApproxUpperBound` for reference.
`lastGemSurrenderAllowed` is based on `policyLastGemUpperBound`.

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

## Planned Follow-Ups

Useful next steps are a narrow v1.1 tuning pass over reviewed v1 ledgers
or mechanics stress suites for Spy/Medic/Muster/Weather/Scorch/Decoy/
Leader behavior. Product difficulty tiers remain a separate future spec.
