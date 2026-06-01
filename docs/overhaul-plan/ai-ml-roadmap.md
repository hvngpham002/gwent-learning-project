# AI And Machine Learning Roadmap

The ML goal should be treated as a product of a correct deterministic engine. A model cannot learn a reliable game if the game has duplicate rule paths, hidden non-determinism, or illegal action side effects.

## Literature-Grounded Workflow

Cluster F starts with a research-foundation stage, not model training. Until at least a small annotated literature base exists, the right next AI/ML work is reading and triaging papers, not writing `legal-heuristic-v1` or a self-play training program.

Operating rules:

- `docs/research/literature/ai/annotations/` is the source of truth for literature-grounded AI/ML claims. Implementation-affecting research claims in future Cluster F specs must cite annotation files there.
- The first Cluster F work is research foundation and benchmark/evaluation-ladder planning, not model training. The annotation workflow at `docs/research/literature/ai/ANNOTATION_WORKFLOW.md` defines the page-bounded batch reading protocol, source package contract, and required body sections.
- Future benchmark, search, training, self-play, difficulty, and model architecture decisions should cite annotations or be explicitly labeled project hypotheses.
- Compact decision notes live under `docs/research/literature/ai/decisions/` and should be used to turn small annotation batches into implementation-adjacent roadmap choices. The first accepted note is `docs/research/literature/ai/decisions/2026-05-09-batch-a-search-baseline.md`, which keeps search in scope but gates implementation on an evaluation and determinization-risk harness. The second accepted note is `docs/research/literature/ai/decisions/2026-05-09-batch-b-evaluation-ladder.md`, which made the next implementation-adjacent artifact a benchmark/evaluation harness before search or model training. cFp21 starts that harness with versioned in-memory ledgers and fixed-suite summaries in `src/game/benchmark/`; cFp22 adds the durable `npm run benchmark:smoke` artifact command and generated public smoke-suite results; cFp23 adds a benchmark deck taxonomy plus `npm run benchmark:starter-matrix` for the official starter-deck fixed-suite matrix; cFp24 adds `legal-heuristic-v1` plus `npm run benchmark:v1-smoke` and `npm run benchmark:v1-starter-matrix` v1-vs-v0 artifact suites; cFp24.1 exposes v1 as an experimental product playtest policy while keeping v0 as the default; cFp48 adds the robust 1000-record starter-matrix evaluation suite and its first suite-local rating baseline; cFp57 freezes current rating snapshots across current, expanded, and robust starter suites; cFp58 records search-readiness and ISMCTS probe design guardrails without implementing search or changing gameplay policy; cFp59 adds hidden-info-safe root-profiler artifacts over current and robust starter benchmark roots as evaluation infrastructure only, not search gameplay; cFp60 adds benchmark-only `known_preset_decklist_prior`, sampled-world validation summaries, hidden-info-safe public action abstraction, and deterministic sampler-readiness artifacts; cFp61 materializes hidden opponent hand/deck source-multiset samples in memory and writes aggregate-only sampler-materialization artifacts; cFp62 classifies the 404 remaining sampler invalid roots with scalar-only invalid-root casebook artifacts and recommends a narrow public-count sampler repair before search; cFp63 adds the public-card de-duplication repair and scalar duplicate-reference diagnostics, finds zero duplicate public/fixed-known-hand references, and recommends cFp64 public-zone provenance casebook work before search; cFp64 adds that scalar public-zone provenance casebook, labels all 404 remaining public-zone deficit roots exactly once, and recommends a narrow cFp65 sampler accounting repair before any search probe. These are documented at `docs/research/literature/ai/benchmark-harness.md`, `docs/research/literature/ai/benchmark-deck-taxonomy.md`, `docs/research/literature/ai/policies/legal-heuristic-v1.md`, and `docs/research/literature/ai/benchmark-results/README.md`.
- `docs/research/bibliography/references.bib` is the shared BibTeX database for research manuscripts. Annotation citekeys should match BibTeX citekeys when possible.
- Draft paper tracks live under `docs/research/manuscripts/`: an applied Gwent AI systems paper and a theory-oriented imperfect-information card-game paper. These are placeholders until annotations and experiments justify concrete claims.
- This roadmap document remains a roadmap summary, not the source of truth for literature claims. If a roadmap statement contradicts an annotation, update the annotation, retract it, or label the roadmap statement a project hypothesis.
- The current completed simulation/export infrastructure (headless AI-vs-AI runner, batch seed suites, hidden-info-safe `sim-export-v1` decision rows, validated in-memory JSONL boundary, `legal-heuristic-v0`, and playtestable `legal-heuristic-v1`) gives us a base for experiments. It does not yet constitute a validated AI research program.
- cEp17 adds `/ai-lab` as a read-only product dashboard over the current research status. cFp24.1 keeps it read-only but derives product policy rows from the shared product policy registry, so `legal-heuristic-v0` appears as stable/default and `legal-heuristic-v1` appears as implemented experimental/playtest. `legal-first-v0` remains benchmark-only. The route does not execute benchmarks, simulations, ratings, search, training, Python tooling, or file export from the browser.

