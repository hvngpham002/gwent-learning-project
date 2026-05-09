# Gwent AI Literature Sweep Brief - 2026-05-08

## Status

The first multi-model literature sweep has been triaged. No paper has
been annotated yet, and no AI/ML implementation decision is
authoritative until the relevant papers are read under the annotation
workflow.

Raw sweep outputs reviewed:

- `chatgpt.md`
- `claude.md`
- `deepseek.md`
- `gemini.md`
- `qwen.md`

Primary or near-primary metadata was spot-checked for the strongest
candidates. The detailed triage table lives in `triage.md`, and the
post-triage reading order lives in `queue.md`.

## Current Project Context

The engine and simulation infrastructure already give us:

- a deterministic pure engine with a clean legal-move contract;
- a hidden-info-safe seat observation;
- a headless AI-vs-AI simulation runner with deterministic seeds;
- a bounded batch seed suite (`current-smoke-v1`);
- a hidden-info-safe `sim-export-v1` decision-row export with
  per-row legal action lists, sparse terminal rewards, runtime
  validation, and an in-memory JSONL boundary;
- one deliberately weak deterministic policy (`legal-heuristic-v0`).

This is enough to support evaluation and search experiments, but not
enough to claim that self-play will converge or that a model is strong
without a benchmark ladder.

## Triage Conclusion

The strongest practical direction is:

1. **annotate ISMCTS and determinization papers first;**
2. **annotate CFR / MCCFR foundations to constrain self-play claims;**
3. **design the evaluation ladder before training;**
4. **then decide between an ISMCTS baseline, `legal-heuristic-v1`, or
   a reduced-game CFR/NFSP experiment.**

The sweep does **not** support jumping directly into neural self-play.
Multiple sources point in the same direction: imperfect-information
games require either search methods that respect information sets, or
regret/equilibrium-aware training methods. Naive AlphaZero-style
self-play is not an honest default for Gwent.

## Highest-Value Leads

Read first:

- Cowling, Powley, Whitehouse - Information Set Monte Carlo Tree
  Search.
- Cowling, Ward, Powley - Ensemble Determinization in Magic: The
  Gathering.
- Long, Sturtevant, Buro, Furtak - Perfect Information Monte Carlo
  Sampling analysis.
- Zinkevich et al. - CFR.
- Lanctot et al. - MCCFR.

Read next for evaluation/interface:

- Huang and Ontanon - invalid action masking.
- Timbers et al. - approximate exploitability.
- TrueSkill and Glicko rating references.

Read after those for CCG comparisons:

- Dockhorn and Mostaghim - Hearthstone-AI Competition.
- LOCM competition summary.
- LOCM OSFP paper.

## Method Direction

Near-term:

- Build a literature-grounded evaluation ladder before training.
- Keep `legal-heuristic-v0` as the weak benchmark.
- Consider `legal-heuristic-v1` only after the evaluation ladder is
  specified, because otherwise it is hard to measure whether it is
  meaningfully stronger.

Likely first practical AI method after annotation:

- ISMCTS / ensemble determinization with strict hidden-info boundaries
  and explicit PIMC-failure acceptance tests.

Medium-term:

- reduced-game CFR / MCCFR experiments for theory and exploitability
  checks;
- action-mask / legal-action export hardening for future neural policy
  work;
- CCG benchmark comparison against Hearthstone / LOCM methodology.

Long-term:

- NFSP, Deep CFR, ReBeL-style public-belief search, or PSRO-style
  population training;
- deck-conditioned generalist policy with possible faction-specialist
  adapters after enough benchmark data exists.

## Reliability Notes

The model outputs were uneven. Claude and ChatGPT were the most useful
retrieval leads; DeepSeek and Qwen were useful for synthesis but not
metadata; Gemini had narrative value but too many secondary or
questionable citations.

Quarantine or reject:

- model-only "Ward et al. Hearthstone" claims;
- unverified Hostetler / Dereszynski / Dietterich / Fern PIMC leads
  from the raw outputs;
- Qwen future-looking or suspicious arXiv links;
- blog/Quora/ResearchGate-heavy citations unless independently
  verified.

## Implementation Specs Should Still Wait

No implementation spec should cite this brief as literature support.
This brief can justify the next annotation phase only. After 2-4
priority annotations exist, the project can write a grounded
evaluation-ladder spec.
