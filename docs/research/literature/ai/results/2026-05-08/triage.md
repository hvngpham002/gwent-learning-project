# Gwent AI Literature Triage - 2026-05-08

## Status

First sweep triaged from five model outputs:

- `chatgpt.md`
- `claude.md`
- `deepseek.md`
- `gemini.md`
- `qwen.md`

No paper has been annotated yet. This file is a retrieval triage and
priority-setting document only. Any implementation-affecting research
claim still needs an annotation under
`docs/research/literature/ai/annotations/` or must be labeled a project
hypothesis.

## Triage Method

The raw outputs were treated as retrieval leads, not authoritative
citations. Candidates were promoted when at least one of these held:

- multiple models independently surfaced the same paper family;
- the paper directly addresses imperfect-information search, regret
  minimization, CCG environments, action masking, or evaluation;
- a primary or near-primary metadata page was spot-checked.

Candidates were demoted when the model output contained missing venue
data, suspicious future arXiv links, secondary-only references,
blog-style citations, or likely conflations between similarly named
papers.

## Spot-Checked Sources

These sources were spot-checked enough to use as high-confidence
annotation leads. `url-only` means the URL/metadata is known, not that
the paper has been read under the batch protocol.

| Source | Source Status | Spot-check note |
|---|---|---|
| Zinkevich et al., "Regret Minimization in Games with Incomplete Information" | `url-only` | NeurIPS/NIPS 2007 metadata verified. |
| Lanctot et al., "Monte Carlo Sampling for Regret Minimization in Extensive Games" | `url-only` | NeurIPS/NIPS 2009 metadata verified. |
| Cowling, Powley, Whitehouse, "Information Set Monte Carlo Tree Search" | `url-only` | IEEE TCIAIG 2012 PDF/metadata found. |
| Cowling, Ward, Powley, "Ensemble Determinization in Monte Carlo Tree Search for Magic: The Gathering" | `url-only` | York publication metadata found. |
| Long, Sturtevant, Buro, Furtak, "Understanding the Success of Perfect Information Monte Carlo Sampling in Game Tree Search" | `url-only` | AAAI 2010 metadata found through indexes; use as the canonical PIMC-caution lead. |
| Goodman, "Re-determinizing Information Set Monte Carlo Tree Search in Hanabi" | `url-only` | arXiv 1902.06075 and CoG/Hanabi competition context found. |
| Huang and Ontanon, "A Closer Look at Invalid Action Masking in Policy Gradient Algorithms" | `url-only` | FLAIRS 2022 page and DOI verified. |
| Lanctot et al., "OpenSpiel: A Framework for Reinforcement Learning in Games" | `url-only` | arXiv metadata verified. |
| Timbers et al., "Approximate Exploitability: Learning a Best Response" | `url-only` | IJCAI 2022 page and DOI verified. |
| Dockhorn and Mostaghim, "Introducing the Hearthstone-AI Competition" | `url-only` | arXiv / competition page verified. |
| "Summarizing Strategy Card Game AI Competition" | `url-only` | LOCM competition summary arXiv found. |
| "Mastering Strategy Card Game (Legends of Code and Magic) via End-to-End Policy and Optimistic Smooth Fictitious Play" | `url-only` | arXiv found; promising but needs careful reading before roadmap use. |
| Heinrich and Silver, "Deep Reinforcement Learning from Self-Play in Imperfect-Information Games" | `url-only` | arXiv / UCL metadata verified. |
| Brown et al., "Deep Counterfactual Regret Minimization" | `url-only` | ICML/PMLR 2019 metadata verified. |
| Brown et al., "Combining Deep Reinforcement Learning and Search for Imperfect-Information Games" | `url-only` | arXiv / NeurIPS context verified. |
| Herbrich, Minka, Graepel, "TrueSkill(TM): A Bayesian Skill Rating System" | `url-only` | NeurIPS 2007 metadata verified. |
| Glickman, Glicko rating system notes | `url-only` | Author-maintained Glicko site found; use as practical rating reference. |
| McIlroy-Young et al., "Aligning Superhuman AI with Human Behavior: Chess as a Model System" | `url-only` | arXiv / KDD paper page found; difficulty-design lead only. |
| Lanctot et al., "A Unified Game-Theoretic Approach to Multiagent Reinforcement Learning" | `url-only` | NeurIPS 2017 PSRO metadata verified. |
| DeepStack / Pluribus / Student of Games line | `url-only` | Primary pages found; high-value background, not near-term implementation targets. |

