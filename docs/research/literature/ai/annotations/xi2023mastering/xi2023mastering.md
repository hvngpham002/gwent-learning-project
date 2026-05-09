---
citekey: xi2023mastering
title: "Mastering Strategy Card Game (Legends of Code and Magic) via End-to-End Policy and Optimistic Smooth Fictitious Play"
authors:
  - "Wei Xi"
  - "Yongxin Zhang"
  - "Changnan Xiao"
  - "Xuefeng Huang"
  - "Shihong Deng"
  - "Haowei Liang"
  - "Jie Chen"
  - "Peng Sun"
year: 2023
venue: "arXiv 2303.04096"
doi: ""
arxiv: "2303.04096"
project_relevance: training-method
method_family: mixed
information_model: imperfect
action_space: masked
source_manifest: "docs/research/literature/ai/source/xi2023mastering/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/xi2023mastering/source.pdf"
pages_read: "1-17"
status: "complete"
---

## Summary

This annotation now covers PDF pp. 1-17 of Wei Xi, Yongxin Zhang,
Changnan Xiao, Xuefeng Huang, Shihong Deng, Haowei Liang, Jie Chen, and
Peng Sun, "Mastering Strategy Card Game (Legends of Code and Magic) via
End-to-End Policy and Optimistic Smooth Fictitious Play," arXiv
`2303.04096v1`, dated 7 Mar 2023 (PDF p. 1).

The paper studies Legends of Code and Magic (LoCM) as a two-stage
strategy card game with card-deck building and battle stages whose
observation and action spaces differ across stages (PDF pp. 1, 6-8).

The paper proposes Optimistic Smooth Fictitious Play (OSFP) as a
two-player zero-sum Nash-equilibrium-seeking algorithm and combines it
with deep reinforcement learning as a smooth-best-response solver for
large multi-step games (PDF pp. 1-5).

The paper also proposes an end-to-end neural policy that trains card
building, battle policy, and value prediction through a single trajectory
and shared card representations (PDF pp. 7-8).

The first ten pages include the main method, LoCM environment model,
training setup, headline competition results, ablations, and the start
of the paper's MCTS discussion (PDF pp. 1-10).

The second batch covers the MCTS experiment result, ethics statement,
conclusion, references, reinforcement-learning and OSFP hyperparameters,
OSFP pseudocode, alternating-training pseudocode, and the appendix
algorithm for the paper's perfect-state MCTS experiment (PDF pp.
11-17).

The full local source is now read, and the final `Relevance To Gwent
AI`, `Risks For Adaptation`, and `AI-Roadmap Decision` sections are
complete.

## Paper Claims

- The paper says DRL plus fictitious play has shown strong results on
  benchmark games, but many such benchmarks are single-stage, while
  real decision problems may have multiple stages with different
  observation and action spaces (PDF p. 1).
- Strategy card games are framed as two-stage problems: card-deck
  building selects cards from a card pool, and battle uses cards drawn
  from that deck to fight the opponent (PDF p. 1).
- The authors study Legends of Code and Magic and propose an
  end-to-end policy function for the multi-stage problem (PDF p. 1).
- The paper states that most strategy card games are two-player
  zero-sum games and treats Nash equilibrium as the optimal-policy
  target in that setting (PDF p. 1).
- The authors propose OSFP to find a Nash equilibrium for large-scale
  multi-step games with last-iterate convergence, using deep
  reinforcement learning as the smooth-best-response sub-solver and
  opponent model sampling (PDF pp. 1, 3-5).
- The paper's stated contributions are OSFP with DRL as a smooth best
  response solver, an end-to-end policy function for multi-stage games,
  and validation on LoCM (PDF pp. 1-2).
- The method section formulates a finite two-player zero-sum game with
  player policies over feasible actions, a bilinear payoff, and a
  Nash-equilibrium condition where neither player can improve by
  unilateral deviation (PDF p. 2).
- The paper says multi-step turn-based games use a Treeplex policy
  space rather than a simple single-step simplex over actions (PDF p.
  2).
- Smooth Best Response adds a regularizer to the best-response
  objective so the best response is unique; the paper gives negative
  entropy as an example for a single-step game and cites Treeplex
  extensions for multi-step games (PDF p. 3).
