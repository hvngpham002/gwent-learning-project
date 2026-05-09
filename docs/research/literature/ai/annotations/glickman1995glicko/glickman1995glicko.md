---
citekey: glickman1995glicko
title: "The Glicko system"
authors:
  - "Mark E. Glickman"
year: 1995
venue: "Boston University"
doi: ""
arxiv: ""
project_relevance: benchmark-methodology
method_family: other
information_model: other
action_space: other
source_manifest: "docs/research/literature/ai/source/glickman1995glicko/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/glickman1995glicko/source.pdf"
pages_read: "1-6"
status: "complete"
---

## Summary

This first batch covers the full local six-page PDF for Mark E.
Glickman, "The Glicko system," a rating-system note by Glickman
describing why Glicko extends Elo with an explicit rating deviation
uncertainty term (PDF pp. 1-2).

The paper presents ratings as best guesses of playing strength and
ratings deviation (RD) as a standard-deviation-like uncertainty measure,
where high RD indicates unreliable ratings and low RD indicates frequent
competition or more precise strength measurement (PDF pp. 1-2).

The algorithm updates ratings from game outcomes, updates RD from both
game outcomes and inactivity, and allows rating changes that are not
zero-sum because both players' RDs influence the amount of change (PDF
p. 2).

The paper gives rating-period update formulas, expected-outcome
formulas that account for uncertainty in both players' ratings,
confidence or credible interval reporting, and implementation guidance
for uncertainty growth between rating periods (PDF pp. 2-6).

This is now a completed annotation. The full local source is read, and
the final `Relevance To Gwent AI`, `Risks For Adaptation`, and
`AI-Roadmap Decision` sections are complete.

## Paper Claims

- The Elo system introduced probabilistic foundations to chess ratings
  and was later adopted by many other games, but it has a reliability
  problem that Glicko was designed to address (PDF p. 1).
- The Glicko system was derived from a statistical model for chess game
  outcomes with approximations chosen for simple computation, and Elo is
  described as a special case of the system (PDF p. 1).
- The note points to Glickman's Applied Statistics paper, "Parameter
  estimation in large dynamic paired comparison experiments," for the
  mathematical derivation (PDF p. 1).
- The paper describes Glicko as implemented on the Free Internet Chess
  Server and adapted in variations by commercial internet gaming
  organizations (PDF p. 1).
- The motivating Elo deficiency is that two players with the same rating
  can have very different rating reliability, so a result should carry
  different rating evidence depending on each player's uncertainty (PDF
  p. 1).
- Glicko extends Elo by computing both a rating and a ratings deviation
  or standard deviation, where high RD means unreliable rating and low RD
  means more reliable rating (PDF pp. 1-2).
- In Glicko, a player's rating changes only from game outcomes, while
  RD changes from both game outcomes and time passing without rated
  games (PDF p. 2).
- Game outcomes always decrease a player's RD, while time without rated
  competition increases a player's RD (PDF p. 2).
- Rating changes are not usually balanced in Glicko; one player's rating
  increase does not need to equal the opponent's rating decrease because
  both players' RDs govern the update magnitudes (PDF p. 2).
- The paper recommends summarizing strength with an interval, such as a
  95% confidence interval, rather than reporting only a point rating
  when RD is available (PDF p. 2).
- The rating algorithm treats games within a rating period as occurring
  simultaneously; rating periods may range from months to game-by-game
  updates, and the system is said to work best with a moderate average
  of 5-10 games per player per rating period (PDF p. 2).
- At the start of a rating period, unrated players receive default
  rating 1500 and RD 350 (PDF p. 3).
- Returning rated players keep their previous rating while their RD is
  increased by a constant `c` between periods, capped at 350 (PDF p. 3).
- Step 2 updates each player separately from the player's pre-period
  rating/RD, opponents' ratings/RDs, and outcomes scored as win, draw,
  or loss values 1, 1/2, and 0 (PDF p. 3).
- Multiple games against the same opponent are treated as games against
  multiple opponents with the same rating and RD (PDF p. 3).
- The rating update uses `g(RD)` to downweight evidence from uncertain
  opponent ratings and `E(s|r, rj, RDj)` as the expected score against
  each opponent (PDF pp. 3-4).
- The worked example updates a 1500-rated player with RD 200 after a win
  over a 1400-rated opponent and losses to 1550- and 1700-rated
  opponents, producing post-period rating 1464 and RD 151.4 (PDF p. 4).
- Glicko permits expected outcome calculation for one game while
  accounting for uncertainty in both players' ratings and RDs (PDF p.
  5).
