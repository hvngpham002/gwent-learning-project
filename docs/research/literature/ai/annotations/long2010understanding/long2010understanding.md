---
citekey: long2010understanding
title: "Understanding the Success of Perfect Information Monte Carlo Sampling in Game Tree Search"
authors:
  - "Jeffrey Long"
  - "Nathan R. Sturtevant"
  - "Michael Buro"
  - "Timothy Furtak"
year: 2010
venue: "Proceedings of the Twenty-Fourth AAAI Conference on Artificial Intelligence"
doi:
arxiv:
project_relevance: direct-implementation
method_family: search
information_model: hidden-card
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/long2010understanding/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/long2010understanding/source.pdf"
pages_read: "1-7"
status: "complete"
---

## Summary

This first batch covers the full local PDF for Long, Sturtevant, Buro,
and Furtak, "Understanding the Success of Perfect Information Monte
Carlo Sampling in Game Tree Search," from AAAI-10 (PDF pp. 1-7;
article pp. 134-140).

The paper studies why Perfect Information Monte Carlo (PIMC) search can
perform well in some imperfect-information games despite known
theoretical defects such as strategy fusion and non-locality (PDF
pp. 1-2; article pp. 134-135). Its main contribution is a set of
measurable game-tree properties - leaf correlation, bias, and
disambiguation factor - that the authors use to predict when PIMC is
likely to be useful or weak (PDF pp. 3-4; article pp. 136-137).

The paper's empirical contrast is valuable for this project: Skat and
Hearts occupy a high-correlation, medium-disambiguation region where
PIMC appears relatively strong, while Kuhn poker has no
disambiguation, medium correlation, and medium bias, where PIMC gives
little improvement and is exploitable by a best-response opponent (PDF
pp. 6-7; article pp. 139-140).

After explicit finalization permission, the annotation is complete.
For Gwent AI, the paper is best used as a determinization-caution and
measurement-design source: it supports testing whether Gwent positions
look more like high-revelation trick-card domains or low-revelation
poker-like domains before relying on PIMC-style search (PDF pp. 3-7;
article pp. 136-140).

## Paper Claims

- PIMC samples fully specified perfect-information worlds from an
  imperfect-information game and then solves or searches those worlds
  exactly or heuristically instead of solving the full imperfect-
  information game (PDF p. 1; article p. 134).
- PIMC had produced expert-caliber players in Bridge and Skat and
  strong play in Hearts, while still being criticized as "averaging
  over clairvoyancy" because it avoids the core imperfect-information
  issue (PDF p. 1; article p. 134).
- The paper claims two contributions: using synthetic game trees to
  identify properties where PIMC is strong or weak compared with an
  optimal player, and showing how those properties can be detected in
  real games (PDF p. 1; article p. 134).
- Frank and Basin's critique identifies strategy fusion and
  non-locality as PIMC errors that persist regardless of the number of
  hypothetical worlds examined (PDF p. 2; article p. 135).
- Strategy fusion occurs when PIMC treats indistinguishable states as
  if different strategies could be chosen in each one, while the real
  imperfect-information player must choose one strategy for the entire
  information set (PDF p. 2; article p. 135).
- The authors state that strategy fusion causes an actual move error
  when there are anti-correlated move values in one part of the tree
  and another move that is guaranteed better elsewhere (PDF p. 2;
  article p. 135).
- Non-locality occurs because an imperfect-information node's value may
  depend on regions outside its subtree, especially when the opponent
  can steer play toward favorable regions using private information
  (PDF p. 2; article p. 135).
- The paper contrasts trick-based card games, where playing a card
  reveals information and may split information sets, with poker,
  where actions such as betting do not directly reveal private card
  information (PDF pp. 2-3; article pp. 135-136).
- The authors argue that full CFR-style solving is infeasible for
  large trick-card games because even single-player hand counts and
  early trick branching are enormous, using Bridge and Skat hand-count
  calculations as examples (PDF p. 3; article p. 136).
- In Skat endgames with three tricks left, approximately 15% of games
  were unresolved in the authors' server-game sample, and PIMC mistakes
  against CFR cost about 0.42 tournament points per deal over 3,000
  unresolved games (PDF p. 3; article p. 136).
- The authors caution that CFR is not guaranteed to produce optimal
  solutions in multi-player games such as Skat, although it often
  seemed to do so for the small games considered in the paper (PDF
  p. 3; article p. 136).
- The authors define three low-level properties that probabilistically
  give rise to PIMC problems: leaf correlation, bias, and
  disambiguation factor (PDF pp. 3-4; article pp. 136-137).