- OSFP takes the smooth best response to a mixture of historical payoff
  vectors plus an extra current payoff vector that the paper interprets
  as an optimistic prediction of the opponent's future policy (PDF p.
  3).
- The paper contrasts OSFP with Smooth Fictitious Play / FTRL, saying
  average FTRL iterates converge to Nash equilibrium while actual
  iterates can cycle, whereas OSFP has last-iterate convergence (PDF p.
  3).
- The paper derives OSFP as equivalent to an Optimistic Mirror Descent
  implementation under the stated regularizer-domain condition, so the
  convergence and speed of OMD carry over to OSFP (PDF pp. 3-4).
- For large multi-step games, the paper says directly solving smooth
  best response is challenging because the policy vectors are
  high-dimensional, and proposes DRL using a conditional policy
  approximator, policy-gradient method, and opponent sampling (PDF p.
  4).
- The paper defines an information state as a decision point that may
  contain multiple world states in imperfect-information games; in its
  strategy-card example, the player sees own hand cards but not the
  opponent's hand cards (PDF p. 4).
- The paper connects sequence-form reach probabilities to a conditional
  policy over actions available at each information state (PDF pp. 4-5).
- The smooth-best-response objective is converted into stochastic
  gradient updates over sampled opponent policies and sampled rollouts
  (PDF p. 5).
- The paper uses policy-gradient reasoning at information states and
  adds a per-information-state regularizer that can be negative entropy
  (PDF pp. 5-6).
- The paper says standard RL techniques such as PPO or V-Trace can
  solve the resulting objective, and rollout segments can be used with
  value bootstrapping instead of whole trajectories (PDF p. 6).
- The paper describes strategy card games as more complex than chess or
  Go because of vivid rules, diversified card types and interactions,
  imperfect information about the opponent, and multi-stage decisions
  (PDF p. 6).
- LoCM is described as a machine-learning research SCG with simplified
  card effects and representations (PDF p. 6).
- LoCM 1.2 uses 160 fixed cards; its card-building stage randomly
  selects 90 cards and presents them over 30 rounds, with one card
  selected into the deck each round (PDF pp. 6-7).
- LoCM 1.5 uses 120 randomly generated cards, from which 30 are
  selected into the deck, and introduces area-of-effect behavior (PDF
  p. 7).
- The paper says earlier LoCM 1.2 submissions generally used separate
  card-building and battle methods, such as evolutionary, Bayesian, or
  expert/data-mined card scoring for deck building and MCTS or RL for
  battle (PDF p. 7).
- The authors call that separated approach Alternating Training and
  argue it can struggle with randomly generated LoCM 1.5 card pools and
  with unclear linkage between deck-quality metrics and battle win/loss
  (PDF p. 7).
- Their end-to-end policy uses one neural network to estimate card
  building policy, battle policy, and value function, treating an
  entire game as one trajectory containing both stages (PDF p. 7).
- The paper models LoCM as a two-player zero-sum imperfect-information
  game where opponent deck cards and hand cards are not observable; with
  a stationary opponent policy, it reduces to a POMDP (PDF p. 7).
- In the card-building stage, the observation includes selectable
  candidate cards and already selected deck cards; the action is a
  categorical distribution selecting one candidate card at each step
  (PDF p. 7).
- In LoCM 1.2, the card-building stage has 30 steps for each player,
  and the paper says all opponent observations and actions are forbidden
  to be observed (PDF p. 7).
- In LoCM 1.5, the authors split choosing 30 cards from 120 generated
  cards into 30 sequential steps and use a card-selection action mask
  depending on the game version (PDF p. 7).
- In battle, the observation includes self hand cards, self deck cards,
  cards on self and opponent lanes, and scalar features such as HP,
  mana, and remaining deck cards (PDF pp. 7-8).
- In battle, the action space is one categorical distribution over all
  possible actions, with an action mask zeroing illegal actions at the
  current time step (PDF pp. 7-8).
- The paper uses terminal reward +1 for a win and -1 otherwise (PDF p.
  8).
- The architecture uses a shared card embedding, a selected-cards
  feature, LSTM state, separate card-building and battle action heads,
  and one value head (Fig. 3, PDF pp. 7-8).
- The paper says the battle-stage reward signal can propagate backward
  into card-building parameters through BPTT and value bootstrapping
  (PDF p. 8).
