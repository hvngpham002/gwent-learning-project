---
citekey: cowling2012ismcts
title: "Information Set Monte Carlo Tree Search"
authors:
  - "Peter I. Cowling"
  - "Edward J. Powley"
  - "Daniel Whitehouse"
year: 2012
venue: "IEEE Transactions on Computational Intelligence and AI in Games"
doi: "10.1109/TCIAIG.2012.2200894"
arxiv:
project_relevance: direct-implementation
method_family: ismcts
information_model: hidden-card
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/cowling2012ismcts/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/cowling2012ismcts/source.pdf"
pages_read: "1-25"
status: "complete"
---

## Summary

This first batch covers the repository cover page plus the paper
frontmatter, introduction, formal game notation, imperfect-information
background, and the start of the ISMCTS algorithm section through
SO-ISMCTS with partially observable moves (PDF pp. 1-10; article
pp. 120-128).

Cowling, Powley, and Whitehouse present ISMCTS as an MCTS family for
games with hidden information and uncertainty, replacing game-state
tree nodes with information-set tree nodes in order to share search
statistics across determinizations and reduce determinization
pathologies such as duplicated search work and strategy fusion (PDF
p. 2; article p. 120). The paper states DOI
`10.1109/TCIAIG.2012.2200894` and identifies this local copy as the
submitted version in White Rose Research Online (PDF p. 1).

The first batch was enough to identify the algorithmic contract and
main cautions, but not enough to judge empirical strength because the
domain-specific experiments began after that batch (PDF p. 3; article
p. 121).

Batch 2 extends coverage through MO-ISMCTS, the Lord of the Rings: The
Confrontation experiments, Phantom (4, 4, 4), Dou Di Zhu, and the
opening computation-time comparison (PDF pp. 11-20; article
pp. 129-138). These pages provide substantial empirical evidence:
MO-ISMCTS is the strongest noncheating tested variant in Phantom
(4, 4, 4), ISMCTS variants beat determinized UCT in LOTR:C under the
reported settings, and Dou Di Zhu is an important counterexample where
ISMCTS and determinization are close overall because branching-factor
pathology can dominate the information-set-tree advantage (PDF
pp. 13-18; article pp. 131-136).

Batch 3 completes the paper: final computation-time results,
conclusion, future-work cautions, appendix pseudocode, references, and
author biographies (PDF pp. 21-25; article pp. 139-143). The conclusion
is deliberately conditional rather than universal: ISMCTS helps where
deeper shared-tree search or reduced strategy fusion matters, but it
does not automatically improve domains where information sets have very
large legal-action unions or where nonlocality and belief modeling are
central unresolved issues (PDF pp. 21-22; article pp. 139-140).

## Paper Claims

- MCTS had already succeeded in deterministic perfect-information
  games such as Computer Go, and UCT was the cited basis for many MCTS
  applications (PDF p. 2; article p. 120).
- The paper targets three imperfect-information features: information
  sets, partially observable moves, and simultaneous moves (PDF p. 2;
  article p. 120).
- Determinization samples states from an information set and analyzes
  the corresponding perfect-information games, but it duplicates
  effort across separate trees and can suffer strategy fusion because
  distinct hidden states become distinct decision nodes (PDF p. 2;
  article p. 120).
- ISMCTS builds trees whose nodes represent information sets rather
  than fully specified states, so move statistics are collected in one
  tree and moves that are good across many states in an information
  set can be exploited more directly (PDF p. 2; article p. 120).
- The paper evaluates ISMCTS in Lord of the Rings: The Confrontation,
  Phantom (4, 4, 4), and Dou Di Zhu (PDF p. 3; article p. 121).
- The authors do not use learned belief distributions in this paper;
  they assume uniform distributions over states in information sets,
  arguing from their domains that robust play against uncertainty can
  matter more often than fine-grained inference from opponent actions
  (PDF p. 3; article p. 121).
- The authors caution that MCTS often fails to find optimal Nash
  policies in imperfect-information games and cite MCCFR as a better
  fit for approximating Nash equilibria in very large trees, while
  positioning MCTS as a way to find strong suboptimal policies in
  reasonable computation time (PDF p. 3; article p. 121).
- SO-ISMCTS + POM weakens opponent modeling because it may treat
  opponent actions indistinguishable to the root player as random; in a
  phantom game this can make the opponent model essentially random
  (PDF p. 11; article p. 129).