The active literature sweep prompt lives at `docs/research/literature/ai/prompts/lit-sweep-gwent-ai-prompt.md`. The first multi-model sweep was triaged in `docs/research/literature/ai/results/2026-05-08/triage.md`; the current post-triage annotation queue lives at `docs/research/literature/ai/results/2026-05-08/queue.md`.

## Stages

| Stage | Name | Goal |
|---|---|---|
| 0 | Literature foundation | Annotation workflow, sweep prompt, multi-model triage, and source-grounded notes for AI/ML claims (Cluster F starting point). cFp0 created the workflow; cFp1 triaged the first ChatGPT/Claude/DeepSeek/Gemini/Qwen sweep. Annotation has not started yet. |
| 1 | Legal heuristic AI | Current AI rebuilt as a policy over legal moves and shared scoring. `legal-heuristic-v0` remains the product default; cFp24 adds `legal-heuristic-v1` with muster-aware mulligan, prompt, pass, card, and leader scoring; cFp24.1 exposes v1 through a compact pre-game `AI policy` playtest selector and `?ai=legal-heuristic-v1` deep link. |
| 2 | AI vs AI simulation | Headless games for policy evaluation and regression. Implemented under `cDp8` / `cDp9`. |
| 3 | Replay and metrics | Event logs, deterministic seeds, win-rate and strategy metrics. Implemented as deterministic command replay, batch diagnostics, and fingerprints under `cDp9`. |
| 4 | Observation/action API | Stable training environment interface. Hidden-info-safe `sim-export-v1` decision rows, per-row legal action lists, and validated in-memory JSONL boundary exist under `cDp10` / `cDp11`. File writers, fixed action vectors, and Python tooling are still future work. |
| 5 | Baseline training | Random, heuristic, supervised imitation from heuristic games, then self-play experiments. Not started; gated on the literature foundation and the next planned work. |
| 6 | Evaluation ladder | Started in cFp21 with an in-memory benchmark harness, `benchmark-match-v1` raw ledgers, `benchmark-summary-v1` fixed-suite summaries, mirrored current-deck smoke matchups, and a deterministic `legal-first-v0` comparator. cFp22 adds the first durable public artifact boundary with `npm run benchmark:smoke`, writing a deterministic manifest, summary, JSONL ledger, and Markdown report for `benchmark-smoke-v1/latest`. cFp23 adds explicit benchmark deck categories and `benchmark-starter-matrix-v1`, covering the five official starter decks across 10 unordered pairings, both policy assignments, 3 seeds, mirrored seat runs, and 120 public records. cFp24 adds v1 comparison suites: `benchmark-v1-smoke-v1` with 12 records and `benchmark-v1-starter-matrix-v1` with 120 records. cFp34/cFp35 add failure-mining artifacts. cFp41 adds the expanded 400-record starter-matrix discovery suite. cFp46 adds a deterministic Glicko-1 rating layer that consumes benchmark records and produces rating/RD reports with uncertainty estimates. cFp47 adds a snapshot/ledger/comparison layer: named `cFp46` snapshots, `ledger.json` per suite, and `cFp46-vs-latest` comparison artifacts with delta/signal computation for longitudinal rating tracking. cFp48 adds `benchmark-v1-starter-matrix-robust-v1`, a 25-seed / 1000-record deterministic v1-vs-v0 official-starter suite with failure-mining, ratings, a `cFp48` snapshot, and a `cFp48-vs-latest` comparison boundary. cFp57 adds named `cFp57` snapshots and suite-local comparisons for current, expanded, and robust rating artifacts. cFp58 defines the search-readiness profiler target for cFp59 and separates safe probes from sampler-required and unsafe oracle/debug variants. cFp59 implements that hidden-info-safe root profiler over current and robust starter benchmark roots, with deterministic artifacts and no gameplay/search policy behavior. cFp60 implements the sampler-readiness contract: `known_preset_decklist_prior` for official starter contexts, sampled-world validation summaries, hidden-info-safe public action abstraction, and deterministic sampler-readiness artifacts over current and robust starter suites. cFp61 materializes the first real hidden opponent source-multiset samples from that prior in memory and writes aggregate-only artifacts for all 36,529 current/robust roots; 36,125 valid roots have 8/8 samples and 404 roots are safe `insufficient_prior_remaining` invalids with zero generated samples. cFp62 reruns that materialization path and classifies all 404 invalid roots as `public_zone_count_deficit`. cFp63 repairs duplicate public-card accounting defensively, adds duplicate-reference diagnostics, and shows the duplicate-reference totals are zero, leaving the same 404 invalid roots. cFp64 labels those 404 roots with scalar public-zone provenance: current 63 roots and robust 341 roots are dominated by mixed public zones plus board/discard single-zone and round-end labels, with no ambiguous or zero-zone rows, and cFp65 should implement a narrow sampler accounting repair before search. Elo, TrueSkill, mechanics decks, competitive deck lists, implemented search policies, and exploitability probes remain future work. |

