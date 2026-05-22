# cFp58 Search-Readiness And ISMCTS Probe Design

Date: 2026-05-22

Status: accepted decision note

## Controlling Sources

This decision follows Batch A search guardrails and Batch B evaluation boundaries:

- `docs/research/literature/ai/decisions/2026-05-09-batch-a-search-baseline.md`
- `docs/research/literature/ai/decisions/2026-05-09-batch-b-evaluation-ladder.md`
- `docs/research/literature/ai/annotations/cowling2012ismcts/cowling2012ismcts.md`
- `docs/research/literature/ai/annotations/cowling2012ensemble/cowling2012ensemble.md`
- `docs/research/literature/ai/annotations/long2010understanding/long2010understanding.md`

Batch A keeps search in scope only with hidden-info-safe inputs, explicit variant separation, branching instrumentation, runtime/budget reporting, and Long-style determinization-risk measurements. Batch B keeps raw public ledgers and fixed suites as source of truth; ratings are one post-engine view and robustness/search probes must record observation contract, budget, and uncertainty. cFp57 supplies the immediate input: current named rating snapshots do not justify another heuristic behavior patch.

## Current Substrate Inventory

| Substrate | Current status | Why it helps search | Missing piece before cFp59/cFp60 | Hidden-info risk |
| --- | --- | --- | --- | --- |
| Deterministic engine command execution | `executeCommand` validates commands against `getLegalMoves` and returns a cloned transaction state plus events. | Search can replay exact legal commands in sampled worlds or benchmark simulations. | cFp59 needs no command change; cFp60 needs a search worker boundary that never serializes raw commands by default. | Commands carry runtime card identifiers and targets, so public artifacts must aggregate counts only. |
| Legal move generation | `getLegalMoves` covers mulligan, play, pass, leader, prompt, and round-end moves with stable move kinds and target shapes. | Search can be legal-move-first and avoid rule-helper forks. | cFp59 should profile move-kind and target-kind counts without exposing move ids, labels, card names, or action refs. | Legal moves include card identifiers, labels, card names, and target metadata that are safe only inside the policy/runtime boundary. |
| `SeatObservation` | Product policies receive own hand, public board/discards/weather, leaders/factions, scores, gems, pass state, counts, and prompt data visible to the acting seat. | This is the right root observation boundary for safe search input. | cFp59 should add public root metric context around this observation, not a sampler. cFp60 would need a named decklist prior. | Own hand is visible to the actor; opponent hand identity and deck order must remain absent except prompt-revealed cards visible to the actor. |
| Headless match simulation | `runHeadlessMatchSimulation` starts catalog presets, builds `SeatObservation`, selects legal moves, converts to commands, executes commands, and can collect compact logs/traces. | Provides deterministic root-state streams for profiler input and future benchmark-only probes. | cFp59 should hook only public scalar root metrics into benchmark artifacts. | Raw results include final state, command log, events, and traces; these stay debug-only and must not be default profiler output. |
| Batch benchmark suite runner | Existing fixed suites include smoke, starter matrix, expanded, and robust v1-vs-v0 suites with public records and summaries. | Gives fixed seeds, mirrored seats, matchup/deck/faction strata, and source ledgers for search-readiness metrics. | cFp59 should write deterministic search-readiness artifacts under the benchmark-results tree without changing suite definitions. | `includeDebugResults` remains unsafe; public artifacts must use the existing serializer/hazard-scan discipline. |
| Safe simulation export / action encoding | `sim-export-v1`, `safe-observation-v1`, and `legal-action-v1` rows encode visible observations and per-row legal action lists in memory. | Shows a hidden-info-safe pattern for observation/action serialization and validation. | cFp59 metrics should not reuse full legal-action rows if only scalar counts are needed; cFp60 may need a sampler-specific safe world descriptor. | Current action rows include labels and visible card summaries; search-readiness artifacts should be narrower scalar metrics. |
| Decision traces and diagnostics | v1 explanation traces and benchmark trace summaries expose aggregate decision diagnostics for failure mining. | Useful model for hidden-info-safe scalar diagnostics and redaction warnings. | cFp59 should collect root metrics independent of v1 trace internals so future search variants can compare v0/v1/random consistently. | Raw traces can include policy-specific candidate detail; public profiler output should avoid card names, runtime ids, raw move labels, and command logs. |
| Failure mining | cFp34-cFp56 mine public benchmark artifacts and hidden-info-safe scalar trace summaries. | Provides precedent for public casebooks and scoped behavior follow-ups. | cFp59 should not add failure classifiers; it should produce branching/budget distributions only. | Failure mining may inspect unsafe data in-process but committed artifacts must remain public scalar records. |
| Rating snapshots/comparisons | cFp46-cFp57 add Glicko reports, ledgers, snapshots, and suite-local comparison artifacts. | Gives uncertainty-aware post-engine context for later search policy comparisons. | cFp59 should not create rating artifacts; later search probes should snapshot/compare only after public benchmark records exist. | Ratings are safe public summaries, but cannot be interpreted as product difficulty or robustness proof. |

