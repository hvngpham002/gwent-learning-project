# AI And Machine Learning Roadmap

The ML goal should be treated as a product of a correct deterministic engine. A model cannot learn a reliable game if the game has duplicate rule paths, hidden non-determinism, or illegal action side effects.

## Literature-Grounded Workflow

Cluster F starts with a research-foundation stage, not model training. Until at least a small annotated literature base exists, the right next AI/ML work is reading and triaging papers, not writing `legal-heuristic-v1` or a self-play training program.

Operating rules:

- `docs/research/literature/ai/annotations/` is the source of truth for literature-grounded AI/ML claims. Implementation-affecting research claims in future Cluster F specs must cite annotation files there.
- The first Cluster F work is research foundation and benchmark/evaluation-ladder planning, not model training. The annotation workflow at `docs/research/literature/ai/ANNOTATION_WORKFLOW.md` defines the page-bounded batch reading protocol, source package contract, and required body sections.
- Future benchmark, search, training, self-play, difficulty, and model architecture decisions should cite annotations or be explicitly labeled project hypotheses.
- Compact decision notes live under `docs/research/literature/ai/decisions/` and should be used to turn small annotation batches into implementation-adjacent roadmap choices. The first accepted note is `docs/research/literature/ai/decisions/2026-05-09-batch-a-search-baseline.md`, which keeps search in scope but gates implementation on an evaluation and determinization-risk harness. The second accepted note is `docs/research/literature/ai/decisions/2026-05-09-batch-b-evaluation-ladder.md`, which made the next implementation-adjacent artifact a benchmark/evaluation harness before search or model training. cFp21 starts that harness with versioned in-memory ledgers and fixed-suite summaries in `src/game/benchmark/`; cFp22 adds the durable `npm run benchmark:smoke` artifact command and generated public smoke-suite results; cFp23 adds a benchmark deck taxonomy plus `npm run benchmark:starter-matrix` for the official starter-deck fixed-suite matrix; cFp24 adds `legal-heuristic-v1` plus `npm run benchmark:v1-smoke` and `npm run benchmark:v1-starter-matrix` v1-vs-v0 artifact suites; cFp24.1 exposes v1 as an experimental product playtest policy while keeping v0 as the default; cFp48 adds the robust 1000-record starter-matrix evaluation suite and its first suite-local rating baseline; cFp57 freezes current rating snapshots across current, expanded, and robust starter suites; cFp58 records search-readiness and ISMCTS probe design guardrails without implementing search or changing gameplay policy; cFp59 adds hidden-info-safe root-profiler artifacts over current and robust starter benchmark roots as evaluation infrastructure only, not search gameplay; cFp60 adds benchmark-only `known_preset_decklist_prior`, sampled-world validation summaries, hidden-info-safe public action abstraction, and deterministic sampler-readiness artifacts; cFp61 materializes hidden opponent hand/deck source-multiset samples in memory and writes aggregate-only sampler-materialization artifacts; cFp62 classifies the 404 remaining sampler invalid roots with scalar-only invalid-root casebook artifacts and recommends a narrow public-count sampler repair before search; cFp63 adds the public-card de-duplication repair and scalar duplicate-reference diagnostics, finds zero duplicate public/fixed-known-hand references, and recommends cFp64 public-zone provenance casebook work before search; cFp64 adds that scalar public-zone provenance casebook, labels all 404 remaining public-zone deficit roots exactly once, and recommends a narrow cFp65 sampler accounting repair before any search probe; cFp65 makes public-zone prior accounting explicit with scalar main-deck-attributable, side-deck-only, off-prior, and uncovered-deficit counts while keeping strict invalid roots invalid unless a public-only adjustment covers them; cFp66 adds perspective-specific public-transfer memory, leaves current at 3,979 valid / 63 invalid, and improves robust to 32,147 valid / 340 invalid without implementing search; cFp67 classifies the remaining post-cFp66 invalid roots as valid-root-only skip candidates and requires explicit cFp68 skip counters before any determinized probe result; cFp68 implements that valid-root-only contract with deterministic eligible/skipped artifacts and still does not run search; cFp69 adds the first benchmark-only determinized-pimc-probe-v0 public-action scaffold over cFp68 eligible roots, with skipped-root accounting carried forward and no rollout/value/strength claims; cFp70 adds a benchmark-only sampled-world action availability probe over those same roots, with 0 failed samples and 0 availability disagreements in current and robust suites; cFp71 adds a benchmark-only one-ply public action outcome skeleton over the same roots, with 0 failed/deferred pairs and 0 public outcome divergence roots in current and robust suites; cFp72 adds a benchmark-only post-one-ply branching budget probe over the same roots, with current/robust completed first-ply pair counts of 150,560/1,230,736, 0 failed/deferred pairs, and no rollout/value/strength claims; cFp73 adds a benchmark-only casebook over committed cFp72 scalar artifacts, with 1,291 current and 10,721 robust casebook rows, 0 status anomalies, 0 very-large/extreme buckets, and a bounded second-ply scaffold recommendation with caps; cFp74 implements that bounded second-ply public-action scaffold with explicit caps, separate over-budget and inherited skipped-root artifacts, 0 failed/deferred second-ply pairs, and compact robust root JSONL below 60 MB. These are documented at `docs/research/literature/ai/benchmark-harness.md`, `docs/research/literature/ai/benchmark-deck-taxonomy.md`, `docs/research/literature/ai/policies/legal-heuristic-v1.md`, and `docs/research/literature/ai/benchmark-results/README.md`.
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
| 6 | Evaluation ladder | Started in cFp21 with an in-memory benchmark harness, `benchmark-match-v1` raw ledgers, `benchmark-summary-v1` fixed-suite summaries, mirrored current-deck smoke matchups, and a deterministic `legal-first-v0` comparator. cFp22 adds the first durable public artifact boundary with `npm run benchmark:smoke`, writing a deterministic manifest, summary, JSONL ledger, and Markdown report for `benchmark-smoke-v1/latest`. cFp23 adds explicit benchmark deck categories and `benchmark-starter-matrix-v1`, covering the five official starter decks across 10 unordered pairings, both policy assignments, 3 seeds, mirrored seat runs, and 120 public records. cFp24 adds v1 comparison suites: `benchmark-v1-smoke-v1` with 12 records and `benchmark-v1-starter-matrix-v1` with 120 records. cFp34/cFp35 add failure-mining artifacts. cFp41 adds the expanded 400-record starter-matrix discovery suite. cFp46 adds a deterministic Glicko-1 rating layer that consumes benchmark records and produces rating/RD reports with uncertainty estimates. cFp47 adds a snapshot/ledger/comparison layer: named `cFp46` snapshots, `ledger.json` per suite, and `cFp46-vs-latest` comparison artifacts with delta/signal computation for longitudinal rating tracking. cFp48 adds `benchmark-v1-starter-matrix-robust-v1`, a 25-seed / 1000-record deterministic v1-vs-v0 official-starter suite with failure-mining, ratings, a `cFp48` snapshot, and a `cFp48-vs-latest` comparison boundary. cFp57 adds named `cFp57` snapshots and suite-local comparisons for current, expanded, and robust rating artifacts. cFp58 defines the search-readiness profiler target for cFp59 and separates safe probes from sampler-required and unsafe oracle/debug variants. cFp59 implements that hidden-info-safe root profiler over current and robust starter benchmark roots, with deterministic artifacts and no gameplay/search policy behavior. cFp60 implements the sampler-readiness contract: `known_preset_decklist_prior` for official starter contexts, sampled-world validation summaries, hidden-info-safe public action abstraction, and deterministic sampler-readiness artifacts over current and robust starter suites. cFp61 materializes the first real hidden opponent source-multiset samples from that prior in memory and writes aggregate-only artifacts for all 36,529 current/robust roots; 36,125 valid roots have 8/8 samples and 404 roots are safe `insufficient_prior_remaining` invalids with zero generated samples. cFp62 reruns that materialization path and classifies all 404 invalid roots as `public_zone_count_deficit`. cFp63 repairs duplicate public-card accounting defensively, adds duplicate-reference diagnostics, and shows the duplicate-reference totals are zero, leaving the same 404 invalid roots. cFp64 labels those 404 roots with scalar public-zone provenance: current 63 roots and robust 341 roots are dominated by mixed public zones plus board/discard single-zone and round-end labels, with no ambiguous or zero-zone rows. cFp65 makes the public-zone prior accounting explicit with scalar main-deck-attributable, side-deck-only, off-prior, and uncovered-deficit counts while preserving strict conservation. cFp66 adds public-transfer memory for previously public or prompt-revealed cards later hidden in opponent hand/deck zones; current remains 3,979 valid / 63 invalid, robust improves to 32,147 valid / 340 invalid. cFp67 classifies all remaining invalid roots as valid-root-only skip candidates and recommends cFp68 expose explicit skip counters before any determinized probe. cFp68 implements that contract as deterministic eligible/skipped artifacts: current 3,979 eligible / 63 skipped, robust 32,147 eligible / 340 skipped, with skipped-root percentages and skip counters. cFp69 consumes those artifacts for a benchmark-only determinized-pimc-probe-v0 scaffold: current 3,979 probe / 63 skipped, robust 32,147 probe / 340 skipped, source consistency probe-ready, sample budgets unchanged, public-action scalar counts only, and no search gameplay or strength claim. cFp70 consumes cFp68/cFp69 artifacts for a benchmark-only sampled-world action availability probe: current 3,979 availability / 63 skipped, robust 32,147 availability / 340 skipped, sample budgets unchanged, 0 failed samples, 0 availability disagreements, and no search gameplay or strength claim. cFp71 consumes cFp68/cFp69/cFp70 artifacts for a benchmark-only one-ply public action outcome skeleton: current 3,979 outcome / 63 skipped / 150,560 completed pairs, robust 32,147 outcome / 340 skipped / 1,230,736 completed pairs, 0 failed/deferred pairs, 0 public outcome divergence roots, and no search gameplay or strength claim. cFp72 consumes cFp68/cFp69/cFp70/cFp71 artifacts for a benchmark-only post-one-ply branching budget probe: current 3,979 branching / 63 skipped / 150,560 completed first-ply pairs, robust 32,147 branching / 340 skipped / 1,230,736 completed first-ply pairs, post-one-ply public action budget averages 5.735 current and 5.765 robust, and no search gameplay or strength claim. cFp73 reads committed cFp72 scalar artifacts for a benchmark-only casebook: current 1,291 casebook / 63 skipped rows, robust 10,721 casebook / 340 skipped rows, source consistency ready, 0 status anomalies, 0 very-large/extreme buckets, and a bounded second-ply scaffold recommendation with explicit caps. cFp74 implements the bounded second-ply scaffold: current 3,593 in-cap / 386 over-budget / 63 inherited skipped roots and robust 28,915 in-cap / 3,232 over-budget / 340 inherited skipped roots, 0 failed/deferred second-ply pairs, explicit root-level cap accounting, compact robust root JSONL at 58.288 MB, and no search gameplay or strength claim. cFp75 pauses blind third-ply execution and defines `search-consumer-action-features-v0` as the recommended cFp76 target, specifying cFp76 artifact contract, feature schema, source consistency checks, budget limits, hidden-info restrictions, non-claims, and stop conditions. cFp76 implements `search-consumer-action-features-v0` as a read-only consumer of committed cFp68-cFp74 artifacts: source consistency is ready for both suites, it emits one root feature row per cFp68 eligible root (current 3,979, robust 32,147) and carries cFp68 skipped roots into skipped-root rows (current 63, robust 340), but because committed cFp69-cFp74 artifacts expose only aggregate per-root count maps and no durable per-public-action identity, it reports `action_feature_source_gap`: `action-features.jsonl` is empty and `action-feature-gaps.jsonl` carries 5 rows per suite. Robust `root-features.jsonl` is 79.68 MB, below the 90 MB hard stop, and robust repeat hashes matched exactly. cFp77 implements `public-action-identity-artifact-v0` as a read-only derivation over committed cFp68/cFp69/cFp76 artifacts: source consistency is ready for both suites, it emits one action identity row per collapsed public action bucket per cFp68 eligible root (current 18,820, robust 153,842) plus one root summary row per eligible root (current 3,979, robust 32,147), and carries cFp68/cFp69 skipped roots into skipped-root rows (current 63, robust 340). Action identity rows reference root summaries through a compact `rootRef` join key instead of repeating root identity fields. Robust `action-identities.jsonl` is 54.89 MB, below the 90 MB hard stop but above the 50 MB soft target, and robust repeat hashes matched exactly. cFp78 implements `public-action-identities-compact-v0` as a read-only compact projection over committed cFp77 artifacts: source consistency is ready for both suites (18 checks), it emits slim compact action rows (dropping `actionPhase`/`actionRound`/`collisionCountWithinBucket`, renaming `publicActionKind → kind`/`publicActionOrdinal → ordinal`, compacting target fields into a `target` token), compact root-index join rows retaining only cFp79-needed fields, and cFp77 skipped-root rows forwarded verbatim. Robust `action-identities-compact.jsonl` is 46.86 MB - below the 50 MB soft target (8.03 MB / 14.63% saved vs cFp77 `action-identities.jsonl`), enabling cFp79 consumer feature joins. Robust `root-index.jsonl` is 23.92 MB. Robust repeat hashes matched exactly. cFp79 implements `search-consumer-action-features-v1` as a read-only join over committed cFp76/cFp78 artifacts: source consistency is ready for both suites, it emits one normalized root-feature row per eligible root (current 3,979, robust 32,147), one populated action-feature row per compact action identity (current 18,820, robust 153,842), and one skipped-root row per skipped root (current 63, robust 340). Robust `action-features.jsonl` is 86.03 MB, below the 90 MB hard stop but above the 50 MB soft target, so cFp80 should compact or dictionary-encode before consumer casebook work. Robust repeat hashes matched exactly. cFp80 implements `search-consumer-action-features-dictionary-v0` as a read-only dictionary projection over committed cFp79 artifacts: source consistency is ready for both suites, cFp79 row counts are preserved (current 3,979 root / 18,820 compact action / 63 skipped; robust 32,147 root / 153,842 compact action / 340 skipped), reconstruction mismatch count is 0, and robust `action-features-compact.jsonl` is 46.04 MB, below the 50 MB soft target. Robust repeat hashes matched exactly. Elo, TrueSkill, mechanics decks, competitive deck lists, implemented search policies, and exploitability probes remain future work. |