- The paper trains with policy gradients, V-Trace value estimation,
  UPGO auxiliary loss, and negative entropy as the per-information-state
  regularizer (PDF p. 8).
- The related-work section positions Heinrich and Silver's NFSP work as
  combining fictitious play and deep RL with average-iterate convergence
  and a separate average-policy learner (PDF p. 8).
- The related-work section compares the paper to Stratego work using a
  single neural network but a discrete replicator-dynamics equilibrium
  method, while this paper uses OSFP with standard policy gradient as
  sub-solver (PDF pp. 8-9).
- The authors report winning both COG2022 LoCM tracks, with organizer
  result averages of 84.41% win rate in LoCM 1.5 and 94.56% in LoCM
  1.2 against other submissions (PDF p. 9).
- The internal evaluation in Table 1 averages each LoCM 1.5 head-to-head
  win rate over 2500 matches with random side switching (Table 1, PDF
  p. 9).
- The submitted LoCM 1.5 model was trained with 24 "Units" for around
  72 hours, where one Unit is one V100 GPU with 600 CPU cores and
  throughput was about 500K observations per second (PDF p. 9).
- The submitted LoCM 1.2 model was first trained with one Unit for
  three days and then with eight Units for six days (PDF p. 9).
- The card-embedding ablation uses 2500 random-side matches and reports
  53% win rate for shared selected-cards feature and 55% for shared card
  embedding (PDF p. 10).
- In Alternating Training ablations, the E2E scheme outperforms Evo-AT
  and Neural-AT under the reported settings in Table 3 (Table 3, PDF p.
  10).
- The evaluation-time temperature post-process uses argmax evaluation
  throughout, and a one-day model showed 53% win rate for tau = 0+
  compared with tau = 1.0 (PDF p. 10).
- The authors report that removing One Turn Kill logic from NeteaseOPD
  dropped that agent's average win rate by 2%, while adding OTK to their
  own submission did not significantly change win rate (PDF p. 10).
- The paper says its LoCM 1.2 IS-MCTS experiment used ground-truth world
  state instead of sampling feasible opponent hand/deck states, even
  though opponent hand and deck are not observable in LoCM (PDF p. 10).
- In Table 4, MCTS under the same resource budget ranged from 36% to
  56% win rate versus the no-MCTS baseline depending on the probability,
  expansion-count, and successive-state parameters (Table 4, PDF p. 11).
- In Table 5, the strongest listed MCTS parameter setting showed 56%
  win rate at 40 hours but only 52% at 80 hours and 51% at 144 hours
  against the baseline under the same resource budget and wall time
  (Table 5, PDF p. 11).
- The authors conclude that MCTS can produce higher-quality samples for
  some settings but reduces data-generation speed, and that its
  advantage diminishes with longer training; they therefore did not
  apply MCTS in the submitted approach (PDF p. 11).
- The ethics statement describes the work as an academic DRL study on
  strategy card games and says the authors do not support dishonorable
  future uses (PDF p. 11).
- The conclusion restates that the work won both COG2022 competitions,
  proposes an end-to-end policy for the two-stage game, and proposes
  OSFP for finding Nash equilibrium in a two-player zero-sum game (PDF
  p. 11).
- The reference list includes gym-locm, the LOCM COG22 page, Cowling et
  al. ISMCTS, Heinrich and Silver NFSP, Perolat et al. Stratego,
  TLeague, and related DRL / game-learning / optimization sources (PDF
  pp. 11-14).
- Table 6 lists reinforcement-learning hyperparameters: V-Trace policy
  gradient weight 1.0, UPGO policy gradient weight 1.0, value loss
  weight 1.0, entropy penalty 0.01, learning rate 5e-5, batch size
  `4e+4 * no. GPUs`, discount 0.99, LSTM states 256, sample reuse 2,
  and V-Trace clip values 1.0 (Table 6, PDF p. 15).
- Table 7 lists OSFP hyperparameters: self-play probability 0.6,
  add-to-historical-model threshold 0.7, add-to-historical-model max LP
  count 6, and 8e8 samples for each learning period (Table 7, PDF p.
  15).
- Algorithm 1 initializes a historical model set, runs learning periods,
  either self-plays the current learner or samples a historical opponent,
  tracks per-opponent returns and counts, and adds the current learner
  to the historical set when it exceeds the win threshold against all
  sampled historical opponents or the max learning-period count is
  exceeded (Algorithm 1, PDF p. 15).
