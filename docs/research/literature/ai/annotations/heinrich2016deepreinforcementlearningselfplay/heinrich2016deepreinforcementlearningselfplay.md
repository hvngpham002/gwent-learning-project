---
citekey: heinrich2016deepreinforcementlearningselfplay
title: "Deep Reinforcement Learning from Self-Play in Imperfect-Information Games"
authors:
  - "Johannes Heinrich"
  - "David Silver"
year: 2016
venue: "arXiv 1603.01121"
doi: ""
arxiv: "1603.01121"
project_relevance: training-method
method_family: nfsp
information_model: imperfect
action_space: fixed-vector
source_manifest: "docs/research/literature/ai/source/heinrich2016deepreinforcementlearningselfplay/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/heinrich2016deepreinforcementlearningselfplay/source.pdf"
pages_read: "1-10"
status: "complete"
---

## Summary

This annotation covers PDF pp. 1-10 of Johannes Heinrich and David
Silver, "Deep Reinforcement Learning from Self-Play in
Imperfect-Information Games," arXiv `1603.01121v2`, dated 28 Jun 2016
(PDF p. 1).

The paper introduces Neural Fictitious Self-Play (NFSP), which combines
fictitious self-play with deep reinforcement learning to learn
approximate Nash equilibria in imperfect-information games without
handcrafted domain abstractions (PDF pp. 1, 3-4).

The method trains one action-value network as an approximate best
response and one supervised average-policy network over the agent's
own past best-response behavior; play samples a mixture of the average
policy and best-response policy through anticipatory dynamics (PDF pp.
3-5).

The experiments are two-player zero-sum poker games: Leduc Hold'em for
exploitability and ablation studies, and Limit Texas Hold'em for
performance against strong Annual Computer Poker Competition agents
(PDF pp. 5-7).

The full local source is ten PDF pages, but the final `Relevance To
Gwent AI`, `Risks For Adaptation`, and `AI-Roadmap Decision` sections
remain pending until explicit finalization is confirmed.

## Paper Claims

- The paper says prior imperfect-information game work often computes
  Nash equilibria in handcrafted abstractions, while NFSP is presented
  as a scalable end-to-end approach to learning approximate Nash
  equilibria without prior domain knowledge (PDF p. 1).
- The abstract reports that NFSP approached a Nash equilibrium in Leduc
  poker while common reinforcement-learning methods diverged, and that
  in Limit Texas Hold'em it approached the performance of state-of-the-
  art superhuman abstraction-based algorithms (PDF p. 1).
- The introduction says many machine-learning methods that solve
  perfect-information games fail to converge in imperfect-information
  games, while many game-theoretic methods for Nash equilibria lack
  generalizing pattern-learning machinery unless the domain is
  abstracted by expert knowledge (PDF p. 1).
- Fictitious play chooses best responses to opponents' average
  behavior, and Fictitious Self-Play extends that idea to extensive-form
  multi-step games (PDF pp. 1, 3).
- NFSP combines FSP with neural network function approximation: an
  action-value network learns an approximate best response from
  reinforcement-learning memory, and an average-policy network imitates
  the agent's own historical best-response behavior from supervised
  memory (PDF pp. 1, 3).
- The paper defines Nash equilibrium in extensive-form games as a
  strategy profile where each player is best responding to the others,
  and states that Nash equilibria are the only strategy profiles that
  rational agents can hope to converge on in self-play (PDF pp. 2-3).
- The paper states that average strategies of fictitious players
  converge to Nash equilibria in certain game classes, including
  two-player zero-sum games (PDF p. 3).
- Algorithm 1 specifies an NFSP agent with a circular reinforcement-
  learning replay memory, a reservoir supervised-learning memory, an
  average-policy network, an action-value network, a target Q network,
  an anticipatory parameter, and per-step updates to supervised and
  Q-learning losses (PDF p. 4).
- NFSP uses reservoir sampling to avoid finite-memory windowing
  artifacts and anticipatory dynamics to support simultaneous self-play
  learning while still sampling each agent's own best-response behavior
  for the supervised average-policy learner (PDF pp. 3-5).
- In Leduc Hold'em, NFSP approached Nash equilibria across tested
  network sizes and achieved exploitability 0.06 in the reported setup
  (PDF pp. 5-6).
- The Leduc ablation reports worse behavior when removing core NFSP
  components: a fixed-size sliding-window supervised memory diverged,
  high anticipatory parameter `0.5` plateaued, and exponentially
  averaged reservoir sampling was noisy (PDF pp. 5-6).
