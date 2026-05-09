---
citekey: brown2019deepcfr
title: "Deep Counterfactual Regret Minimization"
authors:
  - "Noam Brown"
  - "Adam Lerer"
  - "Sam Gross"
  - "Tuomas Sandholm"
year: 2019
venue: "Proceedings of the 36th International Conference on Machine Learning, PMLR 97"
doi: ""
arxiv: "1811.00164"
project_relevance: training-method
method_family: deep-cfr
information_model: imperfect
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/brown2019deepcfr/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/brown2019deepcfr/source.pdf"
pages_read: "1-19"
status: "complete"
---

## Summary

This annotation covers PDF pp. 1-19 of Noam Brown, Adam
Lerer, Sam Gross, and Tuomas Sandholm, "Deep Counterfactual
Regret Minimization," arXiv `1811.00164v3`, dated 22 May
2019 and published in the Proceedings of the 36th
International Conference on Machine Learning, PMLR 97 (PDF
p. 1).

The paper introduces Deep Counterfactual Regret Minimization
(Deep CFR), a neural function-approximation version of CFR
that approximates tabular CFR behavior in the full
unabstracted game instead of first solving a manually
abstracted game (PDF p. 1).

The method uses external-sampling MCCFR traversals to collect
instantaneous advantage samples, trains per-player advantage
networks from reservoir-sampled memories, and trains a final
policy network to approximate the average strategy (PDF pp.
4-6).

The experiments in the first batch focus on poker variants:
heads-up flop hold'em for exploitability and ablation studies,
and heads-up limit Texas hold'em for head-to-head comparison
against NFSP and domain-specific abstraction baselines (PDF
pp. 5, 7-8).

Batch 2 completes the full local source by reading Appendix A,
Appendix B, and Appendix C: poker-domain rules, MCCFR and
K-external-sampling proof details, the Deep CFR regret-bound
proof, the corollary proof, and the PyTorch network listing (PDF
pp. 11-19).

The full local source is now read. The final `Relevance To Gwent
AI`, `Risks For Adaptation`, and `AI-Roadmap Decision` sections
are complete.

## Paper Claims

- The abstract frames CFR as the leading framework for solving
  large imperfect-information games and says standard practice
  uses abstraction before tabular CFR in very large games (PDF
  p. 1).
- The paper claims abstraction can be problematic because it can
  require manual domain knowledge, miss strategic nuances, and
  depend on equilibrium knowledge that the abstraction is meant
  to help discover (PDF p. 1).
- The paper introduces Deep CFR as a CFR variant that replaces
  tabular regret storage with deep neural networks that
  approximate CFR behavior in the full game (PDF p. 1).
- The abstract says Deep CFR is principled, performs strongly
  in large poker games, and is the first non-tabular CFR variant
  to succeed in large games (PDF p. 1).
- The introduction says popular reinforcement-learning
  algorithms do not converge to good policies or equilibria in
  imperfect-information games in theory or practice (PDF p. 1).
- The paper states that Deep CFR converges to an epsilon-Nash
  equilibrium in two-player zero-sum games and empirically
  outperforms NFSP while being competitive with domain-specific
  tabular abstraction techniques (PDF p. 1).
- The formal setting is two-player zero-sum imperfect-information
  extensive-form games with perfect recall, information sets,
  reach probabilities, best responses, Nash equilibria, and
  exploitability (PDF p. 2).
- CFR is described as an iterative algorithm that converges to a
  Nash equilibrium in finite two-player zero-sum games, with an
  `O(1/sqrt(T))` theoretical convergence bound (PDF p. 2).
- Regret matching chooses actions at an infoset in proportion to
  positive accumulated counterfactual regret; when all regrets
  are non-positive, this paper chooses the highest-regret action
  rather than the usual uniform fallback (PDF p. 3).
- External-sampling MCCFR samples chance and opponent actions
  while traversing all actions for the current traverser, and
  updates regrets only for the traverser on that iteration (PDF
  p. 3).
