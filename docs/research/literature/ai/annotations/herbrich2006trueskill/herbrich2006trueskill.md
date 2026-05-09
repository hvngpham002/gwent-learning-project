---
citekey: herbrich2006trueskill
title: "TrueSkill(TM): A Bayesian Skill Rating System"
authors:
  - "Ralf Herbrich"
  - "Tom Minka"
  - "Thore Graepel"
year: 2006
venue: "Advances in Neural Information Processing Systems 19"
doi: ""
arxiv: ""
project_relevance: benchmark-methodology
method_family: other
information_model: other
action_space: other
source_manifest: "docs/research/literature/ai/source/herbrich2006trueskill/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/herbrich2006trueskill/source.pdf"
pages_read: "1-8"
status: "complete"
---

## Summary

This first batch covers the full local eight-page PDF for Herbrich,
Minka, and Graepel, "TrueSkill(TM): A Bayesian Skill Rating System,"
published in Advances in Neural Information Processing Systems 19 (PDF
p. 1).

The paper presents TrueSkill as a Bayesian skill rating system that
generalizes Elo by tracking uncertainty over player skills, explicitly
modeling draws, handling more than two competing entities, and inferring
individual skills from team results (PDF p. 1).

The model represents latent player skills, player performances, team
performances, team-performance differences, and observed ranks in a
factor graph, then uses approximate message passing for online skill
updates after each game (PDF pp. 2-5).

The paper evaluates TrueSkill on Halo 2 beta match outcome data and
reports deployment experience from Xbox 360 Live, including
matchmaking, conservative display ratings, and large-scale operational
observations (PDF pp. 6-8).

The annotation is now complete. The final decision is that TrueSkill is
useful benchmark-ladder infrastructure for rating agents from completed
match outcomes, but it is not a gameplay policy, hidden-information
model, exploitability measure, or anti-overfitting protocol by itself
(PDF pp. 1-8).

## Paper Claims

- Skill ratings in games and sports serve matchmaking, public
  competition or interest, and tournament qualification functions (PDF
  p. 1).
- Online gaming increases the practical importance of ratings because
  online match quality affects large player populations (PDF p. 1).
- Elo models paired game outcomes as a function of two player skill
  ratings and updates ratings so the observed outcome becomes more
  likely, with a weighting factor controlling evidence from the new game
  against the old estimate (PDF p. 1).
- The paper connects Gaussian Elo to the Thurstone Case V model and
  logistic Elo variants to the Bradley-Terry model for paired
  comparison data (PDF pp. 1-2).
- Glicko is described as a Bayesian rating system that models belief
  about a player's skill with a Gaussian mean and variance, addressing
  the fixed provisional-rating window used by Elo systems (PDF p. 2).
- Multiplayer online games motivate two additional rating challenges:
  inferring individual skill from team outcomes and handling outcomes
  involving more than two players or teams (PDF p. 2).
- TrueSkill is presented as a Bayesian framework for those multiplayer
  and team-rating challenges, expressed as a factor graph and solved
  with approximate message passing (PDF p. 2).
- The outcome model assigns each team a rank, allows tied ranks for
  draws, and treats ranks as derived from the scoring rules of the game
  being rated (PDF p. 2).
- The model uses a factorizing Gaussian prior over player skills, a
  Gaussian performance variable per player, and a team performance equal
  to the sum of member performances (PDF p. 2).
- Winning outcomes are modeled by ordering team performances; draw
  outcomes are modeled by a draw margin around the difference between
  adjacent team performances (PDF p. 2).
- The paper uses Gaussian density filtering for online learning: an
  approximate Gaussian posterior after a match becomes the prior before
  the next match (PDF p. 2).
- A dynamics factor can add variance between time steps when player
  skills are expected to vary over time (PDF p. 3).
- Figure 1 gives a three-team factor graph example with variables for
  player skills, player performances, team performances, and team
  performance differences, plus factors for priors, performance
  generation, team sums, and win/draw comparisons (Fig. 1, PDF p. 3).
