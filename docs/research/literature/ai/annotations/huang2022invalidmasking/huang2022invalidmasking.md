---
citekey: huang2022invalidmasking
title: "A Closer Look at Invalid Action Masking in Policy Gradient Algorithms"
authors:
  - "Shengyi Huang"
  - "Santiago Ontanon"
year: 2022
venue: "The International FLAIRS Conference Proceedings 35"
doi: "10.32473/flairs.v35i.130584"
arxiv: "2006.14171"
project_relevance: direct-implementation
method_family: other
information_model: other
action_space: masked
source_manifest: "docs/research/literature/ai/source/huang2022invalidmasking/manifest.yaml"
source_files:
  - "docs/research/literature/ai/source/huang2022invalidmasking/source.pdf"
pages_read: "1-10"
status: "complete"
---

## Summary

This first batch covers the full local PDF for Huang and Ontanon, "A
Closer Look at Invalid Action Masking in Policy Gradient Algorithms,"
published in The International FLAIRS Conference Proceedings 35. The
shared bibliography records DOI `10.32473/flairs.v35i.130584`, and the
local PDF identifies arXiv `2006.14171v3` dated 31 May 2022 (PDF p. 1).

The paper studies invalid action masking for policy-gradient algorithms:
mask invalid logits, sample only from valid actions, and update the
policy using the masked probability distribution (PDF pp. 1-3).

The paper argues that the masked update is a valid policy gradient
because masking can be treated as a state-dependent differentiable
function applied during action-probability calculation (PDF p. 3).

The experiments use PPO in microRTS resource-harvesting tasks and compare
invalid-action penalties, proper masking, naive masking, and train-with-
mask / evaluate-without-mask regimes across increasing map sizes (PDF
pp. 3-5).

The empirical result is that invalid action masking scales as the invalid
action space grows, while invalid-action penalties fail to scale and can
struggle to find the first reward in larger maps (PDF pp. 5-6).

After explicit user finalization, this annotation treats the paper as a
direct implementation source for legal-action masking in future Gwent
policy-gradient or neural-policy training wrappers, not as a hidden-
information game-solving method or an evaluation-ladder source.

## Paper Claims

- Games with complicated rules often have state-dependent valid discrete
  action sets, so prior DRL work combines per-state legal actions into a
  single full discrete action space for standard RL formulation (PDF
  p. 1).
- Full discrete action spaces can be extremely large; the paper cites
  Dota 2's full discrete action space as size 1,837,080 (PDF p. 1).
- Invalid action masking masks invalid actions and samples from the
  remaining valid actions, but the paper frames its theoretical and
  empirical consequences as under-investigated before this work (PDF
  p. 1).
- The paper's three stated contributions are theoretical justification,
  empirical evidence as invalid action spaces grow, and comparison of
  masking regimes such as removing the mask after masked training (PDF
  p. 1).
- The authors compare invalid action masking against invalid-action
  penalties, where invalid actions receive non-positive reward penalties
  so the agent can learn to avoid them (PDF pp. 1, 4-5).
- The paper defines a standard MDP and policy-gradient objective with
  stochastic policy, discounted return, and policy-gradient update (PDF
  p. 2).
- In the paper's illustrative four-action example, masking an invalid
  action by replacing its logit with a large negative value makes the
  invalid action's probability near zero after softmax (PDF pp. 2-3).
- The same example shows that the gradient for the masked invalid
  action's logit becomes zero rather than merely being renormalized (PDF
  p. 3).
- Proposition 1 states that the invalid-action-policy gradient is the
  policy gradient of the masked policy `pi_theta_prime` (PDF p. 3).
- The proof treats the mask as a state-dependent differentiable function
  that is identity for valid-action logits and constant for invalid-
  action logits (PDF p. 3).
- The evaluation environment is microRTS, chosen because its action space
  and number of invalid actions grow combinatorially (PDF p. 3).
- The microRTS observation uses 27 binary feature planes over an `h` by
  `w` map, including hit points, resources, owner, unit type, and current
  action features (PDF pp. 3-4; Table 1, PDF p. 3).
