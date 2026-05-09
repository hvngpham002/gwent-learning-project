---
citekey: kowalski2023competition
title: "Summarizing Strategy Card Game AI Competition"
authors:
  - "Jakub Kowalski"
  - "Radosław Miernik"
year: 2023
venue: "arXiv 2305.11814"
doi: ""
arxiv: "2305.11814"
project_relevance: benchmark-methodology
method_family: other
information_model: partially-observable
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/kowalski2023competition/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/kowalski2023competition/source.pdf"
pages_read: "1-8"
status: "complete"
---

## Summary

This first batch covers the full local eight-page PDF for Jakub
Kowalski and Radosław Miernik, "Summarizing Strategy Card Game AI
Competition," arXiv:2305.11814, a retrospective on five years of the
Strategy Card Game AI Competition (SCGAI) built around Legends of Code
and Magic (LOCM) (PDF pp. 1-8).

The paper presents LOCM as a small collectible card game designed for
AI research, simpler than commercial CCG engines and intended to let
researchers test algorithms and theoretical ideas quickly (PDF pp. 1-2).

The paper describes three LOCM rule versions, the CodinGame and
academic competition history, submitted agent families, tournament
results, and organizer advice for running game-based AI competitions
(PDF pp. 2-7).

This is not yet a completed annotation. The full local source is now
read, but the final `Relevance To Gwent AI`, `Risks For Adaptation`,
and `AI-Roadmap Decision` sections remain pending until explicit
finalization under the annotation workflow.

## Paper Claims

- The paper concludes five years of competitions based on LOCM, a small
  collectible card game designed to support AI research and algorithm
  development (PDF p. 1).
- LOCM was used in CodinGame community contests and in SCGAI at IEEE
  Congress on Evolutionary Computation and IEEE Conference on Games
  (PDF p. 1).
- The paper states that LOCM has supported publications on game-tree
  search, neural networks, evaluation functions, and CCG deckbuilding
  (PDF p. 1).
- The authors frame CCGs as difficult AI settings because they combine
  large action spaces, long-term planning, imperfect information,
  randomness, deckbuilding, and game-balancing challenges (PDF p. 1).
- SCGAI was organized from 2019 through 2022 and was intended to play a
  simplified-testbed role for CCG AI similar to microRTS for StarCraft
  AI contests (PDF p. 1).
- The Hearthstone AI Competition ran from 2018 to 2020 at IEEE
  Conference on Games, received 30-50 submissions per year, and used
  Premade Deck Playing and User Created Deck Playing tracks (PDF p. 1).
- The Hearthstone competition was based on the C#/.Net Core
  SabberStone simulator and required agents to implement a method that
  receives game state and returns an action, with a 30-second per-turn
  budget (PDF pp. 1-2).
- Winning Hearthstone competition strategies were mostly search based,
  including Rolling Horizon Evolution, MCTS, Pruned BFS, Dynamic
  Lookahead, ISMCTS with sparse sampling, and heuristic evaluation
  functions (PDF p. 2).
- The Hearthstone Data Mining Challenge used game states from random AI
  playouts to predict first-player win probability; its training set
  contained 3,250,000 states and its final test set contained 750,000
  states (PDF p. 2).
- The paper says many CCG game-playing approaches use MCTS variants,
  often with action-space reduction, better rollout policies, or state
  evaluation from heuristics or neural networks (PDF p. 2).
- The paper describes CCG deckbuilding and game balancing as related
  tasks often approached with evolutionary methods over card/deck
  representations and playout-based evaluation (PDF p. 2).
- LOCM is described as a CCG designed for AI research, with only a
  handful of mechanics and deterministic card effects; during battle,
  deck order is the only source of nondeterminism (PDF p. 2).
- The competitions used LOCM versions 1.0, 1.2, and 1.5; each version
  changed the game in a backward-incompatible way and slightly
  increased complexity (PDF p. 2).
- The organizers provided an online CodinGame arena, an offline Java
  referee, faster version-1.2 implementations in Nim and Rust, and
  OpenAI Gym environments from related authors (PDF p. 2).
