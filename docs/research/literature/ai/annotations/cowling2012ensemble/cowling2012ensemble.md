---
citekey: cowling2012ensemble
title: "Ensemble Determinization in Monte Carlo Tree Search for the Imperfect Information Card Game Magic: The Gathering"
authors:
  - "Peter I. Cowling"
  - "Colin D. Ward"
  - "Edward J. Powley"
year: 2012
venue: "IEEE Transactions on Computational Intelligence and AI in Games"
doi: "10.1109/TCIAIG.2012.2204883"
arxiv:
project_relevance: direct-implementation
method_family: mcts
information_model: hidden-card
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/cowling2012ensemble/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/cowling2012ensemble/source.pdf"
pages_read: "1-19"
status: "complete"
---

## Summary

Cowling, Ward, and Powley study MCTS for a simplified Magic: The
Gathering environment with hidden opponent cards and stochastic card
draws, using determinization to convert hidden and random information
into perfect-information search instances (PDF p. 2; article p. 1).
The local source is the White Rose submitted version of "Ensemble
Determinization in Monte Carlo Tree Search for the Imperfect
Information Card Game Magic: The Gathering," with DOI
`10.1109/TCIAIG.2012.2204883` (PDF p. 1).

Batch 1 covered the White Rose cover page, frontmatter, introduction,
MCTS background, the simplified Magic: The Gathering rules model,
rule-based baseline players, the determinization survey, and the start
of the paper's M:TG MCTS design through the opening of Section VI.A
(PDF pp. 1-10; article pp. 1-9).

Batch 2 completed the paper. It covered interesting card orderings,
move pruning, binary decision trees for compound card-play decisions,
rollout strategies, discounted rewards, all reported experiments,
conclusion, future work, references, and author biographies (PDF
pp. 11-19; article pp. 10-18). The strongest transferable result is
not "plain determinization is enough"; it is that ensemble
determinization with carefully chosen search-shaping techniques can
make MCTS competitive with a strong hand-authored player in a simplified
hidden-card CCG, while still inheriting determinization caveats (PDF
pp. 14-17; article pp. 13-16).

## Paper Claims

- The abstract says M:TG has incomplete information through the
  opponent's hidden cards and randomness through drawing from a
  shuffled deck (PDF p. 2; article p. 1).
- The abstract says the paper examines determinization, rollout
  sophistication and expert knowledge, decaying reward, pruning,
  relevance of random choices, and a binary yes/no decision-tree
  decomposition of move generation (PDF p. 2; article p. 1).
- The introduction presents MCTS as useful where strong nonterminal
  evaluation functions are hard to formulate, naming Go and Hex as
  examples (PDF p. 2; article p. 1).
- The paper argues that imperfect-information MCTS was less advanced
  than perfect-information MCTS, often being restricted to perfect-
  information variants or subproblems (PDF p. 2; article p. 1).
- Determinization assumes hidden and random information is known to all
  players in a sampled perfect-information instance, allowing MCTS to
  be applied to incomplete-information and stochastic games (PDF p. 3;
  article p. 2).
- The authors cite two determinization weaknesses from Frank and Basin:
  indistinguishable states may imply different optimal moves, and
  opponent influence can make some states more likely than others (PDF
  p. 3; article p. 2).
- M:TG is described as a two-player strategic card game with hidden
  opponent hand information, stochastic shuffled-deck draws, and cards
  whose rule-changing interactions create rich play (PDF p. 3; article
  p. 2).
- The paper identifies four M:TG research challenges: large deck-
  construction space, multiple card plays per turn, significant
  opponent modeling and hidden-hand/deck inference, and non-linear
  turn structure with possible interruptions (PDF p. 3; article p. 2).
- MCTS is summarized as a four-step loop: selection, expansion,
  simulation/rollout, and backpropagation, repeated until a time or
  simulation limit is reached (PDF p. 4; article p. 3).
- The paper says MCTS is anytime and does not require a nonterminal
  evaluation function, although domain-specific choices can improve
  simulation and selection (PDF p. 4; article p. 3).
