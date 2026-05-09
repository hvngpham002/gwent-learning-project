---
citekey: zinkevich2007regret
title: "Regret Minimization in Games with Incomplete Information"
authors:
  - "Martin Zinkevich"
  - "Michael Johanson"
  - "Michael Bowling"
  - "Carmelo Piccione"
year: 2007
venue: "Advances in Neural Information Processing Systems 20"
doi:
arxiv:
project_relevance: training-method
method_family: cfr
information_model: imperfect
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/zinkevich2007regret/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/zinkevich2007regret/source.pdf"
pages_read: "1-8"
status: "complete"
---

## Summary

This first batch covers the full local PDF for Zinkevich, Johanson,
Bowling, and Piccione, "Regret Minimization in Games with Incomplete
Information," published in Advances in Neural Information Processing
Systems 20 (PDF pp. 1-8).

The paper introduces counterfactual regret for finite zero-sum
extensive games with imperfect information and perfect recall. It
shows that minimizing immediate counterfactual regret at information
sets bounds overall regret, and therefore self-play between regret
minimizers can compute approximate Nash equilibria (PDF pp. 2-4).

The paper demonstrates the method on abstract heads-up limit Texas
Hold'em, including an abstraction with approximately 1.65 x 10^12 game
states and 5.73 x 10^7 information sets, and reports lower
exploitability and stronger head-to-head performance as poker
abstractions grow larger (PDF pp. 5-8).

After explicit finalization permission, the final `Relevance To Gwent
AI`, `Risks For Adaptation`, and `AI-Roadmap Decision` sections are now
complete.

## Paper Claims

- Extensive games model sequential multiagent decision-making with
  imperfect information, and even two-player limit Texas Hold'em has
  just under 10^18 game states (PDF p. 1).
- Traditional large extensive-game solving used linear programming
  over realization plans, plus abstraction and subgame decomposition
  to make poker-sized games tractable (PDF p. 1).
- The paper proposes counterfactual regret minimization as an
  iterative technique for finding approximate solutions to large
  extensive games (PDF pp. 1-2).
- In an extensive game, an information set groups histories that a
  player cannot distinguish, forcing the same action distribution over
  all histories in that set (PDF p. 2).
- The paper focuses on finite, zero-sum extensive games with perfect
  recall (PDF p. 2).
- A strategy assigns an action distribution to every information set
  for a player, and a strategy profile combines one strategy per player
  (PDF pp. 2-3).
- The paper defines average overall regret over repeated play and the
  average strategy over iterations using reach probabilities for each
  information set (PDF p. 3).
- Theorem 2 states that in a zero-sum game, if both players' average
  overall regret is less than epsilon at time T, then the average
  strategy profile is a 2-epsilon equilibrium (PDF p. 3).
- The paper defines counterfactual utility for an information set as
  expected utility conditioned on reaching that information set while
  excluding player i's own contribution to the probability of reaching
  it (PDF p. 4).
- Immediate counterfactual regret measures regret over choices at a
  single information set, weighted by the counterfactual probability
  that other players and chance reach that information set (PDF p. 4).
- Theorem 3 states that overall regret is bounded by the sum of the
  positive immediate counterfactual regrets over player i's information
  sets (PDF p. 4).
- The paper uses regret matching at each information set: actions are
  selected in proportion to positive counterfactual regret, and a
  uniform distribution is used when no action has positive regret (Eq.
  8, PDF p. 4).
- Theorem 4 gives a regret bound for the information-set regret
  matching procedure and states that the strategy in Equation 8 can be
  used in self-play to compute a Nash equilibrium (PDF p. 4).
- The poker application solves abstracted heads-up limit Texas Hold'em
  by merging information sets through card-sequence buckets rather than
  solving the full game directly (PDF p. 5).
- The paper's ten-bucket abstraction has about 1.65 x 10^12 game
  states and 5.73 x 10^7 information sets, compared with about 9.17 x
  10^17 game states and 3.19 x 10^14 information sets in full poker
  (PDF p. 5).
- The poker procedure stores regret values for every information set
  and action, repeatedly plays the abstract game, and returns the
  average strategies as the approximate equilibrium (PDF p. 5).
- The experimental variant samples deterministic chance actions each
  iteration, making only the information sets reachable under that
  sampled chance strategy require regret updates (PDF p. 6).
- The sampled poker variant ran at about 750 iterations per second on a
  single 2.4 GHz Opteron core and about 1700 iterations per second with
  a straightforward four-processor parallelization (PDF p. 6).
- The paper evaluates poker strategies using exploitability inside the
  abstract game and head-to-head matches in full Texas Hold'em against
  known strong programs (PDF p. 6).