- The DQN comparison reports that DQN's deterministic greedy strategy
  remained highly exploitable and its average behavior did not approach
  a Nash equilibrium in Leduc Hold'em (PDF p. 6).
- The paper attributes DQN's poor Leduc behavior to self-play
  experience generated exclusively by epsilon-greedy strategies, making
  the experience highly correlated over time and concentrated on a
  narrow state distribution, unlike NFSP's more slowly changing
  anticipated average-policy experience (PDF p. 6).
- In Limit Texas Hold'em, the reported NFSP greedy-average strategy had
  win rates of `-52.1 +/- 8.5`, `-17.4 +/- 9.0`, and `-13.6 +/- 9.2`
  mbb/h against the top three ACPC 2014 agents listed in Figure 2b
  (PDF p. 7).
- The conclusion claims NFSP is the first end-to-end deep
  reinforcement-learning approach to learning approximate Nash
  equilibria of imperfect-information games from self-play and the
  first deep reinforcement-learning method known to converge to
  approximate Nash equilibria in self-play (PDF p. 8).
- The appendix robustness experiment reports that XFP with constant
  average-policy stepsizes plateaued rather than diverged, while adding
  random noise to best-response computation monotonically decreased
  performance but remained stable and improving for all tested noise
  levels (PDF p. 10).

## Game / Environment Model

- The paper's formal background uses extensive-form games as sequential
  multi-player interaction models where rational players maximize
  payoff (PDF p. 2).
- The experiments focus on two-player zero-sum computer poker games:
  Leduc Hold'em and Limit Texas Hold'em (PDF pp. 2, 5-7).
- Imperfect-information poker is described through information states:
  a player observes their own private cards and public/betting history,
  but not other players' private cards (PDF p. 2).
- The paper assumes perfect recall, where a player's current
  information state implies knowledge of that player's preceding
  information states and actions (PDF p. 2).
- Project inference: Gwent also has hidden information and sequential
  decisions, but the paper's environment is poker, not a collectible
  card game with deck construction, rows, round-passing pressure,
  weather, leader abilities, and many card-targeted legal commands.

## Information Model

- A behavioral strategy maps each information state to a probability
  distribution over available actions (PDF p. 2).
- For Leduc and Limit Texas Hold'em, the authors attempt a
  domain-independent poker encoding and avoid higher-level
  engineered features used by other poker work (PDF p. 5).
- Poker cards are encoded with k-of-n vectors per round, and betting
  history is encoded as a tensor over player, round, number of raises,
  and action taken (PDF p. 5).
- A heads-up Limit Texas Hold'em information state is encoded as a
  vector of length 288, while Leduc Hold'em is encoded as a vector of
  length 30 (PDF p. 5).
- Project inference: The paper supports learning from each player's
  legal information state, but it does not define a Gwent observation
  schema or prove that a raw fixed vector for poker transfers to
  Gwent's hidden-card, public-board, deck-count, graveyard, and
  round-history observation needs.

## Action Space

- The formal background says policies assign distributions over
  available actions at states or information states (PDF p. 2).
- The poker experiments use a small action vocabulary: Limit Hold'em
  players usually choose among fold, call, and raise, with check and
  bet treated as context-dependent names for calls and raises (PDF p.
  5).
- Betting is capped at a fixed number of raises per round in the
  reported poker domains, enabling a compact fixed betting-history
  encoding (PDF p. 5).
- Project inference: This paper does not settle the Gwent ML action
  interface. Gwent's engine commands include variable legal rows,
  card-instance targets, weather targets, prompt options, pass, and
  leader actions, so future use of NFSP would still need an
  engine-derived legal-action scorer, mask, or pointer/candidate
  representation beyond this paper's fixed poker action setup.

## Policy / Search / Learning Method

- NFSP combines FSP with neural function approximation and controls all
  players through separate NFSP agents that learn from simultaneous
  self-play (PDF p. 3).
- The Q network `Q(s, a | theta_Q)` predicts action values from
  reinforcement-learning memory using off-policy reinforcement
  learning, and defines an epsilon-greedy approximate best-response
  policy (PDF p. 3).
- The supervised network `Pi(s, a | theta_Pi)` maps states to action
  probabilities and imitates the agent's own past best-response
  behavior from supervised-learning memory, defining the average
  strategy (PDF pp. 3-4).
- During an episode, an NFSP agent samples either epsilon-greedy Q with
  probability `eta` or the average-policy network with probability `1 -
  eta` (PDF p. 4).