- Synthetic-tree experiments show PIMC is worst when leaf correlation
  is low, because anti-correlation near the leaves can make PIMC
  believe critical decisions will happen later even when earlier moves
  matter under the information-set structure (PDF p. 5; article
  p. 138).
- Synthetic-tree experiments show low disambiguation can make random
  play relatively good because uncertainty leaves less room for an
  optimal player to improve, while increasing disambiguation hurts
  random play faster than PIMC and near-perfect disambiguation makes
  the game close to perfect information (PDF p. 5; article p. 138).
- In measured Skat and Hearts samples, correlation is high, roughly
  0.8 to nearly 1.0, while disambiguation is close to 0.6 (PDF p. 6;
  article p. 139).
- Mapping Skat to the synthetic parameter space predicts PIMC loses
  only about 0.1 points per game against equilibrium and gains about
  0.4 points over random play, matching the authors' motivating
  evidence that PIMC works well in those games (PDF p. 6; article
  p. 139).
- Kuhn poker has disambiguation factor 0 because cards are not revealed
  until the end, and its correlation and bias are each 0.5 under the
  authors' pre-terminal-node measure (PDF p. 7; article p. 140).
- Against a best-response opponent in Kuhn poker, PIMC loses
  substantially as player 2, so the paper says PIMC is not a good
  practical approach for poker even though it beats random play and is
  less exploitable than random (PDF p. 7; article p. 140).
- The conclusion states that the three synthetic-tree properties seem
  to predict PIMC performance and can be measured in real games (PDF
  p. 7; article p. 140).
- The conclusion also identifies unresolved issues: PIMC may perform
  worse against opponents that deliberately exploit it, the measured
  real games sit at extremes of the synthetic parameter space, and
  hand-by-hand parameter analysis might guide technique selection in
  games like Skat (PDF p. 7; article p. 140).

## Game / Environment Model

- The paper targets imperfect-information games too large for exact
  solution, especially games where a practical agent samples possible
  perfect-information worlds and searches those worlds (PDF p. 1;
  article p. 134).
- The synthetic model is a two-player, zero-sum, stochastic
  imperfect-information game with alternating moves, a root chance node,
  binary player nodes, and terminal payoffs restricted to 1 or -1 (PDF
  p. 4; article p. 137).
- The synthetic model uses `W` worlds per player and a root chance node
  of degree `W^2`; each player's information is initially disjoint so
  each world for player 1 leaves `W` indistinguishable worlds for
  player 2 (PDF p. 4; article p. 137).
- The real-game measurements focus on Skat, Hearts, and Kuhn poker,
  with Skat game types separated into suit, grand, and null games (PDF
  pp. 6-7; article pp. 139-140).
- Skat's initial auction determines the game type; the auction winner
  becomes the soloist and plays against the other two players as a
  temporary coalition (PDF p. 6; article p. 139).
- Kuhn poker is modeled as a two-player three-card poker game with
  ante, check/raise/fold/call decisions, and known Nash-optimal
  strategies (PDF p. 7; article p. 140).

## Information Model

- In PIMC, the agent samples hypothetical perfect-information worlds
  from the current imperfect-information game rather than representing
  the full information-set game directly (PDF p. 1; article p. 134).
- Trick-based card-game actions reveal a played card, which can split
  information sets and reduce uncertainty as play proceeds (PDF p. 2;
  article p. 135).
- Poker actions do not directly reveal private card information, so
  the number of true game states inside an information set does not
  shrink with player actions in the way it does in trick-taking games
  (PDF pp. 2-3; article pp. 135-136).
- Disambiguation factor measures how quickly a player's information set
  shrinks with depth; the paper uses trick-taking games as a high-
  disambiguation example and poker as a no-direct-reveal example (PDF
  p. 3; article p. 136).
- In synthetic trees, disambiguation factor `df = 0` means a player
  never gains direct knowledge of the opponent's private information,
  while `df = 1` collapses the game immediately to perfect information
  because all information sets become singletons (PDF p. 4; article
  p. 137).
- Kuhn poker has disambiguation factor 0 because the private card is
  not revealed before the end and the information-set size is never
  decreased (PDF p. 7; article p. 140).

## Action Space

- Trick-based card games use card-play actions, where a player plays a
  card from hand to the table face up (PDF p. 2; article p. 135).
- The paper notes that Western 52-card trick games allow up to 52
  possible actions at a node and short-deck European games allow up to
  32 possible actions at a state (PDF p. 2; article p. 135).