- The microRTS action is an eight-component discrete vector: source unit,
  action type, movement parameter, harvest parameter, return parameter,
  produce direction, produce type, and attack target (PDF pp. 3-4; Table
  1, PDF p. 3).
- The experiment rewards resource harvesting: the worker receives +1 for
  harvesting a resource and +1 for returning it to a base (PDF p. 4).
- The paper tests map sizes 4 by 4, 10 by 10, 16 by 16, and 24 by 24,
  with one base and one worker for each player (PDF p. 5).
- The chance of randomly selecting a valid source unit falls from 2/16
  on the 4 by 4 map to 2/576 on the 24 by 24 map, illustrating how
  invalid-action density grows with map size (PDF p. 4).
- The proper invalid-action-masking experiment masks Source Unit and
  Attack Target components only, so invalid actions can still occur
  through incorrect parameters for the selected action type (PDF p. 4).
- The naive masking regime samples from the masked distribution but
  updates the policy gradient using the unmasked probability
  distribution (PDF p. 4).
- The masking-removed regime trains with masks, then evaluates without
  masks (PDF pp. 4-5).
- The reported metrics include final episodic return, invalid source
  selection categories, time to solve, and time to first positive reward
  (PDF p. 5).
- Invalid action masking solves all tested map sizes with final episodic
  return 40.00 and time-to-solve between 8.67% and 18.38% of training
  steps in Table 2 (Table 2, PDF p. 5).
- Invalid-action penalties perform reasonably on 4 by 4 maps but do not
  scale to larger maps; several larger-map penalty settings never reach
  solve threshold (Table 2, PDF p. 5; PDF pp. 5-6).
- The authors report that invalid action masking finds the first reward
  quickly and consistently across map sizes, while penalties can take
  much longer or fail to discover the first reward efficiently (PDF
  p. 5).
- Naive invalid action masking can produce high returns, but it causes
  much larger PPO KL divergence than other regimes and has more volatile
  time-to-solve as map size changes (PDF p. 6; Fig. 3, PDF p. 9).
- Removing masks after masked training degrades as map size grows, but
  still performs better than invalid-action-penalty agents in these
  experiments (PDF p. 6).
- Related-work alternatives include continuous action embeddings with
  nearest valid actions, action elimination networks, and action-space
  shaping by action removals or discretization (PDF p. 6).
- The conclusion states that invalid action masking yields a valid
  policy gradient, works through a state-dependent differentiable
  function, scales as invalid action spaces grow, outperforms
  invalid-action penalties in the tested setting, and can leave some
  useful behavior when masks are removed after training (PDF p. 6).
- The appendix describes multi-discrete action generation as a factored
  policy over action components, reducing output logits from
  `9216(hw)^2` possible flat actions to `2hw + 36` component logits (PDF
  p. 8).
- The appendix lists PPO implementation details including advantage
  normalization, observation normalization, reward scaling, value-loss
  clipping, learning-rate annealing, minibatches, global gradient
  clipping, and orthogonal initialization (PDF pp. 8-9).
- The appendix reports 500,000 training time steps, discount factor
  0.99, GAE lambda 0.97, PPO clipping coefficient 0.2, entropy
  regularization 0.01, gradient norm threshold 0.5, 10 PPO updates per
  epoch, and policy/value learning rates 0.0003 (Table 4, PDF p. 10).
- The appendix gives CNN-plus-MLP architectures whose output dimension is
  `2hw + 36`, reaching 1,188 outputs on the 24 by 24 map (Table 5, PDF
  p. 10).

## Game / Environment Model

- The formal background uses an MDP with state space, discrete action
  space, transition probability, initial-state distribution, reward,
  discount factor, and maximum episode length (PDF p. 2).
- The empirical environment is microRTS, a minimal RTS game with
  simultaneous and durative actions, large branching factors, and
  real-time decision-making (PDF p. 3).
- The experiments are resource-harvesting tasks for Player 1 on four map
  sizes, with Player 1 units at the top left and stationary units at the
  bottom left in the illustrated 10 by 10 setup (PDF pp. 1, 5).
- Episodes have maximum length 200 time steps and can terminate earlier
  if all resources are harvested (PDF p. 4).
- Project inference: The paper's environment is not a hidden-card game
  and does not model Gwent's round structure, pass-as-resource pressure,
  deck order, mulligans, or card-specific targeting rules.