- The simplified M:TG environment keeps basic turn order and creature
  combat while restricting cards to single-colour land and creature
  cards (PDF p. 4; article p. 3).
- The expert rule-based player was much stronger than the reduced
  rule-based player in 10,000 randomly generated games, winning 63.7%
  with a 95% confidence interval of +/-0.94% (PDF p. 7; article p. 6).
- Against seven human players over 114 games, the expert rule-based
  player won 42.1% overall, 46.6% when playing first, and 37.5% when
  playing second (PDF pp. 7-9; article pp. 6-8).
- The determinization survey repeats the strategy-fusion and
  nonlocality critique: values in imperfect-information trees can
  depend on earlier opponent decisions that steer play toward some
  hidden states and away from others (PDF p. 9; article p. 8).
- The paper cites Long et al. as identifying leaf correlation, bias,
  and disambiguation as features affecting PIMC effectiveness (PDF
  p. 10; article p. 9).
- The authors state that M:TG is a good PIMC candidate because game
  outcomes rarely hinge on one final move, and the progressive
  opponent-hand/deck reveal produces a disambiguation factor that grows
  slowly through the game (PDF p. 10; article p. 9).
- The proposed design combines ensemble UCT and determinization:
  multiple MCTS trees are built from the same root, each tree lazily
  determinizes card draws, and the growing tree fixes an ordering for
  cards in each player's deck (PDF p. 10; article p. 9).
- An "interesting" card ordering is one where doing nothing and taking
  the expert rule player's suggested move produce different rollout
  outcomes under that ordering (PDF p. 11; article p. 10).
- Root-level interesting ordering search gave modest improvements
  without visible slowdown, while leaf-level interesting ordering
  search could slow search by up to a factor of two (PDF p. 11; article
  p. 10).
- The paper investigates three pruning levels: no move pruning,
  non-land pruning, and dominated move pruning (PDF p. 11; article
  p. 10).
- Non-land pruning removes moves that omit a land card when an
  otherwise corresponding land-playing move is available; dominated
  move pruning removes moves that are proper subsets of another legal
  move (PDF p. 11; article p. 10).
- Binary decision trees decompose a compound card-play move into
  yes/no decisions about whether to play individual cards, so partial
  decision statistics can accumulate independently (PDF pp. 11-12;
  article pp. 10-11).
- The authors use descending mana cost for binary-tree experiments
  after preliminary tests did not show a significant difference among
  ascending, descending, and random mana-cost orderings (PDF p. 12;
  article p. 11).
- The rollout section reports that expert, reduced-rule, and uniformly
  random rollout strategies were considered, and notes prior MCTS work
  where stronger rollout players do not necessarily produce stronger
  MCTS play because of bias (PDF p. 12; article p. 11).
- Discounted reward uses `lambda = 0.99`, which the authors say gives
  discount factors around 0.7 to 0.5 for a typical 40-60 turn Magic
  game (PDF p. 12; article p. 11).
- The baseline experimental deck has 40 cards: 17 land cards and 23
  creature cards ranging from 1/1(1) to 6/6(7) (PDF p. 12; article
  p. 11).
- The all-possible-deals MCTS baseline is weak, winning 23% of games
  against the expert player and 38% against the reduced-rules player
  (PDF p. 13; article p. 12).
- For a 10,000 simulation budget, ensembles of determinizations play
  much more strongly than the naive all-possible-deals MCTS baseline,
  and the chosen later setting is 40 determinizations with 250
  simulations per tree (PDF p. 14; article p. 13).
- Reduced-rule rollouts perform better than expert-rule rollouts in
  the determinization count experiments even though the reduced-rules
  player is intrinsically weaker (PDF p. 14; article p. 13).
- In the round-robin comparison, all enhancements over the basic
  ensemble determinization baseline improve playing strength, with all
  differences significant at 95% except negative reward for loss (PDF
  p. 15; article p. 14).
