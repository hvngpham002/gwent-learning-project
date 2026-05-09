---
citekey: brown2020rebel
title: "Combining Deep Reinforcement Learning and Search for Imperfect-Information Games"
authors:
  - "Noam Brown"
  - "Anton Bakhtin"
  - "Adam Lerer"
  - "Qucheng Gong"
year: 2020
venue: "34th Conference on Neural Information Processing Systems (NeurIPS 2020)"
doi: ""
arxiv: "2007.13544"
project_relevance: training-method
method_family: mixed
information_model: imperfect
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/brown2020rebel/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/brown2020rebel/source.pdf"
pages_read: "1-25"
status: "complete"
---

## Summary

This annotation now covers PDF pp. 1-25 of Noam Brown, Anton
Bakhtin, Adam Lerer, and Qucheng Gong, "Combining Deep
Reinforcement Learning and Search for Imperfect-Information Games,"
arXiv `2007.13544v2`, dated 29 November 2020 and presented at
NeurIPS 2020 (PDF p. 1).

The paper introduces ReBeL, Recursive Belief-based Learning, as a
framework combining self-play reinforcement learning with search for
two-player zero-sum games, including imperfect-information games
(PDF pp. 1-2).

The first batch explains why AlphaZero-style state-value search is not
sound in imperfect-information games, introduces public belief states
as the expanded search state, and presents ReBeL's depth-limited
subgame search plus self-play value/policy learning loop (PDF pp.
1-7).

The first-batch experiments cover turn endgame hold'em, heads-up
no-limit Texas hold'em, and Liar's Dice; the paper reports
approximate-equilibrium behavior in Liar's Dice, strong TEH
exploitability results, and superhuman HUNL performance against a top
human expert and benchmark poker bots (PDF pp. 8-9).

The second batch covers PDF pp. 11-20. It adds the remaining
first-batch references, Appendix A's contribution summary, detailed
ReBeL pseudocode, HUNL/TEH/Liar's Dice environment descriptions,
poker-domain-knowledge exclusions, network/training hyperparameters,
the HUNL human experiment note, and the beginning of the Theorem 1/2/3
appendix proofs (PDF pp. 11-20).

The third batch covers PDF pp. 21-25. It completes the Appendix G
proof sketches for Theorems 2 and 3, explains Fictitious Linear
Optimistic Play, describes CFR-AVG and modified CFR-AVG, reports
appendix exploitability comparisons, and records the simplified CFR
warm-start procedure (PDF pp. 21-25).

The full local source is read at PDF pp. 1-25. The final `Relevance
To Gwent AI`, `Risks For Adaptation`, and `AI-Roadmap Decision`
sections are complete.

## Paper Claims

- The abstract says existing RL-plus-search successes such as
  AlphaZero are tied to single-agent or perfect-information settings,
  and prior algorithms of that form cannot cope with
  imperfect-information games (PDF p. 1).
- The paper presents ReBeL as a general framework for self-play
  reinforcement learning and search that provably converges to a Nash
  equilibrium in any two-player zero-sum game (PDF p. 1).
- The abstract says ReBeL reduces to an AlphaZero-like algorithm in
  perfect-information games, with a different search algorithm (PDF
  p. 1).
- The paper reports results in two imperfect-information games showing
  approximate-equilibrium convergence and reports superhuman
  heads-up no-limit Texas hold'em performance with less poker domain
  knowledge than prior poker AI systems (PDF p. 1).
- The introduction uses a modified sequential Rock-Paper-Scissors
  example to show that action values in imperfect-information games can
  depend on the probability an action is chosen, so a state defined
  only by action/observation history does not have a unique value (PDF
  pp. 1-2).
- The paper says recent imperfect-information game breakthroughs have
  shown the importance of search at test time, but combining RL and
  search during training in imperfect-information games remained open
  (PDF p. 2).
- ReBeL expands the notion of state to include the probabilistic belief
  distribution of all agents about what state they may be in, based on
  common-knowledge observations and policies (PDF p. 2).
- ReBeL trains a value network and a policy network for public-belief
  expanded states through self-play reinforcement learning, and it
  uses those networks for search during self play (PDF p. 2).
- The paper says ReBeL approximates a Nash equilibrium in Liar's Dice
  and open-sources the Liar's Dice implementation, while it withholds
  poker code for cheating-risk reasons (PDF pp. 2, 10).
- Related work positions perfect-information RL-plus-search systems
  as training value networks through self play and using search with
  value-function leaf evaluation, but says those systems are not
  theoretically sound in imperfect-information games (PDF p. 2).
- Public belief states are defined as common-knowledge belief
  distributions over states, determined by shared public observations
  and all agents' policies (PDF p. 2).
- ReBeL builds on DeepStack's use of a public-belief-state value
  function during search, but unlike DeepStack it trains the value
  function through self-play RL rather than random public-belief-state
  generation with domain-specific sampling and abstractions (PDF p. 2).
- The paper contrasts ReBeL with Pluribus-style depth-limited search,
  where agents choose among blueprint policies at leaf nodes; that
  approach uses search at test time but not during training and needs
  strong blueprint policies computed without search (PDF pp. 2-3).
- The notation assumes game rules and agents' policies, including
  search algorithms, are common knowledge during the main theoretical
  setup, while stochastic algorithm outcomes are not known (PDF p. 3).
- The formal model distinguishes world states, joint actions, legal
  action sets per agent, transitions, rewards, private observations,
  public observations, histories, infostates, and public states (PDF
  p. 3).
- The paper defines a public state as a sequence of public
  observations and says all agents observing the same public sequence
  makes it common knowledge that the true history is one of the
  histories matching that public state (PDF p. 3).
- A policy maps an infostate to a probability distribution over
  actions, and a Nash equilibrium is a policy profile where no agent
  can improve expected value by switching policies (PDF p. 3).
- The paper's theoretical and empirical results are limited to
  two-player zero-sum games, although it notes related techniques have
  been empirically successful in some multi-player settings (PDF
  p. 4).
