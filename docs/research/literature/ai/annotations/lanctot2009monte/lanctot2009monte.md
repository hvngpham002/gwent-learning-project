---
citekey: lanctot2009monte
title: "Monte Carlo Sampling for Regret Minimization in Extensive Games"
authors:
  - "Marc Lanctot"
  - "Kevin Waugh"
  - "Martin Zinkevich"
  - "Michael Bowling"
year: 2009
venue: "Advances in Neural Information Processing Systems 22"
doi:
arxiv:
project_relevance: training-method
method_family: cfr
information_model: imperfect
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/lanctot2009monte/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/lanctot2009monte/source.pdf"
pages_read: "1-9"
status: "complete"
---

## Summary

This first batch covers the full local PDF for Lanctot, Waugh,
Zinkevich, and Bowling, "Monte Carlo Sampling for Regret Minimization
in Extensive Games," published in Advances in Neural Information
Processing Systems 22 (PDF pp. 1-9).

The paper generalizes CFR sampling into Monte Carlo counterfactual
regret minimization (MCCFR), a family of sample-based CFR algorithms
that performs the same regret updates as full CFR in expectation (PDF
pp. 1, 4-5).

The paper introduces outcome-sampling MCCFR, which samples one terminal
history per iteration, and external-sampling MCCFR, which samples
chance and opponent actions while traversing the current player's
choices (PDF pp. 5-6).

It proves high-probability average-regret bounds for outcome and
external sampling, gives a tighter bound for vanilla CFR, and reports
that sampling variants often converge faster by touched-node count or
wall-clock time despite requiring more iterations (PDF pp. 6-8).

Because the annotation workflow requires an explicit finalization step
before completing the roadmap-decision sections, the final `Relevance
To Gwent AI`, `Risks For Adaptation`, and `AI-Roadmap Decision`
sections remain pending even though this first batch read the full
nine-page local source.

## Paper Claims

- Extensive games model sequential decision-making with imperfect
  information, and recent methods had scaled two-player zero-sum
  extensive-game solving to about 10^12 game states (PDF p. 1).
- CFR exploits the fact that time-averaged play by regret-minimizing
  algorithms converges to a Nash equilibrium, but vanilla CFR traverses
  the whole game tree on each iteration (PDF p. 1).
- The poker-specific chance-sampling variant from the CFR technical
  report reduces per-iteration cost, but its bound is limited to
  poker-like games where chance dominates game size (PDF pp. 1-2).
- The paper defines a general MCCFR framework by sampling blocks of
  terminal histories and weighting sampled counterfactual values by
  the probability that each terminal history is included (PDF p. 4).
- Vanilla CFR is recovered by choosing one block containing all
  terminal histories, and the earlier poker chance-sampling variant is
  recovered by blocking terminal histories by chance-outcome sequence
  (PDF pp. 4-5).
- Lemma 1 states that sampled counterfactual value equals ordinary
  counterfactual value in expectation (PDF p. 5).
- Outcome-sampling MCCFR samples a single terminal history and updates
  only information sets along that sampled history (PDF p. 5).
- Outcome sampling can support online regret minimization when sampled
  play comes from the opponent's strategy, because the update no longer
  requires explicit knowledge of the opponent strategy beyond samples
  of play (PDF p. 5).
- External-sampling MCCFR samples actions of chance and the opponent,
  while traversing player i's own action choices and updating visited
  information sets (PDF p. 6).
- Theorem 4 states that external-sampling MCCFR has a high-probability
  average-overall-regret bound with only a constant-factor iteration
  increase over vanilla CFR (PDF p. 6).
- Theorem 5 states that outcome-sampling MCCFR has a high-probability
  regret bound when terminal histories with nonzero opponent reach
  probability have sampling probability at least a positive delta (PDF
  p. 6).
- For balanced games, external sampling has lower asymptotic
  computation time than vanilla CFR because it traverses a fraction of
  the tree per iteration (PDF p. 6).
- The experiments compare vanilla CFR, pruned vanilla CFR,
  outcome-sampling MCCFR, and external-sampling MCCFR on One-Card
  Poker, Goofspiel, Latent Tic-Tac-Toe, and Princess and Monster (PDF
  p. 7).