- Interesting root orderings, dominated move pruning, and binary trees
  are all reported as effective; binary trees are also much faster,
  with Table IV reporting 0.23 seconds per move for BT versus 0.75 for
  the baseline and 9.81 for leaf-level interesting search (PDF p. 15;
  article p. 14).
- The combination experiments use four enhancements: binary trees,
  dominated move pruning, negative reward for loss, and root-level
  interesting simulations (PDF p. 16; article p. 15).
- Multiway ANOVA reports BT, MP, and IR improvements significant at
  the 99% level, while NL is significant only at the 90% level; BT:MP,
  BT:IR, MP:IR, and BT:MP:IR interactions are also reported as
  significant at the 99% level (PDF p. 16; article p. 15).
- The `(BT, MP, *, *)` combinations produce the strongest performance,
  slightly better than the expert player, with Table V values around
  49.5%-50.5% versus the expert rules player (PDF p. 16; article
  p. 15).
- With 100,000 rollouts, BT combinations modestly improve to roughly
  51%-52% versus the expert player, while non-BT variants do not
  reliably improve and can be worse than at lower simulation budgets
  (PDF p. 17; article p. 16).
- The conclusion says multiple determinized trees significantly
  improve playing strength and can become competitive with a
  sophisticated expert rules player within less than one CPU second on
  standard hardware (PDF p. 17; article p. 16).
- The conclusion says reduced-rule stochastic rollouts substantially
  outperform fully deterministic expert-rule rollouts in the MCTS
  setting, while uniformly random rollouts are very weak (PDF p. 17;
  article p. 16).
- Future work is to add more M:TG card types and combine binary trees
  with domain knowledge (PDF p. 18; article p. 17).

## Game / Environment Model

- The studied game is not full M:TG; the authors keep core turn-order
  and combat structure while simplifying to decks containing only
  single-colour land and creature cards (PDF p. 4; article p. 3).
- Each player has a life total, and the first player whose life total
  reaches zero loses (PDF p. 4; article p. 3).
- Creature cards have power, toughness, and mana cost; stronger
  creatures generally cost more resources (PDF p. 4; article p. 3).
- Each turn a player may play at most one land, and land in play
  supplies refreshed resources for playing creature cards from hand
  (PDF p. 4; article p. 3).
- Combat allows the active player to choose any subset of available
  creatures as attackers, while the non-active player assigns untapped
  blockers to at most one attacker each (PDF p. 4; article p. 3).
- The turn sequence in the simplified model is draw a card, choose
  attackers, assign blockers, resolve combat and possible lethal
  damage, play land/creature cards from hand, then switch active player
  roles (PDF p. 5; article p. 4).
- The authors implement three baseline player types for opponents and
  rollout strategies: expert rule-based, reduced rule-based, and random
  (PDF p. 5; article p. 4).
- The experimental deck is symmetric across both players and fixed in
  composition at 17 lands plus 23 creatures, with fixed unbiased deck
  orderings used to reduce variance (PDF pp. 12-13; article
  pp. 11-12).

Project inference: This environment is closer to Gwent than Poker or
Phantom because it is a hidden-hand card game with deck order, public
board development, and variable multi-card turn choices, but its
resource, combat, and interruption model differs substantially from
Gwent's round-and-row structure.

Project inference: The simplified M:TG model is more action-branching
heavy than Gwent because its key main-phase choice is an affordable
card subset; Gwent's engine usually exposes one legal command at a
time, so binary subset trees are an inspiration rather than an
immediate transplant.

## Information Model

- Hidden information comes from the opponent's unseen hand and from
  future shuffled-deck draws (PDF p. 2; article p. 1).
- The introduction stresses that M:TG involves substantial opponent
  modeling and inference about cards held in the opponent's hand and
  deck (PDF p. 3; article p. 2).
- Determinization treats hidden and random information as fully known
  in a sampled perfect-information problem, which lets standard MCTS
  machinery operate but inherits determinization weaknesses (PDF p. 3;
  article p. 2).
- The authors distinguish stochastic card draws from hidden opponent
  cards; both contribute to combinatorial growth in card-game search
  (PDF pp. 2-3; article pp. 1-2).
