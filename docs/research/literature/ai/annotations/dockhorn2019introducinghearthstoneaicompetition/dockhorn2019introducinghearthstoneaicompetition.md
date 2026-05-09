---
citekey: dockhorn2019introducinghearthstoneaicompetition
title: "Introducing the Hearthstone-AI Competition"
authors:
  - "Alexander Dockhorn"
  - "Sanaz Mostaghim"
year: 2019
venue: "arXiv 1906.04238"
doi: ""
arxiv: "1906.04238"
project_relevance: benchmark-methodology
method_family: other
information_model: partially-observable
action_space: variable-legal-set
source_manifest: "docs/research/literature/ai/source/dockhorn2019introducinghearthstoneaicompetition/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/dockhorn2019introducinghearthstoneaicompetition/source.pdf"
pages_read: "1-4"
status: "complete"
---

## Summary

This first batch covers the full local four-page PDF for Alexander
Dockhorn and Sanaz Mostaghim, "Introducing the Hearthstone-AI
Competition," arXiv:1906.04238, a short competition-framework paper for
Hearthstone AI agents and collectible card game benchmark challenges
(PDF pp. 1-4).

The paper frames collectible card games as difficult AI benchmarks
because they combine hidden information, many card effects, randomness,
deck construction, card synergies, and a dynamic meta-game (PDF p. 1).

The competition framework is based on the community-driven C#
SabberStone simulator and adds helper classes for agents that receive a
partial-observation `POGame` state instead of full hidden opponent
information (PDF p. 3).

The paper defines two initial Hearthstone-AI'19 competition tracks:
Premade Deck Playing and User Created Deck Playing, both evaluated with
round-robin win-rate ranking and repeated matches to account for card
draw randomness (PDF p. 3).

After explicit finalization, this annotation treats the paper as a
benchmark-methodology and CCG-engineering source for hidden-safe
simulator harnesses, tournament tracks, repeated-match evaluation, and
response-time telemetry (PDF pp. 1, 3-4).

## Paper Claims

- The Hearthstone-AI framework and competition motivate AI agents for
  collectible card games, whose challenges include many cards, deck
  choice, card synergies, randomness, and restricted information during
  a player's turn (PDF p. 1).
- The paper positions Hearthstone-AI as an additional benchmark beside
  game AI benchmarks and competitions such as Chess, Go, Poker,
  Pac-Man, StarCraft, ALE, and GVGAI (PDF p. 1).
- The authors state that collectible card games include partial
  observable state space because agents do not know their future draws,
  the opponent deck, or the opponent hand (PDF p. 1).
- The authors state that Hearthstone contains more than 2000 different
  cards, whose unique effects increase game-tree complexity (PDF p. 1).
- The authors state that Hearthstone card effects often involve
  randomness, requiring agents to adapt strategies after observed
  outcomes (PDF p. 1).
- The authors state that deck-building creates card-synergy challenges,
  because card combinations can be stronger than cards in isolation
  (PDF p. 1).
- The authors state that a dynamic meta-game affects winning odds
  through the rate at which other decks are played and can help predict
  enemy moves from observed cards (PDF p. 1).
- Hearthstone is described as a turn-based digital collectible card
  game in which two players use self-constructed class decks and try to
  reduce the opponent hero's health from 30 to 0 (PDF p. 2).
- A Hearthstone deck contains 30 cards selected from more than 2000
  available cards, and cards or game mechanics are added through regular
  updates (PDF p. 2).
- Hearthstone cards are described as minions, spells, or weapons, with
  minions having attack, health, mana cost, optional type, and effects;
  spells activating effects at mana cost; and weapons equipping the
  player hero with durability-limited attacks (PDF p. 2).
- The paper describes common deck categories as aggro, mid-range, and
  control, with different strategic styles and different implications
  for game length and branching factor (PDF p. 2).
- The Hearthstone-AI competition is based on the C# SabberStone
  simulator and extends it with helper classes for agent access to the
  current game state limited to human-observable variables (PDF p. 3).
- Agents inherit from `AbstractAgent`; setup and teardown hooks exist
  at session and game boundaries through `InitializeAgent`,
  `FinalizeAgent`, `InitializeGame`, and `FinalizeGame` (PDF p. 3).
- During play, the framework calls `GetMove` whenever the agent must
  choose an action and passes a `POGame` object representing the
  partially observed game state (PDF p. 3).
- The `POGame` object contains visible board information, the agent's
  remaining deck cards, the agent's hand cards, and the number of cards
  in the opponent hand, while opponent deck and hand cards are replaced
  by dummy cards (PDF p. 3).