- Section 4 converts an imperfect-information game into a continuous
  state/action-space perfect-information belief-representation game,
  where state contains all agents' probabilistic belief distributions
  (PDF p. 4).
- In the belief-representation example, players announce action
  probabilities for each possible private card to a referee; the
  referee samples the actual action from the true private-card
  distribution, and beliefs update by Bayes' Rule (PDF p. 4).
- A public belief state is described by a joint probability
  distribution over agents' possible infostates for a public state
  (PDF p. 4).
- The paper says a public belief state can root a subgame, and in
  two-player zero-sum games every public belief state has a unique
  value for each agent under Nash-equilibrium play in the rooted
  subgame (PDF p. 5).
- Although the belief representation enables perfect-information
  reasoning in theory, the paper says the high-dimensional continuous
  belief space makes ordinary perfect-information search intractable
  (PDF p. 5).
- ReBeL's search uses supergradients of the public-belief-state value
  function at leaf nodes rather than direct public-belief-state scalar
  values, and it learns an infostate-value function over public belief
  states (PDF p. 5).
- Algorithm 1 repeatedly constructs a depth-limited subgame rooted at
  the current public belief state, initializes a policy, sets leaf
  values from the learned value network, runs iterative policy updates,
  stores value-network and optional policy-network training examples,
  samples a leaf public belief state, and continues until terminal
  (PDF p. 6).
- ReBeL can use CFR-D as the imperfect-information subgame search
  algorithm, while the paper also later reports fictitious-play
  variants (PDF p. 6).
- In CFR-D search, the value of each discrete leaf node is set from
  the learned infostate-value function conditioned on the public belief
  state induced by the current iteration policy, so leaf values change
  every iteration (PDF p. 6).
- For CFR-D, the average policy profile rather than the final-iteration
  policy converges to a Nash equilibrium, and ReBeL stores the average
  root value vector as value-network training data (PDF p. 6).
- ReBeL trains its value network through self play by solving a
  subgame, storing the root infostate values, sampling a leaf public
  belief state, and repeating the process until the game ends (PDF
  pp. 6-7).
- Theorem 2 states that, with an idealized value approximator and T
  CFR iterations per subgame, Algorithm 1 produces a value approximator
  whose error is at most `C / sqrt(T)` for any public belief state that
  could be encountered during play (PDF p. 7).
- Algorithm 1 can train a policy network by adding the average policy
  for each public belief state in the subgame to a training dataset
  after the subgame is solved (PDF p. 7).
- Section 6 addresses test-time play when the opponent's full policy is
  unknown and the exact public belief state is therefore unknown (PDF
  p. 7).
- The paper contrasts unsafe search, which can be exploitable, with
  safe search, where the algorithm plays a Nash-equilibrium policy in
  expectation (PDF p. 7).
- The paper claims safe search can be achieved without extra search
  constraints by running the same algorithm at test time that is used
  for training, selecting a random iteration and assuming all players'
  policies match the policies on that iteration (PDF p. 8).
- Theorem 3 states that if Algorithm 1 is run at test time with no
  off-policy exploration, a sufficiently accurate value network, and T
  CFR iterations to solve subgames, then the algorithm plays an
  approximate Nash equilibrium with error terms depending on value
  error and `1 / sqrt(T)` (PDF p. 8).
- Experiments measure exploitability and use alternating-updates Linear
  CFR for CFR experiments and alternating-updates Linear Optimistic FP
  for FP experiments (PDF p. 8).
- The experiments evaluate heads-up no-limit Texas hold'em, Liar's
  Dice, and turn endgame hold'em; in poker, the action space is reduced
  to at most nine actions using domain knowledge about typical bet
  sizes, while off-tree test-time actions are added to the subgame
  (PDF p. 8).
- The value and policy functions are approximated with MLPs using GeLU,
  LayerNorm, Adam, Huber loss for value, and MSE over probabilities for
  policy (PDF p. 8).
- The paper reports data generation as the bottleneck and says training
  uses a single machine plus up to 128 machines with 8 GPUs each for
  data generation (PDF p. 8).
- Figure 2 says ReBeL reaches TEH exploitability comparable to about
  125 iterations of full-game tabular CFR, and a value network trained
  on random public belief states fails to learn useful value estimates
  (PDF p. 8).
- Table 1 compares ReBeL against Slumbot, BabyTartanian8, LBR, and top
  human expert Dong Kim; ReBeL's row reports `45 +/- 5` against
  Slumbot, `9 +/- 4` against BabyTartanian8, `881 +/- 94` against LBR,
  and `165 +/- 69` against top humans in thousandths of a big blind per
  game (Table 1, PDF p. 9).
- Table 2 reports exploitability for four Liar's Dice variants and
  says the ReBeL rows average policies over 1,024 playthroughs, making
  the numbers upper bounds on exploitability (Table 2, PDF p. 9).
- The conclusion says ReBeL generalizes self-play reinforcement
  learning and search to imperfect-information games, proves
  approximate-equilibrium computation for two-player zero-sum games,
  shows convergence in Liar's Dice, and shows superhuman HUNL
  performance (PDF p. 9).
- The conclusion states two first-batch limitations: value/policy
  inputs grow linearly with the number of infostates in a public state,
  and theoretical guarantees are limited to two-player zero-sum games
  (PDF p. 9).
- The broader-impact section says the most immediate risk is cheating
  in recreational games such as poker and says the authors do not
  release poker code, while releasing the Liar's Dice implementation
  because it is easier to understand and scale for research (PDF
  p. 10).
- PDF p. 10 begins the references, including AlphaZero-style search,
  CFR, Deep CFR, safe subgame solving, poker agents, and other
  related-work sources cited in the first-batch body (PDF p. 10).
- PDF pp. 11-13 continue and complete the references, including
  depth-limited imperfect-information solving, AIVAT variance
  reduction, Dec-POMDP / public-observation models, DeepStack,
  AlphaZero, MuZero, continual resolving, TD-Gammon, fictitious play,
  and CFR references used by the paper (PDF pp. 11-13).