- The determinization survey warns that determinization cannot reason
  well about information gathering and information hiding, summarizing
  the "averaging over clairvoyance" problem (PDF p. 9; article p. 8).
- In the proposed M:TG approach, card draws are determinized lazily:
  the first time a tree reaches a card-draw state, it samples one draw
  and reuses that transition on later visits to the same tree state
  (PDF p. 10; article p. 9).
- Interesting card ordering attempts to avoid sampled deck orderings
  where the game is already so biased that the current player's
  decision has no rollout-level impact (PDF p. 11; article p. 10).
- The paper's experiments reduce variance by using preselected deck
  orderings that are not particularly biased toward either player (PDF
  p. 13; article p. 12).

Project inference: A Gwent adaptation must keep true hidden opponent
hand/deck identities out of the normal observation and UI surfaces even
if a search worker samples determinizations internally.

Project inference: The paper improves practical determinized search,
but it does not remove the need for a separate hidden-information
safety contract or later belief-modeling caution; a Gwent search
baseline should be evaluated for strategy-fusion, nonlocality, and
hidden-information leakage rather than accepted on win rate alone.

## Action Space

- The authors emphasize that players are not limited to one card per
  turn; as resources grow, the player can play any affordable subset
  of cards from hand, creating high branching factor (PDF p. 3; article
  p. 2).
- The simplified turn gives three main decisions: active-player
  attacker choice, non-active blocker assignment, and post-combat card
  play from hand (PDF p. 6; article p. 5).
- Attacking and blocking are combinatorial because multiple attackers
  may be selected and each attacker may be blocked by any subset of
  eligible defenders, with each defender assigned to at most one
  attacker (PDF p. 6; article p. 5).
- The expert rule-based player handles attacker choice, blocker choice,
  and main-phase card choice with separate heuristics (PDF pp. 6-8;
  article pp. 5-7).
- The reduced rule-based player chooses attacker subsets randomly,
  assigns blockers randomly, and plays non-dominated affordable card
  sets using randomized creature ordering (PDF p. 7; article p. 6).
- The authors estimate that if all chance outcomes are considered,
  two 60-card decks have an upper bound of `(60!)^2` deals; typical
  branching is still approximately 75-90 at 1 ply, 7000-8000 at 2 ply,
  and near one million at 3 ply (PDF p. 10; article p. 9).
- Dominated move pruning removes legal moves that play a proper subset
  of another available move, narrowing the branch factor using limited
  domain knowledge (PDF p. 11; article p. 10).
- The binary-tree variant constrains each decision node to at most two
  children representing whether to play a card or not, enabling the
  tree to look deeper for the same simulation budget (PDF pp. 11-12;
  article pp. 10-11).

Project inference: Gwent also has a variable legal action set, but its
core decision granularity is usually one command at a time rather than
M:TG's high-branching subset selection; this difference should shape
any direct transfer from the binary move-generation experiment.

## Policy / Search / Learning Method

- The paper uses MCTS and determinization, not supervised learning or
  neural reinforcement learning (PDF pp. 2-4; article pp. 1-3).
- The MCTS loop selects children through UCB or another method,
  expands leaves, rolls out to terminal states, and backpropagates
  rewards (PDF p. 4; article p. 3).
- The authors say their experiments commonly use a total number of
  simulations as the search limit (PDF p. 4; article p. 3).
- The baseline rule players provide both opponents and rollout policy
  candidates for MCTS (PDF p. 5; article p. 4).
- The ensemble determinization method uses several MCTS trees for the
  same root position, with each tree representing a possible future
  induced by lazily determinized card draws (PDF p. 10; article p. 9).
- Baseline later experiments use 40 trees and 250 simulations per tree,
  with a UCT constant of 1.5 and a total 10,000 simulation budget (PDF
  p. 13; article p. 12; Table I).
- The enhancements tested include interesting determinizations,
  negative loss reward, dominated move pruning, and binary tree
  structure (PDF pp. 13, 15-16; article pp. 12, 14-15).
