# Gwent AI Literature Annotation Queue - 2026-05-08

## Purpose

This queue is now the post-triage reading order for the first Gwent AI
literature foundation. It replaces the initial category-only seed queue
from cFp0 with concrete candidates produced by the multi-model sweep
and cFp1 triage.

The queue still is not an authoritative bibliography. A paper becomes
authoritative for this project only after:

1. a source package exists under
   `docs/research/literature/ai/source/<citekey>/manifest.yaml`;
2. the paper is read under the page-bounded batch protocol in
   `docs/research/literature/ai/ANNOTATION_WORKFLOW.md`;
3. the completed annotation includes an `AI-Roadmap Decision`.

## Priority Questions

The first annotation pass should answer:

1. Is ISMCTS / determinization a defensible small-compute baseline for
   Gwent, or do PIMC pathologies make it too brittle without belief /
   re-determinization safeguards?
2. What exact evaluation ladder should exist before any neural
   training claim: fixed seeds, matchup matrix, rating system,
   approximate exploitability, or all of the above?
3. What does CFR / MCCFR actually license us to say about self-play
   convergence in imperfect-information games?
4. How should variable legal action sets be exposed to ML policies:
   legal-action scoring, mask over a fixed action vocabulary, or a
   structured/pointer action representation?
5. Which CCG/TCG benchmark papers are useful as engineering
   comparisons without importing their assumptions into Gwent?

## Tier 1 - Read First

### 1. `cowling2012ismcts`

- **Title:** Information Set Monte Carlo Tree Search
- **Category:** MCTS / ISMCTS for imperfect-information games
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/cowling2012ismcts/cowling2012ismcts.md`
- **Why first:** Direct candidate for the first practical
  imperfect-information search baseline.
- **Read goal:** Extract the algorithm contract, hidden-info model,
  failure modes, and compute assumptions before considering a Gwent
  ISMCTS spec.

### 2. `cowling2012ensemble`

- **Title:** Ensemble Determinization in Monte Carlo Tree Search for
  the Imperfect Information Card Game Magic: The Gathering
- **Category:** CCG search baseline
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/cowling2012ensemble/cowling2012ensemble.md`
- **Alias note:** Earlier triage notes called this `cowling2012mtg`;
  the shared bibliography and annotation package use
  `cowling2012ensemble`.
- **Why first:** Closest surfaced CCG-specific search paper.
- **Read goal:** Identify which parts of determinization transfer to
  Gwent and which are Magic-specific.

### 3. `long2010understanding`

- **Title:** Understanding the Success of Perfect Information Monte
  Carlo Sampling in Game Tree Search
- **Category:** PIMC / determinization caveats
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/long2010understanding/long2010understanding.md`
- **Alias note:** Earlier Cluster F queue and handoff notes called this
  `long2010pimc`; the shared bibliography and annotation package use
  `long2010understanding`.
- **Why first:** Needed to avoid naive "sample hidden state and search"
  mistakes.
- **Read goal:** Extract strategy-fusion / non-locality cautions and
  convert them into acceptance criteria for any ISMCTS spec.

### 4. `zinkevich2007regret`

- **Title:** Regret Minimization in Games with Incomplete Information
- **Category:** CFR foundation
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/zinkevich2007regret/zinkevich2007regret.md`
- **Alias note:** Earlier Cluster F queue and handoff notes called this
  `zinkevich2007cfr`; the shared bibliography and annotation package use
  `zinkevich2007regret`.
- **Why first:** Establishes the language for regret, exploitability,
  and equilibrium in imperfect-information games.
- **Read goal:** Bound what we can honestly claim about self-play and
  convergence.

### 5. `lanctot2009monte`

- **Title:** Monte Carlo Sampling for Regret Minimization in Extensive
  Games
- **Category:** CFR / sampling
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/lanctot2009monte/lanctot2009monte.md`
- **Alias note:** Earlier Cluster F queue and handoff notes called this
  `lanctot2009mccfr`; the shared bibliography and annotation package
  use `lanctot2009monte`.
- **Why first:** Bridges full CFR theory toward sampled / reduced
  experiments that could fit a single-workstation project.
- **Read goal:** Decide whether a small reduced-Gwent MCCFR experiment
  belongs in the roadmap.

## Tier 2 - Evaluation And Interface

### 6. `huang2022invalidmasking`

- **Title:** A Closer Look at Invalid Action Masking in Policy Gradient
  Algorithms
- **Category:** legal action masking / variable action spaces
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/huang2022invalidmasking/huang2022invalidmasking.md`
- **Read goal:** Support or revise the project's legal-move-first ML
  interface and future action-mask export.

### 7. `timbers2022approxexploitability`

- **Title:** Approximate Exploitability: Learning a Best Response
- **Category:** evaluation ladder / robustness
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/timbers2022approxexploitability/timbers2022approxexploitability.md`
- **Read goal:** Ground any approximate best-response / exploitability
  probe before Cluster F evaluation tooling starts.

### 8. `herbrich2006trueskill`

- **Title:** TrueSkill(TM): A Bayesian Skill Rating System
- **Category:** evaluation ladder / ratings
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/herbrich2006trueskill/herbrich2006trueskill.md`
- **Alias note:** Earlier Cluster F queue notes called this
  `trueskill2007`; the shared bibliography and annotation package use
  `herbrich2006trueskill`.