- The ten-bucket strategy was run for two billion iterations, taking
  less than 14 days with four CPUs, and had 2.2 mb/h exploitability
  inside its abstract game (PDF p. 6).
- Smaller abstractions converged to similar exploitability levels with
  fewer iterations, and the convergence curves nearly coincide when
  iteration count is normalized by information-set count (PDF p. 7).
- In full Texas Hold'em head-to-head tests, strategies from larger
  abstractions consistently outperformed smaller abstractions and
  exploited weaker bots by larger margins (Table 1, PDF pp. 7-8).
- CFR8 beat all bankroll-division bots from the 2006 AAAI Computer
  Poker Competition by larger margins than the previously published
  S2298 strategy (Table 2, PDF p. 8).
- The conclusion claims the technique computes approximate equilibria
  for abstractions with as many as 10^12 states and produces a poker
  program that outperforms other strong programs tested (PDF p. 8).

## Game / Environment Model

- The formal model is a finite extensive game with histories, terminal
  histories, action sets, a player function, chance probabilities,
  information partitions, and player utility functions (PDF p. 2).
- The paper specifically narrows its theoretical focus to finite,
  two-player zero-sum extensive games with perfect recall (PDF p. 2).
- The domain demonstration is heads-up limit Texas Hold'em, modeled as
  a two-player zero-sum poker game with four card-dealing rounds and
  four betting rounds (PDF p. 5).
- The poker domain is not solved at full scale; the paper solves card
  abstractions that merge information sets by bucketed observed card
  sequences (PDF p. 5).
- Project inference: Gwent is also sequential and imperfect
  information, but this paper's empirical environment is poker and its
  theoretical guarantee is stated for finite zero-sum perfect-recall
  extensive games, so any Gwent transfer needs a project-specific game
  abstraction and evaluation harness.

## Information Model

- Imperfect information is represented through information sets:
  histories in one information set are indistinguishable to the acting
  player and must share one action distribution (PDF p. 2).
- The example information-set explanation uses poker deals where a
  player knows their own cards but not the opponent's private cards
  (PDF p. 2).
- The theoretical setup assumes perfect recall, meaning players do not
  forget their own past actions and information-set observations (PDF
  p. 2).
- Counterfactual regret relies on separating player i's reach
  probability from the reach probability contributed by chance and
  other players (PDF pp. 3-4).
- Project inference: This supports hidden-information-safe learning
  language for Gwent only if observations are organized as acting-seat
  information sets; it does not license exposing opponent hand or deck
  order to a learner.

## Action Space

- The formal model allows each nonterminal history to have its own
  available action set `A(h)`, with information-set validity requiring
  histories in the same information set to share the same available
  actions (PDF p. 2).
- A strategy assigns a distribution over the actions available at each
  information set, not over a single fixed global action vector (PDF
  pp. 2-3).
- In the poker application, actions are betting actions inside heads-up
  limit Texas Hold'em, while the card abstraction changes information
  sets rather than the betting structure (PDF p. 5).
- Project inference: The formal model fits variable legal action sets
  better than a naive fixed-vector ML policy, but the paper does not
  discuss neural action masking or pointer-style card targets.

## Policy / Search / Learning Method

- The method is regret minimization over repeated self-play in
  extensive games, using average strategies as the approximate
  equilibrium output (PDF p. 3).
- Counterfactual regret decomposes overall regret into information-set
  regrets that can be minimized independently through regret matching
  (PDF p. 4).
- The update rule chooses each action in proportion to its positive
  counterfactual regret and chooses uniformly when every action has no
  positive regret (Eq. 8, PDF p. 4).
- The poker implementation repeatedly plays the abstract game, updates
  regret values for information set/action pairs, and returns the
  average strategy profile after T iterations (PDF p. 5).
- The poker variant samples chance actions to reduce per-iteration work
  while updating only the reachable information sets for that sampled
  chance outcome (PDF p. 6).
- The paper is a solver-style equilibrium method, not a heuristic
  search policy, supervised imitation method, or reinforcement-learning
  value-function method (PDF pp. 3-6).

## Training Data

- Not applicable as external data: the paper does not train from human
  gameplay datasets; it iterates self-play in an abstract extensive
  game (PDF pp. 3, 5).
- The poker abstraction itself depends on enumerated or sampled game
  structure, card-sequence buckets, and repeated self-play iterations
  (PDF pp. 5-6).
- The sampled variant uses deterministic chance samples per iteration,
  such as a joint bucket sequence for the two players in the poker
  abstraction (PDF p. 6).

## Self-Play Setup

- Theorem 2 connects low average overall regret for both players to an
  approximate equilibrium in zero-sum games (PDF p. 3).
- The paper states that regret-minimizing algorithms in self-play can
  compute approximate Nash equilibria, with regret bounds controlling
  the approximation's convergence rate (PDF p. 3).