- The paper uses sum-product message passing on factor graphs to infer
  single-variable marginals from the sparse graph structure (PDF p. 4).
- The TrueSkill factor graph is acyclic and most messages are
  one-dimensional Gaussians, but comparison-factor messages for wins and
  draws are non-Gaussian (PDF p. 4).
- The non-Gaussian comparison messages are approximated using
  Expectation Propagation by moment matching the relevant marginal to a
  Gaussian with the same mean and variance (PDF p. 4).
- Table 1 lists update equations for the factor types in the TrueSkill
  graph, using canonical Gaussian precision and precision-adjusted mean
  parameters (Table 1, PDF p. 5).
- Because some messages are approximate, messages on paths between
  approximate marginals are iterated until the approximate marginals
  stop changing (PDF p. 6).
- The Halo 2 beta evaluation uses thousands of outcomes across Free for
  All, Small Teams, Head to Head, and Large Teams modes (PDF p. 6).
- In the Halo 2 evaluation, the draw margin is set from empirical draw
  probability, and TrueSkill is compared against Gaussian Elo with a
  dueling heuristic for team games or games with more than two teams
  (PDF p. 6).
- The authors report that the approximate message-passing ranking
  algorithm ran within twice the runtime of the simple Elo update in
  their experiments (PDF p. 6).
- In the predictive-performance "challenge" setup, TrueSkill is reported
  as significantly better than Elo at identifying tight matches in the
  tested Halo 2 modes (PDF p. 6).
- In the match-quality analysis, TrueSkill is reported as significantly
  better than Elo for Free for All and Head to Head but not Small Teams;
  the paper suggests Capture-the-Flag team dynamics may violate the
  additive team performance model (PDF p. 7).
- In the win-probability analysis for Head to Head, TrueSkill is
  reported to give mostly fair matches even for players with few games,
  with winning probabilities mostly within 35% to 65% (PDF p. 7).
- The convergence example says TrueSkill adjusts learning rate through
  uncertainty and converges faster than Elo for high-rated Free for All
  players, with observed convergence around ten games compared with an
  information-theoretic limit of about five games for eight-player games
  (PDF p. 7).
- Xbox 360 Live is described as using automatic player rating and
  matchmaking with TrueSkill, processing hundreds of thousands of games
  per day (PDF p. 7).
- The deployed Xbox Live parameterization uses a prior mean of 25,
  prior standard deviation of 25/3, and displays a conservative skill
  estimate based on a lower quantile of the skill belief (PDF pp. 7-8).
- Pairwise matchmaking is performed with a match-quality criterion based
  on draw probability relative to the highest possible draw probability
  (Eq. 7, PDF p. 8).
- The paper frames matchmaking as sequential experimental design because
  unpredictable matches are both high quality and informative (PDF
  p. 8).
- The online-service observations include that games differ in effective
  skill levels, displayed ratings feed back into player behavior, and
  new-player losses can shift the skill distribution below the prior
  until tighter matchmaking is enforced (PDF p. 8).
- The conclusion states that TrueSkill is a globally deployed Bayesian
  skill rating algorithm based on approximate message passing in factor
  graphs and has theoretical and practical advantages over Elo (PDF
  p. 8).

## Game / Environment Model

- The paper is a rating-system paper, not a game-playing algorithm
  paper; it consumes match outcomes, team assignments, and ranks rather
  than game states or legal moves (PDF pp. 1-2).
- The formal match model contains a population of players, a set of
  non-overlapping teams in a match, and a rank per team, with equal
  ranks representing draws (PDF p. 2).
- Team performance is modeled as the sum of the performances of team
  members, which supports individual-skill inference from team outcomes
  but embeds an additive team-performance assumption (PDF p. 2).
- The empirical environment is Halo 2 beta outcome data with Free for
  All, Small Teams, Head to Head, and Large Teams game modes (PDF p. 6).
