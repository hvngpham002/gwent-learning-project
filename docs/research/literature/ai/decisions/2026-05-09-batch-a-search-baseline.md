# Batch A Decision Note - Search Baseline Viability

Date: 2026-05-09

Status: accepted decision note

## Question

Should the next Gwent AI phase move directly toward a search baseline
such as determinized search or ISMCTS, or should we build more
evaluation infrastructure before implementing search?

## Sources Read

| Source | Annotation | Role In Decision |
|---|---|---|
| Cowling et al., "Information Set Monte Carlo Tree Search" | `docs/research/literature/ai/annotations/cowling2012ismcts/cowling2012ismcts.md` | Primary imperfect-information search candidate and hidden-info tree-search vocabulary. |
| Cowling et al., "Ensemble Determinization in Monte Carlo Tree Search for the Imperfect Information Card Game Magic: The Gathering" | `docs/research/literature/ai/annotations/cowling2012ensemble/cowling2012ensemble.md` | Closest card-game search baseline and practical rollout / pruning / evaluation example. |
| Long et al., "Understanding the Success of Perfect Information Monte Carlo Sampling in Game Tree Search" | `docs/research/literature/ai/annotations/long2010understanding/long2010understanding.md` | Determinization caution source and measurement vocabulary for PIMC risk. |

This note cites the annotation files as the source of truth. Statements
below are split between "paper says" and "project inference" where the
distinction matters.

## Decision

Proceed with guardrails.

Search is a viable next family of Gwent baselines, but it should not be
implemented as a product AI or "strong AI" phase yet. Batch A supports a
small, hidden-information-safe search-readiness track:

1. design the evaluation and determinization-risk measurements first;
2. implement a benchmark-only search prototype second;
3. compare that prototype against `legal-heuristic-v0`, random/legal
   baselines, and explicitly marked debug/oracle baselines.

The immediate next research artifact should be Batch B's evaluation
ladder decision note, not an ISMCTS implementation spec.

## Rationale

### Paper Says

`cowling2012ismcts` makes ISMCTS directly relevant because it searches
over information sets instead of treating every sampled hidden state as
a separate perfect-information game. The annotation records the central
benefit: move statistics can be shared across hidden-state
determinizations, reducing duplicated effort and strategy-fusion
pressure compared with naive determinization.

`cowling2012ensemble` makes search practical enough to keep in the
roadmap. In simplified Magic: The Gathering, ensemble determinization
plus search-shaping techniques can become competitive with a strong
rule-based player. The annotation is also explicit that rollout policy,
move pruning, fixed budgets, matchup tables, and confidence intervals
matter; it does not justify "plain determinization is enough."

`long2010understanding` is the guardrail source. It says PIMC can work
well in some games, but its failures are not vague folklore: strategy
fusion, non-locality, leaf correlation, bias, and disambiguation factor
are measurable. The annotation recommends measuring Gwent states before
assuming that determinization will transfer.

### Project Inference

The current pure engine is a good substrate for this work because legal
moves, deterministic command execution, seeded simulation, safe
observations, and JSONL export boundaries already exist. A search agent
can be made legal-move-first rather than card-first or rule-helper-first.

But Batch A also says that "search baseline" is not one thing. We must
separate at least four variants:

- random/legal rollout baseline;
- determinized perfect-information search;
- ISMCTS-style information-set search;
- cheating oracle/debug search, allowed only for benchmark diagnosis.

Without this separation, early results will be easy to overread.

## Required Guardrails

1. **Hidden-info boundary:** search input must start from a seat
   observation and legal moves for that seat, not raw full state by
   default.
2. **Explicit hidden-state sampling:** sampled worlds must be consistent
   with the acting seat's known information; any full-state oracle mode
   must be named as a cheating diagnostic.
3. **No hidden-info logs:** search traces, metrics, and export rows must
   not leak opponent hand identities, opponent deck order, or raw engine
   instance IDs unless a debug artifact is clearly marked unsafe.
4. **Variant separation:** benchmark results must report whether they
   came from random rollout, determinized search, ISMCTS, or oracle
   search.
5. **Long-style risk metrics:** before calling determinized search a
   strong baseline, measure at least leaf/outcome correlation,
   determinization bias, information-set shrinkage or disambiguation,
   and phase/deck sensitivity.
6. **Branching instrumentation:** record legal action counts and target
   explosion by phase, prompt type, deck, and faction. The Dou Di Zhu
   counterexample in `cowling2012ismcts` is relevant because large
   action unions can waste search near the root.
7. **Rollout discipline:** compare stochastic weak/heuristic rollouts
   against deterministic heuristic rollouts. Batch A does not imply that
   the strongest standalone heuristic is automatically the best rollout
   policy.
8. **Evaluation discipline:** use fixed seeds, mirrored seats where
   applicable, budget sweeps, runtime reporting, matchup matrices, and
   uncertainty intervals before making strength claims.
9. **No equilibrium claim:** ISMCTS and determinized search are
   practical search baselines, not Nash-convergence or
   exploitability-minimizing methods.
10. **Difficulty later:** do not map search budgets directly to product
    difficulty until the baseline is evaluated and failure modes are
    known.

## Implication For Roadmap

Batch A changes the next AI work from "build ISMCTS" to "build the
search-readiness evaluation layer, then prototype search."

Recommended order:

1. Batch B decision note: evaluation ladder and rating / robustness
   methodology.
2. Spec for a search-readiness benchmark harness:
   - fixed seed/matchup suite;
   - legal action and target branching metrics;
   - determinization-risk measurements inspired by
     `long2010understanding`;
   - hidden-info-safe trace contract;
   - slots for future determinized and ISMCTS policies.
3. Benchmark-only search prototype:
   - legal-move-first;
   - hidden-info-safe by default;
   - oracle mode only as an explicitly unsafe comparator;
   - no product difficulty integration yet.

This keeps `legal-heuristic-v1` useful as a rollout and benchmark policy,
but it should not be treated as the research endpoint.

## Open Questions

- What is the exact Gwent-local definition of leaf correlation and bias:
  match outcome, round outcome, score delta, or card-advantage-adjusted
  value?
- Which representative states should be sampled: opening mulligan,
  round-one tempo, pass decisions, post-spy hands, leader-prompt states,
  or all of them?
- Should the first search prototype be SO-ISMCTS, MO-ISMCTS, or a
  simpler determinized search whose flaws are measured first?
- Which rollout policies should be compared: random legal, current
  `legal-heuristic-v0`, a small pass-aware heuristic, or stochastic
  mixtures?
- How much runtime budget should count as the "small academic compute"
  target for local evaluation on the user's RTX 5080 desktop?

## Next Recommended Artifact

Write Batch B's compact decision note over:

- `timbers2022approxexploitability`;
- `herbrich2006trueskill`;
- `glickman1995glicko`.

The goal is to decide the evaluation ladder before writing any search
implementation spec.