- **Read goal:** Decide whether TrueSkill is a better fit than plain
  Elo for noisy Gwent self-play and seed-suite evaluation.

### 9. `glickman1995glicko`

- **Title:** The Glicko system
- **Category:** evaluation ladder / ratings
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/glickman1995glicko/glickman1995glicko.md`
- **Alias note:** Earlier Cluster F queue notes called this
  `glicko1995`; the shared bibliography and annotation package use
  `glickman1995glicko`.
- **Read goal:** Compare with TrueSkill for a small local benchmark
  ladder where agent uncertainty matters.

## Tier 3 - CCG Benchmarks And Learning Roadmap

### 10. `dockhorn2019introducinghearthstoneaicompetition`

- **Title:** Introducing the Hearthstone-AI Competition
- **Category:** CCG environment / benchmark
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/dockhorn2019introducinghearthstoneaicompetition/dockhorn2019introducinghearthstoneaicompetition.md`
- **Alias note:** Earlier Cluster F queue notes called this
  `dockhorn2019hearthstone`; the shared bibliography and annotation
  package use `dockhorn2019introducinghearthstoneaicompetition`.
- **Read goal:** Extract hidden-information, simulator, and benchmark
  lessons for Gwent without treating Hearthstone as a rule model.

### 11. `kowalski2023competition`

- **Title:** Summarizing Strategy Card Game AI Competition
- **Category:** CCG benchmark / competition harness
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/kowalski2023competition/kowalski2023competition.md`
- **Alias note:** Earlier Cluster F queue notes called this
  `locm2023competition`; the shared bibliography and annotation package
  use `kowalski2023competition`.
- **Read goal:** Compare small CCG tournament methodology, baseline
  bots, and anti-overfitting practices.

### 12. `xi2023mastering`

- **Title:** Mastering Strategy Card Game (Legends of Code and Magic)
  via End-to-End Policy and Optimistic Smooth Fictitious Play
- **Category:** CCG self-play learning
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/xi2023mastering/xi2023mastering.md`
- **Alias note:** Earlier Cluster F queue notes called this
  `locm2023osfp`; the shared bibliography and annotation package use
  `xi2023mastering`.
- **Read goal:** Evaluate whether OSFP-style learning is a realistic
  later-stage training candidate or only a comparison point.

### 13. `heinrich2016deepreinforcementlearningselfplay`

- **Title:** Deep Reinforcement Learning from Self-Play in
  Imperfect-Information Games
- **Category:** NFSP / imperfect-information self-play
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/heinrich2016deepreinforcementlearningselfplay/heinrich2016deepreinforcementlearningselfplay.md`
- **Alias note:** Earlier Cluster F queue notes called this
  `heinrich2016nfsp`; the shared bibliography and annotation package
  use `heinrich2016deepreinforcementlearningselfplay`.
- **Read goal:** Understand when neural fictitious self-play is more
  honest than naive policy-gradient self-play.

### 14. `brown2019deepcfr`

- **Title:** Deep Counterfactual Regret Minimization
- **Category:** Deep CFR
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/brown2019deepcfr/brown2019deepcfr.md`
- **Read goal:** Determine whether Deep CFR belongs in the medium-term
  roadmap or should remain aspirational.

### 15. `brown2020rebel`

- **Title:** Combining Deep Reinforcement Learning and Search for
  Imperfect-Information Games
- **Category:** search + learning
- **Status:** `complete`
- **Source status:** `local-source-available`
- **Annotation:** `docs/research/literature/ai/annotations/brown2020rebel/brown2020rebel.md`
- **Read goal:** Long-term architecture reference for public-belief
  search, not a near-term implementation promise.

## Tier 4 - Defer Until Baselines Exist

- `openspiel2019` - useful framework / terminology reference.
- `psro2017` - useful population and anti-overfitting reference once
  we have multiple policies.
- `maia2020` - useful for later human-like difficulty design, but
  requires human replay data to apply directly.
- DeepStack / Pluribus / Student of Games - important background for
  high-resource imperfect-information game AI; not near-term single
  workstation implementation targets.
- AlphaZero / MuZero / AlphaStar / OpenAI Five - useful conceptual
  comparisons only; they must not be used to justify perfect-
  information assumptions for Gwent.

## Quarantined Or Rejected Leads

- "Ward et al. Hearthstone Competition Summary" - likely model
  conflation. Prefer Dockhorn/Mostaghim and LOCM papers.
- Hostetler / Dereszynski / Dietterich / Fern PIMC line - not enough
  verified metadata from this sweep. Use Long et al. first.
- Qwen future-looking arXiv IDs and unverifiable links - reject unless
  independently rediscovered.
- Gemini blog/Quora/ResearchGate-heavy citations - retain only as
  thematic hints; do not cite.

## Recommended Next Phase

Continue the active research-foundation workflow without implementing
AI code yet. `brown2020rebel` is now complete and should be cited only
as a long-term public-belief search reference within its annotation's
limits. `brown2019deepcfr` is now complete and should be cited only as
a medium- to long-term reduced/offline neural CFR training-method
reference within its annotation's limits. The implementation-adjacent
path remains Batch B's evaluation-ladder decision synthesis.