- Project inference: For Gwent evaluation, the natural environment
  mapping is a tournament or fixed-seed match harness that outputs
  agent identities, optional team/group labels, and match outcomes; the
  paper does not define any Gwent-like simulator contract.

## Information Model

- TrueSkill treats player skills as latent variables with Gaussian
  beliefs, and treats per-match performances and team performances as
  latent variables connected to observed outcomes (PDF pp. 2-3).
- The paper does not model hidden cards, information sets, public belief
  states, or partial observability inside a game; the uncertainty is
  uncertainty over player skill and match performance (PDF pp. 2-4).
- The online update maintains uncertainty in the skill estimate, and
  that uncertainty affects convergence and conservative public display
  ratings (PDF pp. 7-8).
- Project inference: TrueSkill can rate hidden-information Gwent agents
  from completed match outcomes, but it does not solve hidden-state
  inference for a Gwent-playing policy.

## Action Space

- The paper does not define an action space for an agent policy; it
  defines match outcomes as rank orderings over teams, with draws
  represented by tied ranks (PDF p. 2).
- The Halo 2 evaluation uses aggregate game outcomes rather than action
  traces or legal-move sequences (PDF p. 6).
- Project inference: TrueSkill is compatible with variable legal action
  sets at the game level because it only observes final match outcomes,
  but the paper gives no action masking, structured action, or legal
  move interface guidance.

## Policy / Search / Learning Method

- The learning method is online Bayesian skill-rating inference, not
  policy learning or search (PDF pp. 2-4).
- Gaussian density filtering makes each approximate posterior skill
  belief the prior for the next match (PDF p. 2).
- Approximate message passing on the factor graph computes marginal
  beliefs for player skills from match outcomes and team assignments
  (PDF pp. 3-5).
- Expectation Propagation approximates comparison-factor messages by
  matching moments to Gaussian marginals (PDF pp. 4-5).
- Project inference: In this project, TrueSkill would belong outside
  the pure game engine as benchmark-ladder infrastructure over completed
  match records.

## Training Data

- The experimental data comes from Halo 2 beta game outcomes supplied by
  Bungie Studios, with thousands of outcomes across four game modes (PDF
  p. 6).
- The paper's deployed-service discussion uses Xbox 360 Live player
  populations and game outcomes rather than labeled policy traces or
  supervised action targets (PDF pp. 7-8).
- Project inference: A Gwent TrueSkill evaluation would need a durable
  match-results table with agent identity, seed/config metadata, result,
  and possibly faction/deck labels; the paper itself does not specify
  such a schema.

## Self-Play Setup

- Not applicable as a self-play training method; TrueSkill rates
  observed competitive outcomes and does not generate games or train a
  policy through self-play (PDF pp. 1-2).
- Project inference: Self-play agents could be rated by TrueSkill after
  they play matches in the project's tournament harness, but that is an
  evaluation use rather than a TrueSkill training loop.

## Evaluation Method

- The paper compares TrueSkill and Elo by prediction error over full
  datasets and by a "challenge" setup where each system selects matches
  it considers tightly matched for the other system to predict (PDF
  p. 6).
- Match quality is evaluated by sorting games by assigned match quality
  and measuring accumulated pairwise draws, using draws as evidence of
  tight matches (PDF p. 7).
- Win-probability quality is evaluated by selecting games above a match
  quality threshold and measuring player winning-ratio deviation from
  50% as a function of minimum games played (PDF p. 7).
- Convergence is evaluated through rating trajectories for high-rated
  players and compared with an information-theoretic ranking limit (PDF
  p. 7).
- The service section evaluates operational behavior qualitatively,
  including effective skill ranges by game, rating-display feedback
  loops, and effects of new-player losses on the population rating
  distribution (PDF p. 8).

## Difficulty / Human-Likeness Notes

- The paper's main player-experience objective is balanced matchmaking:
  matching players of similar skill should produce interesting, fair,
  and exciting game experiences (PDF pp. 1-2).
- The paper notes that public skill display can change player behavior,
  including stopping play, selecting opponents carefully, or cheating to
  protect or boost ratings (PDF p. 8).