## Information Model

- The paper's formal setup is an MDP with policy conditioning on current
  state; it does not introduce information sets, public belief states, or
  imperfect-information equilibrium concepts (PDF p. 2).
- The microRTS observation is a tensor over map cells and feature planes
  rather than a hidden-hand or private-card observation (PDF pp. 3-4).
- The masking function is state-dependent because the valid/invalid
  action set can differ by state (PDF p. 3).
- Project inference: This paper supports legal-action masking mechanics
  for a Gwent learner, but it does not by itself justify any treatment of
  opponent hand, deck order, or information-set abstraction.

## Action Space

- The paper addresses games where each state can have a different valid
  subset of a full discrete action space (PDF p. 1).
- Invalid action masking replaces invalid action logits with a large
  negative value before softmax so the sampled policy effectively
  selects only valid actions (PDF pp. 2-3).
- The empirical microRTS action is factorized into eight discrete action
  components rather than represented as one flat categorical action (PDF
  pp. 3-4; Table 1, PDF p. 3).
- The proper masking experiment masks Source Unit and Attack Target
  action components, while leaving some action-type parameter invalidity
  unmasked (PDF p. 4).
- The appendix explains that factorized multi-discrete action generation
  dramatically reduces output size compared with a flat combinatorial
  action distribution (PDF p. 8).
- Project inference: Gwent's current engine legal-move list can support
  a mask over legal candidates, but the paper does not prescribe whether
  Gwent should use one flat action vocabulary, a per-turn legal-candidate
  scorer, or an autoregressive card/target decomposition.

## Policy / Search / Learning Method

- The learning method under study is policy-gradient reinforcement
  learning, with PPO used for the experiments (PDF pp. 2, 4).
- The theoretical point is about gradients of masked policies rather
  than tree search, CFR, ISMCTS, supervised imitation, or equilibrium
  solving (PDF pp. 2-3).
- Proper invalid action masking updates the policy using the masked
  action probability distribution, while naive masking samples from the
  masked distribution but updates with the unmasked distribution (PDF
  p. 4).
- The experiments compare proper masking, penalty-based invalid-action
  handling with several penalty values, naive masking, and train-with-
  mask / evaluate-without-mask (PDF pp. 4-5).

## Training Data

- Training data is generated online through PPO interaction with the
  microRTS environment, not from human demonstrations or an offline game
  log corpus (PDF pp. 4-5).
- The appendix states that all experiments train for 500,000 time steps
  (Table 4, PDF p. 10).
- Figure captions report results over four random seeds (Fig. 2, PDF
  p. 4; Fig. 3, PDF p. 9).

## Self-Play Setup

- The experiments are not self-play experiments; Player 1 learns a
  resource-harvesting task while the bottom-left units remain stationary
  in the illustrated setup (PDF p. 1).
- The paper does not describe league training, opponent sampling,
  population-based self-play, Nash dynamics, or evaluation against a
  strategic opponent pool (PDF pp. 4-6).

## Evaluation Method

- The paper evaluates episodic return, invalid source selection counts,
  time-to-solve, and time-to-first-positive-reward (PDF p. 5).
- Figure 2 plots episodic return and PPO KL divergence for 4 by 4 and
  10 by 10 maps, with shaded one-standard-deviation bands over four
  random seeds (Fig. 2, PDF p. 4).
- Table 2 reports aggregate metrics for all four map sizes and all
  invalid-action-handling regimes (Table 2, PDF p. 5).
- Figure 3 repeats episodic return and KL divergence plots for all four
  map sizes (Fig. 3, PDF p. 9).
- The paper does not evaluate Elo, exploitability, best response,
  tournament win rate, fixed matchup matrices, or Gwent-like resource
  play (PDF pp. 4-6).

## Difficulty / Human-Likeness Notes

- Not applicable: the paper studies policy-gradient validity and sample
  efficiency for invalid action handling, not controllable difficulty,
  human-like mistakes, or player modeling (PDF pp. 1-6).
- Project inference: The paper is relevant to preventing invalid actions
  in future training wrappers, not to making a bot intentionally weaker
  or more human-like.