- Appendix A identifies ReBeL's central contribution as RL-plus-search
  for general two-player zero-sum imperfect-information games, where
  prior RL-plus-search was developed for perfect-information games
  and prior imperfect-information value-function learning covered
  cooperative or narrower zero-sum cases (PDF p. 14).
- Appendix A says Theorem 3 provides an alternative to prior safe
  search techniques by showing that, with an accurate public-belief
  value function, random-iteration test-time search can empirically
  play according to a Nash equilibrium; the result applies regardless
  of how the value function was trained and therefore also applies to
  earlier public-belief value-function methods such as DeepStack (PDF
  p. 14).
- Appendix A describes CFR-AVG as a theoretically sound alternative to
  CFR-D for depth-limited subgame decomposition, while noting the
  experiments use an efficient modified CFR-AVG form that is not
  theoretically sound and whose soundness remains open (PDF p. 14).
- Appendix A says Theorem 1 connects public-belief-state gradients and
  infostate values, and that this points toward using a scalar
  public-belief-state value function in settings with billions or more
  infostates per public belief state (PDF p. 14).
- Appendix A introduces Fictitious Linear Optimistic Play as a novel
  fictitious-play variant inspired by regret-minimization work, reports
  near-`O(1/T)` empirical convergence in poker and Liar's Dice, and
  says it can be a reasonable CFR alternative in some domains (PDF
  p. 14).
- Appendix B's detailed pseudocode uses linearly weighted iteration
  sampling, samples iteration `t` with probability proportional to
  `t`, uses exploration probability `epsilon = 0.25` during training
  and `epsilon = 0` at test time, and returns the public belief state
  corresponding to the sampled leaf history (PDF p. 15).
- Appendix C describes HUNL as a two-player no-limit Texas hold'em
  game with blinds, two private cards per player, four betting rounds,
  public community cards after betting rounds, fold/call/raise actions,
  and showdown by best five-card poker hand if nobody folds (PDF
  p. 16).
- Appendix C defines TEH as HUNL with automatic calls in the first two
  betting rounds, an initial `$1,000` per player in the pot at the
  third betting round, randomized training stack sizes between `$5,000`
  and `$50,000`, reduced raise sizes, and about `2 * 10^11` infostates
  even without randomized stacks and bet sizes (PDF p. 16).
- Appendix C describes Liar's Dice as a two-player zero-sum game in
  the experiments: each player privately rolls dice, players make
  increasing bids about dice counts/faces, a challenge ends the round,
  and the highest face is wild (PDF p. 16).
- Appendix D says the most prominent poker-domain knowledge in the
  ReBeL poker agent is action-space simplification to at most eight
  actions at each decision point, with hand-chosen pot-fraction bet
  sizes perturbed by `+/-0.1` times pot during training (PDF p. 16).
- Appendix D says the poker agent does not use information
  abstraction, whether lossy or lossless; it computes a unique policy
  for each infostate and feeds the networks belief distributions over
  card pairs plus public board/pot/betting indicators (PDF pp. 16-17).
- Appendix D says the poker agent does not sample random public belief
  states with handcrafted heuristics, does not use exact all-in EV
  lookup shortcuts, always solves to the end of the current betting
  round, implements CFR on a single-thread CPU without abstractions,
  and uses a single value network for all value layers (PDF p. 17).
- Appendix E says the value-network input consists of an agent index,
  public-state representation, and probability distributions over
  infostates for both agents; its output is a vector of values for
  each possible infostate of the indexed agent (PDF p. 17).
- Appendix E says the paper trains a policy network only for poker;
  it outputs a probability distribution over legal actions for each
  infostate (PDF p. 18).
- Appendix E reports poker training with a circular buffer of 12
  million examples, uniform sampling, 25 percent random-action
  exploration, policy-target linear quantization, replay-buffer
  pruning after 20 epochs, Adam learning-rate schedules, 2,560,000
  examples per epoch, batch size 1024, 90 DGX-1 machines for data
  generation, and 1,750 full-game epochs (PDF p. 18).
- Appendix E reports Liar's Dice value-network training with two
  hidden layers of size 256, Adam, 25,600 examples per epoch, batch
  size 512, 1,024 search iterations during training and evaluation,
  one GPU for training, 60 CPU threads for data generation, and 1,000
  epochs (PDF p. 18).
- Appendix E.1 says the HUNL human experiment used 7,500 hands against
  Dong Kim, variance-reduced scoring, an incentive-compatible payment
  formula, bot decisions never exceeding five seconds, average bot
  self-play speed faster than two seconds per hand, preflop subgame
  caching, a variance-reduced Kim loss of `165 +/- 69`, and a raw Kim
  loss of `358 +/- 188` (PDF p. 18).
- Appendix F begins the proof of Theorem 1. Lemma 1 states player 1's
  value at a public belief state is linear in player 1's belief when
  player 2's policy is fixed, and Lemma 2 states the value is the
  minimum over player 2 policies and therefore concave (PDF p. 19).
- Appendix F restates Theorem 1 and proves the infostate value equals
  the public-belief-state value plus a supergradient component for the
  corresponding infostate direction (PDF pp. 19-20).
- Appendix G begins the proof section for Theorems 2 and 3, with Lemma
  3 starting on p. 20 before the proof continues on p. 21 (PDF
  p. 20).
- Appendix G completes Lemma 3 by arguing inductively that Algorithm 1
  resembles recursive CFR-D when neural value calls are replaced by
  recursive subgame solving, and that sampled reachable leaf public
  belief states eventually receive the needed infostate value vectors
  as the number of runs grows (PDF p. 21).
- Appendix G restates Theorem 2 and says that, with an idealized value
  approximator returning the most recent sampled value and `T` CFR
  iterations in each subgame, Algorithm 1 produces values corresponding
  to a `C / sqrt(T)` equilibrium policy for any public belief state
  that could be encountered during play (PDF p. 21).
- Appendix G restates Theorem 3 and proves it by induction from
  non-depth-limited subgames to depth-limited subgames, using random
  iteration play as equivalent in expectation to the average CFR
  policy and CFR-D / CFR-AVG bounds for leaf public belief states (PDF
  pp. 21-22).