- The expected-outcome example gives a 1400-rated player with RD 80 a
  0.376 expected score against a 1500-rated player with RD 150 (PDF
  p. 5).
- The paper describes rating intervals as confidence intervals or, given
  the quasi-Bayesian derivation, credible intervals over plausible true
  strength values (PDF p. 5).
- A common 95% interval is reported as rating plus or minus 1.96 times
  RD, and the example maps rating 1500 with RD 30 to interval
  1441-1559 (PDF p. 5).
- The constant `c` can be chosen by optimizing predictive accuracy of
  future games or by choosing how long inactivity should take to make a
  typical player's rating as uncertain as an unrated player's rating
  (PDF pp. 5-6).
- The paper's inactivity example assumes RD 50, two-month rating
  periods, and five years of inactivity before reaching RD 350, yielding
  `c = 63.2` (PDF p. 6).
- The paper notes a practical issue where very frequent competition can
  make RD very small and ratings stop changing appreciably, so it
  recommends an RD floor such as 30 (PDF p. 6).

## Game / Environment Model

- The paper is a rating-system note for tournament chess and other games
  that produce rated game outcomes, not a game-playing algorithm or game
  simulator paper (PDF p. 1).
- The formal input model is a set of players with ratings/RDs and a
  collection of game outcomes inside a rating period (PDF pp. 2-3).
- Outcomes are represented as win, draw, or loss scores of 1, 1/2, and
  0 for the player being updated (PDF p. 3).
- The system can be applied with long rating periods or game-by-game
  update periods, with FICS named as an example of game-by-game updating
  (PDF p. 2).
- Project inference: For Gwent, the natural environment mapping is an
  offline benchmark ledger that records agent identity, deck/faction,
  seed suite, opponent, timestamp or rating period, and match outcome;
  the paper does not specify those project fields.

## Information Model

- The uncertainty modeled by Glicko is uncertainty over player strength,
  represented by RD, not hidden game state or partial observability
  inside a match (PDF pp. 1-2).
- High RD corresponds to unreliable strength estimates, such as inactive
  or sparsely observed players, while low RD corresponds to frequent
  competition and more precise estimates (PDF pp. 1-2).
- RD decreases after game outcomes because more information has been
  learned about a player, and RD increases during inactivity because the
  player's current strength becomes less certain (PDF p. 2).
- The expected-outcome formula accounts for uncertainty in both players'
  ratings by using both RDs (PDF p. 5).
- Project inference: Glicko can represent uncertainty about Gwent agent
  strength, but it does not model hidden cards, information sets, public
  belief, or legal observation boundaries.

## Action Space

- The paper does not define game actions, legal moves, action masks, or
  action encodings; it consumes match outcomes after games are played
  (PDF pp. 2-3).
- The only outcome values in the update formula are win, draw, and loss
  scores of 1, 1/2, and 0 (PDF p. 3).
- Project inference: Glicko is compatible with any Gwent policy action
  representation because it is downstream of completed matches, but it
  provides no guidance for variable legal action sets or engine command
  encoding.

## Policy / Search / Learning Method

- The method is an online rating update, not a policy, search, or
  gameplay learning algorithm (PDF pp. 2-4).
- Step 1 inflates RD for existing rated players between rating periods
  and initializes unrated players to rating 1500 and RD 350 (PDF p. 3).
- Step 2 updates post-period rating and RD separately for each player
  using opponents' ratings/RDs and game outcomes from the rating period
  (PDF pp. 3-4).
- The update includes `g(RD)`, expected score, and `d^2` terms to account
  for opponent uncertainty and information in the rating period (PDF
  pp. 3-4).
- The constant `c` controls uncertainty growth between rating periods
  and can be chosen by predictive accuracy or by an inactivity-time
  policy (PDF pp. 5-6).
- Project inference: In this project, Glicko belongs outside the engine
  rules and AI policy loop as a benchmark-result aggregator.

## Training Data

- Not applicable as model-training data; the system updates ratings from
  observed game outcomes in rating periods (PDF pp. 2-3).
- The paper says `c` can be selected by optimizing predictive accuracy
  of future games, referring to the 1999 Applied Statistics paper for
  that procedure (PDF p. 5).
- Project inference: A Gwent implementation would need historical or
  generated match-result data to calibrate rating-period length,
  inactivity growth, and optional RD floors, but the paper does not
  provide Gwent-specific data.

## Self-Play Setup

- Not applicable as a self-play method; the paper rates competitors
  after games rather than generating play by self-play (PDF pp. 2-3).
- Project inference: Gwent self-play agents could be rated by Glicko
  after completed match batches, but Glicko itself would not generate
  actions or improve policies.