## Candidate Table

| Source | Category | Directness | Source Status | Annotation Priority | Decision | Notes |
|---|---|---|---|---|---|---|
| Cowling, Powley, Whitehouse 2012 - ISMCTS | MCTS / ISMCTS for card games | Direct hit | `url-only` | P1 | Promote | Best first annotation candidate. It directly targets imperfect-information search and is small-compute plausible. |
| Cowling, Ward, Powley 2012 - Ensemble Determinization in Magic | Collectible-card-game AI environments; ISMCTS | Direct hit | `url-only` | P1 | Promote | Closest surfaced CCG-specific search paper. Important before adapting determinization to Gwent. |
| Long, Sturtevant, Buro, Furtak 2010 - PIMC success/failure analysis | MCTS / imperfect-information caveats | Direct hit | `url-only` | P1 | Promote | Needed to avoid naive determinization and strategy-fusion mistakes. |
| Goodman 2019 - Re-determinizing IS-MCTS in Hanabi | MCTS / hidden-info honesty | Direct hit | `url-only` | P1 | Promote | Not a CCG, but directly addresses hidden-information leakage inside ISMCTS-like search. |
| Zinkevich et al. 2007 - CFR | Imperfect-information foundations | Direct hit | `url-only` | P1 | Promote | Required vocabulary for equilibrium, regret, exploitability, and "self-play convergence" claims. |
| Lanctot et al. 2009 - MCCFR | CFR family | Direct hit | `url-only` | P1 | Promote | Best bridge from full CFR theory toward sample-based small experiments or reduced games. |
| Huang and Ontanon 2022 - invalid action masking | Legal action masking | Direct hit | `url-only` | P1 | Promote | Directly supports the engine's legal-move-first ML interface. |
| Timbers et al. 2022 - approximate exploitability | Evaluation ladder | Direct hit | `url-only` | P1 | Promote | Strongest surfaced lead for an honest robustness / best-response evaluation beyond win rate. |
| Dockhorn and Mostaghim 2019 - Hearthstone-AI Competition | CCG environments | Partial hit | `url-only` | P2 | Promote | Useful environment/benchmark comparison; not enough by itself to design Gwent AI. |
| LOCM competition summary | CCG environments; evaluation | Partial hit | `url-only` | P2 | Promote | Good small CCG benchmark reference; annotate after ISMCTS/CFR/eval foundations. |
| LOCM OSFP / end-to-end policy paper | Self-play / CCG policy learning | Partial hit | `url-only` | P2 | Promote with caution | Promising for later training, but do not let it shortcut the evaluation/search foundation. |
| Heinrich and Silver 2016 - NFSP | CFR / learning family | Partial hit | `url-only` | P2 | Promote | Useful for learning from self-play in imperfect-information games; likely not first implementation. |
| Brown et al. 2019 - Deep CFR | Deep CFR | Partial hit | `url-only` | P2 | Promote | Important roadmap source; higher implementation risk than ISMCTS or evaluation ladder. |
| Brown et al. 2020 - ReBeL | Search + RL in imperfect-information games | Partial hit | `url-only` | P2 | Promote | Long-term architecture inspiration; too heavy for immediate cFp2/cFp3 implementation. |
| OpenSpiel 2019 | Environment / algorithm framework | Partial hit | `url-only` | P2 | Promote | Good terminology and interface reference; likely not a direct dependency. |
| TrueSkill / Glicko | Evaluation ladder | Partial hit | `url-only` | P2 | Promote | Practical rating-system references for benchmark ladder design. |
| PSRO / unified game-theoretic MARL | Population / anti-overfitting | Partial hit | `url-only` | P3 | Defer | Useful once there are multiple policies; premature before baseline evaluation exists. |
| Maia / human-like chess | Difficulty design | Partial hit | `url-only` | P3 | Defer | Good difficulty-design analogy; not a Gwent strategy source and requires human replay data. |
| DeepStack / Pluribus / Student of Games | Imperfect-information game AI background | Background-only | `url-only` | P3 | Defer | Strong background for high-resource search/resolving; not a near-term single-workstation target. |
| AlphaZero / MuZero / AlphaStar / OpenAI Five | General game AI / action spaces | Background-only | `url-only` or `secondary-lead-only` | P3 | Defer | Useful concepts, but perfect-information or high-resource assumptions must not drive the initial plan. |
| "Ward et al. Hearthstone Competition Summary" | CCG environments | Low-confidence lead | `secondary-lead-only` | None | Quarantine | Likely a model conflation; use Dockhorn/Mostaghim and LOCM sources instead. |
| Hostetler / Dereszynski / Dietterich / Fern PIMC line | PIMC caveats | Low-confidence lead | `secondary-lead-only` | None | Quarantine | Not enough from this sweep. Use Long et al. 2010 as the verified PIMC-caution anchor first. |
| Qwen future-looking arXiv ids and indirect web citations | Mixed | Reject | `missing-source` | None | Reject | Several links/years look fabricated or irrelevant. Re-introduce only if independently found later. |
| Gemini blog/Quora/ResearchGate-heavy citations | Mixed | Low-confidence lead | `secondary-lead-only` | None | Quarantine | Keep thematic synthesis, not citations. Promote only primary sources located independently. |