- MO-ISMCTS addresses this by maintaining one information-set tree per
  player, selecting actions from the tree belonging to the player about
  to act and descending all player trees according to each player's
  observed move (PDF p. 11; article p. 129).
- In LOTR:C, fixed total iterations with more determinizations made
  determinized UCT weaker because each tree searched less deeply; the
  authors say a single combat can account for five or more tree levels
  (PDF p. 13; article p. 131).
- In LOTR:C round-robin tests, cheating single-tree UCT was strongest,
  but all three ISMCTS variants outperformed determinized UCT for the
  Dark player and MO-ISMCTS outperformed determinized UCT for the
  Light player with a reported significant 4.4% difference (PDF
  pp. 13-14; article pp. 131-132).
- In Phantom (4, 4, 4), the authors rank algorithms overall as
  cheating ensemble UCT, cheating UCT, MO-ISMCTS, determinized UCT,
  SO-ISMCTS, then SO-ISMCTS + POM, with 95% confidence significance
  between adjacent ranks (PDF p. 16; article p. 133).
- In Dou Di Zhu, the overall win rates reported for Landlord play
  against determinized UCT opponents are 43.6% for determinized UCT,
  42.3% for ISMCTS, and 56.5% for cheating UCT (PDF p. 18; article
  p. 135).
- In Dou Di Zhu deals where cheating UCT significantly outperformed
  determinized UCT, ISMCTS also significantly outperformed
  determinized UCT; in deals where cheating UCT and determinized UCT
  were not significantly different, determinized UCT was slightly
  better than ISMCTS (PDF p. 18; article p. 135).
- In the final computation-time comparison for Phantom (4, 4, 4),
  MO-ISMCTS outperforms SO-ISMCTS at higher CPU times, but both become
  relatively weaker than determinized UCT as CPU time increases (PDF
  p. 21; article p. 139).
- The conclusion says ISMCTS solves two determinization problems:
  sharing one search tree avoids splitting the budget across multiple
  independent trees, and shared information-set nodes reduce strategy
  fusion when indistinguishable future states share a node (PDF p. 21;
  article p. 139).
- The conclusion explicitly leaves nonlocality to opponent modeling and
  belief distributions beyond the paper's scope (PDF p. 21; article
  p. 139).
- The future-work section says MO-ISMCTS is the most theoretically
  defensible variant among the three because it models each player's
  information separately, but its convergence to Nash-equilibrium
  policy remains future work (PDF p. 22; article p. 140).
- The paper identifies a limitation in its algorithms: the searching
  player does not determinize its own hidden information, so it assumes
  opponents know the player's hidden cards or pieces; this worst-case
  assumption can be harmful when information hiding is important (PDF
  pp. 22-23; article pp. 140-141).
- The paper states that none of the algorithms model belief
  distributions, and integrating belief distributions into ISMCTS is
  an important future-work direction for addressing nonlocality (PDF
  p. 23; article p. 141).

## Game / Environment Model

- The paper models a game as a directed graph with states as nodes,
  terminal states as leaves, nonterminal states as decision points, a
  positive number of players, and an environment player numbered 0
  (PDF p. 3; article p. 121).
- Terminal states carry reward vectors, and play proceeds by the
  current player choosing an outgoing edge until a terminal state is
  reached (PDF p. 3; article p. 121).
- Players choose actions rather than raw edges; actions are
  equivalence classes of edges, and the set of legal actions can
  differ by state (PDF p. 4; article p. 122).
- The environment player has a fixed policy as part of the game
  definition, representing chance-event probabilities (PDF p. 4;
  article p. 122).
- The paper formalizes an imperfect-information game as a tuple
  containing the graph, initial state, number of players, utility
  function, player-to-act function, environment policy, information
  set equivalence relations, and move-observation equivalence
  relations (PDF p. 4; article p. 122).
- LOTR:C is modeled as a two-player asymmetric strategy game with
  hidden character identities, chance events, partially observable
  movement, and simultaneous combat-card decisions (PDF p. 11; article
  p. 129).
- LOTR:C movement actions identify the character and the source and
  destination squares for the acting player, while the opponent observes
  only that a character moved between squares (PDF p. 12; article
  p. 130).