- Appendix H defines ordinary fictitious play as repeated best
  response to opponents' average policies, with average-policy updates
  converging to Nash equilibrium in two-player zero-sum games but very
  slowly in practice (PDF p. 22).
- Appendix H introduces Fictitious Linear Optimistic Play as a
  generalized weakened fictitious-play variant inspired by Linear CFR,
  using an optimistic opponent average with extra weight on the
  previous opponent policy and updating averages with linear weights
  (PDF p. 22).
- Theorem 4 proves FLOP is a form of generalized weakened fictitious
  play because its iteration policies are epsilon-best responses to
  the opponent average with epsilon going to zero (PDF p. 22).
- Appendix I explains a weakness of CFR-D: because leaf public belief
  states are based on the current iteration policy `pi^t`, the value
  network may need accuracy over the whole input domain even when the
  average policy converges to an equilibrium (PDF p. 22).
- Appendix I defines CFR-AVG as setting leaf values according to the
  average policy `pi-bar^t`, while still sampling leaf nodes with
  probability determined by `pi^t` (PDF pp. 22-23).
- Figure 4 reports Liar's Dice exploitability comparisons across four
  variants and says FLOP outperforms Linear FP in all games but does
  not match Linear CFR convergence (Fig. 4, PDF p. 23).
- Figure 5 reports TEH exploitability comparisons for FP variants and
  Linear CFR (Fig. 5, PDF p. 23).
- Theorem 5 states that if `T` iterations of CFR-AVG are run in a
  depth-limited subgame and each leaf public-belief subgame is solved
  completely, then the average policy is a `C / sqrt(T)` Nash
  equilibrium for a game-specific constant (PDF p. 23).
- Appendix I lists CFR-AVG benefits: focusing the value network on a
  narrower input subspace near converged average policies, potential
  narrowing when combined with a policy network, and possible value
  reuse across iterations because average policies change more slowly
  than current policies (PDF p. 24).
- Appendix I says the experiments modify CFR-AVG for efficiency in a
  way not proven theoretically sound; the modification uses prior
  average-policy value estimates to derive current-iteration values
  and remains an open soundness question in depth-limited subgames
  despite empirical TEH convergence in tested parameter settings (PDF
  p. 24).
- Figure 6 reports that sound CFR-AVG performs worse than CFR-D with
  an oracle value network in TEH, while modified CFR-AVG performs
  better than CFR-D with both oracle values and a self-play-trained
  value network (Fig. 6, PDF p. 24).
- The paper reports a HUNL model trained with CFR-D instead of CFR-AVG
  lost to BabyTartanian8 by `10 +/- 3`, while the CFR-AVG model won by
  `9 +/- 4`; the CFR-D model beat Slumbot by `39 +/- 6`, while
  CFR-AVG won by `45 +/- 5` (PDF p. 24).
- Appendix I.1 proves Theorem 5 by following prior CFR-D proof
  structure, bounding regrets for infostates in the depth-limited
  subgame by CFR and showing regrets outside the subgame do not
  increase when exact equilibria are solved at leaf public belief
  states (PDF p. 25).
- Appendix J describes a simplified CFR warm-start procedure: compute
  an exact best response to the warm-start policy profile, convert the
  resulting instantaneous regrets into scaled initial regrets, scale
  by 15 to imitate 15 CFR iterations, initialize the average policy as
  if the warm-start policy had been played for 15 iterations, and then
  continue CFR from there (PDF p. 25).

## Game / Environment Model

- The formal model is a factored-observation game that distinguishes
  world states, joint actions, transitions, rewards, private
  observations, public observations, histories, infostates, and public
  states (PDF p. 3).
- The model supports multiple agents in notation, but the paper's
  theoretical and empirical results are limited to two-player zero-sum
  games (PDF p. 4).
- The paper explicitly distinguishes perfect-information world-state
  subgames from imperfect-information public-belief-state subgames
  (PDF pp. 3-5).
- The experimental games in the first batch are heads-up no-limit
  Texas hold'em, turn endgame hold'em, and Liar's Dice (PDF p. 8).
- TEH is a no-limit Texas hold'em variant where both players
  automatically check or call for the first two of four betting rounds
  (PDF p. 8).
- Appendix C provides the concrete HUNL sequence: blinds, private
  hole cards, four betting rounds, public community-card reveals after
  the first through third betting rounds, fold/call/raise choices, and
  showdown using the best five-card poker hand from private plus
  community cards (PDF p. 16).
- Appendix C says TEH trains with randomized stack sizes, bet sizes,
  and board cards but measures exploitability on a fixed `$20,000`
  stack, unperturbed bet-size, fixed-board setting so NashConv remains
  tractable (PDF p. 16).
- Appendix C defines the Liar's Dice benchmark by private dice, public
  sequential bids, challenge resolution, and wild highest faces (PDF
  p. 16).
- Project inference: Gwent is also two-player and zero-sum at the
  match-result level, but it has constructed decks, row/card effects,
  multi-round pass timing, leaders, weather, public discard piles, and
  hidden opponent hand/deck identities that are not modeled directly in
  the first-batch experiments.

## Information Model

- The paper assumes public and private observations: each agent may
  receive a private observation, and all agents receive a public
  observation when the world state transitions (PDF p. 3).
- An infostate is an agent's sequence of observations and actions, and
  a public state is the shared sequence of public observations (PDF
  p. 3).
- Public states capture common knowledge because all agents observing
  the same public sequence know the true history belongs to the set of
  histories matching that public state (PDF p. 3).
- ReBeL uses public belief states, defined as common-knowledge belief
  distributions over possible infostates for the current public state
  (PDF pp. 2, 4).
- The main setup assumes agents' policies are common knowledge during
  training, but Section 6 addresses test-time search when the
  opponent's policy is unknown (PDF pp. 3, 7).
- Project inference: A Gwent ReBeL experiment would require a
  hidden-safe public state and belief representation over legal hidden
  hands/deck states rather than exposing opponent hand identities.

## Action Space

