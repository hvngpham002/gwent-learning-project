# Batch B Decision Note - Evaluation Ladder

Date: 2026-05-09

Status: accepted decision note

## Question

What should count as credible evidence that a Gwent AI policy is
improving, robust, and ready to compare against future search or
learning agents?

## Sources Read

| Source | Annotation | Role In Decision |
|---|---|---|
| Timbers et al., "Approximate Exploitability: Learning a Best Response" | `docs/research/literature/ai/annotations/timbers2022approxexploitability/timbers2022approxexploitability.md` | Robustness and adversarial-evaluation source; separates head-to-head strength from worst-case exploitability-style weakness. |
| Herbrich et al., "TrueSkill(TM): A Bayesian Skill Rating System" | `docs/research/literature/ai/annotations/herbrich2006trueskill/herbrich2006trueskill.md` | Rating-layer source for uncertainty-aware match-result evaluation, draws, and future multi-agent/team flexibility. |
| Glickman, "The Glicko system" | `docs/research/literature/ai/annotations/glickman1995glicko/glickman1995glicko.md` | Lightweight two-player rating/RD source; useful first rating method over fixed Gwent match-result batches. |

This note cites the annotation files as the source of truth. It does not
read new source PDF pages.

## Decision

Build an evaluation ladder before implementing search or model training.

The ladder should have four layers, from cheapest and most deterministic
to most research-heavy:

1. **Validity and regression layer:** deterministic replay, termination,
   illegal-action count, hidden-info validation, and runtime metrics.
2. **Fixed-suite head-to-head layer:** seeded matchup matrices with
   mirrored seats where appropriate, stratified by agent, deck/faction,
   opponent pool, seed suite, and policy version.
3. **Uncertainty-aware rating layer:** Glicko-style rating/RD as the
   first local implementation; TrueSkill-compatible result schema kept
   open for later multiplayer/team/human ladder uses.
4. **Robustness probe layer:** approximate best-response /
   exploitability-style diagnostics for reduced games or frozen
   policies only after the first two layers are stable.

No single scalar rating should be treated as proof of strong play.
Ratings summarize observed outcomes; they do not prove hidden-info
safety, strategic robustness, or low exploitability.

## Rationale

### Paper Says

`timbers2022approxexploitability` argues that head-to-head outcomes and
worst-case exploitability-style robustness are complementary. Learned
approximate best response can reveal weak trajectories, but the score is
a lower bound on true exploitability and depends on the best responder's
strength and observation contract.

`herbrich2006trueskill` provides a Bayesian rating model over completed
match outcomes with uncertainty, draw handling, conservative display
ratings, and practical large-scale online use. It is a rating layer, not
a gameplay policy or robustness proof.

`glickman1995glicko` gives a simpler uncertainty-aware paired-comparison
rating system. Its rating deviation (RD) is directly useful for early
Gwent agents because sparse or uneven matchup data should show up as
uncertain ratings rather than false precision.

### Project Inference

Gwent AI evaluation needs a layered report, not a single leaderboard.
The same policy can win a narrow fixed suite, lose under a different
faction/deck matrix, and still be exploitable by an adversarial best
responder. Batch B therefore pushes us toward a benchmark harness that
preserves raw match records and only computes ratings as one view over
those records.

The simplest faithful first implementation is not TrueSkill or
approximate exploitability. It is a durable match-result ledger plus
fixed-suite matchup matrices and uncertainty reporting. Glicko can sit
on top of that ledger early because it is easy to explain and cheap.
TrueSkill remains a compatible future direction once human play,
multiplayer/team labels, or matchmaking-style product use becomes real.

## Required Guardrails

1. **Raw result ledger first:** every benchmark result must preserve
   agent id, agent version, policy config, deck/preset id, faction,
   opponent id, opponent deck/faction, seed, seat, match result,
   round results, runtime, engine/catalog version, and benchmark suite
   id.
2. **No unlabeled aggregate rating:** never collapse factions, decks,
   seed suites, and opponent pools into one number without also
   reporting the stratified matrix.
3. **Uncertainty is mandatory:** report confidence intervals, Glicko RD,
   or TrueSkill sigma/conservative rating with sample count. Point
   ratings without uncertainty are not acceptable research evidence.