- The experiments use exploitability as the approximation-quality
  measure and plot it against touched game-tree nodes, with similar
  qualitative results for wall-clock time (PDF pp. 7-8).
- The MCCFR variants often dramatically outperform vanilla CFR by
  computation measure; in Goofspiel, both MCCFR variants reach
  exploitability below 0.5 after a few million touched nodes, while CFR
  requires about 2.5 billion touched nodes (PDF p. 7).
- External sampling is not uniformly best; outcome sampling performs
  better in Goofspiel, while outcome sampling performs worse than
  vanilla CFR in Latent Tic-Tac-Toe (PDF pp. 7-8).
- The conclusion frames future work around game properties affecting
  convergence, online outcome-sampling MCCFR, and possible extensions
  to imperfect recall as an abstraction mechanism (PDF p. 8).

## Game / Environment Model

- The formal setting is finite extensive games with imperfect
  information: histories, terminal histories, action sets, a player
  function, chance probabilities, information partitions, and terminal
  utilities (PDF p. 2).
- The paper restricts attention to two-player zero-sum extensive games
  and assumes perfect recall (PDF p. 3).
- The experimental domains are One-Card Poker, Goofspiel, Latent
  Tic-Tac-Toe, and Princess and Monster, chosen to vary the degree and
  nature of imperfect information while having roughly similar game
  sizes (PDF p. 7).
- Goofspiel is modeled as a bidding card game with hidden bids; the
  paper's version reveals bid results but not the cards used for bids
  (PDF p. 7).
- Princess and Monster is modeled as pursuit-evasion on a 3 by 3 grid
  with random starting positions, a horizon of 13, and neither player
  observing the other's location (PDF p. 7).
- Latent Tic-Tac-Toe hides each move until after the opponent's next
  move, and moves that are invalid when revealed are lost (PDF p. 7).
- Project inference: Gwent fits the broad sequential imperfect-
  information frame, but the paper's experiments do not include
  deck-construction games, multi-round pass resources, or collectible
  card effects.

## Information Model

- Information sets group game states that a player cannot distinguish,
  and a player must choose actions with the same distribution at every
  state inside one information set (PDF p. 2).
- The formal definition requires histories in the same information set
  to share the same available action set (PDF p. 2).
- The paper assumes perfect recall, meaning a player can distinguish
  states where they previously took different actions or previously
  occupied different information sets (PDF p. 3).
- External sampling stores sampled opponent and chance actions so the
  same sampled action is used at all histories in the same information
  set, preserving information-set consistency during the traversal (PDF
  p. 6).
- Project inference: A Gwent MCCFR experiment would need an explicit
  acting-seat information-state abstraction; the paper does not permit
  exposing opponent hand or deck order as ordinary learner input.

## Action Space

- The formal extensive-game definition assigns an available action set
  `A(h)` after each nonterminal history (PDF p. 2).
- Information-set validity requires histories in the same information
  set to have the same available actions, and a strategy assigns a
  distribution over `A(I)` for each information set (PDF pp. 2-3).
- Outcome sampling uses a sampling profile over actions at information
  sets and requires sufficient exploration so sampled terminal
  histories have positive probability (PDF p. 5).
- The experiments include domains with very different action structures:
  hidden card bidding, poker betting, latent board moves, and pursuit-
  evasion movement (PDF p. 7).
- Project inference: The paper supports variable legal action sets at
  the game-tree level, but it does not define a fixed neural action
  vocabulary, invalid-action mask, or pointer-target schema for card
  game actions.

## Policy / Search / Learning Method

- The method is CFR-family self-play regret minimization for computing
  approximate Nash equilibria in two-player zero-sum extensive games
  (PDF pp. 1, 3).
- Vanilla CFR computes counterfactual values through full game-tree
  traversal, accumulates regret terms per player and information set,
  and derives the next strategies through regret matching (PDF p. 4).