- The paper does not discuss bot personality, human-like move choice,
  novice modeling, or controllable AI difficulty beyond the rating and
  matchmaking context (PDF pp. 1-8).
- Project inference: TrueSkill could support difficulty tier calibration
  for Gwent agents by rating agents and humans or scripted baselines in
  the same ladder, but it does not define human-like policy behavior.

## Compute Requirements

- The approximate message-passing ranking algorithm is reported as
  running within twice the runtime of a simple Elo update in the Halo 2
  experiments (PDF p. 6).
- The Xbox Live service deployment is described as processing hundreds
  of thousands of games per day, implying the method is operationally
  lightweight enough for large-scale online updates (PDF p. 7).
- The paper does not provide hardware requirements, memory budgets, or
  batch-processing infrastructure details (PDF pp. 6-8).
- Project inference: A local Gwent benchmark ladder can likely afford
  TrueSkill-style updates after match batches, but implementation cost
  depends on library choice and persistence design rather than engine
  simulation cost.

## What This Paper Establishes

- TrueSkill provides a Bayesian rating model with uncertainty tracking,
  draw modeling, multiplayer rankings, and team-to-individual skill
  inference (PDF pp. 1-2).
- The paper establishes a factor-graph formulation and approximate
  message-passing inference procedure for online rating updates (PDF
  pp. 2-6).
- The Halo 2 beta evaluation supports the claim that TrueSkill can
  identify tight matches and converge faster than Gaussian Elo in the
  tested modes, while also showing a Small Teams weakness under the
  additive team model (PDF pp. 6-7).
- The Xbox 360 Live deployment establishes that the method was used in a
  large-scale commercial online gaming service and gives practical
  parameters for conservative rating display and match quality (PDF
  pp. 7-8).

## What This Paper Does Not Establish

- The paper does not establish a Gwent-playing policy, search method,
  action representation, hidden-card belief model, or legal-action mask
  (PDF pp. 1-8).
- The paper does not establish exploitability, Nash convergence,
  matchup-matrix design, fixed-seed regression protocol, or
  anti-overfitting methodology for game AI benchmarks (PDF pp. 1-8).
- The paper does not compare TrueSkill against Glicko in the reported
  experiments, even though Glicko is discussed as prior Bayesian rating
  work (PDF pp. 2, 6-7).
- The paper's team model can be strained when a game's team outcome is
  not well represented by additive player performances, as suggested by
  the Small Teams Halo 2 result (PDF p. 7).
- The paper warns through service observations that visible ratings can
  create behavioral incentives such as rating protection, opponent
  selection, or cheating, but it does not provide a full mitigation
  framework (PDF p. 8).

## Relevance To Gwent AI

- **Benchmark-ladder infrastructure:** TrueSkill is relevant to Gwent
  AI as a rating layer over completed matches because the paper's model
  consumes match outcomes, team assignments, and ranks rather than game
  states or action traces (PDF p. 2).
- **Uncertainty-aware ratings:** The paper's skill belief tracks both a
  mean and uncertainty, which is useful when early Gwent agents have few
  matches or noisy seed-suite results (PDF pp. 2, 7-8).
- **Draw-aware evaluation:** The model explicitly handles draws through
  tied ranks and a draw margin, which maps to Gwent match outcomes where
  draws are possible and should not be forced into arbitrary wins or
  losses (PDF p. 2).
- **Multi-agent and team generality:** The paper supports more than two
  competing entities and team-to-individual inference, but ordinary
  Gwent AI evaluation is mostly two-player one-agent-per-seat, so this
  is useful flexibility rather than a required near-term feature (PDF
  p. 2).
- **Operational practicality:** The paper reports update runtime within
  twice a simple Elo update and describes large-scale Xbox Live
  deployment, which makes TrueSkill plausible for a local benchmark
  harness after match batches (PDF pp. 6-7).