- In LOCM 1.0, each match starts with a 30-turn fair arena draft where
  both players choose one of the same three offered cards, then proceeds
  to a battle phase (PDF p. 2).
- In LOCM 1.0, players start with 30 health and five runes at health
  thresholds; broken runes grant additional card draw on the next turn
  (PDF p. 3).
- LOCM turns increase max mana up to 12, recharge mana, draw cards up
  to an eight-card hand limit, allow card play and creature attacks, and
  end when at least one player reaches zero or negative health (PDF p.
  3).
- LOCM cards are creatures or items; creatures can remain on board,
  attack once per turn after the summoning turn, and use keywords such
  as breakthrough, charge, drain, guard, lethal, and ward (PDF p. 3).
- LOCM item cards are green, red, or blue, with green items applied to
  own creatures, red items applied to enemy creatures, and blue items
  similar to red but also usable directly on the opponent (PDF p. 3).
- LOCM 1.2 splits the board into two lanes of size three, changing the
  game-tree shape and the importance of keywords such as Guard and
  Lethal (PDF p. 3).
- LOCM 1.5 replaces the draft with a construction phase because
  versions 1.0 and 1.2 showed that hardcoding the whole draft phase
  could make the game effectively single-phase (PDF p. 3).
- LOCM 1.5 generates a new card set for each match to force agents to
  generalize across possible cards, including extreme or useless cards
  (PDF p. 3).
- The LOCM 1.5 construction phase is one four-second turn in which
  agents see 120 cards and may pick up to 30, with at most two copies of
  each (PDF p. 4).
- LOCM 1.5 introduces Area ability behavior for creatures and items and
  removes the rune mechanic, replacing it with additional card draw for
  health lost in the previous round (PDF p. 4).
- The first LOCM CodinGame competition lasted 24 hours and gathered 742
  participants; the second began two days later, lasted 30 days, and
  received 2174 submissions (PDF p. 4).
- CodinGame agents used standard input/output text protocols, more than
  25 programming languages, and an in-browser coding environment (PDF
  p. 4).
- In CodinGame LOCM, handcrafted or experimentally adjusted fixed card
  orderings dominated draft, while handcrafted rule-based agents
  dominated battle; the best players used Minimax or MCTS variants with
  move ordering, pruning, and lethal-move detection (PDF p. 4).
- In SCGAI 2019-2021, academic agents were not restricted by language,
  had lower memory limits, and had doubled standard battle-turn time
  compared with prior settings (PDF p. 4).
- To reduce result noise, academic SCGAI evaluated agents on fixed
  randomly sampled decks, repeated each seed ten times with identical
  card ordering, and mirrored matches to account for first/second player
  advantage (PDF p. 4).
- CEC 2019 received six submissions, all stronger than organizer
  baselines; Coac won with a depth-three minimax-like search using
  alpha-beta and heuristic pruning (PDF p. 4).
- COG 2019's ProphetCoac tried to predict the opponent hand from draft
  observations and already-played cards to reduce branching factor, but
  the modification reduced win rate, likely by leaving less time for
  search (PDF p. 4).
- CEC 2020 included the first neural-network entrant,
  ReinforcedGreediness, which used self-play reinforcement learning for
  draft and best-first search with Bayesian-optimized handcrafted
  features for battle (PDF p. 4).
- COG 2022 used LOCM 1.5, replaced draft with construction, added Area,
  broke compatibility with previous agents, and made fixed card
  orderings unusable because cards were randomly generated per match
  (PDF pp. 4-5).
- In COG 2022, four of six submissions used neural networks, two
  trained with Proximal Policy Optimization and two with other
  reinforcement-learning algorithms (PDF p. 5).
- Across SCGAI there were 22 unique submitted agents, grouped by the
  authors into search-based, neural-network-based, and other agents
  (PDF p. 5).
- Baseline agents were intentionally simple, intended to present game
  rules and provide better training opponents than random agents, and
  relied on the game engine ignoring invalid actions (PDF p. 5).
- Search-based agents were the most common and won all competitions
  using LOCM 1.2; they generally used explicit or implicit move pruning
  and most implemented lethal-move detection (PDF p. 5).