4. **Fixed and holdout suites:** maintain fixed regression suites for
   comparability and separate holdout suites for overfitting detection.
5. **Mirroring where possible:** for deterministic seed comparisons,
   mirror seat/deck/opponent assignments when the matchup allows it so
   first-player, faction, and seed effects are easier to see.
6. **Draw-aware outcomes:** preserve win/loss/draw, not just binary
   wins. Gwent draws are real match outcomes.
7. **Ratings are post-engine:** rating updates live outside the pure
   engine and consume completed match ledgers only.
8. **Rating is not robustness:** Glicko/TrueSkill must not be presented
   as exploitability, Nash distance, hidden-info safety, or
   best-response resistance.
9. **Approximate exploitability is a lower bound:** a weak best
   responder failing to exploit a policy does not prove the policy is
   safe.
10. **Observation contract recorded:** every robustness probe must state
    whether it is hidden-info-safe, belief-sampled, reduced-game, or
    oracle/debug.
11. **Compute budget recorded:** search/training/evaluation budget is
    part of the result, not incidental metadata.
12. **Product difficulty later:** research ratings can inform future
    difficulty tiers, but they are not themselves human-like difficulty
    models.

## Evaluation Ladder Shape

### Layer 0 - Validity And Regression

This layer answers: did the policy complete legal games reproducibly?

Minimum metrics:

- completion rate;
- illegal selected move count;
- policy exception count;
- max-step / non-termination count;
- deterministic replay success;
- hidden-info export validation;
- mean and percentile runtime per match;
- average legal move count and action-type distribution.

### Layer 1 - Fixed-Suite Head-To-Head

This layer answers: how does the policy perform against known
opponents under stable conditions?

Minimum outputs:

- matchup matrix by agent and opponent;
- stratified rows by deck/faction and seed suite;
- win/loss/draw counts;
- round win/loss/draw counts;
- card-advantage and pass-timing summaries;
- mirrored-seat deltas where applicable;
- raw ledger export.

### Layer 2 - Rating

This layer answers: how should observed outcomes be summarized across a
benchmark population?

Initial recommendation:

- implement Glicko-style rating/RD first because current Gwent
  evaluation is two-player and one-agent-per-seat;
- keep the result schema compatible with TrueSkill later;
- show rating, RD, interval/conservative estimate, match count, and
  benchmark population;
- keep ratings research-local until product difficulty policy exists.

### Layer 3 - Robustness / Approximate Best Response

This layer answers: can an adversarial evaluator discover exploitable
weaknesses missed by head-to-head play?

Initial recommendation:

- defer full-game approximate exploitability;
- begin with reduced-game or frozen-policy probes;
- report best-responder lift over ordinary baselines;
- inspect weak trajectories;
- never call the result exact exploitability.

## Implication For Roadmap

Batch B makes the next implementation-adjacent artifact a benchmark
harness spec, not `legal-heuristic-v1`, ISMCTS, NFSP, Deep CFR, ReBeL,
or model training.

The next spec should target:

- a typed match-result ledger;
- fixed seed-suite and matchup-matrix runner;
- deterministic benchmark summaries;
- optional first Glicko/RD report over completed results;
- explicit placeholders for future TrueSkill and approximate
  best-response layers.

This directly supports Batch A because search results need an evaluation
container before the search policy itself is useful.

## Open Questions

- Should the first benchmark suite focus on current starter decks only,
  or include all official starter decks immediately?
- Should the first rating method be pure Glicko, or should the code
  expose a rating-provider interface so TrueSkill can be added later
  without changing the ledger?
- How many seeds per matchup should define a minimum publishable result
  for local development: 20, 50, 100, or adaptive until uncertainty
  falls below a threshold?
- Which holdout suites should be invisible to policy tuning?
- What reduced-game abstraction is small enough for the first
  approximate best-response probe?

## Next Recommended Artifact

Write the implementation spec for a benchmark/evaluation harness, unless
the user wants Batch C first.

If continuing research synthesis first, write Batch C over:

- `zinkevich2007regret`;
- `lanctot2009monte`;
- `heinrich2016deepreinforcementlearningselfplay`.

Batch C should decide the self-play theory boundary and how much, if
any, CFR/NFSP vocabulary belongs in the near-term Gwent plan.