Project inference: The smallest faithful Gwent use is a tournament
results table that records agent id, deck/faction/config labels, seed
suite, match result, and timestamp, then updates TrueSkill ratings
outside the pure engine after matches complete.

## Risks For Adaptation

- **Not a policy metric:** TrueSkill rates observed outcomes; it does
  not inspect legal moves, hidden cards, information sets, search
  quality, or policy mistakes (PDF pp. 1-2).
- **No exploitability claim:** The paper does not establish
  exploitability, NashConv, equilibrium distance, or best-response
  robustness, so TrueSkill ratings must not be used as a substitute for
  exploitability or approximate best-response probes (PDF pp. 1-8).
- **Matchmaking bias:** The paper notes that rating quality interacts
  with matchmaking and that true prediction error can be difficult to
  interpret because the smallest achievable error depends on unknown
  true skills and matchmaking selection (PDF p. 6).
- **Additive-team limitation:** The Small Teams Halo 2 result shows a
  failure mode when additive team performance does not fit the game
  mode, so any future team/population Gwent use should test the modeling
  assumption rather than assume it transfers (PDF p. 7).
- **Rating feedback loops:** The service observations warn that public
  ratings can incentivize rating protection, opponent selection, or
  cheating, so project-facing leaderboards should be separated from
  research-only regression metrics until incentives are clear (PDF
  p. 8).
- **No anti-overfitting protocol:** TrueSkill can rank agents after
  matches, but it does not define fixed seed suites, matchup matrices,
  holdout opponents, deck/faction balancing, or regression acceptance
  thresholds (PDF pp. 1-8).

Project inference: A misleading Gwent adaptation would report only one
global TrueSkill number from a narrow opponent pool or hand-picked seed
suite, then treat that number as proof of robust play.

## AI-Roadmap Decision

1. **Source category:** Benchmark-methodology source for rating and
   matchmaking infrastructure, not a direct gameplay implementation
   candidate.
2. **Game class:** Outcome-rating method that is game-agnostic after
   matches are reduced to team rankings and draws; it does not model
   hidden-information card-game internals (PDF p. 2).
3. **Method family:** Bayesian online skill rating with factor graphs,
   Gaussian density filtering, and approximate message passing; not
   self-play RL, MCTS, ISMCTS, CFR, supervised learning, or search (PDF
   pp. 2-6).
4. **Action space:** Not applicable to policy action spaces. The paper
   is compatible with variable legal action games only because it rates
   final outcomes rather than actions (PDF pp. 1-2).
5. **Evaluation methodology:** Provides a rating and match-quality
   methodology with uncertainty, draws, conservative displayed ratings,
   and match-quality criteria; it does not provide fixed seed suites,
   matchup matrices, exploitability, or anti-overfitting controls (PDF
   pp. 6-8).
6. **Agent scope:** Can rate global agents, faction specialists, deck-
   conditioned agents, scripted baselines, or human players if the
   match-result schema preserves those labels. The paper itself does
   not distinguish these Gwent-specific agent scopes.
7. **Smallest faithful experiment:** Add an offline rating notebook or
   CLI over existing simulation/tournament results that computes
   TrueSkill means, uncertainties, conservative display scores, and
   confidence-aware ranking deltas for a fixed agent/deck/seed suite.
8. **Adaptation risk:** Misleading use would collapse all factions,
   decks, seeds, and opponent pools into one rating; expose public
   ratings that alter behavior; or treat rating gains as proof of
   exploitability, hidden-info safety, or robust strategy.
9. **Roadmap effect:** This source should affect the Cluster F
   evaluation-ladder design and long-term benchmark reporting, but it
   should not affect pure engine rules, legal-move generation, hidden-
   information policy boundaries, or near-term gameplay AI selection.

Project inference: Use `herbrich2006trueskill` as support for an
uncertainty-aware rating layer once the project has a fixed seed-suite
and matchup-matrix harness. Pair it with `timbers2022approxexploitability`
or another robustness source for exploitability-style claims, because
TrueSkill alone is an outcome rating system.