- Poker is treated as a limited-action domain, with common actions such
  as bet, raise, call, and fold (PDF p. 2; article p. 135).
- In the synthetic-tree model, each player node has degree 2 so the
  action space is deliberately simplified for isolating the three
  measured properties (PDF p. 4; article p. 137).
- The Skat lower-bound argument says the trick leader can choose any
  remaining card at the start of each trick, contributing to at least
  `10!H` information sets under the paper's loose lower bound (PDF
  p. 3; article p. 136).

## Policy / Search / Learning Method

- PIMC samples possible perfect-information worlds and searches or
  solves those worlds, instead of building an imperfect-information
  equilibrium strategy directly (PDF p. 1; article p. 134).
- The paper compares PIMC and uniform random play against an optimal
  Nash-equilibrium player produced using CFR in synthetic games (PDF
  p. 4; article p. 137).
- Synthetic experiments hold tree depth at 8, use 8 worlds per player
  for a chance-node size of 64, generate 10,000 synthetic trees per
  parameter triple, and play two games per tree with sides swapped (PDF
  p. 4; article p. 137).
- The paper measures real-game properties by random playouts to
  terminal nodes, estimating local leaf correlation and bias near
  leaves and comparing information-set size changes to estimate
  disambiguation factor (PDF p. 4; article p. 137).
- The paper does not propose a new PIMC algorithm; it proposes a way to
  predict whether PIMC is likely to work well in a game by measuring
  game-tree properties (PDF pp. 1, 7; article pp. 134, 140).

## Training Data

- Not applicable as a training dataset paper: the experiments use
  synthetic tree generation, random rollouts, and sampled human-bid
  Skat games for measurement rather than supervised or reinforcement
  learning data (PDF pp. 4, 6; article pp. 137, 139).
- The Skat real-game measurement uses 10,000 human-bid games per Skat
  type, 1,000 correlation/bias measurements per game near leaves, and
  10 disambiguation rollouts per world (PDF p. 6; article p. 139).
- The Hearts measurement uses 3,000 games with 500 sample points per
  game (PDF p. 6; article p. 139).

## Self-Play Setup

- Not applicable as a self-play training paper: the paper compares
  PIMC, random, Nash-equilibrium, CFR-derived, and best-response
  opponents for analysis rather than iteratively training agents
  through self-play (PDF pp. 4, 7; article pp. 137, 140).
- The synthetic-game evaluation pits PIMC or random play against a Nash
  equilibrium generated with CFR, then evaluates average score rather
  than learning over repeated self-play (PDF p. 4; article p. 137).
- The Kuhn poker evaluation compares random and PIMC against Nash and
  best-response opponents rather than using self-play to improve PIMC
  (PDF p. 7; article p. 140).

## Evaluation Method

- Synthetic-tree playing strength is measured as average score per
  game, with 1 point for a win and -1 for a loss (PDF p. 4; article
  p. 137).
- Figures 3 and 4 visualize challenger loss against equilibrium for
  PIMC and random play; Figure 5 visualizes PIMC's gain over random
  play against equilibrium (PDF p. 5; article p. 138).
- Real-game Skat correlation and bias are measured near leaves by
  walking randomly down the tree, avoiding immediate terminal moves
  after collapsing chains of one legal move, and treating pre-terminal
  node values with respect to the soloist (PDF p. 6; article p. 139).
- Skat disambiguation is measured by comparing possible-world counts
  since the current player's previous move (PDF p. 6; article p. 139).
- Kuhn poker results report average payoffs for random and PIMC as
  player 1 and player 2 against Nash and best-response opponents (PDF
  p. 7; article p. 140).
- The conclusion says future work should examine exploitability against
  opponents that model PIMC's mistakes, not only performance against a
  Nash equilibrium (PDF p. 7; article p. 140).

## Difficulty / Human-Likeness Notes

- The paper uses human strength only as background motivation, noting
  GIB's Bridge strength as roughly expert-equivalent and PIMC's
  practical success in Bridge, Skat, and Hearts (PDF p. 1; article
  p. 134).
- The paper does not propose human-like difficulty tiers, bounded human
  error models, or controllable difficulty methods (PDF pp. 1-7;
  article pp. 134-140).
- Project inference: For Gwent difficulty design, this paper is more
  useful as a warning about when determinized search may look strong or
  brittle than as a source for making agents human-like.

## Compute Requirements

- The paper frames exact Nash-equilibrium solution as computationally
  infeasible except in simple games, which motivates approximate
  methods such as PIMC and CFR abstractions (PDF p. 1; article p. 134).