- MCCFR samples a block of terminal histories on each iteration,
  computes sampled immediate counterfactual regrets for information
  sets touching that block, accumulates those regrets, and applies
  regret matching to accumulated regrets (PDF p. 5).
- Outcome sampling samples one terminal history per iteration, performs
  forward and backward traversals over that history, and updates
  sampled counterfactual regrets at the visited information sets (PDF
  p. 5).
- External sampling samples only chance and opponent actions, performs
  a post-order depth-first traversal for each player, and computes
  sampled counterfactual regrets for visited information sets (PDF p.
  6).
- The paper is not a Monte Carlo tree search method, supervised
  imitation method, policy-gradient method, or deep neural learning
  method (PDF pp. 1-8).

## Training Data

- Not applicable as external data: the paper computes approximate
  equilibria by iterative self-play regret minimization, not by
  learning from human gameplay datasets (PDF pp. 1, 7).
- Outcome-sampling MCCFR can use samples of play from the opponent's
  strategy for online regret minimization, rather than requiring an
  explicit opponent-policy model (PDF p. 5).
- The empirical data are generated from the four game models by running
  CFR and MCCFR variants and measuring exploitability over computation
  (PDF pp. 7-8).

## Self-Play Setup

- The paper uses the regret-to-equilibrium result that if both players'
  average overall regret is small in a zero-sum game, then the average
  strategy profile is an approximate equilibrium (PDF p. 3).
- CFR and MCCFR strategies are produced through repeated iterations
  with regret matching, and the average strategies are the approximate
  equilibrium output (PDF pp. 3-5).
- The experiments use outcome-sampling MCCFR, external-sampling MCCFR,
  vanilla CFR, and pruned vanilla CFR to compute approximate
  equilibria in each test game (PDF p. 7).
- Outcome sampling in the experiments uses an epsilon-greedy sampling
  profile with uniform random actions chosen with probability 0.6 and
  current-strategy actions otherwise (PDF p. 7).

## Evaluation Method

- The paper defines epsilon-Nash equilibrium and exploitability for
  two-player zero-sum games as the sum of best-response values against
  each player's strategy (PDF p. 3).
- The experiments plot exploitability of the two-player strategy
  profile against touched game-tree nodes, and the authors state that
  wall-clock-time plots are nearly identical (PDF p. 7).
- Touched nodes are used as an implementation-independent computation
  measure, which directly tests whether lower per-iteration cost
  outweighs extra iterations for sampling variants (PDF p. 7).
- Table 1 reports game sizes, information-set counts, game length,
  M-values, and average wall-clock time per iteration for vanilla CFR,
  outcome sampling, and external sampling (Table 1, PDF p. 7).
- Figure 1 compares convergence for vanilla CFR, pruned vanilla CFR,
  outcome-sampling MCCFR, and external-sampling MCCFR across all four
  games (Fig. 1, PDF p. 8).
- Project inference: Exploitability is a useful evaluation concept for
  reduced Gwent abstractions, but this paper does not provide a full
  Gwent benchmark ladder or full-engine exploitability method.

## Difficulty / Human-Likeness Notes

- Not applicable: the paper targets approximate equilibrium and regret
  minimization rather than controllable difficulty, human-like play, or
  bounded-error models (PDF pp. 1, 7-8).
- The paper's online outcome-sampling discussion concerns unknown
  opponent policies and online regret minimization, not human-like
  style imitation or difficulty tiers (PDF p. 5).

## Compute Requirements

- Vanilla CFR requires complete game-tree traversal on each iteration,
  which prohibits its use in many large games (PDF pp. 1, 4).
- Vanilla CFR stores values at each information set, giving space
  requirement `O(|I|)` (PDF p. 4).
- External sampling requires only a constant-factor increase in
  iterations over vanilla CFR and, for balanced games, has iteration
  cost proportional to a fraction of the tree rather than the whole
  tree (PDF p. 6).
- Table 1 reports average per-iteration times such as Goofspiel at 110
  seconds for vanilla CFR, 150 microseconds for outcome sampling, and
  150 milliseconds for external sampling (Table 1, PDF p. 7).