- Algorithm 2 gives the alternating-training variant, starting in battle
  training and switching between card-building and battle stages when
  the current learner is added to the history (Algorithm 2, PDF p. 16).
- Appendix D repeats that LoCM is a POMDP and says planning cannot be
  applied as a perfect-information game without modification; it notes
  possible world-state sampling but uses the ground-truth world state
  for tree expansion because of complexity and computation cost (PDF p.
  16).
- The MCTS appendix says the E2E policy can be applied in both
  card-building and battle stages, so MCTS can start from a root world
  state in either stage and end at a later-stage leaf (PDF p. 16).
- In the MCTS appendix, opponent turns during expansion are simulated
  by repeatedly sampling from the opponent conditional policy until the
  opponent turn ends (PDF p. 16).
- Algorithm 3 initializes perfect-state MCTS with `n = 400`, `c = 5.0`,
  `tau = 10.0`, `alpha = 0.03`, and `p = 0.75`; it uses child selection,
  expansion, value backtrace, normalized visit counts, and action
  sampling from the MCTS policy (Algorithm 3, PDF p. 17).

## Game / Environment Model

- The environment is LoCM, a machine-learning research strategy card
  game with card-deck building and battle stages (PDF pp. 1, 6-8).
- LoCM 1.2 and 1.5 differ in card-pool construction: LoCM 1.2 uses a
  fixed 160-card pool and a 30-round card-building process, while LoCM
  1.5 uses 120 randomly generated cards and adds area-of-effect behavior
  (PDF pp. 6-7).
- The paper models the game as two-player zero-sum and
  imperfect-information because opponent deck cards and hand cards are
  hidden (PDF p. 7).
- Appendix D again describes LoCM as a POMDP because opponent hand and
  deck are not observable, then deliberately uses ground-truth world
  state for its MCTS experiment rather than sampling possible hidden
  worlds (PDF p. 16).
- Project inference: For Gwent, LoCM is a useful CCG training analogue
  for two-stage deck/context conditioning and battle play, but its mana,
  HP, lane, creature, spell, and construction mechanics are not Gwent
  rules.

## Information Model

- The method section defines imperfect-information information states as
  sets of possible world states that the acting player cannot
  distinguish (PDF p. 4).
- In the paper's SCG example, the player observes own hand cards but
  not the opponent's hand cards (PDF p. 4).
- In LoCM, opponent deck cards and hand cards are not observable (PDF
  p. 7).
- The paper explicitly says opponent observations and actions in the
  card-building procedure are forbidden to be observed (PDF p. 7).
- The MCTS experiment described on page 10 violates the hidden-state
  boundary by using ground-truth world state for expansion rather than
  sampling feasible hidden states (PDF p. 10).
- Appendix D confirms that this MCTS choice uses the ground-truth world
  state even though opponent hand and deck are hidden, citing complexity
  and computation cost for not sampling feasible hidden states (PDF p.
  16).
- Project inference: Any Gwent adaptation should treat the main OSFP/E2E
  policy setup as hidden-information aware, but should treat the page 10
  MCTS experiment as an oracle/debug experiment, not as a permissible
  product AI observation model.

## Action Space

- The paper frames multi-stage games as having different observation and
  action spaces across stages (PDF p. 1).
- Card-building actions select one candidate card at a time from the
  current candidate set (PDF p. 7).
- Battle actions are represented as one categorical distribution over
  possible actions, with an action mask zeroing illegal actions at the
  current state (PDF pp. 7-8).
- The paper borrows much of its observation and action-space design from
  the gym-locm project (PDF p. 8).
- Project inference: The paper supports a masked, variable-legal-action
  training wrapper for future neural policies, but it does not define a
  Gwent-specific command encoding or legal-move schema.

## Policy / Search / Learning Method

- The central learning method is OSFP, a smooth-best-response iterative
  method using an optimistic prediction term from the current payoff
  vector (PDF p. 3).
- The paper uses DRL as the smooth-best-response sub-solver for
  high-dimensional multi-step games (PDF pp. 4-6).
- The E2E policy uses one neural representation for card-building
  policy, battle policy, and value function (PDF pp. 7-8).
- Training uses policy gradients, V-Trace, UPGO, and negative entropy
  regularization (PDF p. 8).