- The paper states that searching through the opponent turn can help,
  but requires additional pruning and heuristic evaluation because of
  exploding branching factor (PDF p. 5).
- Coac used fixed card ordering for draft and a minimax-like battle
  search of depth three or less with alpha-beta and heuristic pruning
  (PDF p. 6).
- ProphetCoac modified Coac with tentative opponent-hand prediction
  based on draft-visible cards and cards already played (PDF p. 6).
- ByteRL used one end-to-end policy trained with deep reinforcement
  learning and optimistic smooth fictitious play, with an architecture
  including an LSTM block; an adjusted LOCM 1.2 version won against COG
  2021 submissions by more than 20 percentage points over the runner-up
  (PDF p. 6).
- Inspirai used a heuristic construction-phase evaluator optimized from
  Coac with Bayesian optimization and a PPO-trained neural network for
  battle, with attention heads for card and target selection (PDF p. 6).
- Neural-network agents were less common in LOCM 1.2 competitions but
  dominated LOCM 1.5; no GPU was available during play, though some
  agents were trained using a GPU (PDF p. 6).
- The authors advise that game-based AI competitions can be useful test
  beds when the game itself exists or is a simplified version of one,
  and that variety in game genres can bring new algorithms or methods
  (PDF p. 7).
- The authors present CodinGame as a useful incubator for an academic
  competition, while noting its Java engine, text protocol, one-core,
  768MB, no-GPU, and 30-second summarized-execution constraints (PDF
  p. 7).
- The authors argue that AI competition submissions should require
  documentation so organizers can compare them without reading source
  code and future contestants can learn from them (PDF p. 7).
- To tame randomness, the authors recommend same game seeds for all
  agent pairs, repeated use of seeds, mirrored player configurations,
  and interleaving results from parallel or multi-machine runs (PDF p.
  7).
- The authors recommend publishing competition code, configurations,
  dependencies, raw result data, and aggregation scripts to support
  reproducibility (PDF p. 7).
- The conclusion states that SCGAI gathered 22 challengers across
  academia-based editions, ranging from simple rule-based approaches to
  search-based agents and deep reinforcement learning agents (PDF p.
  8).
- The paper states that SCGAI is officially considered closed, but all
  LOCM versions remain available online through CodinGame public
  leaderboards (PDF p. 8).

## Game / Environment Model

- The environment is LOCM, a small CCG inspired by commercial CCGs but
  simplified for AI research and fair AI-vs-AI matches (PDF pp. 1-2).
- LOCM has deck construction or draft, turn-based battle, mana, hands,
  deck order, creature/item cards, targetable effects, board lanes, and
  health-based win conditions (PDF pp. 2-4).
- LOCM was deliberately changed across versions 1.0, 1.2, and 1.5 to
  prevent stagnation and increase challenge (PDF pp. 2-4, 8).
- Project inference: For Gwent, LOCM is most useful as a small CCG
  benchmark analogue and competition-harness reference, not as a rules
  model for rows, rounds, gems, weather, leaders, or Gwent scoring.

## Information Model

- The paper frames CCGs generally as including imperfect information
  and randomness, alongside large action spaces and long-term planning
  (PDF p. 1).
- LOCM battle randomness is limited by design: the paper states that
  deck order is the only source of nondeterminism during battle (PDF
  p. 2).
- ProphetCoac used information from draft-visible cards and
  already-played cards to predict the opponent hand, indicating that
  opponent hidden hand uncertainty mattered for branching-factor control
  in submitted agents (PDF pp. 4, 6).
- The academic SCGAI evaluation reused the same random seeds and
  identical card ordering across repeated matches to reduce noise (PDF
  p. 4).
- Project inference: LOCM supports hidden-information and seed-control
  evaluation lessons for Gwent, but this paper does not define a formal
  information-set model, belief state, or safe observation schema.

## Action Space

- The paper repeatedly identifies large or exploding action spaces as a
  CCG/game-playing challenge and as a reason for action-space reduction,
  pruning, and heuristic evaluation in CCG agents (PDF pp. 1-2, 5).