- The formal model defines the joint action space as the product of
  per-agent action spaces and uses `Ai(w)` for agent `i`'s legal
  actions at world state `w` (PDF p. 3).
- A policy maps each infostate to a probability distribution over
  actions (PDF p. 3).
- The belief-representation example turns a discrete action into a
  vector of action probabilities per possible private card; in the
  example with 52 possible private cards and three discrete actions,
  an action is described by 156 probabilities (PDF p. 4).
- In HUNL and TEH, the paper reduces the poker action space to at most
  nine actions using bet-size domain knowledge, while adding off-tree
  test-time actions to the subgame (PDF p. 8).
- Appendix D narrows the poker agent's train-time action
  simplification as at most eight actions at each decision point,
  based on hand-chosen conventional poker bet sizes perturbed during
  training (PDF p. 16).
- Appendix E says the policy network's output is a probability
  distribution over legal actions for each infostate and that the
  poker action abstraction has at most nine legal actions for the
  target vector (PDF p. 18).
- Project inference: The paper acknowledges legal actions and
  off-tree-action handling, but it does not provide a Gwent action
  encoder for row targets, card targets, weather, leaders, pass, deck
  construction, or prompt choices.

## Policy / Search / Learning Method

- ReBeL combines self-play reinforcement learning with search at both
  training time and test time for imperfect-information games (PDF
  pp. 1-2).
- Search is performed in depth-limited imperfect-information subgames
  rooted at public belief states, not in ordinary world-state subgames
  rooted at a fully observed state (PDF pp. 5-6).
- ReBeL solves subgames in the discrete representation using an
  iterative equilibrium-finding algorithm, with CFR-D described first
  and fictitious-play variants also evaluated (PDF pp. 6, 8).
- The learned infostate-value network provides leaf values during
  each search iteration, and those leaf values can change with the
  iteration policy or average policy depending on the search variant
  (PDF p. 6).
- Self-play training stores value-network examples from subgame root
  infostate values and can store average-policy examples for a policy
  network (PDF pp. 6-7).
- Test-time safe search uses the same algorithm as training, selecting
  a random iteration and assuming all players' policies match that
  iteration's policies (PDF p. 8).
- Appendix A lists CFR-AVG as a contribution and says it is a
  theoretically sound alternative to CFR-D, but also flags the
  experiment's efficient modified CFR-AVG implementation as not
  theoretically sound with open soundness status (PDF p. 14).
- Appendix A lists FLOP as a novel fictitious-play variant that
  empirically performs much better than previous fictitious-play
  variants and is sometimes a reasonable CFR alternative (PDF p. 14).
- Algorithm 2 details the linear CFR-D ReBeL loop: construct the
  subgame, initialize policy with optional warm start, set learned leaf
  values, sample an iteration with probability proportional to its
  iteration number, update policies and averages, store value and
  optional policy data, then recurse from a sampled leaf public belief
  state (PDF p. 15).
- Appendix F provides the first part of the formal basis for using
  infostate values in public-belief-state search by proving the
  value/supergradient relationship in Theorem 1 (PDF pp. 19-20).
- Appendix G completes the proof sketches for the value-network and
  test-time search guarantees by induction over depth-limited
  subgames, assuming the stated idealized value approximation and
  subgame-solving conditions (PDF pp. 21-22).
- Appendix H introduces FLOP as an optimistic, linearly weighted
  fictitious-play variant that converges as a generalized weakened
  fictitious-play algorithm but is still usually slower than Linear or
  Discounted CFR in large-scale games (PDF p. 22).
- Appendix I frames CFR-AVG as a theoretically sound alternative to
  CFR-D when leaf subgames are solved completely, then separates that
  from the paper's more efficient modified CFR-AVG implementation
  whose theoretical soundness remains open (PDF pp. 23-24).
- Appendix J warm-starts CFR from a policy profile by converting exact
  best-response instantaneous regrets into scaled initial regrets and
  treating the warm-start policy as if it had been played for the
  first 15 CFR iterations (PDF p. 25).

## Training Data

- Training data is generated by self play rather than human gameplay
  logs (PDF pp. 2, 6-8).
- Value-network training examples are public belief states paired with
  computed infostate-value vectors from solved subgames (PDF pp. 5-6).
- Optional policy-network examples are public belief states paired with
  average subgame policies after subgame solution (PDF pp. 6-7).
- The paper says data generation is the bottleneck because of the
  sequential nature of FP/CFR algorithms and leaf-node evaluation on
  every iteration (PDF p. 8).
- Appendix B's sampling procedure samples a root history from the
  current public belief state, chooses a random player for exploration,
  follows random actions with probability `epsilon` for that player
  and policy actions otherwise, and returns the public belief state at
  the sampled leaf (PDF p. 15).
- Appendix D says poker training data is collected purely from
  self-play without handcrafted public-belief-state sampling, other
  than the exploration hyperparameter set to `epsilon = 0.25` (PDF
  p. 17).
- Appendix E reports poker training data storage in a simple 12
  million-example circular buffer sampled uniformly, with half of the
  early replay data removed after 20 epochs because initial data is
  produced with a random value network (PDF p. 18).
- Project inference: A Gwent adaptation would need generated
  self-play data tied to public belief states and legal hidden-state
  hypotheses, not product gameplay telemetry or hidden-information
  shortcuts.

## Self-Play Setup

- ReBeL repeatedly solves the current public-belief-state subgame,
  records training data, samples a leaf public belief state, and
  continues recursively until terminal (PDF p. 6).
- During self-play training, the setup assumes all players' policies
  are common knowledge so the public belief state can be computed
  exactly (PDF pp. 3, 7).
- One agent samples random actions with positive probability during
  training to ensure sufficient exploration (PDF p. 7).
- The paper distinguishes ReBeL from DeepStack by emphasizing
  self-play training for public-belief-state value estimates rather
  than random public-belief-state generation (PDF p. 2).
- The paper distinguishes ReBeL from Pluribus-style blueprint-policy
  search by using search during training rather than requiring strong
  non-search blueprint policies first (PDF pp. 2-3).