- The poker application has two regret-minimizing players repeatedly
  play the abstract game, then returns the average strategies as the
  approximate equilibrium (PDF p. 5).
- The experiment for the largest abstraction runs two billion
  iterations, and the smaller-abstraction comparisons use up to 750
  million iterations depending on abstraction size (Fig. 1a, PDF p. 7).

## Evaluation Method

- The paper identifies exploitability, or performance against a
  worst-case opponent, as a natural measure for a near-equilibrium
  poker strategy (PDF p. 6).
- It notes that full-game exploitability is generally intractable, so
  exploitability inside the strategy's own abstraction evaluates the
  equilibrium computation but does not guarantee safety against
  strategies outside that abstraction (PDF p. 6).
- It also uses head-to-head full Texas Hold'em matches against known
  strong poker programs as practical strength evidence, while noting
  that positive expected value is not transitive (PDF p. 6).
- Table 1 reports cross-play results among PsOpti4, S2298, and CFR
  strategies with 5, 6, 8, and 10 buckets, using duplicate-match hand
  counts and significance notes (Table 1, PDF p. 8).
- Table 2 compares CFR8 and S2298 against 2006 AAAI Computer Poker
  Competition bankroll-division bots (Table 2, PDF p. 8).
- Project inference: The explicit warning about abstraction-local
  exploitability is important for Gwent; a reduced-game CFR result
  would not prove robustness in the full engine unless backed by a
  separate evaluation ladder.

## Difficulty / Human-Likeness Notes

- Not applicable: the paper targets approximate Nash equilibrium and
  low exploitability, not controllable difficulty or human-like error
  modeling (PDF pp. 3, 6).
- The head-to-head bot comparisons are used as strength benchmarks, not
  as a model of human-like play (PDF pp. 6-8).

## Compute Requirements

- The largest reported poker abstraction has approximately 1.65 x 10^12
  game states and 5.73 x 10^7 information sets (PDF p. 5).
- The basic procedure requires storing regret values for every
  information set and action (PDF p. 5).
- The sampled variant reduces each iteration to 18,496 reachable states
  and 6,378 reachable information sets after sampling a joint bucket
  sequence (PDF p. 6).
- The sampled implementation runs about 750 iterations per second on a
  single 2.4 GHz Opteron core and about 1700 iterations per second with
  four processors (PDF p. 6).
- The ten-bucket abstraction used two billion iterations and less than
  14 days of four-CPU computation, while the five-bucket abstraction
  used 100 million iterations and 33 hours without parallelization
  (PDF pp. 6-7).
- Project inference: Full-engine Gwent CFR is unlikely to be the first
  small-compute implementation target, but reduced abstractions could
  become useful for benchmarking or exploitability probes.

## What This Paper Establishes

- Counterfactual regret is an information-set-local regret concept for
  imperfect-information extensive games (PDF p. 4).
- Overall regret can be bounded by the sum of positive immediate
  counterfactual regrets over a player's information sets (Theorem 3,
  PDF p. 4).
- Regret matching over immediate counterfactual regret has a bound that
  supports computing Nash equilibria through self-play in the stated
  zero-sum extensive-game setting (Theorem 4, PDF p. 4).
- The paper provides exploitability as a core evaluation concept for
  equilibrium-style poker strategies and distinguishes abstraction-local
  exploitability from full-game robustness (PDF p. 6).
- The poker experiments show CFR-style solving can scale to substantially
  larger poker abstractions than previous reported approaches and that
  larger abstractions produced stronger tested poker programs (PDF
  pp. 6-8).

## What This Paper Does Not Establish

- It does not solve full heads-up limit Texas Hold'em; it solves
  abstract games formed by merging information sets through card
  buckets (PDF p. 5).
- It does not prove that low exploitability inside an abstraction means
  low exploitability in the full game (PDF p. 6).
- It does not address non-zero-sum, multiplayer, or imperfect-recall
  settings; the theoretical focus is finite zero-sum games with perfect
  recall (PDF p. 2).
- It does not provide a neural policy architecture, fixed action-vector
  schema, invalid-action masking method, or supervised training
  dataset (PDF pp. 3-6).
- It does not evaluate collectible card games, deck construction,
  multi-round pass-as-resource games, or Gwent-like hidden-card
  mechanics (PDF pp. 5-8).

## Relevance To Gwent AI

- **CFR vocabulary foundation:** The paper gives the project precise
  language for extensive games, information sets, perfect recall,
  average regret, average strategy, approximate equilibrium,
  counterfactual utility, and counterfactual regret (PDF pp. 2-4).