- LOTR:C combat is implemented as a sequence of attacker movement,
  environment reveal and possible random defender selection, two
  simultaneous player card choices, and environment card reveal plus
  combat resolution (PDF p. 12; article p. 130).
- The LOTR:C implementation encodes perfect recall of revealed
  character-location information into the game state, so sampled
  determinizations stay consistent with previously revealed identities
  (PDF p. 12; article p. 130).
- Phantom (4, 4, 4) is an alternating grid-marking game where players
  cannot see opponent marks; attempting an occupied square is invalid,
  reveals information, and carries no penalty (PDF p. 15; article
  p. 133).
- Dou Di Zhu is modeled as a three-player hidden-hand card game in
  which the Landlord competes against two cooperating non-Landlord
  players; because the non-Landlord players cannot see each other's
  cards, the game cannot be reduced to a two-player perfect-recall game
  (PDF pp. 17-18; article pp. 134-135).

Project inference: Gwent's pure engine already exposes legal moves
from public state, so the relevant adaptation question is whether its
hidden hand/deck uncertainty can be sampled into determinizations while
keeping the default observation hidden-info-safe.

## Information Model

- An information set is a collection of states indistinguishable to a
  player; in a card game example, hidden opponent cards create many
  possible states inside the acting player's information set (PDF p. 2;
  article p. 120).
- Hidden information creates both state-space growth and strategic
  inference/bluffing challenges because players may infer hidden state
  from actions or attempt to mislead opponents (PDF p. 2; article
  p. 120).
- Partially observable moves are modeled separately from hidden state:
  a player may observe only a move class rather than the exact action
  another player took (PDF p. 4; article p. 122).
- Simultaneous moves are treated as a special imperfect-information
  case where choices can be modeled sequentially while hiding them
  until an environment action reveals and resolves them (PDF p. 6;
  article p. 124).
- The paper's first-batch algorithms assume determinizations sampled
  from the current information set, and those determinizations restrict
  which parts of the information-set tree are available in an
  iteration (PDF p. 10; article p. 128).
- MO-ISMCTS uses one information-set tree per player, so each player
  tree represents that player's viewpoint rather than forcing all
  decisions through the root player's observations (PDF p. 11; article
  p. 129).
- In LOTR:C, hidden information can both decrease and increase: if a
  known character enters a square with an unknown character and then a
  character exits, both identities may again become unknown (PDF p. 12;
  article p. 130).
- In Phantom (4, 4, 4), invalid moves are the only mechanism described
  for discovering opponent marks, so information gathering is itself a
  playable action effect (PDF p. 15; article p. 133).
- In Dou Di Zhu, determinizations are generated by randomly reassigning
  hidden cards among opponents from the current player's point of view
  (PDF p. 18; article p. 135).

Project inference: For Gwent, the "cheating" boundary needs to be
explicit: hidden opponent hand/deck identities may be sampled inside a
search worker, but the product UI, default observations, and policy
datasets must not expose the true hidden state.
Project inference: The paper's own-information limitation is relevant
to Gwent because a naive search that assumes the opponent knows the
human/AI player's hand could undervalue deception, bait, and delayed
resource-reveal lines even if it remains hidden-info-safe externally.

## Action Space

- The paper distinguishes legal actions from legal moves as observed
  by a player; legal actions are the legal moves from the viewpoint of
  the player about to act (PDF p. 4; article p. 122).
- At an information-set node where the observer is not the player
  about to act, different hidden states in the same information set can
  have different legal action subsets, for example because an
  opponent's legal card plays depend on the opponent's hidden hand
  (PDF p. 8; article p. 126).
- The authors frame this as a subset-armed bandit problem, where only
  a subset of arms is available on each trial and action availability
  can be correlated across arms (PDF p. 8; article p. 126).
- Their simple modification replaces the parent visit count in UCB1
  with an availability count, preventing rare legal actions from being
  over-explored merely because they are available in few sampled states
  (PDF p. 8; article p. 126).
- In MO-ISMCTS, selection uses statistics in the acting player's tree,
  then all player trees descend through the move each corresponding
  player observes from the selected action (PDF p. 11; article p. 129).
- LOTR:C combat contains simultaneous card choices, which the paper
  models as hidden sequential choices followed by environment reveal
  and resolution (PDF p. 12; article p. 130).