- The agent receives 60 seconds of computation time to return actions
  step-wise and end its turn; if the turn is not ended, the returned
  action is processed irreversibly and an updated game state is returned
  for the next action request (PDF p. 3).
- Games continue until a winner is determined or a maximum number of
  turns, defaulting to 50, is exceeded, at which point the game ends in
  a draw (PDF p. 3).
- `POGameHandler` controls multiple-game simulation and reports
  `GameStats` with wins, draws, losses, and total and average response
  times per agent (PDF p. 3).
- The Premade Deck Playing track gives participants six decks and plays
  all combinations against each other, while only three of six decks are
  known to developers before final submission (PDF p. 3).
- The User Created Deck Playing track lets participants create their
  own decks or choose decks available online, emphasizing deck-agent
  combinations and agent optimization for the chosen deck (PDF p. 3).
- The competition ranks agents by average win rate in round-robin
  tournament play, with possible sub-tournaments for large participant
  counts and repeated matches to account for card draw randomness (PDF
  p. 3).
- The authors plan to make submissions publicly available after
  competition evaluation to support incremental agent improvements (PDF
  p. 3).
- Future competition tracks proposed by the paper include deck-building,
  draft mode deck-building, and game balancing or card generation (PDF
  p. 4).

## Game / Environment Model

- The environment is Hearthstone, a two-player digital collectible card
  game with self-constructed decks, classes, mana, hands, decks, minion
  boards, heroes, weapons, and history as board elements (Fig. 1, PDF
  p. 2).
- The game has hidden zones: the agent does not observe opponent hand
  cards or opponent deck cards directly in the competition framework
  (PDF p. 3).
- The paper's competition environment exposes a partial-observation
  object to agents and simulates repeated games through `POGameHandler`
  (PDF p. 3).
- Project inference: For Gwent, the closest transfer is not
  Hearthstone rules but a hidden-safe simulator harness that exposes
  public board state, own legal/hand data, safe opponent counts, and
  repeated match statistics.

## Information Model

- The paper explicitly lists partial observable state space as a core
  collectible-card-game challenge, including unknown future draws,
  opponent deck, and opponent hand cards (PDF p. 1).
- The competition framework replaces opponent deck and hand cards with
  dummy cards in the agent's `POGame` state to preserve hidden
  information (PDF p. 3).
- The framework still reveals the number of cards in the opponent hand
  as part of the partial-observation object (PDF p. 3).
- Project inference: This supports the project's existing hidden-info
  boundary that default AI observations may include public opponent
  counts but must not include hidden opponent card identities.

## Action Space

- The paper describes step-wise action selection: the agent returns a
  set of actions, the framework processes returned actions
  irreversibly if the turn has not ended, and then asks for the next
  action from an updated state (PDF p. 3).
- The paper does not define a fixed global action vector, neural action
  head, or action-mask tensor for Hearthstone agents (PDF pp. 1-4).
- The paper does not enumerate all legal action encodings in the short
  introduction; it describes the competition framework's action-return
  loop at the agent API level (PDF p. 3).
- Project inference: The paper is more compatible with an engine-legal
  action API than with illegal-action penalties, but it does not specify
  the Gwent command schema or a reusable action vocabulary.

## Policy / Search / Learning Method

- The paper introduces a competition framework rather than a specific
  policy, search algorithm, or learning method (PDF pp. 1, 3-4).
- The framework provides lifecycle hooks that can load, store, set up,
  and update strategy information at session and game boundaries (PDF
  p. 3).
- The paper states that the competition aims to motivate development of
  autonomously playing agents for Hearthstone, but it does not prescribe
  MCTS, CFR, reinforcement learning, supervised learning, or heuristic
  search as the required method (PDF p. 1).
- Project inference: For Gwent, this paper should inform benchmark
  harness shape and observation safety, not choose the gameplay policy.

## Training Data

- The paper does not provide a training dataset or replay corpus for
  agent learning (PDF pp. 1-4).
- The framework can call initialization/finalization hooks at session
  and game boundaries, which the authors say can be used to load/store
  information, set up a strategy, or update it from game outcomes (PDF
  p. 3).
- The authors plan public availability of submissions after competition
  evaluation, which can support incremental agent improvement but is not
  described as a formal training dataset (PDF p. 3).
- Project inference: A Gwent adaptation would need its own match logs,
  seeds, deck labels, and observation schema if training data is needed.

## Self-Play Setup