## Product AI Lab Boundary

The `/ai-lab` route is a read-only control-plane surface for the product shell. It is allowed to show static suite, policy, ladder, and research-reference metadata, including `benchmark-smoke-v1`, stable/default `legal-heuristic-v0`, experimental/playtest `legal-heuristic-v1`, and benchmark-only `legal-first-v0`. Product policy rows are derived from the shared product policy registry so future registration changes do not require hand-edited duplicate implementation status.

It is not a runner. Browser benchmark execution, ledger export, ratings generation, search prototypes, self-play, model training, Python tooling, and product difficulty tiers remain future work and must be specified before being wired. The cFp22 `benchmark:smoke`, cFp23 `benchmark:starter-matrix`, cFp24 v1 artifact commands, cFp46 `benchmark:ratings:*` commands, cFp47 `benchmark:ratings:compare:*` commands, cFp48 robust benchmark/rating commands, cFp59 search-readiness artifact commands, cFp60 sampler-readiness artifact commands, cFp61 sampler-materialization artifact commands, cFp62 sampler invalid-root artifact commands, and cFp64 sampler public-zone provenance artifact commands remain headless and are not invoked by `/ai-lab`. cFp59 is profiler/evaluation infrastructure metadata, cFp60 is sampler-readiness infrastructure metadata, cFp61 is sampler-materialization infrastructure metadata, cFp62 is invalid-root casebook metadata, cFp63 is sampler repair metadata, and cFp64 is provenance casebook metadata for this surface; none adds a browser search runner, search gameplay, or a product search policy.

## Policy Interface

All AI variants should implement the same interface:

```ts
interface Policy {
  id: string;
  selectAction(input: PolicyInput): EngineCommand;
}

interface PolicyInput {
  observation: SeatObservation;
  legalMoves: LegalMove[];
  seed: string;
}
```

The policy never mutates state directly and never constructs moves that are not in `legalMoves`.

## Observation Model

The engine should produce an observation for a given seat:

- own hand;
- own deck count, not deck order unless a rule reveals it;
- own discard;
- own leader and faction;
- opponent battlefield;
- opponent discard;
- opponent deck count;
- opponent hand count;
- public weather and row effects;
- gem counts;
- round number;
- pass state;
- public event history.

Debug and training experiments may request full-state observations, but that must be an explicit cheat/debug mode. It cannot be the default AI input.

## Action Space

The action space should start as legal-move IDs, not a fixed global neural action vector.

For ML export, each move can be encoded as:

- action type: play card, pass, use leader, choose target, choose row, mulligan;
- source card instance or source ID;
- target row;
- target card instance;
- prompt response;
- legal action mask.

This lets a model score only currently legal choices.

## Rewards

Initial reward signals:

- match win/loss/draw;
- round win/loss/draw;
- card advantage after each round;
- final gem margin;
- score differential at pass;
- penalty for invalid action attempts in training wrappers only.

Do not over-shape rewards before a baseline policy exists. Start with sparse match reward plus metrics.

## Logs

Simulation should emit JSONL:

```json
{
  "matchId": "seed-001",
  "step": 42,
  "seat": "seat_a",
  "observationHash": "...",
  "legalMoveCount": 18,
  "chosenMove": { "type": "play_card", "card": "neutral.decoy" },
  "events": [],
  "result": null
}
```

Match summary:

```json
{
  "matchId": "seed-001",
  "seed": "001",
  "policies": { "seat_a": "heuristic-v1", "seat_b": "random-v1" },
  "winner": "seat_a",
  "rounds": 3,
  "finalGems": { "seat_a": 1, "seat_b": 0 },
  "metrics": {
    "turns": 41,
    "passes": 5,
    "averageLegalMoves": 12.4
  }
}
```

## Evaluation

Baseline policy suite:

- random legal move;
- greedy score policy;
- current heuristic port;
- pass-aware heuristic;
- self-play candidate.

Metrics:

- win rate by matchup;
- average card advantage;
- average round length;
- pass timing;
- illegal move attempts;
- deterministic replay success rate;
- runtime per simulated game.

## ML Integration Boundary

Keep the core engine in TypeScript. Export logs and environment steps in a stable JSON protocol so Python tooling can consume them later.

Possible future paths:

- Python training loop reads JSONL offline data.
- Node process exposes a simple environment bridge.
- Web worker or server process runs self-play batches.
- Learned model is exported back to the app as policy weights or a service.

The critical early investment is not model code. It is legal moves, deterministic replay, and clean observations.