- Algorithm 2 sets `epsilon = 0.25` during training and `epsilon = 0`
  at test time in its sampled-leaf procedure (PDF p. 15).
- Appendix D emphasizes that ReBeL poker self-play does not rely on
  handcrafted random public-belief-state generation, unlike the
  DeepStack value-network training approach discussed by the paper
  (PDF p. 17).

## Evaluation Method

- The paper measures exploitability and defines it as an average over
  agents of the value improvement available through best response
  against the evaluated policy profile (PDF p. 8).
- TEH results compare ReBeL's exploitability against full-game tabular
  CFR, an oracle perfect value net, self-play value nets, self-play
  value/policy nets, and random-beliefs value-net training (Fig. 2,
  PDF pp. 8-9).
- HUNL evaluation includes head-to-head performance against Slumbot,
  BabyTartanian8, LBR, and a top human expert, with variance reduced
  using AIVAT for the human match (PDF pp. 8-9).
- Liar's Dice evaluation reports exploitability across four game
  sizes for full-game FP, full-game CFR, ReBeL FP, and ReBeL CFR-D
  (Table 2, PDF p. 9).
- The paper reports decision-time constraints for the poker agent:
  ReBeL played faster than two seconds per hand and never needed more
  than five seconds for a decision (PDF p. 8).
- Appendix C says TEH exploitability is measured on a fixed `$20,000`
  stack and fixed public board setting despite randomized training
  stacks, bet sizes, and board cards (PDF p. 16).
- Appendix E says Liar's Dice evaluation uses 1,024 search iterations
  and reports averages over the last three checkpoints to reduce
  variance in RL-plus-search results (PDF p. 18).
- Appendix E.1 describes the human HUNL evaluation against Dong Kim:
  7,500 hands, home/asynchronous play, up to four simultaneous games,
  payment tied to variance-reduced win/loss rate, preflop subgame
  caching, and both variance-reduced and raw score reporting (PDF
  p. 18).
- Figure 4 compares Liar's Dice exploitability for FP, Linear FP,
  FLOP, and Linear CFR; the caption states FLOP outperforms Linear FP
  in all games but does not match Linear CFR convergence (Fig. 4, PDF
  p. 23).
- Figure 5 compares exploitability for multiple fictitious-play
  variants and Linear CFR in TEH (Fig. 5, PDF p. 23).
- Figure 6 compares CFR-D, CFR-AVG, modified CFR-AVG, and FP with
  oracle values and with self-play-learned values in TEH; the text
  highlights modified CFR-AVG as empirically stronger than CFR-D in
  those TEH settings (Fig. 6, PDF p. 24).
- The appendix HUNL comparison reports CFR-AVG outperforming the
  otherwise identical CFR-D model against BabyTartanian8 and Slumbot
  in the authors' runs (PDF p. 24).
- Project inference: The first batch supports exploitability-style
  and strong-baseline evaluation discipline, but full Gwent would need
  reduced-game best-response proxies, matchup matrices, and fixed
  seed suites before comparable claims are meaningful.

## Difficulty / Human-Likeness Notes

- The paper is about approximate-equilibrium computation and strong
  play, not modeling human mistakes, controllable weakness, or
  human-like style (PDF pp. 1-2, 8-9).
- The first-batch human comparison is a strength benchmark: ReBeL
  plays top HUNL expert Dong Kim and reports a statistically positive
  result in thousandths of a big blind per game (PDF pp. 8-9).
- The broader-impact section frames poker cheating risk as a concern
  precisely because ReBeL can compute policies for arbitrary stack
  sizes and bet sizes in seconds (PDF p. 10).
- Appendix E.1 uses a top human HUNL expert as a performance benchmark
  and compensation target, not as a behavioral-imitation or
  controllable-difficulty dataset (PDF p. 18).
- Project inference: ReBeL is a long-term strong-agent architecture
  reference, not a source for human-like Gwent difficulty tiers.

## Compute Requirements

- The paper uses neural value and policy functions implemented as
  MLPs with GeLU activation functions and LayerNorm, trained with Adam
  (PDF p. 8).
- The value network uses pointwise Huber loss, and the policy network
  uses MSE over probabilities (PDF p. 8).
- The paper says data generation is the bottleneck because FP/CFR are
  sequential and every leaf node is evaluated on each iteration (PDF
  p. 8).
- The first-batch setup uses a single machine for training and up to
  128 machines with 8 GPUs each for data generation (PDF p. 8).
- The conclusion says value and policy function inputs grow linearly
  with the number of infostates in a public state, which is intractable
  for games with strategic depth and little common knowledge, such as
  Recon Chess (PDF p. 9).
- Appendix C says TEH has roughly `2 * 10^11` infostates even without
  randomized stack and bet sizes (PDF p. 16).
- Appendix D says the poker agent implements CFR only on a
  single-thread CPU and avoids abstractions, which makes it learn six
  value layers rather than DeepStack's three-layer setup (PDF p. 17).
- Appendix E reports the poker networks as six hidden-layer MLPs with
  1,536 hidden units per layer, a poker input including `2 * 1326`
  infostate-belief components, and policy targets up to nine times the
  value-target size due to the action abstraction (PDF p. 18).
- Appendix E reports full-game poker data generation with 90 DGX-1
  machines, each with 8 Nvidia V100 GPUs, while Liar's Dice uses one
  GPU for training and 60 CPU threads for data generation (PDF p. 18).
- Appendix I's modified CFR-AVG discussion is partly an efficiency
  workaround: it tries to avoid the mismatch between an average-policy
  public-belief input and a current-policy value output without
  adding both current and average public beliefs to the network input
  (PDF p. 24).
- Project inference: These compute and representation constraints make
  ReBeL unsuitable as an immediate full-Gwent product AI target; a
  faithful project experiment would likely need a small reduced Gwent
  model and offline training.

## What This Paper Establishes

- ReBeL is presented as an RL-plus-search framework for
  imperfect-information games that works over public belief states and
  trains value/policy networks through self play (PDF pp. 1-7).