- The related-work section positions NFSP as the previous leading
  domain-independent function-approximation algorithm for
  imperfect-information game solving, but says fictitious play
  has weaker theoretical convergence guarantees and slower
  practical convergence than CFR (PDF p. 3).
- Deep CFR's goal is to approximate CFR without calculating and
  accumulating regrets at every infoset, instead generalizing
  across similar infosets with neural function approximation
  (PDF p. 4).
- On each iteration, Deep CFR performs a fixed number of partial
  game-tree traversals with external-sampling MCCFR, using
  regret matching over a neural advantage model's outputs to
  choose strategies (PDF p. 4).
- Samples of instantaneous action advantages are stored in a
  per-player advantage memory with reservoir sampling when
  capacity is exceeded (PDF p. 4).
- Lemma 1 states that, for external-sampling MCCFR, sampled
  instantaneous regrets are an unbiased estimator of the
  advantage, defined as the difference between the expected
  payoff for playing an action and the expected payoff for the
  current strategy at the infoset (PDF p. 4).
- After a player's traversals finish, the advantage network is
  trained from scratch to minimize MSE between predicted
  advantages and sampled instantaneous regrets from memory (PDF
  p. 4).
- A separate policy network approximates the average strategy
  because CFR's average strategy, not the final iteration
  strategy alone, is what converges to a Nash equilibrium (PDF
  p. 4).
- The policy memory stores infoset probability vectors for both
  players when an infoset is visited during the opposing player's
  external-sampling traversal, weighted by the CFR iteration
  number (PDF p. 4).
- The paper notes that storing every prior value network can
  replace the final policy network in small runs, but this
  requires storing all or a subset of prior value networks (PDF
  p. 4).
- Theorem 1 bounds total regret with high probability by terms
  depending on game/payoff/action constants, the number of
  traversals, and the value-network approximation error; Corollary
  1 bounds average regret as the number of iterations grows (PDF
  p. 5).
- The experiments use heads-up flop hold'em with more than
  `10^12` nodes and more than `10^9` infosets, and heads-up
  limit Texas hold'em with more than `10^17` nodes and more than
  `10^14` infosets (PDF p. 5).
- The network architecture uses card and betting-history inputs,
  seven layers, 98,948 parameters in the FHP setup, and outputs
  either predicted advantages or average-strategy logits for each
  possible action (PDF p. 5).
- Algorithm 1 initializes per-player advantage networks,
  reservoir-sampled advantage memories, and a strategy memory;
  runs traversals for each player each CFR iteration; trains the
  traverser's advantage network from memory; and finally trains
  the policy network from strategy memory (PDF p. 6).
- Algorithm 2 traverses terminal, chance, traverser, and opponent
  nodes differently: traverser infosets enumerate every action and
  insert computed advantages, while opponent infosets insert the
  strategy vector and sample one action (PDF p. 6).
- The model-training section uses 40 million infosets for each
  player's advantage memory and for the strategy memory, trains
  the value model from scratch each CFR iteration, and uses Adam
  with gradient clipping (PDF p. 6).
- The HULH setup uses larger training batches and more SGD
  iterations than the FHP setup (PDF p. 6).
- The paper uses Linear CFR weighting, storing iteration weights
  with memory entries and minimizing weighted error during model
  training (PDF p. 6).
- In FHP, Deep CFR asymptotically reaches exploitability similar
  to a 3.6 million cluster domain-specific abstraction while
  converging faster by nodes touched, though neural inference and
  training add overhead that tabular CFR avoids (PDF p. 7).
- The FHP comparison reports that Deep CFR reached 37 mbb/g
  exploitability while NFSP converged to 47 mbb/g in the authors'
  sweep, and that Deep CFR was more sample efficient than NFSP
  (PDF p. 7).
- The traversal/SGD/model-size experiments report that fewer CFR
  traversals per iteration slow convergence but do not change final
  exploitability, fewer SGD steps affect asymptotic exploitability,
  and larger models reduce final exploitability up to a point (PDF
  pp. 7-8).