- Reinforcement-learning memory stores transition tuples
  `(s_t, a_t, r_{t+1}, s_{t+1})`; supervised-learning memory stores
  `(s_t, a_t)` only when the agent follows its best-response policy
  (PDF pp. 3-4).
- Algorithm 1 trains the supervised network with negative log
  likelihood over supervised memory and trains the Q network with a
  fitted Q-learning target using a periodically updated target network
  (PDF p. 4).
- The paper's method is not a search algorithm at action time; it is a
  learned self-play / fictitious-play procedure with reinforcement and
  supervised updates (PDF pp. 3-5).

## Training Data

- NFSP training data is self-generated through interaction among NFSP
  agents, not through human gameplay datasets (PDF pp. 1, 3-4).
- `M_RL` is a circular replay memory for reinforcement-learning
  transitions, while `M_SL` is a reservoir for supervised-learning
  behavior tuples from the agent's own approximate best-response policy
  (PDF pp. 3-4).
- The Leduc setup used memory sizes `200k` and `2m` for `M_RL` and
  `M_SL`, respectively, SGD learning rates `0.1` and `0.005`, two
  stochastic-gradient updates per network for every 128 game steps,
  target-network refit every 300 updates, anticipatory parameter `eta =
  0.1`, and exploration beginning at `0.06` before decaying to zero
  (PDF p. 5).
- The Limit Texas Hold'em setup used fully connected networks with
  hidden layers `1024`, `512`, `1024`, and `512`, memory sizes `600k`
  and `30m` for `M_RL` and `M_SL`, SGD learning rates `0.1` and
  `0.01`, two mini-batch-256 updates per network for every 256 game
  steps, target-network refit every 1000 updates, anticipatory
  parameter `eta = 0.1`, and slower exploration decay from `0.08`
  (PDF pp. 6-7).

## Self-Play Setup

- All players are controlled by separate NFSP agents that learn from
  simultaneous self-play against each other (PDF p. 3).
- The agent's mixture policy uses the average strategy with probability
  `1 - eta` and the approximate best-response strategy with
  probability `eta`, which supplies best-response behavior samples for
  supervised average-policy training (PDF pp. 4-5).
- The method is designed so each agent can approximate a best response
  to opponents' anticipated average strategy profile while also
  collecting samples of its own best-response behavior for average
  policy learning (PDF pp. 4-5).
- Project inference: The useful Gwent takeaway is not "generic neural
  self-play converges." The paper's claim is tied to NFSP's fictitious-
  play structure, average-policy tracking, reservoir sampling, and
  exploitability-based poker evaluation.

## Evaluation Method

- Most experiments measure exploitability of learned strategy profiles;
  in a two-player zero-sum game, exploitability is defined as the
  expected average payoff that a best-response profile achieves against
  the evaluated strategy profile (PDF p. 5).
- The paper states that exploitability `2 delta` yields at least a
  `delta`-Nash equilibrium (PDF p. 5).
- Leduc Hold'em experiments compare NFSP across network sizes, ablated
  NFSP variants, and DQN / DQN average-strategy variants using
  exploitability curves (PDF pp. 5-6).
- Limit Texas Hold'em performance is reported in milli-big-blinds per
  hand and compared against top ACPC 2014 agents, with periodic
  evaluation against SmooCT over 25,000 hands per evaluation (PDF pp.
  6-7).
- The LHE section contextualizes win rates by saying a player that
  always folds loses `750` mbb/h, expert human players achieve
  expected win rates of `40-60` mbb/h in online high-stakes games, and
  the top half of ACPC 2014 computer agents achieved up to `50` mbb/h
  among themselves (PDF p. 7).
- Project inference: The paper supports exploitability and strong fixed
  opponents as evaluation concepts for NFSP-style agents, but it does
  not provide a Gwent fixed-seed suite, matchup matrix, or rating
  ladder by itself.

## Difficulty / Human-Likeness Notes

- Not applicable as a difficulty-design source: the paper optimizes
  approximate equilibrium / strong poker play, not calibrated
  human-likeness or intentionally weaker opponent tiers (PDF pp. 5-8).
- Human experts are mentioned only to contextualize Limit Texas
  Hold'em performance, not as imitation data or a human-like policy
  objective (PDF pp. 6-7).

## Compute Requirements

- The paper reports neural-network sizes, replay-memory sizes, update
  batch sizes, learning rates, target-network refresh periods, and
  exploration schedules for Leduc and Limit Texas Hold'em (PDF pp.
  5-7).