- Dou Di Zhu has a large and variable legal action space: leading plays
  typically have branching factor around 40, and move categories with
  kickers can create a combinatorial explosion because each move-plus-
  kicker combination is a distinct move (PDF p. 18; article p. 135).
- To reduce Dou Di Zhu kicker branching, the implementation uses a
  move-grouping-like approach: choose the base move first, then choose
  the kicker at a separate consecutive decision node (PDF p. 18;
  article p. 135).

Project inference: This is directly relevant to a Gwent search API:
the planner should score engine legal moves for each sampled hidden
state rather than assume a fixed global action vector is always valid.
Project inference: Gwent has variable legal moves but not Dou Di Zhu's
kicker-combination pathology; a Gwent ISMCTS baseline should still
watch for analogous move explosion from target-rich cards such as Medic,
Decoy, Scorch variants, and leader prompts.
- The conclusion summarizes the Dou Di Zhu action-space problem with a
  set-union relation: the union of legal action sets across all states
  in an information set can be much larger than the action set for any
  single state in that information set (Eq. 8, PDF p. 22; article
  p. 140).

## Policy / Search / Learning Method

- MCTS estimates action strength by simulating games from nonterminal
  states to terminal rewards, treating decisions as multiarmed bandit
  problems and incrementally improving reward estimates (PDF p. 4;
  article p. 122).
- Determinization, also called perfect-information Monte Carlo in the
  cited background, converts hidden/stochastic uncertainty into sampled
  perfect-information instances, solves those instances, and combines
  their decisions (PDF p. 5; article p. 123).
- The paper discusses two determinization failure modes from Frank and
  Basin: strategy fusion, where an agent implicitly makes different
  decisions from indistinguishable states, and nonlocality, where some
  determinizations are unlikely because other players can steer away
  from them (PDF p. 5; article p. 123).
- For simultaneous moves, the paper uses EXP3 at simultaneous-move
  nodes because mixed policies are often needed there, while UCB
  remains in use elsewhere in the tree (PDF p. 6; article p. 124).
- The algorithm section uses UCT with UCB1 and reports that, for the
  games studied, tested algorithms were not highly sensitive to the
  exploration constant inside roughly the 0.1-1.0 range; the
  experiments use 0.7 (PDF p. 8; article p. 125).
- Cheating UCT is used only as a benchmark that observes hidden or
  uncertain information; the authors explicitly say this is not a valid
  AI approach for imperfect-information games (PDF p. 9; article
  p. 126).
- Determinized UCT samples states uniformly from the current
  information set, builds independent UCT trees rooted at those sampled
  states, and chooses a root move by summed visit counts (PDF p. 9;
  article p. 126).
- SO-ISMCTS searches one tree whose nodes correspond to information
  sets from the root player's viewpoint and whose edges correspond to
  actions; the authors note that this is not a one-to-one mapping when
  partially observable opponent moves are present (PDF p. 9; article
  p. 126).
- Each SO-ISMCTS iteration samples a determinization, restricts
  tree selection to nodes and actions compatible with that
  determinization, expands a compatible action leading to an unseen
  root-player information set, simulates to terminal state, updates
  visit/reward counts, updates sibling availability counts, and returns
  the root action with maximal child visits (PDF p. 10; article
  p. 128).
- SO-ISMCTS with partially observable moves changes tree edges from
  player-action edges to moves as observed by the root player, so
  indistinguishable opponent actions share one edge in the tree (PDF
  p. 10; article p. 128).
- MO-ISMCTS maintains separate trees for each player, descends them in
  parallel, selects from the current actor's tree, updates the
  determinization by applying the selected action, and backpropagates
  through all visited player-tree nodes plus available siblings (PDF
  p. 11; article p. 129).
- The authors compare MO-ISMCTS to Auger's MMCTS but distinguish it by
  MO-ISMCTS's use of determinizations to guide and restrict each
  iteration and by its online mode of play (PDF p. 11; article p. 129).
- LOTR:C experiments compare cheating UCT, cheating ensemble UCT,
  determinized UCT, SO-ISMCTS, SO-ISMCTS + POM, and MO-ISMCTS at
  10,000 iterations per decision, with determinized UCT using tuned
  determinization counts by side (PDF p. 13; article p. 131).