- The first batch also describes evaluation-time argmax temperature
  selection and an MCTS exploration that uses ground-truth hidden state
  (PDF p. 10).
- OSFP's appendix algorithm manages a historical opponent set, mixes
  self-play against the current learner with sampled historical
  opponents, and promotes the current learner into history based on a
  win-rate threshold or a maximum learning-period count (Algorithm 1,
  PDF p. 15).
- Alternating Training uses the same historical-opponent loop but
  switches between card-building and battle training stages only after a
  learner is added to history (Algorithm 2, PDF p. 16).
- Perfect-state MCTS uses the E2E policy as prior/behavior support,
  value estimates for backtrace, Dirichlet noise in child priors, and
  normalized visit counts to sample the root action (Algorithm 3, PDF p.
  17).

## Training Data

- Training data comes from online interaction trajectories through the
  LoCM environment rather than offline human or logged replay data (PDF
  pp. 7-8).
- The E2E policy treats a whole game, including both card building and
  battle, as one training trajectory (PDF p. 7).
- The paper discusses DRL online setup and off-policy correction issues,
  citing clipped per-step importance sampling as a variance-reduction
  approach (PDF p. 8).
- The MCTS appendix uses normalized MCTS visit counts as the behavior
  policy whenever importance sampling is required in RL (PDF p. 16).
- Project inference: The paper does not describe a reusable public
  Gwent dataset or a supervised pretraining corpus.

## Self-Play Setup

- The paper's OSFP setup samples opponent models when estimating the
  smooth-best-response objective (PDF p. 5).
- The paper says OSFP is convenient with DRL sub-solvers because
  last-iterate convergence avoids maintaining a separate average-policy
  learning process (PDF p. 3).
- The training setup is presented as fictitious-play and DRL training in
  an internal framework similar to TLeague (PDF p. 9).
- Table 7 reports OSFP self-play probability 0.6, historical-model
  promotion threshold 0.7, max learning-period count 6, and 8e8 samples
  for each learning period (Table 7, PDF p. 15).
- Algorithm 1 is the paper's operational OSFP loop over historical
  models, current-learner self-play, sampled historical opponents, and
  promotion into the historical set (Algorithm 1, PDF p. 15).
- Project inference: The paper gives a concrete population/self-play
  loop for LoCM-scale training, but not a small-compute Gwent schedule
  or checkpoint policy.

## Evaluation Method

- The paper reports COG2022 double championships and organizer-provided
  average win rates for LoCM 1.5 and LoCM 1.2 (PDF p. 9).
- Internal head-to-head evaluations use 2500 matches per pairing with
  random side switching (PDF p. 9).
- Ablation comparisons also use 2500 random-side matches to estimate
  win-rate changes from architecture features (PDF p. 10).
- Table 3 compares alternating-training variants and the E2E scheme
  under the reported resource budget (Table 3, PDF p. 10).
- The MCTS experiments compare parameter settings under the same
  resource budget and, separately, compare longer wall-time training
  against a no-MCTS baseline (Tables 4-5, PDF p. 11).
- Project inference: The paper provides practical matchup-matrix,
  ablation, and wall-time/resource-budget comparison patterns, but it
  does not define a Gwent ladder, confidence interval policy, fixed seed
  suite, or exploitability metric.

## Difficulty / Human-Likeness Notes

- Not applicable for the first batch as a direct difficulty-design
  source: pp. 1-10 optimize competition strength and equilibrium-style
  self-play, not human-like play or controllable difficulty (PDF pp.
  1-10).
- Project inference: A future Gwent use of this paper would likely be
  high-strength training research, not novice, intermediate, or
  human-like difficulty tuning.

## Compute Requirements

- The submitted LoCM 1.5 model used 24 Units for around 72 hours, with
  one Unit defined as one V100 GPU plus 600 CPU cores and throughput of
  about 500K observations per second (PDF p. 9).
- The submitted LoCM 1.2 model used one Unit for three days and then
  eight Units for six days (PDF p. 9).
- Appendix A reports RL hyperparameters including batch size
  proportional to the number of GPUs and 256 LSTM states (Table 6, PDF
  p. 15).
- Appendix A reports 8e8 samples for each OSFP learning period (Table
  7, PDF p. 15).