- LOCM actions include drafting or constructing cards, playing cards,
  attacking with creatures, targeting items, and ending turns (PDF pp.
  2-4).
- Submitted agents used move ordering, pruning, lethal-move detection,
  and in one neural architecture attention heads for card and target
  selection (PDF pp. 4-6).
- The baseline agents relied on the engine ignoring invalid actions,
  but this is described as a baseline simplification rather than a
  recommended learning interface (PDF p. 5).
- Project inference: The paper supports treating variable legal action
  sets as a central benchmark issue, but it does not prescribe a fixed
  action vector, legal-action mask, pointer action representation, or
  Gwent command schema.

## Policy / Search / Learning Method

- Search-based agents were the most common submitted class and won all
  LOCM 1.2 competitions (PDF p. 5).
- Search-based agents used minimax-like search, MCTS, best-first search,
  flat simulation, online evolutionary planning, heuristic pruning,
  alpha-beta pruning, move ordering, and lethal-move detection (PDF pp.
  4-6).
- Neural-network agents became dominant in LOCM 1.5, with PPO and other
  reinforcement-learning methods among the 2022 submissions (PDF p. 5).
- ByteRL is described as an end-to-end deep reinforcement learning
  policy with optimistic smooth fictitious play and an LSTM-containing
  architecture (PDF p. 6).
- Inspirai combined a Bayesian-optimized heuristic evaluator for
  construction with PPO battle play and attention heads for card/target
  selection (PDF p. 6).
- Project inference: The paper surveys competition approaches and
  results; it is not by itself a proof that any single algorithm family
  should be adopted for Gwent without separate implementation and
  evaluation specs.

## Training Data

- The Hearthstone Data Mining Challenge, not LOCM itself, provided
  3,250,000 training states and 750,000 test states for win-probability
  prediction (PDF p. 2).
- LOCM-related neural agents were trained outside match execution in at
  least some cases, because no GPU was available during play but some
  agents were trained using a GPU (PDF p. 6).
- Some submitted agents tuned heuristic parameters offline using MCTS,
  evolutionary algorithms, harmony search, Bayesian optimization, or
  self-play reinforcement learning (PDF pp. 5-6).
- Project inference: A Gwent adaptation would need its own hidden-safe
  replay/export data and clear training/evaluation separation; this
  paper does not provide a reusable Gwent dataset.

## Self-Play Setup

- ReinforcedGreediness used self-play reinforcement learning for draft
  networks, trained independently for both sides (PDF p. 4, 6).
- ByteRL used deep reinforcement learning combined with optimistic
  smooth fictitious play (PDF p. 6).
- Other agents were rule-based, heuristic, search-based, or used
  offline parameter tuning rather than self-play as their core method
  (PDF pp. 5-6).
- Project inference: The paper shows self-play and fictitious-play
  methods appearing in successful LOCM entrants, but a Gwent self-play
  plan still needs separate action encoding, observation, reward,
  compute, and evaluation decisions.

## Evaluation Method

- CodinGame allowed agents to compete against others using a given game
  seed, which contributed to card-ordering mimicry among players (PDF
  p. 4).
- Academic SCGAI repeated games on fixed random seeds with identical
  card ordering and mirrored matches to account for first-player
  advantage (PDF p. 4).
- The paper reports competition rankings by place and win rate across
  CEC/COG events from 2019 through 2022 (Table I, PDF p. 5).
- The authors recommend same seeds for all agent pairs, repeated seed
  use, mirrored configurations, and interleaving parallel/multi-machine
  results to reduce randomness and resource-bias effects (PDF p. 7).
- The authors recommend publishing all competition code, configs,
  dependencies, raw result data, and aggregation scripts for
  reproducibility (PDF p. 7).
- Project inference: This is the paper's strongest direct benchmark
  contribution for Gwent: seed suites, mirrored sides, repeated games,
  reproducible configs, raw data, and aggregation scripts.

## Difficulty / Human-Likeness Notes

- The paper does not define human-like play or controllable difficulty
  tiers (PDF pp. 1-8).