## Evaluation Method

- The paper gives an expected-outcome formula for a game that accounts
  for both players' rating uncertainty (PDF p. 5).
- The paper gives a worked expected-score example where rating/RD values
  lead to expected score 0.376 for the lower-rated player (PDF p. 5).
- The paper recommends interval reporting, including rating plus or
  minus 1.96 times RD as a 95% interval or credible interval (PDF p. 5).
- The paper recommends selecting the uncertainty-growth constant `c`
  either by predictive accuracy or by a chosen inactivity-to-unrated
  horizon (PDF pp. 5-6).
- Project inference: These elements support benchmark-ladder reporting
  with uncertainty, but they do not replace fixed seed suites, matchup
  matrices, or exploitability probes.

## Difficulty / Human-Likeness Notes

- The paper does not discuss human-like AI, controllable difficulty, or
  opponent modeling beyond estimating competitor strength (PDF pp. 1-6).
- Strength intervals can communicate uncertainty in a player's or
  agent's estimated skill, but the paper does not define how to map a
  rating to human-facing Gwent difficulty tiers (PDF pp. 2, 5).
- Project inference: Glicko could later help calibrate difficulty tiers
  by rating agents against benchmark opponents or human data, but that
  would require separate product and data policy decisions.

## Compute Requirements

- The paper says Glicko was derived with mathematical approximations to
  enable simple computation (PDF p. 1).
- The paper says the two rating-period steps are computed in parallel
  for all players (PDF pp. 2-3).
- The formulas require rating/RD values, opponent rating/RD values,
  game outcomes, and scalar functions such as `g(RD)`, expected score,
  and `d^2` (PDF pp. 3-4).
- The paper reports no GPU, cluster, or large-scale training
  requirements (PDF pp. 1-6).
- Project inference: For a local Gwent benchmark ladder, Glicko rating
  updates should be cheap relative to match simulation; storage and
  reproducibility of the match ledger are likely the larger engineering
  concerns.

## What This Paper Establishes

- Glicko adds an explicit RD uncertainty measure to ratings, making
  rating reliability part of both interpretation and update magnitude
  (PDF pp. 1-2).
- Rating updates are not required to be balanced between opponents,
  because both players' RDs affect how much evidence each result carries
  (PDF p. 2).
- RD decreases after game evidence and increases with inactivity between
  rating periods (PDF p. 2).
- Glicko supports rating-period updates, game-by-game updates, expected
  score calculations with uncertainty, and rating intervals over
  plausible strength (PDF pp. 2-6).
- The implementation guidance includes default unrated values, a cap of
  RD 350, configurable uncertainty growth through `c`, and a suggested
  RD floor to avoid frozen ratings for very frequent players (PDF
  pp. 3, 6).

## What This Paper Does Not Establish

- It does not define a Gwent AI policy, search algorithm, self-play
  training method, or hidden-information model (PDF pp. 1-6).
- It does not define legal action tensors, action masks, pointer action
  representations, or engine command schemas (PDF pp. 1-6).
- It does not compare Glicko against TrueSkill, approximate
  exploitability, matchup matrices, or fixed seed suites in the local
  note (PDF pp. 1-6).
- It does not provide an empirical Gwent, CCG, or simulator benchmark
  dataset (PDF pp. 1-6).
- It does not address non-transitive policy populations or benchmark
  overfitting by itself (PDF pp. 1-6).

## Relevance To Gwent AI

- Project inference: Glicko is relevant as lightweight
  benchmark-ladder infrastructure for Gwent AI because it turns
  completed match outcomes into ratings plus explicit uncertainty,
  rather than requiring access to actions, hidden cards, or policy
  internals (PDF pp. 1-3).
- Project inference: RD is the most useful near-term feature for this
  project. Early Gwent agents, deck/faction specialists, and scripted
  baselines will often have sparse or uneven matchup data, and Glicko's
  high-RD / low-RD interpretation directly communicates how reliable a
  reported rating is (PDF pp. 1-2, 5).
- Project inference: Glicko's rating-period model fits offline
  simulation batches: run a fixed seed suite or matchup batch, record
  win/draw/loss outcomes, then update each agent/deck configuration
  outside the pure engine after the batch completes (PDF pp. 2-3).
- Project inference: The confidence or credible interval guidance is
  useful for reports because Gwent benchmark summaries should show
  uncertainty bands, not just point estimates that imply false
  precision (PDF pp. 2, 5).