- Project inference: These requirements are far beyond the likely
  near-term single-workstation scope of this Gwent project, so the
  paper should not be treated as an immediate implementation mandate
  before a much smaller experiment is designed.

## What This Paper Establishes

- The full local source establishes a concrete LoCM competition-winning
  approach that combines OSFP, DRL smooth-best-response training, and an
  end-to-end multi-stage neural policy (PDF pp. 1-17).
- It establishes that the paper's LoCM policy uses hidden-information
  observations, legal-action masking, shared card embeddings, and
  whole-game trajectories across card-building and battle stages (PDF
  pp. 7-8).
- It establishes that the reported system was trained with very large
  CPU/GPU resources and evaluated primarily by competition results,
  matchup matrices, and ablations (PDF pp. 9-10).
- It establishes a concrete OSFP historical-opponent loop and reported
  OSFP/RL hyperparameters for the authors' LoCM setting (Algorithm 1 and
  Tables 6-7, PDF p. 15).
- It establishes that the authors evaluated but did not adopt MCTS
  because the sample-quality gain did not justify slower data generation
  over longer training (PDF p. 11).

## What This Paper Does Not Establish

- The full local source does not establish a near-term low-compute Gwent
  implementation plan; the reported submitted models use multi-GPU and
  large CPU training resources and large per-learning-period sample
  counts (PDF pp. 9, 15).
- The full local source does not justify importing LoCM rules, mana, lanes,
  HP, creature combat, spells, or generated-card construction into
  Gwent (PDF pp. 6-7).
- The full local source does not define a Gwent-specific observation tensor,
  legal command schema, deck-conditioning format, benchmark ladder, or
  rating method (PDF pp. 7-17).
- The MCTS experiment does not establish a hidden-safe Gwent
  search method because it expands with the ground-truth hidden world
  state in LoCM (PDF pp. 10, 16-17).

## Relevance To Gwent AI

- Project inference: This paper is relevant as a long-term
  training-method source for Gwent AI because it shows a successful CCG
  agent built around hidden-information observations, legal-action
  masking, a shared card representation, an end-to-end card-building
  plus battle policy, and self-play against historical opponents in
  LoCM (PDF pp. 7-8, 15).
- Project inference: The most transferable near-term design idea is not
  full OSFP training, but preserving deck or setup context in the battle
  policy representation. The paper's network keeps selected-card/deck
  features available to the battle policy and lets battle reward update
  card-building parameters through the shared representation and value
  function (PDF pp. 7-8).
- Project inference: The paper reinforces the action-interface direction
  already supported by the invalid-action-masking annotation: future
  neural Gwent policies should consume engine legal moves as masks,
  because the LoCM policy masks illegal card-building and battle actions
  before sampling from categorical action heads (PDF pp. 7-8).
- Project inference: The OSFP loop is useful as a long-term self-play
  reference for population/history management: it mixes current-learner
  self-play with sampled historical opponents and promotes the current
  learner into history by threshold or max learning-period count
  (Algorithm 1, PDF p. 15).
- Project inference: The evaluation setup supports Gwent experiment
  discipline already emerging from the CCG benchmark annotations:
  report head-to-head win rates, run enough games per pairing, switch
  sides, include ablations, and separate wall-time/resource-budget
  comparisons from raw win-rate claims (PDF pp. 9-11).
- Project inference: The paper is a warning as much as a roadmap item:
  the submitted LoCM system used very large resources and 8e8 samples
  per learning period, so it should inform future architecture and
  research planning rather than trigger immediate model training in this
  project (PDF pp. 9, 15).

## Risks For Adaptation

- Project inference: A direct port would be misleading if it imported
  LoCM mechanics into Gwent. The paper's environment uses mana, HP,
  lanes, creatures, spells, generated LoCM 1.5 cards, and LoCM
  card-building rules, none of which define Gwent rows, rounds, gems,
  weather, leaders, or scoring (PDF pp. 6-7).
- Project inference: A direct OSFP implementation is not a near-term
  workstation task. The paper's submitted LoCM 1.5 model used 24 V100 /
  600-CPU-core Units for about 72 hours, and its OSFP hyperparameters
  include 8e8 samples per learning period (PDF pp. 9, 15).