- The paper notes that CodinGame community solutions often optimize for
  playing the game rather than novel algorithms or sophisticated
  methods (PDF p. 7).
- Marketing competitions among students can bring well-documented
  submissions that may evolve into theses and papers (PDF p. 7).
- Project inference: The paper may help structure benchmark opponents
  and baseline submissions, but it does not define player-facing Gwent
  difficulty calibration.

## Compute Requirements

- CodinGame constrained agents to one CPU core, 768MB RAM, no GPU, and
  at most 30 seconds of summarized agent execution time for the whole
  game (PDF p. 7).
- Academic SCGAI lowered memory limits to 256MB and disqualified agents
  using 1024MB or more; standard battle-turn time was doubled relative
  to the previous setting (PDF p. 4).
- LOCM 1.5 gave agents four seconds for the construction phase and kept
  other limits unchanged (PDF p. 5).
- Some neural agents were trained with GPUs, but no GPU was available
  during play (PDF p. 6).
- The authors state that pairwise comparison over enough matches
  requires notable CPU time and recommend publishing code and raw data
  for reproducibility (PDF p. 7).
- Project inference: Gwent benchmark specs should separate inference
  budgets from offline training budgets and record CPU/memory/time
  constraints explicitly.

## What This Paper Establishes

- It establishes LOCM/SCGAI as a multi-year small-CCG competition
  benchmark with CodinGame and IEEE CEC/COG history (PDF pp. 1, 4-5,
  8).
- It establishes fixed seeds, repeated games, and mirrored matches as
  practical tools for reducing CCG evaluation noise (PDF pp. 4, 7).
- It establishes that search, pruning, heuristic evaluation, neural
  policies, PPO, and OSFP-style learning all appeared in LOCM
  competition entrants (PDF pp. 4-6).
- It establishes that action branching, move ordering, pruning, and
  lethal-move detection were central practical concerns for successful
  LOCM agents (PDF pp. 4-6).
- It establishes organizer guidance around documentation, code/config
  publication, dependency documentation, raw result data, aggregation
  scripts, and infrastructure automation (PDF p. 7).

## What This Paper Does Not Establish

- It does not define Gwent rules, Gwent scoring, Gwent row mechanics,
  Gwent leader rules, or a Gwent deck format (PDF pp. 1-8).
- It does not provide a formal hidden-information model, belief update,
  exploitability metric, CFR derivation, or legal-action-mask algorithm
  (PDF pp. 1-8).
- It does not prove that MCTS, minimax, PPO, OSFP, or deep RL will work
  for the current Gwent engine without adaptation and evaluation (PDF
  pp. 4-6).
- It does not provide a reusable Gwent dataset, Gwent fixed seed suite,
  Gwent match-result schema, or Gwent-compatible tournament harness
  (PDF pp. 1-8).
- It does not define human-like play or product difficulty tiers (PDF
  pp. 1-8).

## Relevance To Gwent AI

- Project inference: This paper is directly relevant to Gwent's future
  benchmark harness because it documents a small CCG competition
  designed for AI research, intentionally simpler than commercial CCG
  engines, and used across CodinGame and IEEE CEC/COG settings (PDF pp.
  1-2, 4-5).
- Project inference: The strongest transfer to Gwent is evaluation
  protocol: fixed random seeds, repeated games on the same seeds,
  mirrored player configurations, and interleaved parallel results
  should become acceptance criteria for any serious local Gwent agent
  tournament or seed suite (PDF pp. 4, 7).
- Project inference: The paper's reproducibility guidance maps cleanly
  to Gwent benchmark artifacts: publish or store the agent configs,
  engine/catalog version, dependencies, raw match results, and
  aggregation scripts alongside summarized win rates (PDF p. 7).
- Project inference: The LOCM results support tracking action-branching
  and search-control behavior in Gwent experiments because successful
  LOCM 1.2 agents relied on move ordering, pruning, lethal-move
  detection, heuristic evaluation, and sometimes opponent-turn search
  under branching-factor pressure (PDF pp. 4-6).