## Search Variant Taxonomy

| Variant label | Safety class | Allowed input | Forbidden input | Intended use | Not-to-claim warning |
| --- | --- | --- | --- | --- | --- |
| `random-rollout-probe-v0` | `safe` | Acting-seat `SeatObservation`, acting-seat legal moves, deterministic seed, and public scalar root metrics. If extended beyond root selection, every simulated decision must receive only that acting seat's observation and legal moves. | Raw full state in the policy, true opponent hand identity, true deck order, command/event logs, raw move labels, action refs, and unsafe debug payloads. | Cheap legal-random baseline/profiler comparator and rollout sanity check. | Do not call it search strength, product difficulty, or a hidden-state sampler. |
| `determinized-pimc-probe-v0` | `risky_requires_sampler` | `SeatObservation`, root legal moves, named decklist prior, deterministic sampler seed, and sampled worlds consistent with public counts and revealed information. | True hidden state as input, opponent hand/deck identities outside sampled internal worlds, raw runtime ids in artifacts, and product-selectable policy wiring. | First determinized search experiment after cFp59 metrics show branching budgets are tractable. | Do not report it as hidden-info sound or strong without Long-style risk metrics. |
| `so-ismcts-probe-v0` | `risky_requires_sampler` | Same safe root contract plus an information-set tree keyed by public/root action abstractions and sampled-world legal action availability. | Raw full-state root, hidden identities in logs, fixed global action vectors that ignore legal move availability, and product UI integration. | Later benchmark-only single-observer ISMCTS probe once sampler and action-union risks are understood. | Do not claim Nash convergence, equilibrium play, or universal superiority to determinization. |
| `oracle-pimc-debug-v0` | `unsafe_oracle_debug` | Explicit unsafe benchmark/debug path with full engine state, clearly separated artifact path, and no product policy registration. | Default benchmark output, AI Lab product policy rows, safe export datasets, or any path that could be confused with hidden-info-safe policy results. | Diagnose determinization bias by comparing safe sampled estimates with a cheating upper-bound/debug value. | Do not compare it as a fair agent and do not merge its records with safe policy ledgers. |

## Observation And Determinization Contract

Future safe search input starts from `SeatObservation` plus the acting seat's legal moves. The search root may also receive public benchmark context such as acting policy id, faction, deck preset id, deterministic seed, and a public root fingerprint.

Safe mode may use:

- own hand identities, because they are visible to the acting seat;
- public board, public discard piles, weather, leader/faction, gems, round, passed status, score, and prompt data revealed to the acting seat;
- opponent hand count and deck count;
- acting/opponent deck preset id in benchmark starter suites, because those suites publish preset metadata;
- public catalog-level priors only through a named prior contract.

Safe mode may not receive raw opponent hand identities, opponent deck order, raw full state, raw move labels, action refs, command logs, event logs, final engine state, or unsafe debug payloads. Prompt-revealed cards remain allowed only for the prompt owner and only while the engine exposes that reveal through the observation/prompt contract.

Decklist priors must be named:

- `known_preset_decklist_prior` for benchmark starter suites where both presets are public benchmark metadata;
- `unknown_decklist_catalog_prior` for future custom-deck/product play where only catalog constraints and public counts are available.

Sampled worlds must be consistent with public counts, known decklist prior, own visible hand/discard, public board/weather/discards, leader/faction information, passed/gem/round state, and any currently revealed prompt data. Oracle/debug mode must use a different variant label and artifact path; safe benchmark artifacts must never silently include oracle results.