- The paper does not define self-play training; it defines competition
  tracks and tournament evaluation for submitted agents (PDF pp. 3-4).
- The two initial tracks compare agents in Premade Deck Playing and
  User Created Deck Playing under tournament play (PDF p. 3).
- Project inference: A Gwent implementation could reuse repeated
  agent-vs-agent tournament structure for evaluation, but self-play
  improvement remains a separate algorithmic choice.

## Evaluation Method

- The competition uses round-robin tournaments to determine average win
  rate and rank agents (PDF p. 3).
- If participant count makes a full round robin infeasible, the paper
  proposes multiple sub-tournaments followed by a round robin among the
  best performing agents (PDF p. 3).
- Matches are repeated multiple times to accommodate randomness in card
  draw (PDF p. 3).
- `GameStats` reports wins, draws, losses, and total and average
  response times per agent at the end of a simulation session (PDF p.
  3).
- Project inference: This supports a Gwent benchmark harness that
  reports matchup win/draw/loss records and response-time telemetry,
  but the paper does not define Glicko/TrueSkill, exploitability, fixed
  seeds, or anti-overfitting controls.

## Difficulty / Human-Likeness Notes

- The paper does not discuss human-like play or controllable difficulty
  tiers (PDF pp. 1-4).
- The paper says only three of six premade decks are known before final
  submission in that track, encouraging agents to infer and use
  opponent deck characteristics rather than overfit to all final decks
  known in advance (PDF p. 3).
- Project inference: Hidden final decks are a benchmark robustness
  idea, not a human-likeness method.

## Compute Requirements

- The competition framework grants agents 60 seconds of computation
  time during a turn to return actions step-wise (PDF p. 3).
- The paper's reported framework statistics include total and average
  response times per agent (PDF p. 3).
- The paper does not report GPU requirements, cluster training budgets,
  neural network sizes, or large-scale self-play compute (PDF pp. 1-4).
- Project inference: For local Gwent benchmarking, response-time limits
  and telemetry are more directly portable than any specific compute
  stack.

## What This Paper Establishes

- It establishes Hearthstone-AI as a CCG competition framework built on
  SabberStone with a partial-observation agent API (PDF p. 3).
- It establishes hidden opponent hand/deck replacement with dummy cards
  as an explicit framework-level information-safety mechanism (PDF p.
  3).
- It establishes two initial CCG benchmark tracks: premade-deck play
  and user-created-deck play (PDF p. 3).
- It establishes round-robin average win-rate ranking, repeated matches
  for draw randomness, and response-time telemetry as competition
  evaluation elements (PDF p. 3).
- It establishes planned future benchmark tasks for deck-building,
  draft deck-building, and game balancing or card generation (PDF p. 4).

## What This Paper Does Not Establish

- It does not establish Hearthstone rules as a model for Gwent rules
  or scoring (PDF pp. 1-4).
- It does not define a Gwent AI policy, search algorithm,
  self-play-learning algorithm, CFR method, or neural architecture (PDF
  pp. 1-4).
- It does not define a fixed action tensor, legal-action mask, or
  engine command schema (PDF pp. 1-4).
- It does not provide a Gwent benchmark dataset, a fixed seed suite, an
  exploitability metric, Glicko/TrueSkill ratings, or a formal
  anti-overfitting protocol (PDF pp. 1-4).
- It does not show comparative agent results inside the local paper;
  it points readers to competition resources for more information (PDF
  pp. 1, 4).

## Relevance To Gwent AI

- Project inference: This paper is directly relevant to the shape of a
  Gwent AI benchmark harness because it documents a CCG competition API
  that exposes partial observations instead of full hidden opponent
  hand and deck identities (PDF p. 3).
- Project inference: The strongest transferable pattern is the
  hidden-safe observation contract: an agent may see public board state,
  its own visible/private state, and opponent hand count while hidden
  opponent card identities are replaced by dummy values (PDF p. 3).
- Project inference: The second transferable pattern is tournament
  reporting: repeated matches, win/draw/loss records, response-time
  telemetry, and round-robin or staged round-robin ranking are
  appropriate benchmark-harness features for Gwent agent evaluation
  (PDF p. 3).
- Project inference: The Premade Deck track is useful for Gwent
  robustness testing because only part of the deck set is known before
  final submission, but a Gwent adaptation should express that as held-
  out deck/faction/seed suites rather than importing Hearthstone deck
  rules (PDF p. 3).
- Project inference: The User Created Deck track is useful as a later
  deck-conditioned-agent benchmark concept, but it should wait until
  this project has stable deck validation, baseline agents, and a
  hidden-safe evaluation harness (PDF p. 3).