- The best reported combinations center on binary trees plus dominated
  move pruning, with root-level interesting simulations often useful
  and negative loss reward less robust (PDF pp. 16-17; article
  pp. 15-16).

Project inference: For Gwent, the likely near-term transfer is a
single-machine search baseline with deterministic seed control,
legal-move-only expansion, stochastic but legal heuristic rollouts, and
strict hidden-state sampling boundaries, not a learned policy.

## Training Data

Not applicable. The paper describes search, hand-authored rule players,
random test games, and human comparison games; it does not introduce a
learned model, offline training dataset, or supervised target corpus
(PDF pp. 5-17; article pp. 4-16).

## Self-Play Setup

Not applicable as training self-play. The experiments compare fixed
search/player variants against rule-based players and each other using
generated games and fixed deck orderings, but no policy is trained
through self-play (PDF pp. 7, 13-17; article pp. 6, 12-16).

## Evaluation Method

- The expert and reduced rule-based players are compared over 1,000
  randomly generated test games repeated 10 times, producing 10,000
  games and confidence interval information (PDF p. 7; article p. 6).
- The expert rule-based player is also compared against seven human
  opponents across 114 games, with separate first-player and
  second-player win rates reported (PDF pp. 7-9; article pp. 6-8).
- To reduce variance in MCTS experiments, the paper uses fixed deck
  orderings that are not particularly biased toward either player, and
  alternates player positions (PDF p. 13; article p. 12).
- The paper uses win-rate comparisons, round-robin tournaments,
  confidence intervals, CPU time per move, and Multiway ANOVA for
  enhancement analysis (PDF pp. 13-17; article pp. 12-16).
- The stated practical target is around one CPU second or less per
  decision for play against a human player (PDF p. 13; article p. 12).
- The all-possible-deals baseline establishes that branching chance
  nodes directly gives weak play in this environment (PDF p. 13;
  article p. 12).
- The determinization-count experiments choose 40 determinizations with
  250 simulations per tree as a practical 10,000 simulation setting
  after finding the best number of determinizations usually between 20
  and 100 for that budget (PDF p. 14; article p. 13).
- The combination experiments report performance versus the expert
  rules player, with the strongest `BT + MP` combinations near or just
  above 50% (PDF pp. 16-17; article pp. 15-16).

Project inference: Gwent can reuse the paper's evaluation shape:
fixed-seed/deal suites, mirrored seating where relevant, large matchup
batches, wall-clock/CPU budget reporting, and confidence intervals.
However, Gwent should also add hidden-info leak tests and regression
baselines because this paper's evaluation target is playing strength,
not product safety.

## Difficulty / Human-Likeness Notes

- The paper says the Xbox Live Arcade M:TG AI appeared plausible for a
  beginner but not strong enough to challenge an average player (PDF
  p. 3; article p. 2).
- Human comments on the expert rule-based player said it generally
  made good decisions but was sometimes too cautious, letting humans
  win games they thought they should have lost (PDF p. 9; article
  p. 8).
- The paper says forward-search players can make weak moves in very
  strong winning or losing positions unless the search is kept under
  pressure (PDF p. 12; article p. 11).
- Discounting rewards and using negative loss reward are presented as
  ways to create urgency or delay losses, but negative loss reward is
  weaker than BT, MP, and IR in the reported combination analysis (PDF
  pp. 12, 16; article pp. 11, 15).

Project inference: The paper supports adding pressure/urgency
heuristics to avoid visibly passive Gwent AI, but it does not by itself
define human-like difficulty tiers or intentional mistake models.

## Compute Requirements

- The MCTS background states that the algorithm usually stops at a
  time limit or a simulation-count limit, and the paper commonly uses
  a total simulation count in experiments (PDF p. 4; article p. 3).
- The simplified M:TG chance space remains huge: two 60-card decks
  imply an upper bound of `(60!)^2` possible deals if card draws are
  branched explicitly (PDF p. 10; article p. 9).