Current code exposes enough for a cFp59 hidden-info-safe root profiler, not enough for a cFp60 safe sampler. The minimal cFp59 additions should be public scalar metric collection, public root fingerprinting, and benchmark root context with acting policy id, faction, and deck preset id. A later sampler phase needs the named prior implementation and a sampled-world validator before any rollout or tree search.

## Branching And Budget Metrics

cFp59 should collect one public root metric row per profiled decision point:

- phase;
- round;
- acting policy id;
- acting faction;
- acting deck preset id;
- legal move count;
- move counts by kind;
- play-card source-card count;
- target expansion count;
- prompt-option count;
- mulligan-option count;
- commander horn target count if derivable safely;
- weather target count if derivable safely;
- row target count if derivable safely;
- elapsed time per root-state profiling operation;
- deterministic seed;
- root-state public fingerprint.

These metrics must not include card names, catalog source identifiers, runtime instance identifiers, raw move labels, action refs, command logs, event logs, final engine state, or unsafe debug payloads unless a future spec explicitly defines a safe public encoding. The root-state public fingerprint should hash only public scalar/count fields and visible/public zones allowed by the observation contract.

## Determinization-Risk Metrics

| Metric | Definition | Safe mode now? | Future data/code required |
| --- | --- | --- | --- |
| Outcome variance across sampled worlds for the same root | Variance of rollout terminal outcome estimates when multiple sampled worlds share one public root observation. | No. | Named prior sampler, sampled-world validator, rollout policy, and per-root sample grouping. |
| Selected-action rank instability across sampled worlds | Frequency with which the top-ranked root action changes across sampled worlds for the same public root. | No. | Determinized evaluator with stable public action abstraction and no hidden payload serialization. |
| Root-value variance by phase/faction/deck | Distribution of sampled value estimates stratified by phase, faction, and deck preset. | No. | Sampler, value estimator, public stratification metadata, and enough fixed-suite roots. |
| Determinization bias versus oracle/debug value | Gap between safe sampled estimates and a full-state oracle/debug estimate for the same root. | Unsafe debug only. | Separate `oracle-pimc-debug-v0` path, clear artifact segregation, and report labels preventing fair-agent comparisons. |
| Information-set shrinkage / disambiguation proxy | Change in candidate hidden-world count or compatible-card-pool width as public information accumulates. | Partial after cFp59 root metrics; not measured today. | Named prior plus safe counts of remaining compatible hidden assignments by root, phase, faction, and deck. |
| Action-union width | Count of distinct public root/action abstractions that appear across sampled worlds compared with per-world legal move counts. | No. | Sampler, legal move generation per sampled world, and a public action abstraction that avoids raw ids/labels. |
| Rollout-policy sensitivity | Difference in root value/action ranking when rollouts use random, v0, v1, or stochastic heuristic policies. | No. | Multiple rollout policies, fixed budgets, deterministic seeds, and public result records with budget metadata. |

## Recommended cFp59 Build Target

cFp59 should implement a hidden-info-safe search-readiness profiler, not a search-playing policy.

The profiler should:

- collect root-state branching and budget metrics from existing headless benchmark runs;
- write deterministic public artifacts under the benchmark-results tree, for example `<suiteId>/search-readiness/cFp59/`;
- include no rollouts, tree search, PIMC, ISMCTS, oracle/debug search, or product-selectable search AI;
- reuse existing legal moves and observation boundaries without changing engine rules or AI policy behavior;
- update AI Lab metadata to identify cFp59 as profiler/evaluation infrastructure;
- produce distributions that decide whether `determinized-pimc-probe-v0` or `so-ismcts-probe-v0` is the safer cFp60 build target.

This is safer than implementing full search immediately because current code lacks a named hidden-state sampler, public action abstraction across sampled worlds, and determinization-risk measurements.

## Stop Conditions

Future search implementation should stop and return to design if:

- root legal-move branching or target expansion is too high for local pruning/budget goals;
- safe determinization cannot be implemented without exposing opponent hidden hand identities or deck order;
- prompt-stage roots dominate the sample and need a separate prompt/search contract;
- profiling or prototype budgets exceed local RTX 5080 / small academic compute targets;
- oracle/debug results are being reported beside safe policy results without clear unsafe labels and artifact separation;
- sampled worlds cannot be validated against public counts, revealed information, and the named prior;
- action-union width makes the root abstraction unstable enough that early rollout values are uninterpretable.