- Project inference: Future Gwent benchmark tracks could mirror the
  paper's separation between play-only evaluation and later
  deck-building/draft/balancing tasks, but the near-term Cluster F
  priority should remain playable-agent evaluation before deck-building
  or card-generation AI (PDF pp. 3-4).

## Risks For Adaptation

- Project inference: The largest adaptation risk is treating
  Hearthstone mechanics as Gwent mechanics. The paper describes
  Hearthstone health, mana, minions, spells, weapons, secrets, fatigue,
  and 30-card decks, none of which should override Gwent's engine rules,
  rows, round structure, gems, scoring, or legal command model (PDF
  p. 2).
- Project inference: A second risk is overclaiming algorithmic support.
  The paper introduces a competition framework and does not prescribe
  MCTS, ISMCTS, CFR, reinforcement learning, supervised learning, or
  heuristic search as the gameplay method (PDF pp. 1, 3-4).
- Project inference: The partial-observation API pattern must be
  adapted conservatively. Gwent observations may expose opponent counts
  and public state, but default agents must not receive hidden opponent
  hand identities or raw hidden deck order; the paper's dummy-card
  replacement supports this boundary rather than weakening it (PDF
  p. 3).
- Project inference: A repeated-match win-rate tournament can be
  misleading if deck/faction/seed coverage is narrow. The paper repeats
  matches for card draw randomness, but it does not define a Gwent fixed
  seed suite, matchup matrix, held-out seed policy, or anti-overfitting
  protocol (PDF p. 3).
- Project inference: Response-time limits should be treated as
  benchmark configuration, not game logic. The paper grants agents 60
  seconds during turns, but Gwent should choose a local timing policy
  that fits the engine, CLI/CI environment, and target agent class (PDF
  p. 3).
- Project inference: Public release of submitted agents can improve
  incremental progress, but it can also encourage benchmark gaming if
  no held-out decks, seeds, or opponent policies exist (PDF p. 3).

## AI-Roadmap Decision

1. **Source category.** Benchmark-methodology and CCG engineering
   reference. It is not a direct gameplay-policy implementation source
   because the paper defines a competition framework rather than an AI
   algorithm (PDF pp. 1, 3-4).
2. **Game class.** Hidden-information card games / partially observable
   collectible card games. The paper explicitly identifies unknown
   future draws, opponent deck, and opponent hand as CCG information
   challenges (PDF p. 1).
3. **Method family.** Other / framework. It does not require self-play,
   search, supervised learning, reinforcement learning, CFR, or
   MCTS/ISMCTS; submitted agents can choose their own strategy while
   using the competition API (PDF pp. 1, 3).
4. **Action space.** Variable legal action API at the framework level,
   not a fixed global action vector. The agent returns actions
   step-wise from an updated partially observed game state, but the
   paper does not define an action mask tensor or Gwent command encoding
   (PDF p. 3).
5. **Evaluation methodology.** Adopt selectively: repeated matches,
   win/draw/loss `GameStats`, response-time telemetry, and round-robin
   or staged round-robin tournament ranking are useful. The paper does
   not provide rating systems, exploitability, fixed seed suites, or a
   complete anti-overfitting method (PDF p. 3).
6. **Agent scope.** Supports both global deck-conditioned agents and
   deck-specialized agents as benchmark concepts: the Premade Deck
   track aims toward playing any deck, while the User Created Deck
   track allows optimizing a deck-agent combination (PDF p. 3).
7. **Smallest faithful experiment.** Project inference: implement a
   hidden-safe Gwent benchmark runner that evaluates two existing legal
   Gwent agents over repeated matches across a small fixed deck/faction
   and seed matrix, exports win/draw/loss counts plus average response
   time, and never exposes hidden opponent card identities. This
   preserves the paper's partial-observation and tournament-harness
   claims without importing Hearthstone rules (PDF p. 3).
8. **Adaptation risk.** Project inference: adaptation becomes
   misleading if Gwent agents observe hidden opponent cards, if a
   Hearthstone-style action interface replaces engine legal commands, if
   the benchmark uses only one weak fixed opponent, or if win rate is
   reported without deck/faction/seed and response-time context (PDF
   p. 3).
9. **Roadmap effect.** This source should affect Cluster F benchmark
   harness specs and the long-term ML roadmap's evaluation-track
   language. It should not trigger immediate model training,
   deck-building AI, card-generation AI, or any engine rule change by
   itself (PDF pp. 3-4).