- The ablations report that retraining the regret model from
  scratch each CFR iteration, using linear weighting, choosing the
  highest-regret action when all regrets are non-positive, and
  using reservoir memories all improve convergence or final
  exploitability relative to ablated variants (PDF p. 8).
- In HULH, Deep CFR beats NFSP by `43 +/- 2` mbb/g and loses by
  `-11 +/- 2` mbb/g to the largest `3.3 * 10^8` bucket abstraction
  baseline in Table 1 (PDF p. 8).
- The conclusion says Deep CFR combines CFR with deep neural
  function approximation to find approximate equilibria in large
  imperfect-information games and is the first non-tabular CFR
  variant to succeed in large games (PDF p. 8).
- The conclusion warns that extending Deep CFR to larger games will
  likely require more scalable sampling strategies and variance
  reduction for sampled payoffs (PDF p. 8).
- PDF pp. 9-10 are references for work cited in the first-batch
  body, including CFR, MCCFR, NFSP, abstraction, poker agents,
  variance reduction, and related neural counterfactual regret
  work (PDF pp. 9-10).
- Appendix A defines HULH as a two-player zero-sum poker game
  where players alternate position after each hand and each betting
  round offers fold, call, or raise actions (PDF p. 11).
- HULH caps raises at three in the first two betting rounds and four
  in the third and fourth betting rounds, giving the game a limited
  number of actions (PDF p. 11).
- FHP is identical to HULH except it includes only the first two
  betting rounds (PDF p. 11).
- Appendix B.1 reviews MCCFR as sampling blocks of terminal histories
  and considering only histories in the sampled block on an iteration
  (PDF p. 11).
- For external-sampling MCCFR, the sampling probability for a
  terminal history is the opponent-and-chance reach probability, and
  the sampled value reduces to a sum over sampled terminal histories
  weighted by the traverser's reach from the information set (PDF
  p. 11).
- Theorem 2 restates Lanctot's general MCCFR regret bound, and the
  appendix simplifies it for external sampling using `delta = 1`
  (PDF p. 12).
- Appendix B.2 proves Lemma 1 by showing the sampled value conditional
  on visiting an information set equals the true counterfactual value
  divided by opponent reach probability (PDF p. 12).
- Appendix B.3 models `K` external-sampling traversals per iteration
  as `T * K` external-sampling rounds, with the strategy fixed within
  the `K` traversals from the regrets available at the start of that
  iteration (PDF p. 13).
- The K-external-sampling proof explicitly permits arbitrary play
  when all positive regrets sum to zero, because convergence bounds do
  not constrain play in those situations (PDF p. 13).
- Theorem 4 states that after `T` iterations of K-external sampling,
  average regret is bounded with high probability by a term that
  improves with `K` as `1 / sqrt(K)` inside the constant but still
  requires the same order of iterations as one-traversal external
  sampling (PDF pp. 14-15).
- Appendix B.4 proves Theorem 1 by adding an approximation-error term
  to the sampled-regret bound and relating that term to the average
  MSE loss gap between the learned value network and the best
  representable value function (PDF pp. 15-17).
- The Theorem 1 proof assumes first that the advantage memory is not
  full, which requires `K * |Ip| * T < |MV|`, and notes that the paper
  does not formally handle the full-memory case (PDF p. 17).
- Footnote 8 says reservoir sampling should intuitively work because
  it keeps an unbiased sample of previous iterations' regrets, and the
  authors point to Figure 4 for empirical support over a sliding
  window (PDF p. 17).
- Appendix B.5 proves Corollary 1 by choosing `rho = T^(-1/4)` and
  showing the average regret converges in probability to the bound
  controlled by approximation error (PDF p. 17).
- Appendix C provides a PyTorch implementation of the network with
  rank, suit, and card embeddings, masked no-card inputs, separate card
  and betting branches, skip connections, normalization, and a final
  action head (PDF pp. 18-19).

## Game / Environment Model

- The formal game model is an imperfect-information extensive-form
  game with finite players, histories, terminal histories, chance,
  action sets, information sets, payoffs, and perfect recall (PDF
  p. 2).