- For Phantom (4, 4, 4), the same six algorithms are compared in a
  round-robin tournament with 10,000 total iterations, and determinized
  UCT plus cheating ensemble UCT use 40 trees with 250 iterations per
  tree (PDF p. 16; article p. 133).
- For Dou Di Zhu, all three ISMCTS variants are equivalent because the
  game has fully observable moves, so the authors test SO-ISMCTS and
  refer to it simply as ISMCTS for that section (PDF p. 18; article
  p. 135).
- The appendix supplies more complete pseudocode for SO-ISMCTS,
  SO-ISMCTS + POM, and MO-ISMCTS, using UCB for a concrete selection
  implementation while noting that other bandit algorithms may be used
  (PDF pp. 23-24; article pp. 141-142).
- The appendix SO-ISMCTS pseudocode samples a determinization uniformly
  from the root information set, selects/expands/simulates, and
  backpropagates through nodes plus compatible siblings for
  availability counts (PDF p. 23; article p. 141).
- The appendix MO-ISMCTS pseudocode creates a root tree for each
  player, samples a determinization, selects through the relevant
  player tree, updates all player-tree paths, and creates player-tree
  nodes as needed for observed moves (PDF p. 24; article p. 142).

Project inference: The paper supports treating a first Gwent search
baseline as search, not training. It does not support claims about
learned policies or self-play convergence.
Project inference: For Gwent, MO-ISMCTS is the cleanest candidate
variant if future implementation needs opponent action modeling, but
the paper does not prove Nash convergence or provide a ready-made
belief sampler for hidden hand/deck inference.

## Training Data

Not applicable. The full paper describes search, simulation
algorithms, game-playing experiments, and future-work theory questions,
not supervised datasets, replay corpora, or learned model training (PDF
pp. 4-25; article pp. 122-143).

## Self-Play Setup

No self-play training setup is specified in the paper. The experiments
are head-to-head game-playing comparisons and human/commercial-agent
comparisons, not iterative policy training (PDF pp. 13-20; article
pp. 131-138).

## Evaluation Method

- The abstract claims the new ISMCTS algorithms are tested in three
  domains with different characteristics and outperform existing
  hidden-information and uncertainty approaches (PDF p. 2; article
  p. 120).
- The introduction says ISMCTS has an advantage in Lord of the Rings:
  The Confrontation because deep search matters, an advantage in
  Phantom (4, 4, 4) because strategy fusion is especially harmful, and
  rough parity with determinized UCT in Dou Di Zhu because the
  information-set tree has much larger branching factor and the named
  effects have smaller impact there (PDF p. 3; article p. 121).
- The algorithm section introduces cheating UCT as a nonvalid but
  useful benchmark and determinized UCT as the simplest noncheating
  baseline (PDF p. 9; article p. 126).
- LOTR:C uses a determinization-balancing experiment varying
  determinizations while holding total iterations fixed; the paper
  reports that more determinizations can weaken play by reducing tree
  depth per determinization (PDF p. 13; article p. 131).
- LOTR:C uses a round-robin tournament among cheating UCT, cheating
  ensemble UCT, determinized UCT, SO-ISMCTS, SO-ISMCTS + POM, and
  MO-ISMCTS, with 10,000 iterations per decision (PDF p. 13; article
  p. 131).
- LOTR:C also includes a human-opponent evaluation: MO-ISMCTS played
  32 games as Light and 32 as Dark, winning 14 as Light and 16 as Dark
  against intermediate-to-expert human players (PDF p. 15; article
  p. 132).
- Phantom (4, 4, 4) uses another round-robin tournament among the same
  six algorithms, again with 10,000 total iterations and 40-by-250
  tree/iteration settings for cheating ensemble UCT and determinized
  UCT (PDF p. 16; article p. 133).
- Dou Di Zhu uses preselected and then larger random deal samples,
  classifies 5,000 deals into categories based on whether cheating UCT
  significantly differs from determinized UCT, and compares ISMCTS
  against determinized UCT within those categories (PDF pp. 18-19;
  article pp. 135-136).
- Dou Di Zhu also compares determinized UCT and ISMCTS against a
  commercial AI Factory agent, with 1,000 games per tested algorithm
  against two copies of the commercial agent (PDF p. 19; article
  p. 137).