- The paper says the Limit Texas Hold'em configuration was selected
  after manually calibrating nine configurations (PDF p. 6).
- The paper does not report a specific hardware budget or wall-clock
  training cost for NFSP in these experiments (PDF pp. 5-8).
- Project inference: The `30m` supervised-memory size and million-scale
  training-iteration plots suggest that a faithful NFSP Gwent
  experiment would require explicit data-storage, runtime, and
  evaluation-budget planning rather than being a drop-in local UI
  feature.

## What This Paper Establishes

- NFSP is an imperfect-information self-play training method that
  combines an off-policy approximate best-response learner with a
  supervised average-policy learner (PDF pp. 3-5).
- The paper provides empirical support that NFSP can approach low
  exploitability in Leduc Hold'em while DQN-style self-play does not
  approach Nash equilibrium in the same reported comparison (PDF pp.
  5-6).
- The paper provides empirical support that NFSP can learn a competitive
  Limit Texas Hold'em strategy from raw poker inputs without explicit
  handcrafted poker abstraction features (PDF pp. 5-7).
- The paper gives a concrete reason to distrust naive DQN-style
  self-play in imperfect-information games: deterministic strategies
  are exploitable and epsilon-greedy self-play generates correlated,
  narrow experience distributions (PDF p. 6).
- The paper provides an evaluation vocabulary centered on
  exploitability for two-player zero-sum settings and match win rate
  against strong fixed poker agents (PDF pp. 5-7).

## What This Paper Does Not Establish

- It does not evaluate Gwent, Hearthstone, Legends of Code and Magic, or
  another collectible card game; all experiments are poker (PDF pp.
  5-7).
- It does not define a Gwent observation schema, legal-action encoding,
  row/card-target representation, prompt representation, leader-action
  interface, or reward design (PDF pp. 3-7).
- It does not show that arbitrary neural self-play, DQN self-play,
  policy-gradient self-play, or AlphaZero-style self-play converges in
  imperfect-information games; its convergence claim is tied to NFSP
  and fictitious-play structure (PDF pp. 3-8).
- It does not present a search planner, public-belief-state search, CFR
  traversal implementation, ISMCTS algorithm, or online lookahead
  method for action selection (PDF pp. 3-8).
- It does not provide a human-like difficulty-control method or
  behavior-cloning recipe from human play (PDF pp. 5-8).
- It does not report exact hardware requirements or a small-compute
  workstation recipe for reproducing the Limit Texas Hold'em result
  (PDF pp. 5-8).

## Relevance To Gwent AI

- Project inference: This paper is relevant as a training-method source
  for imperfect-information self-play because it gives a concrete
  neural fictitious-play structure: one learner approximates a best
  response, one learner tracks the historical average policy, and play
  mixes those policies through anticipatory dynamics (PDF pp. 3-5).
- Project inference: The strongest near-term lesson for Gwent is a
  constraint, not an implementation mandate: naive DQN-style self-play
  is a poor default in imperfect-information games because the paper's
  DQN comparison stayed highly exploitable and did not approach a Nash
  equilibrium in Leduc Hold'em (PDF p. 6).
- Project inference: NFSP is a plausible medium-term reference for a
  reduced Gwent learning experiment after the project has a stable
  hidden-safe observation export, engine-derived legal-action
  candidate/mask interface, replay storage, and evaluation ladder. The
  paper itself supplies the dual-memory / dual-network self-play
  pattern but not those Gwent-specific interfaces (PDF pp. 3-7).
- Project inference: The evaluation framing is useful for future Gwent
  robustness work: learned policies should be tested against
  exploitability-style best-response probes where tractable, plus strong
  fixed opponents where exact exploitability is unavailable (PDF pp.
  5-7).
- Project inference: The paper helps separate defensible
  imperfect-information self-play claims from generic "self-play gets
  stronger" claims. Its convergence evidence is tied to fictitious-play
  averaging, reservoir sampling, anticipatory dynamics, and poker
  exploitability evaluation, not to arbitrary reinforcement learning
  loops (PDF pp. 3-8).
- Project inference: The paper is less directly Gwent-specific than the
  CCG benchmark annotations because its experiments are poker-only and
  use a small fixed action vocabulary, but it is more theory-aligned
  than generic policy-gradient self-play for imperfect-information
  training-roadmap discussions (PDF pp. 5-7).

## Risks For Adaptation