- **Self-play convergence boundary:** The useful claim for Gwent is
  narrow: regret-minimizing algorithms in self-play can compute
  approximate Nash equilibria in the stated zero-sum setting, with
  convergence tied to regret bounds rather than generic "self-play gets
  good" intuition (PDF pp. 3-4).
- **Exploitability framing:** The paper's evaluation discussion makes
  exploitability a relevant robustness concept, while also warning that
  exploitability inside an abstraction does not imply unexploitable play
  in the full game (PDF p. 6).
- **Legal-action-first compatibility:** The formal model assigns
  actions per history/information set rather than requiring one fixed
  global action vector, which matches the project's legal-move-first
  engine boundary better than a naive fixed-output policy (PDF pp. 2-3).
- **Reduced-game benchmark candidate:** Project inference: the smallest
  credible Gwent use is not full-engine CFR. It is a reduced
  perfect-recall, hidden-card Gwent abstraction where information sets
  and legal actions are explicit enough to run tabular CFR and measure
  abstraction-local exploitability.
- **Not a product AI path by itself:** Project inference: this paper
  should inform benchmark language and reduced solver experiments, but
  it does not replace the current practical search-baseline track for
  playable full-engine Gwent.

## Risks For Adaptation

- **Convergence overclaim:** The paper's equilibrium connection depends
  on regret minimization in a finite zero-sum perfect-recall extensive
  game, not arbitrary neural self-play, heuristic self-play, or
  full-engine agents without a clean information-set model (PDF
  pp. 2-4).
- **Abstraction mismatch:** The empirical success is in bucketed heads-
  up limit Texas Hold'em abstractions, not in full poker and not in a
  collectible/deck-construction card game with Gwent's pass, round, row,
  weather, leader, and deck-specific mechanics (PDF pp. 5-8).
- **Abstraction-local exploitability:** The paper explicitly cautions
  that exploitability inside an abstract game evaluates the equilibrium
  computation but does not prove robustness against strategies outside
  that abstraction (PDF p. 6).
- **Compute and storage pressure:** The poker procedure stores regret
  values for every information set/action pair and reports multi-day
  computation even with sampling and four processors, so a direct
  full-engine Gwent CFR attempt would likely be misleading before a
  reduced-game abstraction is defined (PDF pp. 5-7).
- **Hidden-information leakage:** Project inference: a Gwent CFR
  experiment must define acting-seat information sets and legal actions
  from observations, not use true opponent hand/deck identities as if
  they were available policy inputs.
- **Action-interface gap:** The paper's formal action sets support
  variable legal actions, but it does not specify neural action masks,
  card-pointer actions, or the project's eventual sim-export action
  encoding (PDF pp. 2-3).

## AI-Roadmap Decision

1. **Source category:** Training-method foundation and benchmark-
   methodology source. It is not a direct full-engine implementation
   candidate for near-term playable Gwent AI (PDF pp. 3-8).
2. **Game class:** Finite zero-sum extensive games with imperfect
   information and perfect recall; the empirical domain is abstracted
   heads-up limit Texas Hold'em (PDF pp. 2, 5).
3. **Method family:** CFR / regret minimization in self-play using
   average strategies. It is not MCTS/ISMCTS, supervised learning,
   policy-gradient RL, NFSP, or Deep CFR (PDF pp. 3-5).
4. **Action space:** Supports per-information-set legal action sets
   through `A(h)` / `A(I)`. It does not provide a fixed-vector neural
   action schema or invalid-action-masking implementation (PDF
   pp. 2-3).
5. **Evaluation methodology:** Provides exploitability and
   abstraction-local exploitability as core evaluation concepts, plus
   practical head-to-head comparison against known agents with
   significance reporting (PDF pp. 6-8).
6. **Agent scope:** Supports solving an explicit game abstraction. It
   does not establish global deck-conditioned Gwent agents, faction
   specialists, or a product policy for arbitrary decks (PDF pp. 5-8).
7. **Smallest faithful experiment:** Project inference: define a small
   two-player zero-sum Gwent abstraction with explicit hidden-card
   information sets, legal actions, terminal utilities, and perfect
   recall; run tabular CFR/regret matching; report abstraction-local
   exploitability and compare against random/legal-heuristic baselines.
8. **Adaptation risk:** Project inference: adaptation becomes
   misleading if it leaks hidden cards, claims full-game robustness from
   abstraction-local exploitability, ignores compute/storage cost,
   treats non-CFR self-play as covered by the theorem, or evaluates only
   against weak fixed opponents.
9. **Roadmap effect:** This source should ground CFR terminology,
   self-play-convergence limits, and reduced-game exploitability
   experiments in future Cluster F specs. It should not trigger
   immediate neural training or a full-engine CFR implementation without
   MCCFR, invalid-action-masking, and evaluation-ladder annotations.