- The paper restricts its theoretical treatment to two-player
  zero-sum games with players `{1, 2}` and opposing payoffs (PDF
  p. 2).
- The experimental environments are heads-up flop hold'em and
  heads-up limit Texas hold'em, both poker variants with very
  large game trees and information-set spaces (PDF p. 5).
- FHP is described as similar to HULH but ending after the second
  betting round rather than the fourth, with only three community
  cards ever dealt (PDF p. 5).
- Appendix A states that each HULH hand deals two private cards to
  each player, then reveals community cards across flop, turn, and
  river stages unless a player folds earlier (PDF p. 11).
- FHP drops the later HULH betting rounds and community-card stages,
  keeping only the first two betting rounds (PDF p. 11).
- Project inference: Gwent fits the broad sequential imperfect-
  information and two-player zero-sum framing, but the paper's
  experiments are poker games, not row-based, multi-round,
  deck-constructed Gwent with card text, leaders, weather, and
  prompt-like card targets.

## Information Model

- An information set groups histories that are indistinguishable to
  the acting player, and every non-terminal node belongs to exactly
  one information set for each player (PDF p. 2).
- A strategy assigns the same action distribution to every history
  inside the same information set because the player cannot
  distinguish those histories (PDF p. 2).
- Perfect recall is assumed, meaning later histories cannot merge
  paths that differed in the player's prior information sets or
  actions (PDF p. 2).
- Deep CFR's neural inputs are infosets, and the FHP/HULH network
  represents card sets plus betting history rather than full hidden
  opponent private state (PDF pp. 4-5).
- The appendix rules confirm the poker information split used by the
  experiments: each player has private hole cards, while community
  cards are public once dealt (PDF p. 11).
- Appendix C's network code embeds card groups separately and sums
  cards within each group, matching the permutation-invariant handling
  of hole and board card sets described in the main text (PDF pp.
  18-19).
- Project inference: A Gwent Deep CFR experiment would need an
  engine-defined information-state encoder that hides opponent hand
  identities and deck order while exposing legal public board,
  discard, round, score, pass, leader, weather, and own-hand data.

## Action Space

- The formal notation uses an available action set `A(h)` at each
  node and an action set `A(I)` for each information set (PDF p. 2).
- Strategies are probability vectors over the available actions for
  the information set, and regret matching computes probabilities
  over those actions from positive regret (PDF pp. 2-3).
- Deep CFR's advantage network maps an infoset to a vector of values
  for actions, and the theorem uses `|A|` as the maximum number of
  actions at any infoset (PDF pp. 4-5).
- The poker network outputs values or logits for each possible
  action in the poker domain; the first-batch text does not define a
  variable-card-target or pointer action representation (PDF p. 5).
- Appendix A makes the poker action vocabulary concrete: fold, call,
  and raise, with betting-round raise caps making the action set much
  narrower than a general card-target command space (PDF p. 11).
- Appendix C's model has a final linear action head parameterized by
  `n_actions`, reinforcing that the implementation uses a fixed output
  width for the poker action set (PDF pp. 18-19).
- Project inference: The paper supports per-infoset legal action
  sets in game-theoretic form, but a faithful Gwent adaptation still
  needs an engine-derived candidate-action scorer, action mask, or
  target-pointer representation for rows, cards, weather, pass,
  leaders, and prompt options.

## Policy / Search / Learning Method

- Deep CFR is a CFR-family learning method, not a product-time tree
  search policy; it learns approximate equilibrium strategies through
  repeated self-play regret minimization (PDF pp. 1, 4-6).
- The method replaces tabular accumulated regret at every infoset
  with neural advantage estimates intended to approximate the regret
  that tabular CFR would have produced (PDF p. 4).
- It uses external-sampling MCCFR to collect samples, traversing all
  traverser actions and sampling chance/opponent actions (PDF pp.
  3-4, 6).
- The advantage network is trained from memory after each traverser's
  batch of traversals, and this paper trains it from scratch each CFR
  iteration rather than fine-tuning a single model (PDF pp. 4, 6, 8).