- The paper provides first-batch theoretical claims for two-player
  zero-sum games: value approximation error decreases with subgame CFR
  iterations under idealized conditions, and test-time use of the same
  algorithm gives approximate Nash play under the stated assumptions
  (PDF pp. 7-8).
- ReBeL's first-batch evaluation includes exploitability results in
  TEH and Liar's Dice and head-to-head HUNL results against benchmark
  bots and a top human expert (PDF pp. 8-9).
- The paper establishes that random public-belief-state value training
  can fail where self-play value training succeeds in the reported TEH
  setup (Fig. 2, PDF p. 8).
- The paper explicitly identifies representation scaling and
  two-player zero-sum theoretical scope as limitations (PDF p. 9).
- Appendix A establishes the authors' own contribution framing:
  general two-player zero-sum imperfect-information RL-plus-search,
  a random-iteration safe-search alternative, CFR-AVG subgame
  decomposition, the public-belief-state gradient / infostate-value
  connection, and FLOP (PDF p. 14).
- Appendix D establishes that the reported poker agent avoids several
  major poker-specific shortcuts used by prior agents, including
  information abstraction, handcrafted random public-belief-state
  sampling, all-in EV lookup, deeper third-round solving, GPU CFR, and
  separate value networks by layer (PDF pp. 16-17).
- Appendix F establishes the first part of the proof record for
  Theorem 1 by deriving the concavity/supergradient relationship
  between public-belief-state values and infostate values (PDF
  pp. 19-20).
- Appendix G completes the paper's first-order proof record for the
  stated Theorem 2 and Theorem 3 guarantees under the paper's
  idealized approximation and subgame-solving assumptions (PDF
  pp. 21-22).
- Appendix H establishes FLOP as a convergent generalized weakened
  fictitious-play variant and empirically compares it with Linear FP
  and Linear CFR (PDF pp. 22-23).
- Appendix I establishes CFR-AVG's theoretical convergence when leaf
  subgames are solved completely, and distinguishes that theorem from
  the empirically successful but unproven modified CFR-AVG used in
  experiments (PDF pp. 23-25).
- Appendix J establishes the implementation's simplified CFR
  warm-start procedure rather than a separately tuned warm-start
  theorem (PDF p. 25).

## What This Paper Does Not Establish

- It does not show that AlphaZero-style world-state value search is
  sound in imperfect-information games; the paper argues the opposite
  through its modified Rock-Paper-Scissors example (PDF pp. 1-2).
- It does not provide a Gwent observation schema, action encoder,
  public-belief-state compressor, hidden-card belief updater, or
  product-time policy interface (PDF pp. 3-8).
- It does not evaluate collectible card games, deck construction,
  row-based boards, multi-round pass pressure, weather, leader
  abilities, or card-text prompt targets (PDF pp. 8-9).
- It does not remove the need for domain-specific action abstraction:
  HUNL/TEH reduce actions to at most nine bet sizes using poker domain
  knowledge (PDF p. 8).
- It does not provide a human-like difficulty model or player-style
  model; the human result is a high-strength benchmark (PDF pp. 8-9).
- It does not prove scalability beyond two-player zero-sum games or
  beyond public belief state representations with tractable infostate
  counts (PDF p. 9).
- It does not remove all domain knowledge: the poker agent still uses
  hand-chosen action-space simplification based on conventional poker
  bet sizes (PDF p. 16).
- It does not establish that the efficient modified CFR-AVG used in
  experiments is theoretically sound; Appendix A explicitly says that
  remains an open question (PDF p. 14).
- It does not provide the complete proof details for Theorems 2 and 3
  without idealized assumptions about value approximation, infinite
  repeated Algorithm 1 runs, or complete leaf subgame solving where
  the proofs require those conditions (PDF pp. 21-22).
- It does not prove the modified CFR-AVG algorithm used for efficient
  experiments is theoretically sound in depth-limited subgames; the
  paper explicitly leaves that as an open question (PDF p. 24).
- It does not show FLOP is generally preferable to CFR; Appendix H
  says Linear CFR and Discounted CFR still converge much faster in
  most large-scale games, and Figure 4 shows FLOP does not match
  Linear CFR on Liar's Dice (PDF pp. 22-23).

## Relevance To Gwent AI

- ReBeL is most relevant as a long-term architecture reference for
  hidden-information search plus self-play learning. Its core lesson
  for Gwent is that AlphaZero-style search over a fully observed
  world state is not a sound model for an imperfect-information game;
  the paper instead roots search in public belief states and infostate
  values (PDF pp. 1-7).
- The public/private observation, infostate, public-state, and
  public-belief-state framing gives useful vocabulary for any future
  Gwent AI design that must reason from public board state, visible
  discard piles, known played cards, pass history, and legal hidden
  hand/deck hypotheses without exposing the real opponent hand or deck
  identities (PDF pp. 3-5).
- Depth-limited public-belief subgame search with learned infostate
  values is a possible long-term experiment direction after the
  project has hidden-info-safe observation export, legal-action
  candidate generation, and an evaluation ladder. The paper's own
  method solves public-belief subgames and uses learned leaf values
  during self play (PDF pp. 5-7, 15).
- The safe-search discussion is a useful warning for product AI:
  test-time search in imperfect-information games can be exploitable
  unless the algorithm preserves the policy assumptions required for
  safe search. The paper's random-iteration test-time search claim
  depends on using the same algorithm as training, no off-policy
  exploration, sufficiently accurate values, and subgame iteration
  bounds (PDF pp. 7-8, 21-22).
- The evaluation discipline is relevant even if the concrete metrics
  do not transfer directly. ReBeL reports exploitability in reduced
  tractable games, head-to-head comparisons against strong baselines,
  decision-time limits, and variance-reduced human benchmarking rather
  than relying on anecdotal self-play strength (PDF pp. 8-9, 18,
  23-24).
- The compute and representation limits are directly relevant to
  roadmap scope. The paper reports data generation as the bottleneck,
  large-scale poker data generation across many GPU machines, and
  value/policy inputs that grow with the number of infostates in a
  public state (PDF pp. 8-9, 16-18).