- The final computation-time comparison for Phantom (4, 4, 4) measures
  determinized UCT, SO-ISMCTS, and MO-ISMCTS from 0.25 to 5 seconds
  per move and reports that the results are similar to the 10,000
  iteration results below 1.5 seconds, while both SO/MO-ISMCTS become
  relatively weaker than determinized UCT with more CPU time (PDF
  p. 21; article p. 139).
- The paper uses 95% confidence intervals in multiple playing-strength
  plots and explicitly notes Clopper-Pearson intervals for Bernoulli
  game outcomes (PDF p. 13; article p. 131).

## Difficulty / Human-Likeness Notes

No controllable-difficulty method is established in the pages read. The
LOTR:C human-opponent section does report qualitative human observations
that MO-ISMCTS made plausible moves and strong endgame decisions, while
its weakest observed behavior was combat card play, including wasting
powerful cards when weaker ones would suffice (PDF p. 15; article
p. 132).

Project inference: For Gwent, this suggests a future difficulty
analysis should inspect resource conservation and card-timing mistakes,
not just win rate, if an ISMCTS baseline is used as a playable opponent.

## Compute Requirements

- MCTS is presented as an anytime algorithm that can use as much or as
  little compute time as available and can be parallelized (PDF p. 2;
  article p. 120).
- The paper argues determinization wastes compute by building separate
  trees that often share many nodes, while ISMCTS collects move
  statistics in a single tree (PDF p. 2; article p. 120).
- The authors position MCTS as useful for strong suboptimal policies
  in complex games where Nash approximation may be better handled by
  methods such as MCCFR (PDF p. 3; article p. 121).
- The first batch did not provide wall-clock budgets, rollout counts
  per move, or domain-specific compute curves (PDF pp. 1-10).
- For LOTR:C, the paper justifies 10,000 iterations as a standard
  benchmark by stating that, with an efficient implementation on modern
  hardware, they expect it to be roughly one second of computation and
  acceptable for human play latency (PDF p. 13; article p. 131).
- In the computation-time section, SO-ISMCTS and MO-ISMCTS are reported
  as roughly two to four times slower than determinized UCT in the
  tested implementation, with game domain also affecting iteration
  throughput (PDF p. 20; article p. 138).
- For LOTR:C under decision-time comparison, MO-ISMCTS is reported as
  slightly inferior to determinized UCT at one second, but
  significantly stronger once at least three seconds per decision are
  available (PDF p. 20; article p. 138).
- For Dou Di Zhu, the paper reports that relative playing strength was
  not significantly different from the earlier fixed-iteration result
  for tested decision times from 0.25 to 8 seconds, with SO-ISMCTS
  appearing slightly weaker below one second (PDF p. 20; article
  p. 138).
- For Phantom (4, 4, 4), higher CPU time exposes a pessimism problem:
  SO-ISMCTS and MO-ISMCTS can incorrectly conclude the game is lost
  because they assume the opponent knows some or all hidden information,
  whereas determinized UCT has the inaccurate but more balanced view
  that both players see all hidden information (PDF p. 21; article
  p. 139).

## What This Paper Establishes

- The first batch establishes the formal motivation for ISMCTS:
  determinization can duplicate search and induce strategy fusion,
  while information-set trees can share statistics over hidden-state
  samples (PDF p. 2; article p. 120).
- The first batch establishes that legal action subsets can vary
  across hidden states inside one information set, requiring selection
  logic that accounts for action availability rather than treating all
  actions as always legal (PDF p. 8; article p. 126).
- The first batch establishes the high-level SO-ISMCTS loop and its
  use of sampled determinizations to restrict each iteration through
  the information-set tree (PDF p. 10; article p. 128).
- The first batch establishes that partially observable opponent moves
  require a variant where tree edges represent moves from the root
  player's viewpoint rather than fully observed opponent actions (PDF
  p. 10; article p. 128).
- The second batch establishes MO-ISMCTS as the paper's stronger
  opponent-modeling variant, using per-player information-set trees
  while still restricting each iteration by sampled determinization
  (PDF p. 11; article p. 129).
- The second batch establishes that ISMCTS gains are domain-dependent:
  the authors report clear benefits over determinized UCT in LOTR:C and
  Phantom (4, 4, 4), but rough parity or deal-dependent tradeoffs in
  Dou Di Zhu (PDF pp. 13-18; article pp. 131-136).