- The paper states CFR for poker had scaled by 2010 to game trees from
  `10^7` to `10^12` states and describes CFR as using space
  proportional to information sets and time `O(I^2 N)` for `I`
  information sets and `N` game states (PDF p. 3; article p. 136).
- The Bridge hand-count example gives about `6.35 x 10^11` possible
  hands per player for a 52-card, 13-card hand, before opponent hands
  or play lines are included (PDF p. 3; article p. 136).
- The Skat lower-bound example gives `364,512,240` hands for one
  player, `42,678,636` possible other-player hands in a starting
  information set, and at least about `1.54 x 10^14` information sets
  once opening trick leaders' card choices are counted (PDF p. 3;
  article p. 136).
- The synthetic-tree experiments are small enough to generate 10,000
  trees per parameter triple at depth 8 with a root chance-node size of
  64 (PDF p. 4; article p. 137).

## What This Paper Establishes

- PIMC failure is not explained simply by the existence of strategy
  fusion or non-locality; the authors argue that low-level measurable
  tree properties can help predict whether those pathologies produce
  practical move-selection errors (PDF pp. 2-4; article pp. 135-137).
- Leaf correlation, bias, and disambiguation factor are concrete
  measurable properties that can be estimated in real games through
  rollouts and information-set-size changes (PDF pp. 3-4; article
  pp. 136-137).
- Low leaf correlation is a major danger region for PIMC in the
  synthetic experiments because it increases late anti-correlation and
  makes PIMC undervalue early information-set commitments (PDF p. 5;
  article p. 138).
- Trick-taking games with high correlation and moderate information
  revelation, such as the measured Skat and Hearts samples, are
  presented as plausible PIMC-friendly domains (PDF p. 6; article
  p. 139).
- Poker-like domains with no disambiguation, such as Kuhn poker, are
  presented as PIMC-unfriendly and exploitable by best-response
  opponents (PDF p. 7; article p. 140).

## What This Paper Does Not Establish

- The paper does not prove that PIMC is generally safe for all hidden-
  information card games; it explicitly reports poker as a negative
  case and leaves exploitability against mistake-modeling opponents as
  future work (PDF p. 7; article p. 140).
- The paper does not provide a Gwent-specific measurement of leaf
  correlation, bias, or disambiguation factor (PDF pp. 1-7; article
  pp. 134-140).
- The paper does not define an ISMCTS algorithm, belief model, or
  hidden-information-safe Gwent implementation contract (PDF pp. 1-7;
  article pp. 134-140).
- The paper does not establish CFR as practical for full-scale
  trick-card games; it uses Bridge and Skat counts to argue the
  opposite for full solving (PDF p. 3; article p. 136).
- The paper does not resolve PIMC exploitability; the authors identify
  that as a major unaddressed issue (PDF p. 7; article p. 140).

## Relevance To Gwent AI

- Project inference: This is a direct search-risk source for Gwent
  rather than a standalone implementation recipe. It gives Cluster F a
  way to phrase acceptance criteria for determinization or ISMCTS work:
  measure whether sampled Gwent states have high enough payoff
  correlation and information revelation to avoid the failure regions
  the paper identifies for PIMC (PDF pp. 3-7; article pp. 136-140).
- Project inference: Gwent is not identical to either Skat/Hearts or
  poker. It has hidden hands and deck order, but public card plays
  reveal information and reduce uncertainty over time; therefore the
  paper suggests measuring Gwent's own leaf correlation, bias, and
  disambiguation behavior instead of assuming determinization will
  transfer from trick-taking games (PDF pp. 2-7; article pp. 135-140).
- Project inference: The paper strengthens the case for a
  hidden-info-safe evaluation ladder before implementing a search agent.
  A determinized search baseline should be judged not only by win rate
  against weak policies, but also by fixed-seed suites, matchup
  matrices, and adversarial or best-response-style probes that can
  expose PIMC exploitability (PDF p. 7; article p. 140).
- Project inference: The paper does not block ISMCTS or
  ensemble-determinization work already supported by the completed
  Cowling annotations. It narrows that work: Gwent search specs should
  avoid naive "average over fully clairvoyant worlds" language and
  should explicitly test for strategy fusion, non-locality, and
  low-correlation decision regions (PDF pp. 1-2, 5, 7; article
  pp. 134-135, 138, 140).

## Risks For Adaptation