- The action abstraction caveat matters for Gwent. ReBeL formally
  supports legal action sets, but the poker agent still hand-reduces
  betting actions and handles off-tree actions in poker-specific ways;
  this does not solve Gwent row targets, card targets, leader actions,
  prompt choices, weather placement, or pass timing (PDF pp. 3, 8,
  16, 18).
- Project inference: This paper should not drive a near-term full
  Gwent AI implementation. It belongs after simpler baselines,
  evaluation methodology, hidden-info-safe exports, and a small
  reduced-game experiment are in place.

## Risks For Adaptation

- Hidden-information leakage is the primary implementation risk. Any
  Gwent adaptation that conditions values, policies, search roots, or
  belief updates on the real opponent hand/deck identities would
  violate the paper's public/private observation framing rather than
  applying it (PDF pp. 3-5).
- Public-belief-state explosion is likely severe in Gwent. The paper
  already flags input growth with the number of infostates in a public
  state as a limitation, and its poker model uses explicit belief
  distributions over card pairs plus public betting features (PDF
  pp. 9, 17-18).
- The training setup assumes common-knowledge policies so exact public
  belief states can be computed during self play; project inference:
  product Gwent opponents, heuristic bots, and human players will not
  satisfy that assumption without an explicit opponent-model or
  blueprint-policy approximation (PDF pp. 3, 7).
- The paper's poker action abstraction is domain-specific. Project
  inference: copying the architecture without first designing Gwent
  legal command candidates, action masks, pointer/card targets, row
  targets, and prompt encodings would collapse the method into an
  ill-defined policy head (PDF pp. 8, 16, 18).
- Compute and data-generation requirements make a direct full-game
  attempt unrealistic for the current project. The paper reports data
  generation as the bottleneck and describes poker runs using 90
  DGX-1 machines for data generation (PDF pp. 8, 18).
- Modified CFR-AVG should not be treated as settled theory. Appendix
  A and Appendix I separate theoretically sound CFR-AVG from the
  efficient modified version used in experiments, whose soundness is
  left open (PDF pp. 14, 24).
- The theorem assumptions are idealized. The guarantees depend on
  conditions such as idealized value approximation, sufficiently many
  subgame iterations, no off-policy exploration at test time, and
  complete leaf subgame solving where required (PDF pp. 7-8, 21-25).
- Domain transfer is unproven. The experiments cover HUNL, TEH, and
  Liar's Dice, not collectible card games, deck construction,
  multi-round row combat, weather, leaders, or prompt-heavy card text
  (PDF pp. 8-9, 16).
- The human result is a strength benchmark, not a difficulty design.
  It does not support claims about human-like mistakes, adjustable
  skill levels, or player-style imitation (PDF pp. 8-9, 18).
- The broader-impact cheating warning applies to this project. A
  strong hidden-information agent that can play arbitrary positions
  quickly has misuse risk if it is exposed outside controlled
  evaluation contexts (PDF p. 10).

## AI-Roadmap Decision

1. **Source category:** Long-term training-method and search-learning
   architecture reference. ReBeL is not a direct Gwent implementation
   plan, product bot design, rating method, or human-like difficulty
   model (PDF pp. 1-9).
2. **Game class:** Two-player zero-sum imperfect-information games
   with public and private observations, infostates, public states,
   and public belief states. The paper's theory and experiments do not
   cover CCG-specific deck construction or Gwent-specific card-effect
   structure (PDF pp. 3-5, 8-9).
3. **Method family:** Self-play reinforcement learning plus
   public-belief-state depth-limited search, with learned value and
   optional policy networks, CFR-D / CFR-AVG / modified CFR-AVG /
   fictitious-play search variants, and random-iteration safe-search
   theory under stated assumptions (PDF pp. 5-8, 14-25).
4. **Action space:** The paper formally models legal actions and
   uses poker-specific action abstraction with off-tree action
   handling. Project decision: future Gwent work must first expose
   engine legal commands as hidden-info-safe candidates with masks or
   structured pointer targets; ReBeL does not supply that encoder (PDF
   pp. 3, 8, 16, 18).
5. **Evaluation methodology:** Adopt the discipline, not the exact
   metrics. ReBeL uses exploitability where tractable, strong
   benchmark opponents, fixed reduced settings, decision-time
   reporting, and variance-reduced human evaluation. Gwent needs its
   own reduced-game best-response proxies, fixed seed suites, matchup
   matrix, runtime budget reporting, and rating methodology before
   comparable claims (PDF pp. 8-9, 16, 18, 23-24).
6. **Agent scope:** ReBeL may eventually inform global or
   faction-specialist training only after the project has public
   belief encoders, legal-action abstractions, and benchmark
   infrastructure. The paper does not directly support
   deck-conditioned full-Gwent claims.
7. **Smallest faithful experiment:** A tiny reduced Gwent-like
   imperfect-information game: fixed decks, a few card types, a few
   hidden cards, simplified row/pass resolution, explicit public
   belief states, legal command candidates, and a small CFR/FP
   depth-limited search with learned or tabular infostate values.
   Evaluate with exploitability or best-response proxies, fixed seeds,
   and baseline comparisons. Do not start with the full engine.
8. **Adaptation risks:** The blocking risks are hidden-info cheating,
   pretending public belief states are tractable without measurement,
   copying modified CFR-AVG as if it were proven, underestimating
   compute/data-generation cost, and evaluating only against weak bots
   or anecdotal self-play results.
9. **Roadmap effect:** ReBeL should influence the long-term ML/search
   roadmap and the design of a future reduced-game public-belief
   experiment. It should not trigger immediate `legal-heuristic-v1`,
   ISMCTS, Deep CFR, ReBeL, OSFP, NFSP, or neural training
   implementation work.

Final decision: mark `brown2020rebel` complete and classify it as a
long-term public-belief RL-plus-search reference. The next practical
Cluster F work should remain evaluation-ladder and benchmark design,
with any ReBeL-style experiment deferred until hidden-info-safe public
belief state representation and action abstraction are explicitly
specified.