- Project inference: A direct port would be misleading if it treats the
  poker action model as sufficient for Gwent. The paper's experiments
  use a compact fold/call/raise-style action vocabulary, while Gwent
  has variable legal commands with board-row, card-instance, weather,
  prompt, pass, and leader targets (PDF p. 5).
- Project inference: A Gwent NFSP experiment would leak hidden
  information if it trains or acts on opponent hand/deck identities not
  visible to the acting seat. The paper's game model is information
  state based, where poker players know their own private cards but not
  opponents' private cards (PDF p. 2).
- Project inference: The paper must not be cited as support for
  arbitrary neural self-play convergence. The failed DQN comparison is
  part of the paper's evidence, and the positive claim depends on the
  NFSP / fictitious-play machinery (PDF pp. 3-8).
- Project inference: The paper does not provide a Gwent reward design,
  observation tensor, legal-action schema, simulator export format,
  matchup matrix, rating system, or human-like difficulty control.
  Those remain separate project specs and literature decisions (PDF pp.
  3-8).
- Project inference: The Limit Texas Hold'em setup used large replay
  memories, including a `30m` supervised memory, and million-scale
  training iterations. Any Gwent adaptation should declare storage,
  runtime, and evaluation budgets before training so a toy result is not
  overread as full-engine strength (PDF pp. 6-7).
- Project inference: Poker exploitability and Gwent exploitability are
  not interchangeable. Exact exploitability may be unavailable for
  full-engine Gwent, so any use of this paper should distinguish exact
  reduced-game exploitability from approximate best-response or fixed
  opponent evaluation (PDF pp. 5-7).

## AI-Roadmap Decision

1. **Source category.** Project inference: training-method source for
   imperfect-information neural self-play, with secondary evaluation
   relevance through exploitability and fixed-opponent comparisons. It
   is not a direct near-term Gwent implementation mandate (PDF pp.
   1, 3-8).

2. **Game class.** Project inference: applies most directly to finite
   two-player zero-sum imperfect-information extensive-form games. The
   paper's experiments are poker games, not CCGs or Gwent (PDF pp.
   2, 5-7).

3. **Method family.** Project inference: NFSP / fictitious self-play
   with deep reinforcement learning and supervised average-policy
   learning. The method uses off-policy Q-learning for approximate best
   response, supervised classification for average-policy imitation,
   reservoir sampling, and anticipatory dynamics (PDF pp. 3-5).

4. **Action space.** Project inference: the paper supports policies over
   available actions in principle, but its experiments use a small
   fixed poker action vocabulary and do not solve Gwent's variable
   legal-command interface. A Gwent adaptation should consume
   engine-derived legal action candidates or masks rather than importing
   the poker action encoding (PDF pp. 2, 5).

5. **Evaluation methodology.** Project inference: useful for
   exploitability-centered evaluation in tractable reduced games and
   fixed-opponent comparisons against strong baselines. It does not
   provide a complete Gwent evaluation ladder, rating method, fixed seed
   suite, side-switching protocol, or confidence policy (PDF pp. 5-7).

6. **Agent scope.** Project inference: supports global information-state
   agents more than faction-specialist or deck-conditioned agents. The
   paper does not discuss factions, decks, CCG archetypes, card pools,
   or deck-conditioned policy scope (PDF pp. 5-7).

7. **Smallest faithful experiment.** Project inference: defer full
   Gwent NFSP until observation/action/export and evaluation machinery
   exists. The smallest faithful experiment would be a reduced,
   hidden-safe Gwent subgame or late-round benchmark with a compact
   legal-action candidate interface, dual NFSP memories, separate
   best-response and average-policy networks, and evaluation against an
   approximate best response or fixed baseline agents (PDF pp. 3-7).

8. **Adaptation risk.** Project inference: adaptation becomes
   misleading if it exposes hidden opponent data, collapses Gwent's
   variable target actions into an invalid fixed vector, reports
   self-play win rate without best-response or fixed-opponent probes,
   ignores replay/storage budgets, or cites NFSP as proof that generic
   DQN/policy-gradient self-play converges (PDF pp. 2-8).

9. **Roadmap effect.** Project inference: affects the medium-term ML
   roadmap and future Cluster F training-method specs after evaluation
   and hidden-safe observation/action exports are settled. It should
   not trigger immediate NFSP implementation, full neural self-play, or
   product AI replacement. The next implementation-adjacent work should
   remain evaluation-ladder synthesis and low-compute reduced
   experiment design (PDF pp. 3-8).