- Project inference: The largest adaptation risk is treating PIMC's
  practical success in Bridge, Skat, and Hearts as proof that it will
  work in Gwent. The paper says those successes depend on measurable
  game properties, and it reports poker as a practical negative case
  with no disambiguation and best-response exploitability (PDF pp. 1,
  6-7; article pp. 134, 139-140).
- Project inference: A Gwent PIMC baseline could look strong if tested
  only against random or weak fixed policies, while remaining brittle
  against policies that exploit determinization mistakes. The paper
  explicitly names exploitability against mistake-modeling opponents as
  an unresolved issue (PDF p. 7; article p. 140).
- Project inference: Gwent's round structure, pass timing, card-order
  sequencing, and leader abilities may create non-local value effects
  not captured by simple local rollouts. Any measurement inspired by
  this paper must respect full engine legal moves and hidden-info-safe
  observations rather than simplified card-play-only trees (PDF p. 2;
  article p. 135).
- Project inference: Leaf-correlation and disambiguation estimates can
  become benchmark-gaming tools if measured on too narrow a seed set or
  only on late-game positions. The paper's own future-work caution that
  different hands may sit in different parameter clouds suggests Gwent
  should stratify measurements by phase, faction/deck family, and
  board state rather than produce one global score (PDF p. 7; article
  p. 140).
- Project inference: This paper should not be used to justify hidden-
  information leakage. Its PIMC framing samples possible worlds for
  analysis, but the project must keep search observations and UI/AI
  views hidden-info safe unless a separate spec marks an oracle/debug
  mode explicitly (PDF p. 1; article p. 134).

## AI-Roadmap Decision

1. **Source category.** Direct implementation-risk and benchmark-
   methodology source for determinization/PIMC-style search. The paper
   is not a Gwent implementation design by itself, but it directly
   informs acceptance criteria for any PIMC, ISMCTS, or ensemble-
   determinization baseline (PDF pp. 1-7; article pp. 134-140).
2. **Game class.** Applies to imperfect-information games and hidden-
   card domains, with specific evidence for trick-based card games and
   Kuhn poker rather than collectible card games (PDF pp. 2-7; article
   pp. 135-140).
3. **Method family.** Search and determinization/PIMC analysis. The
   paper uses CFR-generated Nash-equilibrium opponents as an evaluation
   tool, but it does not propose CFR or self-play training as its main
   method (PDF pp. 3-4, 7; article pp. 136-137, 140).
4. **Action space.** Supports variable legal action sets conceptually:
   trick-card actions are card plays from hand with up to 52 or 32
   possibilities, while poker is described as a much smaller fixed
   action family of bet/raise/call/fold-style choices (PDF pp. 2-3;
   article pp. 135-136).
5. **Evaluation methodology.** Provides a measurement methodology for
   estimating leaf correlation, bias, and disambiguation factor through
   playouts and information-set-size changes, plus comparison against
   Nash and best-response opponents in synthetic/Kuhn poker settings
   (PDF pp. 4, 6-7; article pp. 137, 139-140).
6. **Agent scope.** Project inference: This source supports both
   global and deck-conditioned Gwent agents only indirectly. Its
   hand-by-hand future-work note suggests Gwent should measure
   position/deck/faction-specific parameter clouds before deciding
   whether a global search policy is reliable across all decks (PDF
   p. 7; article p. 140).
7. **Smallest faithful experiment.** Project inference: Before a Gwent
   determinization implementation spec, add a hidden-info-safe
   measurement harness over existing engine seeds that samples legal
   playout neighborhoods and estimates leaf correlation, outcome bias,
   and information-set shrinkage for representative phases/decks. That
   experiment preserves the paper's claim better than immediately
   tuning a PIMC player, because the paper's main contribution is
   predictive measurement rather than a new algorithm (PDF pp. 1, 4,
   6-7; article pp. 134, 137, 139-140).
8. **Adaptation risk.** Project inference: Adaptation becomes
   misleading if Gwent tests only average win rate against weak
   opponents, uses clairvoyant hidden information in normal search,
   ignores strategy fusion/non-locality, or reports a single aggregate
   PIMC-safety number without stratifying by game phase and deck state
   (PDF pp. 1-2, 7; article pp. 134-135, 140).
9. **Roadmap effect.** This source should affect both near-term
   Cluster F specs and the long-term ML roadmap. Near term, it should
   add determinization-risk measurements and exploitability probes to
   the evaluation ladder before a PIMC/ISMCTS implementation. Long
   term, it should keep self-play/search claims framed as empirical
   and hidden-info-safe rather than as equilibrium or clairvoyant
   optimality claims (PDF pp. 1-7; article pp. 134-140).