- Project inference: Glicko can be a simpler alternative or companion
  to TrueSkill for two-player one-agent-per-seat Gwent evaluation. It
  lacks TrueSkill's team/match-quality machinery, but its rating/RD
  model is easy to explain and implement for local agent-vs-agent
  batches (PDF pp. 1-6).
- Project inference: The paper supports rating inactive or rarely tested
  agents as increasingly uncertain, which matters when historical Gwent
  AI checkpoints are kept in an evaluation pool but not rerun every
  phase (PDF pp. 2-3, 5-6).

## Risks For Adaptation

- Project inference: Glicko must not be treated as a gameplay metric.
  It rates outcomes after matches; it does not inspect legal moves,
  hidden-information safety, action quality, exploitability, or
  strategic robustness (PDF pp. 1-3).
- Project inference: A single global Glicko rating can hide Gwent
  non-transitivity across factions, decks, seeds, and opponent pools.
  A rating report should preserve agent version, deck/faction,
  baseline pool, seed suite, and rating-period context rather than
  collapsing every result into one undifferentiated number.
- Project inference: Rating changes are not zero-sum in Glicko, so
  project reports should explain RD-driven update asymmetry instead of
  expecting one agent's gain to equal another agent's loss (PDF p. 2).
- Project inference: Rating periods are a policy choice. The paper says
  Glicko works best with a moderate average of 5-10 games per player per
  rating period, so a Gwent benchmark with very small batches could
  produce noisy or misleading updates unless it reports RD and batch
  size clearly (PDF p. 2).
- Project inference: The inactivity-growth constant `c` and any RD
  floor must be chosen and documented for Gwent. Otherwise rating
  uncertainty may grow too slowly for stale checkpoints or shrink too
  far for frequently tested agents (PDF pp. 5-6).
- Project inference: Glicko does not replace fixed seed suites, matchup
  matrices, approximate best-response probes, exploitability
  reductions, or regression thresholds. It is a reporting layer over
  match outcomes, not the whole evaluation methodology (PDF pp. 1-6).
- Project inference: Public or product-facing rating use would create
  incentive and interpretation issues outside this paper. Near-term
  use should stay research-only until the project defines whether
  ratings are for regression tracking, AI selection, or user-visible
  difficulty/ranked systems.

## AI-Roadmap Decision

1. **Source category.** Project inference: benchmark-methodology source
   for uncertainty-aware outcome ratings. It is not a direct gameplay,
   search, self-play, or training-method source (PDF pp. 1-6).

2. **Game class.** Project inference: game-agnostic after matches are
   reduced to win/draw/loss outcomes inside rating periods. It does not
   model hidden-information card-game mechanics, but it can rate Gwent
   agents after completed matches (PDF pp. 2-3).

3. **Method family.** Project inference: online paired-comparison
   rating update with rating deviation uncertainty and inactivity
   growth. It is not CFR, NFSP, MCTS, ISMCTS, self-play RL, supervised
   learning, or search (PDF pp. 1-4).

4. **Action space.** Project inference: not applicable to policy action
   spaces. Glicko is compatible with variable legal action games only
   because it consumes final outcomes rather than actions or legal
   moves (PDF pp. 2-3).

5. **Evaluation methodology.** Project inference: supports a local
   benchmark rating layer with rating/RD, expected outcome, confidence
   or credible intervals, rating periods, inactivity uncertainty, and RD
   floors. It does not provide fixed seed suites, matchup matrices,
   exploitability, approximate best responses, or anti-overfitting
   protocols by itself (PDF pp. 2-6).

6. **Agent scope.** Project inference: can rate global agents, faction
   specialists, deck-conditioned agents, scripted baselines, and frozen
   checkpoints if the match-result schema preserves those identities.
   The paper itself does not define those Gwent-specific labels.

7. **Smallest faithful experiment.** Project inference: add an offline
   rating script or notebook over a fixed Gwent match-result table with
   columns for agent id, deck/faction/config, opponent, seed suite,
   result, rating period, rating, RD, and interval. Keep it outside the
   pure engine and run it after simulation batches (PDF pp. 2-6).

8. **Adaptation risk.** Project inference: misleading adaptation would
   report point ratings without RD, mix incompatible decks/factions and
   seed suites into one rating, tune `c` invisibly, use too few games
   per rating period, or treat rating as exploitability or hidden-info
   safety evidence (PDF pp. 1-6).

9. **Roadmap effect.** Project inference: should affect Cluster F
   evaluation-ladder synthesis and benchmark reporting. It should not
   affect pure engine rules, legal-move generation, hidden-information
   observation boundaries, or near-term AI policy selection by itself.
   Pair it with fixed seed suites, matchup matrices, and robustness
   probes before using ratings to compare learned agents.