## Compute Requirements

- The experiments use PPO for 500,000 training time steps per listed
  configuration (Table 4, PDF p. 10).
- The neural networks are small convolutional-plus-fully-connected
  models whose output sizes scale with map size from 68 logits on the 4
  by 4 map to 1,188 logits on the 24 by 24 map (Table 5, PDF p. 10).
- The paper reports four random seeds for the plotted results (Fig. 2,
  PDF p. 4; Fig. 3, PDF p. 9).
- The paper provides source code links for reproducibility in the main
  text and appendix (PDF pp. 1, 9).

## What This Paper Establishes

- Invalid action masking can produce a valid policy-gradient update when
  the masked probability distribution is used for both sampling and
  gradient calculation (PDF p. 3).
- The mask can be understood as a state-dependent differentiable
  function over logits, identity for valid actions and constant for
  invalid actions (PDF p. 3).
- In the tested microRTS task, proper invalid action masking scales
  better than invalid-action penalties as invalid-action density grows
  with map size (PDF pp. 5-6).
- In the tested microRTS task, naive masking can produce strong returns
  but produces much larger PPO KL divergence and less stable solve-time
  behavior (PDF p. 6; Fig. 3, PDF p. 9).
- In the tested microRTS task, agents trained with masks retain some
  useful behavior when masks are removed at evaluation time, though
  performance degrades with larger maps (PDF p. 6).

## What This Paper Does Not Establish

- It does not establish an imperfect-information game-solving method,
  because the paper is not about information sets, hidden-card belief
  states, or equilibrium convergence (PDF pp. 1-6).
- It does not evaluate collectible card games, Gwent-like round
  structure, mulligans, pass decisions, deck construction, or card-effect
  targeting (PDF pp. 1-6).
- It does not provide a benchmark ladder such as Elo, Glicko,
  exploitability, best-response evaluation, or matchup matrices (PDF
  pp. 4-6).
- It does not prove that removing masks at deployment is harmless; the
  masking-removed results degrade with larger map size (PDF p. 6).
- It does not choose a Gwent action encoding; it analyzes masking and
  uses a factored multi-discrete action representation for microRTS (PDF
  pp. 3-4, 8).

## Relevance To Gwent AI

- Project inference: This is a direct implementation source for any
  future Gwent policy-gradient or neural policy that uses the engine's
  legal-move output as an action mask. The paper's central claim is that
  proper invalid action masking, with both sampling and gradient updates
  using the masked distribution, yields a valid policy-gradient update
  (PDF p. 3).
- Project inference: The current Gwent engine architecture already has
  the right boundary for this technique: the pure engine exports legal
  moves, and an ML wrapper can map those moves into a per-state mask
  rather than training a learner to discover invalid rules by penalty.
  The paper's experiments show penalties do not scale well as invalid-
  action density grows, while masking remains effective in the tested
  microRTS setting (PDF pp. 5-6).
- Project inference: A future Gwent learner should prefer consistent
  masking during both training and inference. The paper's
  masking-removed experiment shows some useful behavior remains after
  masked training, but performance degrades as map size grows, so mask
  removal should not be treated as harmless deployment practice (PDF
  p. 6).
- Project inference: Gwent should avoid the paper's "naive masking"
  failure mode: sampling from a masked distribution while computing
  gradients against an unmasked distribution. The paper reports much
  larger PPO KL divergence and more volatile solve time for naive masking
  (PDF p. 6; Fig. 3, PDF p. 9).
- Project inference: If the Gwent action space becomes too structured
  for one flat legal-move index, the paper's appendix supports a
  factorized action-head direction as a compatible design pattern,
  because its microRTS implementation reduces a flat combinatorial
  action space into component logits (PDF p. 8).

## Risks For Adaptation

- Project inference: The paper does not solve Gwent's hidden-
  information problem. It uses MDP policy-gradient framing and microRTS
  observations, not information sets, public belief states, hidden hands,
  deck-order uncertainty, or equilibrium convergence (PDF pp. 2-4).
- Project inference: Masking legality is not a substitute for strategic
  search or self-play evaluation. The paper evaluates resource-
  harvesting returns, invalid source selections, time-to-solve, and time
  to first reward, not Elo, exploitability, best response, tournament
  matrices, or Gwent-like win quality (PDF pp. 4-6).