- The average-policy network is trained at the end from strategy
  memory so it can approximate the average strategy across CFR
  iterations (PDF pp. 4, 6).
- Linear CFR weighting is used for faster practical convergence,
  even though the paper does not provide a convergence bound for Deep
  CFR with linear weighting in the Monte Carlo case (PDF pp. 5-6).
- Appendix B proves the core regret-bound machinery for ordinary
  external sampling, K-external sampling, and Deep CFR with a value
  approximation error term, not for every practical variant discussed
  in the experiments (PDF pp. 11-17).
- The K-external-sampling appendix explains why performing `K`
  traversals per iteration can improve constants while retaining the
  same order of iterations as ordinary external sampling (PDF pp.
  13-15).
- Appendix C shows that the reported neural implementation is a
  two-branch poker encoder plus shared trunk and action head, not a
  general card-game rules interpreter (PDF pp. 18-19).

## Training Data

- Training data is self-generated from game-tree traversals rather
  than human gameplay logs (PDF pp. 4, 6).
- Per-player advantage memories store sampled instantaneous advantage
  vectors from traverser infosets, with reservoir sampling used when
  capacity is exceeded (PDF p. 4).
- The strategy memory stores sampled infoset probability vectors when
  infosets are encountered during the opposing player's traversal
  (PDF p. 4).
- The FHP setup allocates 40 million infosets to each player's
  advantage memory and 40 million infosets to the strategy memory
  (PDF p. 6).
- FHP value training uses 4,000 mini-batch SGD iterations with batch
  size 10,000, Adam learning rate 0.001, and gradient norm clipping
  to 1; HULH uses 32,000 SGD iterations with batch size 20,000 (PDF
  p. 6).
- Project inference: These memory and training budgets are
  substantial for a browser-first Gwent project and point toward
  offline reduced-game experiments rather than immediate product AI.
- The Theorem 1 proof's clean bound assumes the advantage memory
  contains all sampled regrets, which is guaranteed only when
  `K * |Ip| * T < |MV|` (PDF p. 17).
- The paper explicitly says it does not formally handle full memories,
  even though reservoir sampling is empirically favorable in Figure 4
  (PDF p. 17).
- Appendix C supplies executable-style PyTorch architecture details
  for the value/average-policy model: card embeddings, betting feature
  processing, ReLU layers, skip connections, normalization, and final
  action logits/values (PDF pp. 18-19).

## Self-Play Setup

- CFR's average strategies converge toward approximate Nash
  equilibria when both players' average total regret becomes small in
  two-player zero-sum games (PDF p. 3).
- Deep CFR alternates players as traversers, collecting regret data
  for the current traverser and strategy data from opponent infosets
  encountered during those traversals (PDF pp. 3-4, 6).
- The method's output is the final average-policy network, not a
  single greedy best-response network (PDF pp. 4, 6).
- The experiments compare learned self-play output against NFSP and
  tabular abstraction baselines rather than against human gameplay
  datasets (PDF pp. 5, 7-8).
- Appendix B.3 and B.4 clarify that the theoretical analysis is framed
  around iterative regret minimization over repeated external-sampling
  traversals, not a one-shot learned policy trained independently of
  CFR iterations (PDF pp. 13-17).
- Project inference: The paper supports a neural equilibrium-learning
  roadmap source for two-player zero-sum hidden-information games, but
  not naive policy-gradient self-play or a one-policy-vs-itself
  convergence claim.

## Evaluation Method

- The paper defines exploitability as how much worse a strategy does
  against a best response than a Nash-equilibrium strategy does
  against its best response, and measures total exploitability across
  players (PDF p. 2).
- FHP performance and exploitability are measured in milli big blinds
  per game, a standard poker win-rate measure (PDF p. 7).
- Figure 2 compares Deep CFR with NFSP and several domain-specific
  tabular abstractions in FHP by exploitability versus nodes touched
  (PDF p. 7).
- Figure 3 varies traversals per iteration, SGD steps per iteration,
  and model size to study convergence and final exploitability in FHP
  (PDF pp. 7-8).