- Even with repeated card copies and only about 20 cards often drawn
  from each deck, the paper reports approximate branching factors of
  75-90 at 1 ply, 7000-8000 at 2 ply, and near one million at 3 ply
  when chance outcomes are considered directly (PDF p. 10; article
  p. 9).
- Experiments were run in C# on server machines, with reported CPU
  times normalized to an Intel Xeon X5460 server with 4GB RAM (PDF
  p. 13; article p. 12).
- With 10,000 simulations, the authors report decision times around
  0.62 seconds for one tree, 1.12 seconds for 50 trees, and 14.01
  seconds for 1,000 trees due in part to implementation inefficiencies
  in combining trees (PDF p. 14; article p. 13).
- Table IV reports average CPU times per move of 0.75 seconds for the
  baseline, 1.00 seconds for root interesting search, 1.00 seconds for
  dominated move pruning, 0.23 seconds for binary trees, and 9.81
  seconds for leaf interesting search (PDF p. 15; article p. 14).
- The 100,000 rollout experiments are described as requiring roughly
  five to ten times as much CPU time per trial as the 10,000 rollout
  combination experiments (PDF p. 17; article p. 16).

Project inference: A Gwent implementation should start with strict per-
decision budgets and benchmark both simulation count and wall-clock
time, because extra simulations do not automatically improve strength
when branching remains too broad.

## What This Paper Establishes

This paper establishes that ensemble determinization can materially
improve MCTS playing strength in a simplified hidden-card CCG compared
with a naive all-possible-deals MCTS baseline (PDF pp. 13-14; article
pp. 12-13).

It establishes that the paper's best enhancement combinations,
especially binary trees with dominated move pruning, can reach roughly
expert-rule-player strength in the simplified M:TG setting, despite not
using the expert player's full hand-authored decision policy (PDF
pp. 16-17; article pp. 15-16).

It establishes that rollout policy choice matters: stochastic reduced-
rule rollouts are better in these experiments than fully deterministic
expert-rule rollouts, while uniformly random rollouts are weak (PDF
pp. 14, 17; article pp. 13, 16).

It establishes a useful evaluation pattern for small-team search
experiments: fixed budgets, fixed orderings to reduce variance,
position alternation, CPU reporting, matchup tables, confidence
intervals, and ANOVA for enhancement interactions (PDF pp. 13-17;
article pp. 12-16).

## What This Paper Does Not Establish

- It does not establish a full-M:TG AI result, because the environment
  omits the wider range of card types and interactions that the authors
  identify as future work (PDF p. 18; article p. 17).
- It does not establish that determinization is theoretically sound in
  all hidden-information games; the paper explicitly cites strategy
  fusion, nonlocality, and averaging-over-clairvoyance limitations (PDF
  pp. 3, 9; article pp. 2, 8).
- It does not establish Nash-equilibrium convergence or low
  exploitability; CFR/MCCFR appears only in the background comparison
  to poker work (PDF p. 10; article p. 9).
- It does not establish neural self-play, supervised learning,
  reinforcement learning, or AlphaZero-style transfer (PDF pp. 1-19;
  article pp. 1-18).
- It does not establish a final Gwent AI method by itself; Gwent still
  needs PIMC/determinization caution, ISMCTS, evaluation-ladder, and
  hidden-info-safety annotations synthesized into a project-specific
  spec.

## Relevance To Gwent AI

- **Direct implementation candidate:** The paper is relevant to a near-
  term Gwent search baseline because it targets a hidden-card CCG with
  stochastic deck order and variable legal actions using MCTS plus
  determinization (PDF pp. 2-3, 10; article pp. 1-2, 9).
- **Search-shaping techniques:** Gwent can evaluate ensemble
  determinization, legal-move pruning, urgency/discounted rewards, and
  stochastic heuristic rollouts as small experiments before considering
  heavier ML work (PDF pp. 11-17; article pp. 10-16).
- **Evaluation discipline:** The paper supports fixed-seed/deal
  matchup suites, mirrored seating, confidence intervals, CPU budgets,
  and ablation tables for future Gwent AI phases (PDF pp. 13-17;
  article pp. 12-16).