- Project inference: A Gwent implementation would be misleading if it
  used invalid-action penalties as the primary legality mechanism in a
  large action space. The paper reports that invalid-action penalties
  struggle as invalid-action density grows and can fail to discover the
  first positive reward efficiently (PDF pp. 5-6).
- Project inference: A Gwent implementation would also be misleading if
  it trains with masks but evaluates or exports a policy without masks
  by default. The paper's masking-removed regime degrades with larger map
  sizes (PDF p. 6).
- Project inference: This paper does not choose the Gwent action
  encoding. It supports proper masking, but the project still needs a
  separate design decision for flat legal-candidate indices versus
  action-type / card / target decomposition; the paper's own empirical
  action space is an eight-component microRTS vector (PDF pp. 3-4,
  8).
- Project inference: Because the paper's proper masking experiment masks
  only Source Unit and Attack Target components, leaving some parameter
  invalidity possible, a Gwent port should not assume partial masks are
  enough for all card and prompt targets without measuring residual
  invalid-action rates (PDF p. 4).

## AI-Roadmap Decision

1. **Source category.** Project inference: direct implementation source
   for legal-action masking in future Gwent ML wrappers. It is not a
   standalone game-playing algorithm, search method, or benchmark ladder.
   The paper's direct support is that proper invalid action masking
   produces a valid policy-gradient update and scales better than
   invalid-action penalties in the tested environment (PDF pp. 3, 5-6).

2. **Game class.** Project inference: applicable to discrete-action
   games with state-dependent valid action sets. The paper studies MDP
   policy-gradient learning and microRTS, not hidden-information card
   games specifically (PDF pp. 2-4).

3. **Method family.** Project inference: policy-gradient reinforcement
   learning support, with PPO used in the experiments. It does not supply
   CFR, ISMCTS, supervised learning, self-play league training, or
   equilibrium-solving machinery (PDF pp. 2, 4).

4. **Action space.** Project inference: supports action masking and
   variable legal action sets. The most faithful Gwent adaptation is a
   mask derived from engine legal moves, applied before sampling and used
   consistently in the policy-gradient log-probability calculation (PDF
   pp. 2-4).

5. **Evaluation methodology.** Project inference: do not adopt this
   paper as the Gwent evaluation ladder. Its metrics are useful for a
   wrapper smoke test, such as invalid-action rate and first valid reward
   discovery, but not for policy strength. The paper reports episodic
   return, invalid source selections, time-to-solve, time to first
   reward, and PPO KL divergence (PDF pp. 5-6; Fig. 3, PDF p. 9).

6. **Agent scope.** Project inference: compatible with either global
   deck-conditioned agents or faction specialists because masking is an
   action-interface mechanism, not a deck-generalization method. The
   paper itself does not discuss deck conditioning, factions, or card
   archetypes (PDF pp. 1-6).

7. **Smallest faithful experiment.** Project inference: build a small
   training-wrapper prototype that converts each engine legal-move list
   into a dense action mask over a fixed candidate vocabulary or a
   per-turn legal-candidate scorer, then verify that invalid actions
   receive zero probability and zero gradient contribution under the
   selected policy-gradient implementation. The paper's own faithful
   requirements are masked sampling plus masked log-probability updates
   (PDF pp. 2-4).

8. **Adaptation risk.** Project inference: the main risks are hidden-
   information leakage through action features, using penalties instead
   of masks, naive masking with unmasked-gradient updates, deploying
   without masks, and overclaiming policy strength from legality-
   compliance metrics. Each risk corresponds to a boundary the paper
   either tests directly or does not address (PDF pp. 4-6).

9. **Roadmap effect.** Project inference: this source should affect
   Cluster F observation/action-interface specs and the long-term ML
   roadmap. It should not by itself trigger `legal-heuristic-v1`, CFR,
   ISMCTS, or rating-ladder implementation. The proper next use is an
   annotation-backed requirement that future neural-policy wrappers use
   engine-derived legal masks and avoid invalid-action penalties as the
   primary legality mechanism (PDF pp. 3, 5-6).