- Figure 4 ablates linear weighting, retraining from scratch, regret
  fallback behavior, and reservoir versus sliding-window memories
  (PDF p. 8).
- Table 1 compares Deep CFR and NFSP head-to-head in HULH against
  converged CFR equilibria from abstractions of different sizes (PDF
  p. 8).
- Appendix A documents enough HULH/FHP rules to interpret the poker
  experiments' betting-round and action-cap assumptions (PDF p. 11).
- Appendix B is theoretical support for the regret-bound claims rather
  than an additional empirical evaluation section (PDF pp. 11-17).
- Project inference: The paper reinforces exploitability and strong
  fixed baselines as evaluation tools, but Gwent would need its own
  reduced-game best-response proxy, matchup matrix, or rating ladder
  before comparable claims are meaningful.

## Difficulty / Human-Likeness Notes

- The paper is about approximate equilibrium computation and
  performance against algorithmic poker baselines, not modeling human
  mistakes, style, explainability, or controllable difficulty (PDF
  pp. 1, 5, 7-8).
- The only human comparison in the first batch is contextual: Table 1
  notes a 2007 poker AI using roughly `3 * 10^8` abstraction buckets
  defeated human professionals by about 52 mbb/g after variance
  reduction techniques (PDF p. 8).
- Project inference: Deep CFR may eventually support strong Gwent
  agents or benchmark opponents, but it does not directly provide a
  human-like difficulty model.
- Appendix A-C add no human-likeness or controllable-difficulty
  method; they provide poker rules, proofs, and model architecture
  details (PDF pp. 11-19).

## Compute Requirements

- The paper targets extremely large games: FHP has over `10^12` nodes
  and over `10^9` infosets, while HULH has over `10^17` nodes and
  over `10^14` infosets (PDF p. 5).
- The FHP neural model described in the first batch has 98,948
  parameters and seven layers (PDF p. 5).
- The FHP memory allocation is 40 million infosets per player
  advantage memory plus 40 million infosets for strategy memory (PDF
  p. 6).
- HULH training uses substantially more SGD work than FHP: 32,000
  SGD iterations and batch size 20,000 rather than 4,000 iterations
  and batch size 10,000 (PDF p. 6).
- The authors note that neural network inference and training require
  considerable overhead that tabular CFR avoids (PDF p. 7).
- The conclusion says larger games will likely require more scalable
  sampling strategies and variance-reduction methods for sampled
  payoffs (PDF p. 8).
- The formal proof assumes a sufficiently large value memory for the
  clean bound and separately notes that full memories are not formally
  handled (PDF p. 17).
- Appendix C's default PyTorch architecture uses embedding and hidden
  dimensions parameterized by `dim = 256`, with separate card and bet
  branches before a shared trunk and action head (PDF pp. 18-19).

## What This Paper Establishes

- Deep CFR is presented as a principled non-tabular CFR-family method
  that approximates tabular CFR behavior with neural function
  approximation in two-player zero-sum imperfect-information games
  (PDF pp. 1, 4-5).
- External-sampling MCCFR provides the sampled instantaneous advantage
  data used to train Deep CFR's neural advantage networks (PDF pp.
  3-4, 6).
- Reservoir sampling, retraining advantage networks from scratch,
  linear weighting, and non-uniform fallback when all regrets are
  non-positive are all important practical components in the reported
  ablations (PDF p. 8).
- In the reported poker experiments, Deep CFR is more sample efficient
  than NFSP, reaches lower FHP exploitability than NFSP, and performs
  competitively against large domain-specific abstraction baselines
  (PDF pp. 7-8).
- The appendices establish the paper's HULH/FHP rule assumptions,
  external-sampling and K-external-sampling proof details, the
  approximation-error-dependent regret bound, and concrete network
  architecture used in the reported implementation (PDF pp. 11-19).

## What This Paper Does Not Establish

- It does not show that generic deep reinforcement learning, DQN,
  policy gradients, or AlphaZero-style self-play converge in
  imperfect-information games (PDF pp. 1, 3).