- Table 1 reports Latent Tic-Tac-Toe at 38 seconds for vanilla CFR, 62
  microseconds for outcome sampling, and 70 milliseconds for external
  sampling (Table 1, PDF p. 7).
- Pruning is described as critical to vanilla CFR practicality in the
  tested domains; for Latent Tic-Tac-Toe the first vanilla CFR
  iteration touches 142 million nodes, while later iterations touch as
  few as 5 million nodes after dominated actions are eliminated (PDF
  p. 8).
- Project inference: A full Gwent MCCFR implementation would still
  need a reduced abstraction or aggressive sampling because the paper's
  practical wins come from large reductions in tree work, not from
  eliminating the need to model the game tree.

## What This Paper Establishes

- MCCFR is a general sample-based CFR family whose sampled
  counterfactual values match ordinary counterfactual values in
  expectation (Lemma 1, PDF p. 5).
- Outcome sampling and external sampling are concrete MCCFR variants
  with high-probability average-regret bounds under their stated
  sampling conditions (Theorems 4-5, PDF p. 6).
- External sampling can give an asymptotic computation-time
  improvement over vanilla CFR in balanced games while preserving a
  constant-factor iteration relationship (PDF p. 6).
- Outcome sampling can be used for online regret minimization when the
  opponent policy is available through samples of play and exploration
  keeps sampling probabilities positive (PDF p. 5).
- Empirically, sampling variants can converge faster by computation
  measure across diverse imperfect-information games, but the best
  sampling variant depends on game properties (PDF pp. 7-8).

## What This Paper Does Not Establish

- It does not provide a Gwent-specific abstraction, information-state
  encoding, legal-action interface, or simulator integration (PDF pp.
  1-8).
- It does not show that full-scale CFR or MCCFR is practical for
  Gwent's complete engine state space (PDF pp. 6-8).
- It does not provide a neural policy architecture, invalid-action
  masking method, fixed action-vector schema, or supervised training
  dataset (PDF pp. 1-8).
- It does not address multiplayer, non-zero-sum, or imperfect-recall
  guarantees as completed results; imperfect recall is identified only
  as a future-work direction (PDF pp. 3, 8).
- It does not establish one universally best sampling scheme; the
  experiments explicitly show external sampling is not uniformly best
  and outcome sampling can underperform vanilla CFR in Latent
  Tic-Tac-Toe (PDF pp. 7-8).
- It does not evaluate collectible card games, deck construction,
  multi-round pass dynamics, or Gwent-like weather/leader/card-effect
  interactions (PDF pp. 7-8).

## Relevance To Gwent AI

- Project inference: This is a training-method and reduced-experiment
  source for Gwent AI, not a direct full-engine implementation
  mandate. The paper supports considering MCCFR only after a finite
  two-player zero-sum, perfect-recall Gwent abstraction is defined, and
  after the project can evaluate exploitability or best-response-style
  quality for that abstraction (PDF pp. 3, 6-8).
- Project inference: External-sampling MCCFR is the most relevant
  offline candidate for a first reduced-Gwent CFR experiment because
  the paper proves a high-probability regret bound with only a
  constant-factor iteration increase and lower per-iteration traversal
  cost in balanced games (PDF p. 6).
- Project inference: Outcome-sampling MCCFR is relevant as a later
  online/adaptive-opponent direction, because the paper says it can use
  samples of opponent play without explicit knowledge of the opponent
  policy, but it requires exploration that keeps sampled terminal
  histories positively probable (PDF p. 5).
- Project inference: The paper reinforces that future Gwent ML exports
  should preserve legal action sets at information states. It models
  strategies as distributions over each information set's available
  actions rather than a single fixed global action vector (PDF pp. 2-3).
- Project inference: The paper's evaluation framing is useful for a
  reduced abstraction benchmark: report exploitability when computable,
  touched nodes, and wall-clock time, and compare against vanilla or
  pruned CFR before claiming a sampling method is better (PDF pp. 7-8).

## Risks For Adaptation

- Project inference: Full-engine Gwent MCCFR would be misleading as a
  near-term promise. The paper's guarantees are stated for finite
  two-player zero-sum perfect-recall extensive games, while its
  experiments use smaller abstract games rather than collectible card
  games with deck construction, leaders, weather, and many card effects
  (PDF pp. 3, 7-8).