- The second batch establishes that branching factor can undermine
  ISMCTS: Dou Di Zhu can produce many unique legal leading plays across
  determinizations, so ISMCTS may spend many simulations expanding
  opponent nodes near the root (PDF pp. 18-19; article pp. 135-136).
- The second batch establishes that a noncheating ISMCTS agent can be
  plausible to humans in at least one complex board-game domain, based
  on the reported LOTR:C human-player matches and qualitative comments
  (PDF p. 15; article p. 132).
- The full paper establishes the authors' final scope boundary:
  ISMCTS addresses strategy fusion and budget splitting, but not
  nonlocality, which the paper assigns to opponent modeling and belief
  distributions outside its scope (PDF p. 21; article p. 139).
- The full paper establishes that ISMCTS is promising when deep search
  is possible/beneficial or strategy fusion is detrimental, but not an
  immediate improvement where information sets have many legal moves
  and strategy-fusion effects are unclear (PDF p. 22; article p. 140).
- The full paper establishes concrete future-work requirements before
  treating ISMCTS as a complete imperfect-information solution:
  branching-factor control, theoretical analysis, better opponent
  modeling for indistinguishable moves, own-information uncertainty,
  and belief distributions (PDF pp. 22-23; article pp. 140-141).

## What This Paper Does Not Establish

- The first batch does not establish a Nash-convergent or
  exploitability-minimizing method; the authors explicitly distinguish
  MCTS's strong suboptimal policies from MCCFR-style Nash
  approximation (PDF p. 3; article p. 121).
- The first batch does not establish learned belief models; the
  authors explicitly do not use belief distributions here and assume
  uniform distributions over information-set states (PDF p. 3; article
  p. 121).
- The first batch does not establish a Gwent-specific rollout policy,
  deck-conditioning scheme, evaluation ladder, or difficulty-tier
  strategy.
- The pages read do not establish that ISMCTS will beat determinization
  in every hidden-information card game; Dou Di Zhu is specifically a
  counterexample where the approaches are close overall and
  determinized UCT is better in many deals where hidden information has
  little measured effect (PDF p. 18; article p. 135).
- The paper does not establish learned opponent modeling; the
  experiments use uniform determinization and the authors explicitly
  leave belief distributions to future work (PDF p. 23; article
  p. 141).
- The paper does not establish that ISMCTS alone solves information
  hiding; the authors identify the own-hidden-information assumption as
  a limitation and warn that simply randomizing one's own information
  would destroy the player's ability to plan beyond the current move
  (PDF pp. 22-23; article pp. 140-141).
- The paper does not give a Gwent-specific rollout policy,
  deck-conditioning scheme, target-pruning method, or evaluation ladder
  (PDF pp. 1-25).

## Relevance To Gwent AI

Project inference:

- This paper is a direct implementation candidate for a first
  noncheating hidden-information search baseline in Gwent. Its core
  contract matches the project engine shape: sample hidden states
  consistent with the acting seat's observation, ask the engine for
  legal moves in each sampled state, run rollouts, and choose among
  legal root actions without exposing hidden identities to the product
  UI or default observation export (paper basis: information sets,
  determinizations, and legal-action subset handling, PDF pp. 2, 8,
  10-11; article pp. 120, 126, 128-129).
- MO-ISMCTS is more relevant than plain SO-ISMCTS if Gwent search needs
  a nontrivial opponent model, because MO-ISMCTS maintains per-player
  information-set trees instead of collapsing all future opponent
  decisions into the root player's view (PDF p. 11; article p. 129).
- The paper supports a small-compute search baseline, not a neural
  training program. The authors position MCTS as strong suboptimal play
  in reasonable time and explicitly contrast Nash approximation with
  MCCFR-style methods (PDF p. 3; article p. 121).
- A Gwent implementation should include strict hidden-info tests, a
  fixed seed/matchup evaluation ladder, and iteration/time budget
  curves. The paper's own experiments rely on head-to-head tournaments,
  confidence intervals, human/commercial-opponent comparisons, and
  decision-time checks rather than a single headline win rate (PDF
  pp. 13-21; article pp. 131-139).
- Gwent adaptation should prioritize branch-control and rollout policy
  design. Dou Di Zhu shows that a large union of legal moves across
  determinizations can erase ISMCTS's advantage (PDF pp. 18-19, 22;
  article pp. 135-136, 140).