- It does not provide a Gwent observation schema, action encoder,
  prompt-target representation, deck-construction model, or
  product-time AI policy (PDF pp. 4-8).
- It does not evaluate collectible card games, row-based card effects,
  multi-round pass pressure, weather effects, leader abilities, or
  Gwent-specific hidden information (PDF pp. 5, 7-8).
- It does not remove the need for exploitability-style or
  best-response evaluation; exploitability is central to the paper's
  evaluation setup (PDF pp. 2, 7-8).
- It does not claim that full-scale Deep CFR is cheap; the reported
  memory, traversal, and SGD settings are large, and the conclusion
  identifies scalability and variance as future-work issues (PDF pp.
  6-8).
- It does not formally prove the full-memory reservoir-sampling case;
  the proof assumes memory is large enough to hold all sampled regrets
  and then gives an intuitive/empirical argument for reservoir sampling
  when memories fill (PDF p. 17).
- Appendix C does not provide a reusable Gwent architecture; it is a
  poker-specific PyTorch model over card groups and betting features
  with a fixed action head (PDF pp. 18-19).

## Relevance To Gwent AI

- Project inference: This paper is relevant as a training-method source
  for equilibrium-oriented neural self-play in imperfect-information
  games. It combines CFR-family regret minimization with neural
  approximation through external-sampling MCCFR traversals,
  per-player advantage memories, advantage networks, strategy memory,
  and a final average-policy network (PDF pp. 1, 4-6).
- Project inference: The strongest Gwent use is medium- to long-term
  research planning, not immediate product AI. The method assumes a
  faithful information-state representation and repeated self-play
  traversal data; Gwent would first need hidden-safe observations,
  engine-derived legal action candidates or masks, reproducible
  simulation exports, and evaluation baselines (PDF pp. 2, 4-8).
- Project inference: Deep CFR is a useful comparison point against
  NFSP-style self-play because the paper explicitly positions NFSP as
  the prior domain-independent neural baseline and reports lower FHP
  exploitability plus stronger HULH head-to-head results for Deep CFR
  in the tested poker settings (PDF pp. 3, 7-8).
- Project inference: The paper supports exploitability-centered
  evaluation discipline for reduced Gwent experiments. Its empirical
  claims are reported through exploitability, nodes touched,
  ablations, and head-to-head comparison against fixed baselines rather
  than self-play win rate alone (PDF pp. 2, 7-8).
- Project inference: The formal action model accepts per-infoset
  available actions, but the reported poker implementation uses a
  fixed-width action head over a small betting vocabulary. A Gwent
  adaptation should keep the engine as the legal-action source and
  design a candidate-action scorer, action mask, or target-pointer
  representation rather than importing the poker action head directly
  (PDF pp. 2, 5, 11, 18-19).
- Project inference: The compute and storage profile makes Deep CFR a
  candidate for offline reduced-game or benchmark experiments. The FHP
  setup uses 40 million infosets per advantage memory and strategy
  memory, repeated traversal/training cycles, and the authors note
  neural inference/training overhead and future scalability needs (PDF
  pp. 6-8).

## Risks For Adaptation

- Project inference: A Gwent implementation would be invalid if it
  trains or acts on opponent hand identities, opponent deck order, or
  other hidden state unavailable to the acting seat. The paper's model
  is explicitly information-set based and assumes players cannot
  distinguish histories inside the same information set (PDF p. 2).
- Project inference: The paper should not be cited as proof that full
  Gwent Deep CFR will converge cheaply. The theoretical bound is for
  two-player zero-sum games with a value-approximation error term, and
  the appendix's clean memory argument assumes advantage memory is not
  full; the paper itself does not formally handle the full-memory
  reservoir case (PDF pp. 5, 15-17).
- Project inference: The poker action model is too narrow for direct
  Gwent use. HULH/FHP actions are fold, call, and raise with capped
  betting rounds, while Gwent legal commands include row targets,
  card-instance targets, weather, pass, leaders, and prompt choices
  (PDF pp. 5, 11, 18-19).