- Project inference: The MCTS part must not be adapted as a
  hidden-safe Gwent search method. The paper explicitly uses
  ground-truth hidden world state for MCTS expansion even though LoCM
  opponent hand and deck are not observable, and presents this as a
  simplification driven by complexity and computation cost (PDF pp. 10,
  16-17).
- Project inference: The paper's two-stage card-building setup does not
  map cleanly to current Gwent gameplay. Gwent deck construction is
  currently a product/deck-builder setup concern, not an in-match LoCM
  construction phase, so any Gwent experiment must state whether it is
  training a deck-conditioned battle policy, a deck-selection policy, or
  a true deck-building policy (PDF pp. 1, 6-8).
- Project inference: The paper does not supply a Gwent observation
  tensor, action encoding, reward design, simulator export schema,
  rating ladder, exploitability metric, or human-like difficulty model;
  those still need separate Gwent-specific specs and annotations (PDF
  pp. 7-17).
- Project inference: The paper's strongest results are competition and
  internal matchup win rates, not formal Gwent robustness guarantees.
  It does not prove full-engine Gwent convergence, exploitability, or
  strategy quality, even though it frames OSFP around Nash equilibrium
  in two-player zero-sum games (PDF pp. 1-5, 9-11).

## AI-Roadmap Decision

1. **Source category.** Project inference: training-method and
   long-term self-play architecture source for CCG AI. It is not a
   near-term Gwent implementation mandate. The paper's concrete support
   is a LoCM competition-winning OSFP + DRL + E2E policy system (PDF
   pp. 1, 7-11, 15).

2. **Game class.** Project inference: applies to two-player zero-sum,
   imperfect-information CCG-like games when the acting observation
   hides opponent hand/deck information and legal actions are masked.
   The paper models LoCM this way, but LoCM's game mechanics are not
   Gwent mechanics (PDF pp. 4, 6-8).

3. **Method family.** Project inference: mixed fictitious-play /
   policy-gradient reinforcement learning. OSFP supplies the historical
   opponent and smooth-best-response framing, while V-Trace / UPGO /
   entropy-regularized policy-gradient training supplies the neural
   sub-solver (PDF pp. 3-8, 15).

4. **Action space.** Project inference: supports masked variable legal
   action sets. The paper uses categorical card-building and battle
   action heads with masks for selectable cards and legal battle actions
   (PDF pp. 7-8). A Gwent adaptation should derive masks from engine
   legal moves rather than learning legality by penalty.

5. **Evaluation methodology.** Project inference: useful for matchup
   matrices, side switching, ablation studies, and resource-budget /
   wall-time comparisons, but not a complete Gwent evaluation ladder.
   The paper reports competition results, 2500-game random-side
   head-to-head comparisons, ablations, and MCTS wall-time/resource
   comparisons (PDF pp. 9-11).

6. **Agent scope.** Project inference: better evidence for deck- or
   setup-conditioned global agents than for narrow faction specialists.
   The paper's E2E architecture shares card embeddings between
   card-building and battle and carries selected-deck features into
   battle policy/value computation (PDF pp. 7-8). Gwent faction
   specialists remain a project design option, not a result established
   by this paper.

7. **Smallest faithful experiment.** Project inference: defer full OSFP.
   The smallest faithful Gwent experiment would be a reduced, hidden-safe
   neural-policy wrapper that consumes engine legal moves as masks,
   conditions battle decisions on deck/faction/card-context features,
   and evaluates against fixed baseline agents under a side-switched
   matchup matrix. A later OSFP experiment would add a small historical
   opponent pool and promotion threshold similar to Algorithm 1 (PDF pp.
   7-9, 15).

8. **Adaptation risk.** Project inference: adaptation becomes misleading
   if it exposes hidden opponent hand/deck identities, treats the
   perfect-state MCTS appendix as product-safe search, imports LoCM
   rules, hides the compute budget, reports reduced or toy results as
   full Gwent strength, or skips side-switched baseline evaluation (PDF
   pp. 6-11, 15-17).

9. **Roadmap effect.** Project inference: affects the long-term ML
   roadmap and future Cluster F observation/action/training specs. It
   should not trigger immediate OSFP training, full neural self-play,
   or MCTS implementation. Before using this source operationally, the
   project still needs evaluation-ladder synthesis, hidden-safe
   observation/export design, legal-action masking/tensorization, and a
   low-compute reduced experiment spec (PDF pp. 7-17).