- Project inference: Any Gwent abstraction must preserve hidden
  information correctly. The paper's information-set model requires
  indistinguishable histories to share the same action distribution,
  and external sampling preserves sampled opponent/chance choices
  consistently across histories in an information set (PDF pp. 2, 6).
- Project inference: Reduced-game exploitability must not be reported
  as full-engine exploitability. The paper measures exploitability for
  the game model being solved; it does not provide a method for
  proving full Gwent robustness from a smaller abstraction (PDF pp. 3,
  7-8).
- Project inference: The sampling choice is an empirical risk.
  External sampling is not universally best, and outcome sampling
  performs worse than vanilla CFR in Latent Tic-Tac-Toe in the paper's
  experiments, so a Gwent experiment needs method comparison rather
  than a single preselected sampler (PDF pp. 7-8).
- Project inference: Outcome sampling can be biased or high-variance if
  exploration is too weak. The paper's bound depends on positive
  sampling probability for reachable terminal histories, and the
  experiments use an epsilon-greedy sampler rather than pure current
  strategy sampling (PDF pp. 5, 7).
- Project inference: The paper does not solve neural action masking,
  pointer-style target selection, or policy tensorization. Those should
  remain grounded in the invalid-action-masking and legal-action
  interface annotations, not inferred from MCCFR alone (PDF pp. 1-8).

## AI-Roadmap Decision

1. **Source category:** Training-method source for CFR-family reduced
   experiments, plus benchmark-methodology support for exploitability,
   touched-node, and wall-clock comparisons. It is not a direct
   full-engine Gwent implementation source (PDF pp. 6-8).
2. **Game class:** Applies to finite two-player zero-sum
   imperfect-information extensive games with perfect recall. It can
   apply to hidden-card games only after those games are encoded as
   information sets with legal actions shared inside each set (PDF pp.
   2-3).
3. **Method family:** CFR / MCCFR self-play regret minimization. The
   concrete variants to preserve are outcome sampling and external
   sampling, with vanilla or pruned CFR as comparison baselines (PDF pp.
   4-8).
4. **Action space:** Supports variable legal action sets at the
   extensive-game information-set level. It does not define a fixed
   action vocabulary, neural mask, or card-target pointer schema (PDF
   pp. 2-3).
5. **Evaluation methodology:** Use exploitability where computable,
   touched-node counts, wall-clock time, and convergence curves for the
   solved abstraction. Do not use this paper alone as the full Gwent
   evaluation ladder (PDF pp. 3, 7-8).
6. **Agent scope:** Project inference: MCCFR could support either
   global deck-conditioned agents or faction specialists, but only if
   deck/faction configuration is part of the abstraction's public and
   private information-state definition. The paper itself does not
   discuss deck conditioning or faction specialization (PDF pp. 1-8).
7. **Smallest faithful experiment:** Project inference: Build a tiny
   fixed-deck reduced-Gwent extensive game with explicit hidden hand or
   deck uncertainty, shared legal actions per information set, and a
   terminal zero-sum utility. Compare vanilla/pruned CFR,
   external-sampling MCCFR, and outcome-sampling MCCFR using
   exploitability or exact best responses if tractable, touched nodes,
   and wall-clock time (PDF pp. 3, 5-8).
8. **Adaptation risk:** Project inference: The experiment becomes
   misleading if it exposes opponent hidden cards, collapses
   information sets in a way that violates perfect recall, reports
   reduced-game exploitability as full-engine robustness, chooses one
   sampler without comparison, or ignores positive-probability
   exploration requirements for outcome sampling (PDF pp. 2-8).
9. **Roadmap effect:** This should affect the long-term ML roadmap and
   a later Cluster F reduced-equilibrium experiment, not the immediate
   product AI. The next implementation-adjacent spec should still
   prioritize evaluation-ladder synthesis and hidden-info-safe
   baselines before promising MCCFR in the full Gwent engine (PDF pp.
   6-8).