- Project inference: The reported architecture is not a reusable Gwent
  model. Appendix C encodes poker card groups and betting features
  through embeddings, skip connections, normalization, and a final
  action head; it does not encode Gwent rows, weather, discard state,
  leaders, pass pressure, prompts, deck construction, or variable
  targets (PDF pp. 18-19).
- Project inference: Deep CFR's average-policy requirement is easy to
  misuse. The policy output that matters is the average strategy
  approximation, not simply the last traverser's advantage network or a
  greedy final-iteration policy (PDF pp. 3-4, 6).
- Project inference: The paper does not provide human-like difficulty,
  explainability, or controllable mistake modeling. It is about
  approximate equilibrium computation and algorithmic poker baselines,
  so difficulty tiers would need separate design after benchmark
  evaluation exists (PDF pp. 1, 7-8).
- Project inference: Any Gwent experiment should declare memory,
  traversal, training, runtime, and evaluation budgets before results
  are interpreted. The paper's strong claims are tied to large poker
  experiments, exploitability comparisons, and ablations, not a
  browser-first implementation budget (PDF pp. 5-8).

## AI-Roadmap Decision

1. **Source category.** Project inference: training-method source for
   imperfect-information neural CFR. It has secondary evaluation value
   through exploitability and ablation methodology, but it is not a
   near-term Gwent implementation mandate (PDF pp. 1, 4-8).

2. **Game class.** Project inference: applies most directly to finite
   two-player zero-sum imperfect-information extensive-form games with
   perfect recall. The paper's experiments are poker games, not CCGs or
   Gwent (PDF pp. 2, 5, 7-8).

3. **Method family.** Project inference: Deep CFR / external-sampling
   MCCFR with neural advantage approximation, reservoir-sampled
   advantage memory, strategy memory, retraining from scratch per CFR
   iteration, linear weighting in experiments, and final average-policy
   learning (PDF pp. 3-6, 8).

4. **Roadmap placement.** Project inference: keep Deep CFR in the
   medium- to long-term ML roadmap as a reduced-game/offline training
   candidate. Do not schedule full-engine Deep CFR, product AI
   replacement, or browser-runtime neural training before the project
   has hidden-safe observation exports, legal-action encoding, and a
   benchmark ladder (PDF pp. 4-8).

5. **Observation and action prerequisites.** Project inference: any
   faithful Gwent experiment must encode the acting seat's information
   state without hidden leaks and must consume engine-derived legal
   actions. The paper does not solve Gwent's row/card/weather/leader/
   prompt target interface; that remains a project design requirement
   (PDF pp. 2, 4-5, 18-19).

6. **Evaluation methodology.** Project inference: use this paper to
   require exploitability-style or approximate-best-response evaluation
   where tractable, plus fixed baselines and ablations. It should not
   justify claims based only on self-play win rate, training loss, or
   anecdotal match strength (PDF pp. 2, 7-8).

7. **Smallest faithful experiment.** Project inference: the smallest
   reasonable Gwent follow-up is a reduced, hidden-safe two-player
   zero-sum subgame or late-round benchmark with compact legal-action
   candidates, external-sampling traversals, per-player advantage
   memories, an average-policy learner, explicit memory/training
   budgets, and evaluation against fixed policies plus approximate best
   responses when available (PDF pp. 4-8, 15-17).

8. **Adaptation risk.** Project inference: adaptation becomes
   misleading if it exposes hidden opponent state, collapses variable
   legal targets into an invalid fixed poker-style action vector,
   ignores the full-memory reservoir caveat, treats the Appendix C
   poker network as a generic CCG architecture, or cites Deep CFR as
   evidence that generic RL self-play converges in imperfect-
   information Gwent (PDF pp. 1-8, 15-19).

9. **Roadmap effect.** Project inference: this annotation completes
   the Deep CFR source as a future training-method reference, but it
   does not supersede the cFp19 Batch A search decision or the need for
   Batch B's evaluation-ladder decision. The next implementation-
   adjacent work should still be evaluation methodology and benchmark
   harness design before any Deep CFR or ReBeL implementation spec
   (PDF pp. 2, 4-8).