## Model Reliability Notes

- **Claude** produced the best triage structure and most useful caveats,
  especially around ISMCTS, PIMC, CFR-family work, and unreliable
  Hearthstone/PIMC leads.
- **ChatGPT** produced a broad usable candidate list with good
  near-term categories, but still needs primary-source checking.
- **DeepSeek** was thematically useful but contained likely venue /
  year mistakes, so it should not be used as metadata authority.
- **Gemini** had useful narrative synthesis but mixed in too many
  blogs, secondary citations, and strange source paths for direct use.
- **Qwen** gave a reasonable high-level blueprint but included many
  unverifiable or suspicious references; use it as synthesis only.

## Triage Conclusions

1. **The next implementation phase should still wait.** The first
   post-triage work should be annotation, not `legal-heuristic-v1`,
   neural training, or an ISMCTS implementation.
2. **Small-compute ISMCTS is the leading practical search candidate,**
   but only if the PIMC / determinization pitfalls are read first.
   The first annotation batch should therefore pair ISMCTS with at
   least one cautionary paper rather than treating ISMCTS as already
   approved.
3. **CFR / MCCFR is required theory, not necessarily the first
   product AI.** It should ground words like regret, exploitability,
   approximate equilibrium, and self-play convergence before the
   roadmap claims that self-play will "converge into a master."
4. **The engine's legal-move-first interface is aligned with the
   action-masking literature.** This supports the existing architectural
   instinct: AI should score legal moves, not invent card commands from
   raw hand state.
5. **The benchmark ladder should be designed before training.** Fixed
   seed suites, matchup matrices, Glicko/TrueSkill-style ratings, and
   approximate best-response/exploitability probes are the strongest
   recurring evaluation ideas.
6. **Difficulty design is real but later.** The Maia / human-like-play
   literature argues against "drunk" random blunders, but Gwent lacks a
   human replay corpus today. Difficulty should initially be controlled
   through search budget, policy sampling, and evaluation handicaps,
   with human-like modeling deferred.

## Recommended Annotation Queue

Use this order unless a source is unavailable:

1. `cowling2012ismcts` - Information Set Monte Carlo Tree Search.
2. `cowling2012mtg` - Ensemble Determinization in Magic: The
   Gathering.
3. `long2010pimc` - Perfect Information Monte Carlo Sampling analysis.
4. `zinkevich2007cfr` - CFR foundation.
5. `lanctot2009mccfr` - Monte Carlo CFR.
6. `huang2022invalidmasking` - invalid action masking.
7. `timbers2022approxexploitability` - approximate exploitability.
8. `dockhorn2019hearthstone` or `locm2023competition` - CCG benchmark
   environment comparison.

The next phase should create source packages and begin page-bounded
annotation for item 1 only, unless the user explicitly wants a broader
manifest setup phase first.