- Project inference: The agent survey supports a staged Gwent AI ladder
  that compares trivial/rule-based baselines, search-based agents,
  heuristic agents, and later neural policies, while keeping each
  method's compute budget explicit (PDF pp. 5-7).
- Project inference: LOCM 1.5's randomly generated card construction is
  useful as a robustness concept for held-out content and generalization
  tests, but near-term Gwent work should express that as held-out
  seeds, decks, factions, or catalog snapshots rather than generated
  card rules (PDF pp. 3-5).
- Project inference: The paper reinforces the need to separate offline
  training resources from match-time inference limits: SCGAI play had
  CPU/memory/time limits and no GPU during play, even though some neural
  agents were trained with GPUs (PDF pp. 4, 6-7).

## Risks For Adaptation

- Project inference: The largest adaptation risk is treating LOCM rules
  as Gwent rules. LOCM health, mana, creatures, items, lanes, runes,
  Area effects, draft, and construction phases must not override
  Gwent's rounds, rows, gems, weather, leaders, scoring, or catalog
  rules (PDF pp. 2-4).
- Project inference: A second risk is overclaiming algorithmic evidence.
  The paper reports successful search, heuristic, PPO, and OSFP-style
  competition entrants, but it does not prove that any one method will
  work for the current Gwent engine without Gwent-specific
  implementation and evaluation (PDF pp. 4-6).
- Project inference: Fixed seeds are necessary for fair comparison but
  create overfitting risk if they become the only benchmark. A Gwent
  harness should pair public regression seeds with held-out seeds, deck
  suites, and faction matchups because the paper also shows how fixed
  card orderings and known content can be exploited (PDF pp. 3-4, 7).
- Project inference: The baseline-agent pattern of relying on the engine
  to ignore invalid actions is unsuitable for this project. Gwent AI
  interfaces should continue to dispatch exact legal engine commands
  rather than using invalid-action tolerance as a primary legality
  mechanism (PDF p. 5).
- Project inference: LOCM's simplified deterministic card effects and
  deck-order-only battle randomness make it easier to evaluate than a
  fuller Gwent engine with weather, leaders, graveyard effects, round
  carryover, and hidden/deck zones; benchmark conclusions may not
  transfer without measuring Gwent-specific branching and variance (PDF
  pp. 2-4).
- Project inference: The paper's competition results are win-rate
  rankings, not exploitability, equilibrium, or rating-system evidence;
  Gwent should combine this source with the existing rating and
  exploitability annotations before claiming a complete evaluation
  ladder (Table I, PDF p. 5).
- Project inference: The paper does not define a formal hidden-safe
  observation schema, so Gwent benchmark work must still preserve the
  project's own hidden-information boundary for opponent hand/deck
  identities (PDF pp. 1-8).

## AI-Roadmap Decision

Complete as a **benchmark-methodology and CCG-competition-engineering
source**.

Project inference: For the Gwent AI roadmap, this paper should inform
the evaluation-ladder and tournament-harness design before stronger AI
training claims. A future Gwent benchmark spec should include fixed
seed suites, repeated games, mirrored seats, explicit deck/faction
labels, raw result storage, aggregation scripts, dependency/config
capture, and documented CPU/memory/time budgets, all grounded in the
competition practices summarized by Kowalski and Miernik (PDF pp. 4,
7).

Project inference: The paper supports adding practical agent-comparison
metrics around branching factor, action count, response time, invalid
action rejection, and lethal-move or forced-line detection, because LOCM
competition performance repeatedly depended on pruning, move ordering,
heuristic search, and time/branching tradeoffs (PDF pp. 4-6).

Project inference: The paper does **not** authorize importing LOCM
mechanics, replacing Gwent's legal-command model, choosing PPO/OSFP/deep
RL as the next implementation step, claiming hidden-information
equilibrium properties, or treating win-rate tables as enough for a
complete evaluation ladder (PDF pp. 1-8).

Project inference: The near-term roadmap use is therefore a benchmark
design input, alongside the completed Hearthstone-AI competition
annotation and the rating/exploitability annotations. It should be cited
when specifying tournament protocol and reproducibility requirements,
not when justifying a specific Gwent gameplay policy or neural training
architecture.