## Risks For Adaptation

Project inference:

- Hidden-information leakage is the largest implementation risk. The
  paper uses "cheating" agents as explicit invalid benchmarks that see
  hidden information; a Gwent implementation must keep any true hidden
  state confined to sampled internal search states, not observations,
  logs, UI labels, or policy datasets (paper basis: cheating UCT
  warning, PDF p. 9; article p. 126).
- Uniform hidden-state sampling may be weak for Gwent. The paper does
  not model belief distributions and says belief distributions are
  essential for optimal imperfect-information play and for nonlocality
  (PDF p. 23; article p. 141).
- A naive implementation may undervalue information hiding because the
  searched determinization does not randomize the searching player's
  own hidden cards/pieces; the authors explicitly identify this as a
  limitation (PDF pp. 22-23; article pp. 140-141).
- Target-rich legal moves can cause a Dou Di Zhu-like expansion
  problem. Gwent has fewer kicker-like combinations, but Medic, Decoy,
  Scorch, row choices, leader prompts, and future custom cards can
  still produce large legal target sets that need pruning or rollout
  abstraction (paper basis: Dou Di Zhu branching analysis, PDF pp.
  18-19, 22; article pp. 135-136, 140).
- ISMCTS should not be sold as equilibrium play. The paper itself says
  MCTS often fails to find optimal Nash policies in imperfect-
  information games and leaves MO-ISMCTS theoretical convergence to
  future work (PDF pp. 3, 22; article pp. 121, 140).
- Difficulty tuning by budget alone may produce brittle mistakes. In
  LOTR:C, human observers saw plausible play but also wasteful combat
  card use, and the computation-time section shows domain-dependent
  behavior as time increases (PDF pp. 15, 20-21; article pp. 132,
  138-139).

## AI-Roadmap Decision

1. **Source category.** Direct implementation candidate for a first
   hidden-information search baseline, with benchmark-methodology value
   for comparing determinized UCT, cheating oracle baselines, and
   ISMCTS variants (PDF pp. 9, 13-21; article pp. 126, 131-139).
2. **Game class.** Applies to imperfect-information games and
   hidden-information card/board games; Dou Di Zhu gives the strongest
   direct card-game evidence, while LOTR:C and Phantom (4, 4, 4)
   expose partially observable move and phantom-information behavior
   (PDF pp. 11-19; article pp. 129-137).
3. **Method family.** MCTS/ISMCTS search with determinizations and
   rollouts. It does not require self-play learning, supervised
   learning, reinforcement learning, or CFR-style training (PDF
   pp. 4-11; article pp. 122-129).
4. **Action space.** Supports variable legal action sets through
   sampled-state legal actions and subset-armed bandit availability
   counts; large legal-action unions across determinizations are a
   known failure mode (PDF pp. 8, 22; article pp. 126, 140).
5. **Evaluation methodology.** Provides useful evaluation patterns:
   round-robin head-to-head tournaments, cheating-agent upper-bound
   baselines, determinized UCT baselines, confidence intervals,
   human/commercial-opponent comparisons, and per-decision-time curves
   (PDF pp. 13-21; article pp. 131-139).
6. **Agent scope.** Supports a search agent over a specific current
   game state. The paper does not discuss deck-conditioned global
   agents or faction specialists (PDF pp. 1-25).
7. **Smallest faithful experiment.** Project inference: implement a
   hidden-info-safe SO-ISMCTS or MO-ISMCTS prototype behind a benchmark
   flag, with fixed Gwent seed suites, legal-move-only root actions,
   random legal rollout baseline, determinized UCT comparison, cheating
   oracle comparison only in explicit debug/benchmark mode, and
   iteration/time budget sweeps.
8. **Adaptation risk.** Project inference: misleading adaptation would
   come from hidden-state cheating, skipping belief-sampling caveats,
   ignoring large target/action sets, claiming Nash/equilibrium
   properties, or evaluating only against weak fixed opponents.
9. **Roadmap effect.** This source should affect both Cluster F specs
   and the long-term ML roadmap. Near term, it supports an evaluation
   ladder plus a small-compute ISMCTS/determinized-search baseline
   after PIMC-caution and CFR/MCCFR sources are annotated. It does not
   justify neural self-play or AlphaZero-style assumptions by itself.