## Product AI Lab Boundary

cFp81 adds `search-consumer-action-feature-casebook-v0` as a read-only
aggregate casebook over committed cFp80 compact artifacts. Current and robust
both reach `casebook_ready` with 80 bounded casebook rows and 95 slice
summaries; current carries 63 inherited skipped roots (1.56%) and robust
carries 340 (1.05%). Robust `casebook-rows.jsonl` is 42,703 bytes and
`slice-summaries.jsonl` is 41,906 bytes. It is benchmark infrastructure only:
no search gameplay, action execution, rollout, action ranking, or product
policy behavior changes.

The `/ai-lab` route is a read-only control-plane surface for the product shell. It is allowed to show static suite, policy, ladder, and research-reference metadata, including `benchmark-smoke-v1`, stable/default `legal-heuristic-v0`, experimental/playtest `legal-heuristic-v1`, and benchmark-only `legal-first-v0`. Product policy rows are derived from the shared product policy registry so future registration changes do not require hand-edited duplicate implementation status.

It is not a runner. Browser benchmark execution, ledger export, ratings generation, search prototypes, self-play, model training, Python tooling, and product difficulty tiers remain future work and must be specified before being wired. The cFp22 `benchmark:smoke`, cFp23 `benchmark:starter-matrix`, cFp24 v1 artifact commands, cFp46 `benchmark:ratings:*` commands, cFp47 `benchmark:ratings:compare:*` commands, cFp48 robust benchmark/rating commands, cFp59 search-readiness artifact commands, cFp60 sampler-readiness artifact commands, cFp61 sampler-materialization artifact commands, cFp62 sampler invalid-root artifact commands, cFp64 sampler public-zone provenance artifact commands, cFp67 post-cFp66 invalid-root casebook artifact commands, cFp68 determinized probe contract artifact commands, cFp69 determinized-pimc-probe-v0 artifact commands, cFp70 sampled-world action availability artifact commands, cFp71 one-ply outcome skeleton artifact commands, cFp72 post-one-ply branching budget artifact commands, cFp73 post-one-ply branching budget casebook artifact commands, cFp74 bounded second-ply scaffold artifact commands, cFp75 search-consumer contract decision artifacts, cFp76 search-consumer-action-features-v0 artifact commands, cFp77 public-action-identity-artifact-v0 artifact commands, cFp78 public-action-identities-compact-v0 artifact commands, cFp79 search-consumer-action-features-v1 artifact commands, cFp80 search-consumer-action-features-dictionary-v0 artifact commands, and cFp81 search-consumer-action-feature-casebook-v0 artifact commands remain headless and are not invoked by `/ai-lab`. cFp59 is profiler/evaluation infrastructure metadata, cFp60 is sampler-readiness infrastructure metadata, cFp61 is sampler-materialization infrastructure metadata, cFp62 is invalid-root casebook metadata, cFp63 is sampler repair metadata, cFp64 is provenance casebook metadata, cFp65 is public-zone accounting repair-probe metadata, cFp66 is public-transfer memory metadata, cFp67 is post-cFp66 invalid-root decision metadata, cFp68 is valid-root-only determinized probe contract metadata, cFp69 is public-action probe scaffold metadata, cFp70 is sampled-world action availability metadata, cFp71 is one-ply outcome skeleton metadata, cFp72 is post-one-ply branching budget metadata, cFp73 is post-one-ply branching budget casebook metadata, cFp74 is bounded second-ply public-action scaffold metadata, cFp75 is search-consumer contract planning metadata, cFp76 is search-consumer-action-features-v0 read-only feature consumer metadata reporting `action_feature_source_gap` for this surface, cFp77 is public-action-identity-artifact-v0 read-only action-identity derivation metadata, cFp78 is public-action-identities-compact-v0 read-only compact projection metadata enabling cFp79 consumer feature joins, cFp79 is search-consumer-action-features-v1 read-only feature-join metadata, cFp80 is search-consumer-action-features-dictionary-v0 read-only compaction metadata below the robust 50 MB action target, and cFp81 is search-consumer-action-feature-casebook-v0 read-only aggregate casebook metadata over cFp80 compact artifacts; none adds a browser search runner, search gameplay, or a product search policy.

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