- **Limited binary-tree transfer:** Binary decomposition is relevant
  where Gwent decisions can be treated as subsets or ordered choices,
  but normal Gwent play is already command-granular through engine
  legal moves, so this should be treated as optional search-structure
  research rather than a default architecture.

Project inference: The smallest faithful Gwent experiment inspired by
this paper is a deterministic, hidden-info-safe search worker that
samples legal hidden hands/deck orders from the acting perspective,
runs a fixed number of determinizations under a fixed wall-clock or
simulation budget, uses legal engine commands only, rolls out with a
stochastic heuristic policy, and reports win rate plus CPU time against
existing heuristic baselines on fixed seeds.

## Risks For Adaptation

- **Determinization pathologies:** Strategy fusion, nonlocality, and
  averaging over clairvoyance remain risks because the paper improves
  practical performance without eliminating those theoretical problems
  (PDF pp. 3, 9; article pp. 2, 8).
- **Simplified-domain overfit:** The reported result comes from a
  simplified creature/land Magic model, not the full commercial card
  set or Gwent's row, round, weather, leader, pass, and card-retention
  dynamics (PDF pp. 4, 18; article pp. 3, 17).
- **Branching mismatch:** Binary tree and dominated-move pruning target
  M:TG subset-selection moves; forcing those techniques into Gwent
  could add complexity without benefit if the engine legal-move surface
  is already narrow enough.
- **Rollout bias:** The paper shows that stronger hand-authored
  rollouts can be worse than weaker stochastic rollouts, so Gwent
  should not assume that the strongest existing heuristic policy is the
  best rollout policy (PDF pp. 14, 17; article pp. 13, 16).
- **Compute illusion:** Extra simulations do not guarantee improvement;
  without branching control, 100,000 rollout non-BT variants can be no
  better or worse than lower-budget variants (PDF p. 17; article
  p. 16).
- **Hidden-info leakage:** A Gwent implementation must not expose true
  hidden card identities in UI, default observations, logs, datasets, or
  search diagnostics, even if sampled determinizations contain concrete
  hidden cards internally.

## AI-Roadmap Decision

1. **Source category:** Direct implementation candidate for a search
   baseline, with supporting benchmark-methodology value.
2. **Game class:** Hidden-information card game / imperfect-information
   stochastic game, but in a simplified Magic environment rather than
   full Gwent.
3. **Method family:** MCTS with ensemble determinization, not CFR,
   neural self-play, supervised learning, or reinforcement learning.
4. **Action space:** Supports variable legal action sets and high-
   branching compound moves; the binary-tree technique is specific to
   subset-style decisions.
5. **Evaluation methodology:** Provides practical methodology through
   fixed deck orderings, player-position alternation, win-rate
   matchup tables, confidence intervals, CPU-time reporting, and ANOVA
   for enhancement interactions.
6. **Agent scope:** Supports a search agent for a fixed deck/rules
   environment; it does not establish global deck-conditioned agents or
   faction specialists.
7. **Smallest faithful experiment:** Implement a Gwent ensemble-
   determinization baseline with fixed seed suites, strict per-decision
   budget, legal-command-only rollouts, stochastic heuristic rollout
   policy, hidden-state sampling from the acting perspective, hidden-
   info leak tests, and matchup reporting against current heuristic
   baselines.
8. **Adaptation risk:** Misleading adaptation would rely on true hidden
   information, report only weak-opponent win rate, ignore strategy-
   fusion/nonlocality cautions, or port M:TG-specific subset pruning
   into Gwent without a branching-factor benchmark.
9. **Roadmap effect:** This source should affect future Cluster F
   search-baseline specs and evaluation-ladder design, but it should
   not trigger immediate neural training or Nash/equilibrium claims.

Project inference: `cowling2012ensemble` should be cited alongside the
completed `cowling2012ismcts` annotation as support for a practical
determinized-search baseline. Before implementation, Cluster F should
still annotate `long2010pimc` or an equivalent determinization-caution
source so the acceptance criteria explicitly test for known PIMC
failure modes.
