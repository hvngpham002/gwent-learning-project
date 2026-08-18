# Benchmark Harness

Date: 2026-05-10

## Purpose

The cFp21 benchmark harness is the first in-memory evaluation layer for
Gwent AI policies. It turns deterministic headless simulations into
versioned public match records and deterministic summaries without
exposing raw engine state, command logs, event logs, hand identities, deck
order, or runtime card instance IDs.

cFp22 adds the first durable headless artifact boundary on top of that
in-memory harness. The CLI report command writes deterministic public
artifacts for benchmark suites: a JSON manifest, JSON summary, JSONL
match ledger, and Markdown report.

cFp23 adds an explicit benchmark deck taxonomy and the first broader
starter matrix. Deck categories are documented in
`docs/research/literature/ai/benchmark-deck-taxonomy.md` and registered
in `src/game/benchmark/decks.ts`.

cFp24 adds `legal-heuristic-v1` as the first strategic comparator above
v0 and creates dedicated v1-vs-v0 smoke and starter-matrix suites.
cFp24.1 exposes v1 as an experimental product playtest policy through
the pre-game `AI policy` selector and `?ai=legal-heuristic-v1`, while the
product default remains `legal-heuristic-v0`.

cFp25 adds opt-in decision trace summaries to benchmark output for
playtest investigation. Each match record gains a compact
`decisionTraceSummary` field when `includeDecisionTraces: true` is
passed to `runBenchmarkSuite`. The summary contains counts by decision
type (pass, play, leader, prompt, mulligan, round-end) and is hidden-info
safe. Default benchmark commands remain unchanged.

cFp34 adds a deterministic failure-mining layer over
`benchmark-v1-starter-matrix-v1`. The mining command may collect richer
headless decision traces in memory, but it writes only public IDs,
aggregate counts, rates, booleans, and bucketed diagnostics. It is an
evaluation artifact for future tuning specs, not a new policy and not a
product behavior change.

cFp35 calibrates that failure-mining layer. It narrows the
`suspicious_pass` evaluator so a pass is not flagged solely because
`stopLossRecommended === false`, records suppressed broad-pass analyzer
noise as aggregate counts, and adds a deterministic `tuning-queue.md`
artifact for cFp36 scoping. It does not change `legal-heuristic-v1`,
v0, engine rules, legal moves, UI behavior, catalog data, deck presets,
or the experiment setup recorded in
`docs/compute/experiment-status-ledger.md`.

The harness is implementation support for the Batch A and Batch B
decision notes:

- `docs/research/literature/ai/decisions/2026-05-09-batch-a-search-baseline.md`
- `docs/research/literature/ai/decisions/2026-05-09-batch-b-evaluation-ladder.md`

Batch B controls the immediate order: raw ledgers and fixed matchup
matrices come before ratings, search, self-play, or model training.

## Layers

Raw ledger:

- one `benchmark-match-v1` row per completed or failed match attempt;
- suite, matchup, seed, mirrored-run, seat, policy, faction, and deck
  identifiers;
- terminal status, winner/result, round outcomes, gems, validity counts,
  replay status, and a deterministic public fingerprint.

Matchup matrix:

- deterministic summaries grouped by matchup id;
- result counts by policy id and deck preset id;
- status, replay, prompt, leader-use, step, command, and legal-move
  aggregates.

Rating layer:

- cFp46 adds a deterministic Glicko-1 rating layer that consumes
  `benchmark-match-v1` records and produces rating/RD/conservative-rating
  reports per suite;
- cFp47 adds a snapshot/ledger/comparison layer: named `cFp46` snapshots,
  `ledger.json` per suite, and `cFp46-vs-latest` comparison artifacts with
  delta and signal computation;
- cFp48 adds `benchmark-v1-starter-matrix-robust-v1`, a 25-seed / 1000-record
  deterministic starter-matrix evaluation suite, plus its first suite-local
  `cFp48` rating snapshot and `cFp48-vs-latest` comparison boundary;
- cFp57 freezes current committed `ratings/latest` artifacts as named `cFp57`
  snapshots for the current, expanded, and robust starter suites, then writes
  suite-local baseline-to-cFp57 and cFp57-to-latest comparison artifacts;
- ratings must remain stratified by suite, matchup, policy, deck, and
  sample count;
- future TrueSkill or Elo work should consume ledger records only and
  follow the same hidden-info and determinism contracts.

Search-readiness:

- cFp58 is a design/readiness boundary, not a search implementation;
- future search variants must be labeled separately as safe, sampler-required,
  or unsafe oracle/debug;
- cFp59 adds an opt-in benchmark-only root profiler over existing headless
  benchmark runs. It observes roots after legal moves are generated and before
  policy selection, then writes deterministic public scalar/count artifacts
  under `<suiteId>/search-readiness/cFp59/`;
- cFp59 profiler artifacts contain deterministic seeds, suite/matchup/mirror
  metadata, policy/faction/deck metadata, legal-move counts, move-kind counts,
  target-kind/side counts, play-card source/target-expansion counts, prompt and
  mulligan counts, public root fingerprints, and summaries only. They do not
  contain raw moves, command/event payloads, terminal state payloads, or hidden
  card payloads;
- cFp59 deliberately omits committed wall-clock per-root timing so repeated
  artifact hashes stay stable. Runtime timing should be collected in a future
  separated local timing profile.
- cFp60 adds a benchmark-only known-preset sampler contract and public action
  abstraction; cFp61 materializes deterministic in-memory hidden opponent
  hand/deck source-multiset samples from that prior and writes only aggregate
  sampler-materialization artifacts under `<suiteId>/sampler-materialization/cFp61/`;
- cFp62 adds a benchmark-only sampler invalid-root casebook under
  `<suiteId>/sampler-invalid-roots/cFp62/`. It reruns the cFp61 materialization
  path, emits scalar/count evidence only for invalid roots, and classifies all
  404 current/robust invalid roots as `public_zone_count_deficit`.
- cFp63 repairs the sampler public-known collection path so each public runtime
  card instance contributes to public-known subtraction at most once and
  prompt-revealed opponent hand cards contribute to fixed known hand at most
  once. It regenerates cFp61 and cFp62 artifacts with scalar duplicate-reference
  diagnostics. The duplicate-reference totals are zero in both current and
  robust suites, so the same 404 strict `public_zone_count_deficit` roots
  remain and cFp64 should add a scalar public-zone provenance casebook before
  any determinized probe.
- cFp64 adds that benchmark-only scalar public-zone provenance casebook under
  `<suiteId>/sampler-public-zone-provenance/cFp64/`. It represents each of the
  404 cFp62 `public_zone_count_deficit` roots exactly once, assigns one
  scalar-safe provenance label per root, keeps duplicate public/fixed-known-hand
  reference totals at zero, and recommends a narrow cFp65 sampler accounting
  repair before any search probe.
- cFp65 adds explicit scalar public-zone prior accounting to regenerated
  cFp61/cFp62/cFp64 sampler artifacts. Public cards are separated into
  main-deck-attributable, side-deck-only, and off-prior counts using only public
  zones and the known preset prior. Strict conservation remains enforced: roots
  stay invalid unless a public-only adjustment covers the deficit.
- cFp66 adds benchmark-only, perspective-specific public-transfer memory to
  those sampler paths. It tracks only cards that were public or prompt-revealed
  to the perspective seat before later moving into hidden opponent hand/deck
  zones, accounts for those known hidden cards without scanning never-seen
  hidden identities, and serializes scalar public-transfer diagnostics only.
- cFp67 adds a benchmark-only post-cFp66 invalid-root decision casebook under
  `<suiteId>/sampler-post-cfp66-invalid-root-casebook/cFp67/`. It reads the
  committed cFp61/cFp62/cFp64 artifacts, classifies every remaining invalid root
  exactly once, and recommends valid-root-only skip accounting for cFp68.
- cFp68 adds that benchmark-only valid-root-only determinized probe contract
  under `<suiteId>/determinized-probe-contract/cFp68/`. It reads committed
  cFp61 sampler-materialization roots and cFp67 invalid-root casebook records,
  emits one eligible or skipped contract record for every cFp61 root, reports
  skipped-root counts and percentages, and defines the future probe requirement
  to consume skipped-root counters beside every result. It does not run search,
  evaluate actions, rank actions, change policy behavior, or wire product
  gameplay.
- cFp69 adds the first benchmark-only `determinized-pimc-probe-v0` sanity
  scaffold under `<suiteId>/determinized-pimc-probe-v0/cFp69/`. It consumes
  cFp68 eligible/skipped artifacts, re-observes matching benchmark roots,
  emits one probe record per eligible root, carries skipped roots into cFp69
  skip accounting, and records only zero/one-ply public-action scalar counts.
  It does not run rollouts, compute action values, rank actions, choose moves,
  make strength claims, change policy behavior, or wire product gameplay.
- cFp70 adds the first benchmark-only sampled-world action-availability probe
  under `<suiteId>/determinized-pimc-action-availability-v0/cFp70/`. It
  consumes cFp68 eligible/skipped artifacts and cFp69 public-action scaffold
  artifacts, regenerates cFp61 hidden multiset samples in memory, checks
  sampled legal-action availability, writes only scalar/public-bucket
  availability artifacts, and carries skipped-root accounting forward. It does
  not run rollouts, compute action values, rank actions, choose moves, make
  strength claims, change policy behavior, or wire product gameplay.
- cFp71 adds a benchmark-only one-ply public action outcome skeleton under
  `<suiteId>/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/`. It
  consumes cFp68, cFp69, and cFp70 artifacts, regenerates the same in-memory
  samples through the cFp70 rebuild path, executes deterministic representative
  sampled public buckets only on cloned sampled roots, writes root-level scalar
  public transition-shape aggregates, and carries skipped-root accounting
  forward. It does not run rollouts, compute action values, rank actions,
  choose moves, estimate win probability, change policy behavior, or wire
  product gameplay.
- cFp72 adds a benchmark-only post-one-ply branching budget probe under
  `<suiteId>/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/`.
  It consumes cFp68, cFp69, cFp70, and cFp71 artifacts, regenerates the same
  in-memory samples through the cFp70 rebuild path, executes only the first-ply
  representative sampled public bucket on cloned sampled roots, then counts the
  next legal/public action surface without executing any next move. It writes
  only root-level scalar branching/budget aggregates and skipped-root scalar
  accounting. It does not run rollouts, compute action values, rank actions,
  choose moves, estimate win probability, change policy behavior, or wire
  product gameplay.
- cFp73 adds a benchmark-only post-one-ply branching budget casebook under
  `<suiteId>/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/`.
  It reads committed cFp72 scalar artifacts only, emits selected scalar
  casebook rows plus skipped-root scalar rows, and classifies budget pressure
  by threshold, phase, round, policy, faction, deck preset, matchup, actor
  label, and phase label. It does not re-run root observation, rebuild samples,
  execute a second ply, run rollouts, compute action values, rank actions,
  choose moves, change policy behavior, or wire product gameplay.
- cFp74 adds a benchmark-only bounded second-ply public-action scaffold under
   `<suiteId>/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/`. It
   consumes cFp68/cFp69/cFp70/cFp71 artifacts plus cFp72 branching budgets and
   cFp73 casebook labels, reuses the established cFp70/cFp71/cFp72 sampled-root
   materialization path, primes public-transfer memory for eligible over-budget
   roots, executes only representative second-ply public actions for in-cap
   roots inside cloned sampled benchmark states, and emits compact scalar JSONL
   rows plus separate over-budget and inherited skipped-root artifacts. It does
   not count third-ply legal surfaces, run rollouts, compute values, rank or
   choose actions, change policy behavior, or wire product gameplay.
- cFp75 is a search-consumer contract decision phase. It pauses blind third-ply
   execution, defines `search-consumer-action-features-v0` as the recommended
   cFp76 target, specifies the cFp76 artifact contract, feature schema, source
   consistency checks, budget limits, hidden-info restrictions, non-claims,
   and stop conditions. cFp75 writes only a decision note and audit report,
   updates AI Lab metadata, and updates project state. It does not execute
   benchmarks, run command probes, generate artifacts, or change policy
   behavior.
- cFp76 implements `search-consumer-action-features-v0` under
   `<suiteId>/search-consumer-action-features-v0/cFp76/`. It is a read-only
   consumer of committed cFp68-cFp74 artifacts: it performs the cFp75 source
   consistency checks, emits one hidden-info-safe root feature row per cFp68
   eligible root, carries cFp68 skipped roots into skipped-root rows, and
   audits whether per-root-public-action feature rows are derivable from
   committed cFp69-cFp74 scalar count maps. Because those artifacts expose
   only aggregate per-root count maps and no durable per-public-action
   identity, cFp76 reports `action_feature_source_gap`: it writes an empty
   `action-features.jsonl` and a populated `action-feature-gaps.jsonl` (one
   row per cFp69/cFp70/cFp71/cFp72/cFp74) rather than fabricating a
   `publicActionRef`. It does not re-observe roots, rebuild sampled states,
   execute commands, count third-ply surfaces, run rollouts, compute values,
   rank or choose actions, change policy behavior, or wire product gameplay.
- cFp77 implements `public-action-identity-artifact-v0` under
   `<suiteId>/public-action-identities-v0/cFp77/`. It observes benchmark roots
   at the same root-observer position as cFp69, builds public action buckets
   from legal moves with the existing `buildPublicActionAbstraction` /
   `buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey` contract,
   and emits one hidden-info-safe action identity row per collapsed public
   action bucket per cFp68 eligible root, plus one root summary row per
   eligible root and skipped-root rows carried from cFp68/cFp69. It validates
   row counts and source consistency against committed cFp68/cFp69/cFp76
   artifacts and reports `identityReadinessStatus`. It does not execute
   candidate actions, rebuild sampled states, materialize hidden worlds, run
   rollouts, compute action values/rewards/win probabilities/payoff
   tables/principal variations/action rankings, change policy behavior, or
   wire product gameplay.
- cFp78 implements `public-action-identities-compact-v0` under
   `<suiteId>/public-action-identities-compact-v0/cFp78/`. It reads committed
   cFp77 artifacts as immutable source data and emits slim compact action rows
   (dropping `actionPhase`/`actionRound`/`collisionCountWithinBucket`, renaming
   `publicActionKind → kind` / `publicActionOrdinal → ordinal`, compacting
   target fields into a `target` token), compact root-index join rows (retaining
   only fields needed for cFp79 consumer joins), and cFp77 skipped-root rows
   forwarded verbatim. The robust `action-identities-compact.jsonl` is 46.86 MB,
   below the 50 MB soft target, enabling cFp79 consumer feature joins. It does
   not re-observe benchmark roots, execute candidate actions, rebuild sampled
   states, materialize hidden worlds, run rollouts, compute action
   values/rewards/win probabilities/payoff tables/principal variations/action
   rankings, change policy behavior, or wire product gameplay.
- cFp79 implements `search-consumer-action-features-v1` under
   `<suiteId>/search-consumer-action-features-v1/cFp79/`. It reads committed
   cFp76 and cFp78 artifacts as immutable source data, validates both source
   chains, joins cFp76 root features to cFp78 root-index rows by public root
   identity, emits one normalized root-feature row per eligible root, emits
   one action-feature row per compact public action identity, and carries
   skipped-root classifications forward with cFp79 metadata. Current emits
   3,979 root rows, 18,820 action rows, and 63 skipped rows. Robust emits
   32,147 root rows, 153,842 action rows, and 340 skipped rows. Robust
   `action-features.jsonl` is 86,029,163 bytes: below the 90 MB hard stop but
   above the 50 MB soft target, so cFp80 should compact or dictionary-encode
   before any consumer casebook. cFp79 does not execute actions, rebuild
   sampled states, materialize hidden worlds, run rollouts, compute values,
   rank or choose actions, change policy behavior, or wire product gameplay.
- cFp80 implements `search-consumer-action-features-dictionary-v0` under
   `<suiteId>/search-consumer-action-features-dictionary-v0/cFp80/`. It reads
   committed cFp79 artifacts as immutable source data, validates cFp79
   `features_ready` and ready source consistency, dictionary-encodes repeated
   action-feature strings, emits one compact action row per cFp79 action row,
   forwards root and skipped rows with cFp80 metadata, and proves lossless
   reconstruction for preserved public/scalar action fields. Current emits
   3,979 root rows, 18,820 compact action rows, and 63 skipped rows; compact
   actions are 5,615,464 bytes versus cFp79's 10,518,156 bytes. Robust emits
   32,147 root rows, 153,842 compact action rows, and 340 skipped rows;
   compact actions are 46,044,793 bytes versus cFp79's 86,029,163 bytes, below
   the 50 MB soft target. Reconstruction mismatch count is 0. cFp80 does not
   execute actions, rebuild sampled states, materialize hidden worlds, run
   rollouts, compute values, rank or choose actions, change policy behavior,
   or wire product gameplay.
- cFp81 implements `search-consumer-action-feature-casebook-v0` under
   `<suiteId>/search-consumer-action-feature-casebook-v0/cFp81/`. It reads
   committed cFp80 compact artifacts as immutable source data, validates
   `dictionary_ready`, ready source consistency, passed reconstruction, actual
   row counts, dictionary group counts, root-reference resolution, and the
   robust compact-action file below the 50 MB target. It expands dictionary ids
   only in memory for grouping and emits bounded aggregate rows:
   `casebook-rows.jsonl`, `slice-summaries.jsonl`, and
   `skipped-root-summary.json`. Current emits 80 casebook rows, 95 slice
   summaries, and carries 63 inherited skipped roots (1.56%). Robust emits 80
   casebook rows, 95 slice summaries, and carries 340 inherited skipped roots
   (1.05%); robust `casebook-rows.jsonl` is 42,703 bytes and
   `slice-summaries.jsonl` is 41,906 bytes. cFp81 does not execute actions,
   rebuild sampled states, materialize hidden worlds, run rollouts, compute
   values, rank or choose actions, change policy behavior, or wire product
   gameplay.
- cFp82 is a docs/metadata-only search-consumer casebook decision phase. It
   reads the committed cFp81 summaries, casebook rows, slice summaries, report,
   and decision note, then selects cFp83
   `search-consumer-small-subset-contract-v0` as the next safe benchmark-only
   step. The decision is based on the usable ordinary ready slice in cFp81
   plus dominant high-branching and high-collision pressure in the broader
   robust surface. cFp82 creates no benchmark artifact family, adds no runner,
   modifies no cFp81/cFp80/cFp79/cFp78/cFp76 artifacts, and does not execute
   actions, rebuild sampled states, materialize hidden worlds, run rollouts,
   compute values, rank or choose actions, change policy behavior, or wire
   product gameplay.
   These phases do not evaluate actions, run rollouts/search, change policy
   behavior, or wire product gameplay.

Robustness probe:

- deferred in cFp21;
- future approximate best-response or exploitability-style diagnostics
  must state their observation contract and should not be presented as
  exact exploitability.

Failure mining:

- deterministic cFp34/cFp35 artifact bundle over `benchmark-v1-starter-matrix-v1`;
- emits matchup/deck skew plus behavior-level findings such as round-one
  overinvestment, weak round-three resources, calibrated suspicious passes,
  weathered-row plays, and Medic timing risks;
- records suppressed broad suspicious-pass candidates only as aggregate
  counts and writes a ranked `tuning-queue.md` for future spec scoping;
- `leader_underuse` is explicitly deferred until a safe public
  leader-availability summary exists.

## Current Scope

The built-in suites are:

- `benchmark-smoke-v1`: a tiny plumbing/regression suite over the current
  Northern Realms and Nilfgaard presets. It uses the existing six
  simulation smoke seeds, mirrors `legal-heuristic-v0` versus
  benchmark-only `legal-first-v0`, and produces 12 records.
- `benchmark-starter-matrix-v1`: a broader starter-deck coverage suite
  over the five official starter presets. It includes every unordered
  pair of distinct starter decks, both policy assignments per deck pair,
  3 deterministic seeds, mirrored `legal-heuristic-v0` versus
  `legal-first-v0` runs, and produces 120 records.
- `benchmark-v1-smoke-v1`: the current Northern Realms versus Nilfgaard
  smoke shape, mirrored over the same six seeds, comparing
  `legal-heuristic-v1` against `legal-heuristic-v0` and producing 12
  records.
- `benchmark-v1-starter-matrix-v1`: the official starter-deck matrix
  shape, comparing `legal-heuristic-v1` against `legal-heuristic-v0`
  over 10 unordered starter pairs, both policy assignments, 3 seeds,
  mirrored seats, and producing 120 records.
- `benchmark-v1-starter-matrix-expanded-v1`: the cFp41 expanded
  starter-deck discovery shape, comparing `legal-heuristic-v1` against
  `legal-heuristic-v0` over the same 10 unordered starter pairs and
  policy assignments, but with 10 deterministic seeds. It produces 400
  records and should be run through the cFp40 long-run wrapper.
- `benchmark-v1-starter-matrix-robust-v1`: the cFp48 robust
  starter-deck evaluation shape, comparing `legal-heuristic-v1` against
  `legal-heuristic-v0` over the same 10 unordered starter pairs and
  policy assignments, but with 25 deterministic seeds. It produces 1000
  records and is evaluation infrastructure, not a policy behavior change.

The harness supports explicit catalog deck presets per seat. It still
uses `currentCatalogCards` and `currentCatalogLeaders`. cFp23 adds no
mechanics decks, competitive decks, custom catalog snapshots, browser
execution, Python tooling, ratings, search, or model training.

## Product AI Lab Boundary

cEp17 adds `/ai-lab` as a read-only authentic product dashboard for
benchmark and policy visibility. The screen mirrors static smoke-suite
status. cFp23 does not wire the starter matrix into the browser; the
starter artifacts remain headless files for review.

The AI Lab does not import or call `runBenchmarkSuite`, the
`benchmark:smoke` command, headless simulation runners, ratings, search,
training, Python tooling, file writers, or unsafe benchmark output.
Browser execution remains deferred until a later spec defines a safe
runner.

## Usage

From a Vitest or other Vite-resolved TypeScript context:

```ts
import { runBenchmarkSuite } from "@/game/benchmark";

const result = runBenchmarkSuite({ suiteId: "benchmark-smoke-v1" });

console.log(result.records.length);
console.log(result.summary.matchupSummaries);
```

Custom suites can be passed directly to `runBenchmarkSuite({ suite })`.
All output is returned in memory unless it is passed through the cFp22
artifact layer.

From the repository root, write the deterministic smoke artifact set:

```bash
npm run benchmark:smoke
```

Write the deterministic starter matrix artifact set:

```bash
npm run benchmark:starter-matrix
```

Write the v1 comparison artifact sets:

```bash
npm run benchmark:v1-smoke
npm run benchmark:v1-starter-matrix
```

Write the v1 starter-matrix failure-mining artifact set:

```bash
npm run benchmark:v1-failure-mining
```

Write the expanded v1 starter-matrix artifact sets:

```bash
npm run benchmark:v1-starter-matrix-expanded
npm run benchmark:v1-failure-mining-expanded
```

Write the robust v1 starter-matrix artifact sets:

```bash
npm run benchmark:v1-starter-matrix-robust
npm run benchmark:v1-failure-mining-robust
npm run benchmark:ratings:v1-robust
npm run benchmark:ratings:compare:v1-robust
```

Write cFp59 search-readiness root-profiler artifact sets:

```bash
npm run benchmark:search-readiness:v1-starter-matrix
npm run benchmark:search-readiness:v1-robust
```

Write cFp60 sampler-readiness artifact sets:

```bash
npm run benchmark:sampler-readiness:v1-starter-matrix
npm run benchmark:sampler-readiness:v1-robust
```

Write cFp61 sampler-materialization artifact sets:

```bash
npm run benchmark:sampler-materialization:v1-starter-matrix
npm run benchmark:sampler-materialization:v1-robust
```

Write cFp62 sampler invalid-root casebook artifact sets:

```bash
npm run benchmark:sampler-invalid-roots:v1-starter-matrix
npm run benchmark:sampler-invalid-roots:v1-robust
```

Write cFp64 sampler public-zone provenance casebook artifact sets:

```bash
npm run benchmark:sampler-public-zone-provenance:v1-starter-matrix
npm run benchmark:sampler-public-zone-provenance:v1-robust
```

Write cFp67 post-cFp66 invalid-root decision casebook artifact sets:

```bash
npm run benchmark:sampler-post-cfp66-invalid-root-casebook:v1-starter-matrix
npm run benchmark:sampler-post-cfp66-invalid-root-casebook:v1-robust
```

Write cFp68 valid-root-only determinized probe contract artifact sets:

```bash
npm run benchmark:determinized-probe-contract:v1-starter-matrix
npm run benchmark:determinized-probe-contract:v1-robust
```

Write cFp69 determinized-pimc-probe-v0 sanity scaffold artifact sets:

```bash
npm run benchmark:determinized-pimc-probe-v0:v1-starter-matrix
npm run benchmark:determinized-pimc-probe-v0:v1-robust
```

Write cFp70 sampled-world action-availability artifact sets:

```bash
npm run benchmark:determinized-action-availability:v1-starter-matrix
npm run benchmark:determinized-action-availability:v1-robust
```

Write cFp72 post-one-ply branching budget artifact sets:

```bash
npm run benchmark:determinized-branching-budget:v1-starter-matrix
npm run benchmark:determinized-branching-budget:v1-robust
```

Write cFp73 post-one-ply branching budget casebook artifact sets:

```bash
npm run benchmark:determinized-branching-budget-casebook:v1-starter-matrix
npm run benchmark:determinized-branching-budget-casebook:v1-robust
```

cFp82 has no benchmark command. It is a docs/metadata decision phase over
committed cFp81 evidence and does not write a new artifact family.

For longer local runs that should not be tied to an agent turn, use the
cFp40 progress runner. It orchestrates existing npm commands, writes a
local run log bundle under `.local/benchmark-runs/`, and uses
[`alive-progress`](https://github.com/rsalmei/alive-progress) when the
optional Python package is installed:

```bash
python3 -m pip install --user alive-progress
npm run benchmark:long -- --profile v1-current
```

The default `v1-current` profile runs:

```text
npm run benchmark:v1-smoke
npm run benchmark:v1-starter-matrix
npm run benchmark:v1-failure-mining
```

Other profiles are `smoke`, `v1-current-repeat`, `v1-expanded`,
`v1-expanded-repeat`, `v1-robust`, `v1-robust-repeat`, and `all-current`.
Future agents should ask the user to run this command for long benchmark
jobs, then inspect the resulting `summary.md` or `run.json`, rather than
running multi-minute or multi-hour jobs inside the agent runtime.

cFp41 adds the expanded discovery profile:

```bash
npm run benchmark:long -- --profile v1-expanded
```

For determinism checks, use:

```bash
npm run benchmark:long -- --profile v1-expanded-repeat
```

cFp48 adds the robust evaluation profile:

```bash
npm run benchmark:long -- --profile v1-robust
```

For robust determinism checks, use:

```bash
npm run benchmark:long -- --profile v1-robust-repeat
```

The command writes:

```text
docs/research/literature/ai/benchmark-results/benchmark-smoke-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-starter-matrix-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-smoke-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/
  manifest.json
  summary.json
  findings.jsonl
  report.md
  tuning-queue.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/
  manifest.json
  summary.json
  findings.jsonl
  report.md
  tuning-queue.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/
  manifest.json
  summary.json
  findings.jsonl
  report.md
  tuning-queue.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/latest/
  manifest.json
  ratings.json
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/snapshots/cFp48/
  manifest.json
  ratings.json
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/comparisons/cFp48-vs-latest/
  manifest.json
  comparison.json
  report.md
```

The default run id is `<suite-id>:latest`. Each `latest/` path is
intentionally stable and should be reviewed with a suite-specific diff,
for example:

```bash
git diff -- docs/research/literature/ai/benchmark-results/benchmark-smoke-v1/latest
git diff -- docs/research/literature/ai/benchmark-results/benchmark-starter-matrix-v1/latest
git diff -- docs/research/literature/ai/benchmark-results/benchmark-v1-smoke-v1/latest
git diff -- docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest
git diff -- docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest
```

Policy or engine changes that affect public benchmark behavior should
show up as a focused diff in those files.

## Hidden-Info Contract

Default benchmark output must not include:

- `finalState`;
- `cardsById`;
- `commandLog`;
- raw event logs;
- hand arrays;
- deck arrays or deck order;
- `ownHand` / `opponentHand` observations;
- raw `seat_a:` / `seat_b:` runtime card instance prefixes.

`includeDebugResults: true` is the explicit unsafe/debug escape hatch.
Those results are named `unsafeDebugResults` and are not part of the
default benchmark summary contract.

The cFp22 script does not expose an `includeDebugResults` option and does
not serialize unsafe debug results. cFp24 v1 artifacts use the same
public serializer and hazard-scan contract.

The cFp34/cFp35 failure-mining command uses the unsafe/debug headless path only
inside the Node process. The committed failure-mining artifacts are
hidden-info safe and contain findings, counts, rates, policy/deck/faction
IDs, matchup IDs, seeds, mirror indexes, bucket labels, aggregate
suppression counts, and ranked queue metadata only. They do not include
raw engine states, command logs, raw events, private-zone arrays, debug
result objects, runtime card instance IDs, or hidden hand card names.

### Opt-In Trace Artifacts (cFp25)

The `includeDecisionTraces: true` flag on `BenchmarkRunInput` enables
compact decision trace summaries in each `BenchmarkMatchRecord`. The
summary shape (`BenchmarkDecisionTraceSummary`) contains:

- `totalDecisions`: total AI decisions across the match;
- `passDecisions`, `playDecisions`, `leaderDecisions`, `promptDecisions`,
  `mulliganDecisions`, `roundEndDecisions`: counts by decision type;
- `avgCandidateCount`: average candidate count per decision (approximate);
- `redactionWarnings`: any redaction warnings from trace collection.

The trace summary is hidden-info safe: it contains only public counts
and does not include card identities, hand arrays, or instance IDs.
It is excluded from default benchmark output, preserving backward
compatibility for existing consumers.

## Rating Layer (cFp46)

cFp46 adds a deterministic Glicko-1 rating layer that consumes existing public
benchmark `records.jsonl` artifacts and produces rating/RD reports. It does not
change AI behavior, engine rules, legal moves, UI behavior, benchmark suite
definitions, failure-mining classifiers, or product difficulty.

Rating artifacts are written under:

```text
docs/research/literature/ai/benchmark-results/<suiteId>/ratings/latest/
  manifest.json
  ratings.json
  report.md
```

Three required scopes are produced: `policy`, `policy_deck`, `policy_faction`.
An optional `policy_matchup` scope is also available.

Each rating entry includes: rating, RD, 95% CI, conservative rating (rating - 2*RD),
games played, wins, losses, draws. High RD signals uncertain estimates based on
few games.

Generated artifact suites:

- `benchmark-v1-starter-matrix-v1/ratings/latest/`
- `benchmark-v1-starter-matrix-expanded-v1/ratings/latest/`
- `benchmark-v1-starter-matrix-robust-v1/ratings/latest/`

CLI: `tsx scripts/run-benchmark-rating-report.ts --suite <suiteId>`
NPM: `npm run benchmark:ratings:v1-starter-matrix` / `npm run benchmark:ratings:v1-expanded` / `npm run benchmark:ratings:v1-robust`

## Rating Snapshot Comparisons (cFp47/cFp48/cFp57)

cFp47 adds suite-local snapshot ledgers and rating comparisons. cFp48 extends
the same comparison pipeline to the robust suite and allows the comparison CLI
to create the first baseline snapshot when the requested snapshot id matches
`--phase` (`cFp48` for the robust suite), while preserving the cFp47 cFp46
bootstrap behavior for older commands.

The robust comparison command writes:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/snapshots/cFp48/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/ledger.json
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/comparisons/cFp48-vs-latest/
```

`cFp48-vs-latest` is an initial baseline comparison, so all 22 common entries
have zero deltas and `signal: "no_change"`.

cFp57 extends the ledger across all committed starter rating suites without
changing rating formulas or benchmark records. It writes:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/ratings/snapshots/cFp57/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/ratings/comparisons/cFp46-vs-cFp57/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/ratings/comparisons/cFp57-vs-latest/

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/ratings/snapshots/cFp57/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/ratings/comparisons/cFp46-vs-cFp57/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/ratings/comparisons/cFp57-vs-latest/

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/snapshots/cFp57/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/comparisons/cFp48-vs-cFp57/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/comparisons/cFp57-vs-latest/
```

The cFp57-to-latest consistency comparisons must remain zero-delta and
`no_change` only. Baseline comparisons are suite-local; do not compare ratings
across different benchmark pools or treat rating deltas as product difficulty.

## Search-Readiness Root Profiler (cFp59)

cFp59 adds deterministic profiler artifacts under:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-readiness/cFp59/
  manifest.json
  summary.json
  roots.jsonl
  report.md

docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-readiness/cFp59/
  manifest.json
  summary.json
  roots.jsonl
  report.md
```

These artifacts are evaluation infrastructure, not search gameplay. They do
not rewrite benchmark `latest`, failure-mining, rating, or comparison artifacts.
The robust cFp59 command was repeated with identical committed hashes.

## Deferred Work

TrueSkill is deferred; cFp46 implements only Glicko-1. Approximate best response
is deferred because Batch B treats it as a later robustness probe. cFp58 recommends
that cFp59 implement a search-readiness profiler before any PIMC/ISMCTS rollout
search; cFp59 completes that profiler without adding a search policy.

cFp60 adds sampler-readiness infrastructure: `known_preset_decklist_prior` for
official starter deck contexts, deterministic sampled-world validation summaries
emitting public scalar/status fields only, hidden-info-safe public action
abstraction grouping legal moves by public shape without raw ids, and
deterministic sampler-readiness artifacts under `<suiteId>/sampler-readiness/cFp60/`.
All 36,529 roots across starter (4,042 roots, 120 matches) and robust (32,487
roots, 1,000 matches) suites have `prior_available` and `deferred` status
because cFp60 intentionally did not materialize hidden multisets. Robust repeat
artifacts produce identical hashes. npm scripts `benchmark:sampler-readiness:v1-starter-matrix`
and `benchmark:sampler-readiness:v1-robust` run the CLI.

cFp61 adds sampler-materialization infrastructure under
`<suiteId>/sampler-materialization/cFp61/`. It samples opponent hidden
hand/deck source multisets in memory from the cFp60 opponent-seat known preset
prior, counts prompt-revealed opponent hand cards once as fixed known hand
cards, validates those samples against public counts and duplicate limits, and
serializes only aggregate sample statistics. Starter and robust suites produce
4,042 and 32,487 roots respectively; all are `prior_available`, no roots are
`deferred`, valid roots report 8 requested, generated, and valid samples with
0 invalid samples, and safe invalid roots report `insufficient_prior_remaining`
with zero generated samples. Robust repeat artifacts produce identical hashes.

cFp60, cFp61, cFp62, cFp63, cFp64, cFp65, cFp66, and cFp67 do not run
PIMC/ISMCTS/rollouts, evaluate actions, build trees, select moves, or change
any policy behavior.

cFp63 repairs the public-known duplicate-reference path defensively and adds
scalar duplicate diagnostics to the regenerated cFp61/cFp62 artifacts. The
regenerated current and robust suites report zero duplicate public references,
zero duplicate fixed-known-hand references, and unchanged invalid-root counts:
63 current and 341 robust, all still `public_zone_count_deficit`. Next
recommended step: cFp64 should add a scalar-only public-zone provenance casebook
before any determinized probe.

cFp64 adds that provenance casebook under
`<suiteId>/sampler-public-zone-provenance/cFp64/`. Starter current labels are
42 mixed public zones, 6 round-end, 6 board-only, and 9 discard-only. Robust
labels are 230 mixed public zones, 28 round-end, 54 board-only, and 29
discard-only. No roots are ambiguous or zero-zone, duplicate-reference totals
remain zero, and cFp65 should implement a narrow sampler accounting repair
before any search probe.

cFp65 implements that narrow accounting probe by making the public adjustment
surface explicit in cFp61/cFp62/cFp64 artifacts: main-deck-attributable public
cards still consume the main-deck prior, side-deck-only and off-prior public
cards are counted as scalar public adjustments, and uncovered prior deficits
remain invalid. If invalid roots remain after cFp65, the next prerequisite is
event-history/public-transfer memory before any determinized probe.

cFp66 implements that public-transfer memory prerequisite. It adds
benchmark-only, perspective-specific memory for cards previously public or
prompt-revealed to the seat and later hidden in opponent hand/deck zones. It
does not inspect never-seen hidden hand/deck identities, add placeholders, or
relax conservation. Current remains 3,979 valid / 63 invalid roots. Robust
improves from 32,146 valid / 341 invalid to 32,147 valid / 340 invalid, with
the one repaired robust root coming from a main-deck-attributable
public-transfer hand card. Remaining invalid roots still classify as
`public_zone_count_deficit`, so the next spec should define explicit
valid-root-only skip accounting or require deeper public-state reconstruction
before any determinized probe.

cFp67 makes that decision casebook explicit. It reads committed post-cFp66
cFp61/cFp62/cFp64 artifacts and writes deterministic scalar-only artifacts under
`<suiteId>/sampler-post-cfp66-invalid-root-casebook/cFp67/`. Current remains
3,979 valid / 63 invalid roots (1.559% invalid), and robust remains 32,147 valid
/ 340 invalid roots (1.047% invalid). Every remaining invalid root is classified
exactly once as `candidate_valid_root_only_skip`; deeper-reconstruction and
unavailable classifications are 0. Current has 63 one-card deficits. Robust has
339 one-card deficits and 1 multi-card deficit. cFp68 should proceed only with
valid roots and explicit skip counters by suite, phase, round, matchup, policy,
faction, deck preset, provenance label, invalid reason, and skipped-root
percentage.

cFp68 implements that valid-root-only contract under
`<suiteId>/determinized-probe-contract/cFp68/`: every cFp61 root maps to one
eligible or skipped record, current has 3,979 eligible / 63 skipped roots, and
robust has 32,147 eligible / 340 skipped roots. cFp69 consumes those cFp68
artifacts and writes `determinized-pimc-probe-v0/cFp69/` scaffold artifacts:
current has 3,979 probe / 63 skipped roots, robust has 32,147 probe / 340
skipped roots, source consistency is probe-ready, sample budgets match cFp68,
and only public-action scalar counts are emitted. cFp69 is not search gameplay
and makes no strength claim. cFp70 consumes cFp68 and cFp69 artifacts and writes
`determinized-pimc-action-availability-v0/cFp70/` availability artifacts:
current has 3,979 availability / 63 skipped roots, robust has 32,147
availability / 340 skipped roots, source consistency is probe-ready, sample
budgets match cFp68/cFp69, 31,832 current and 257,176 robust samples are
generated and checked, failed samples are 0, and availability disagreement is
0 in both suites. cFp70 is still not search gameplay and makes no strength
claim. cFp72 consumes cFp68/cFp69/cFp70/cFp71 artifacts and writes
`determinized-pimc-post-one-ply-branching-budget-v0/cFp72/` branching budget
artifacts: current has 3,979 branching roots / 63 skipped roots / 150,560
completed first-ply pairs, robust has 32,147 branching roots / 340 skipped
roots / 1,230,736 completed first-ply pairs, failed and deferred pairs are 0,
post-one-ply public action budget averages are 5.735 current and 5.765 robust,
and only the next legal/public action surface is counted after first-ply
execution. cFp72 is still not search gameplay and makes no strength claim.
cFp73 reads those committed scalar artifacts and writes
`determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/` casebook
artifacts: current has 1,291 casebook rows / 63 skipped rows, robust has 10,721
casebook rows / 340 skipped rows, readiness is casebook-ready in both suites,
status anomalies are 0, very-large/extreme buckets are 0, and the robust
casebook JSONL is 27 MB. cFp73 recommends a bounded benchmark-only second-ply
public-action scaffold with explicit budget caps and skipped-over-budget
counters, still without rollout, action quality, ranking, move choice, product
AI wiring, or strength claims.

Search policies, v1.1/v2 policy tuning, ML exports, Python notebooks,
mechanics/competitive deck suites, browser benchmark execution, and product
difficulty tiers remain future work.

Search-consumer contract phase (cFp75):

cFp75 is a search-consumer contract decision phase. It pauses blind
third-ply execution and defines `search-consumer-action-features-v0` as
the recommended cFp76 target. It specifies the cFp76 artifact contract
(artifact family, suites, required files, recommended source artifacts,
source consistency checks), the cFp76 feature schema (root-level and
action-level rows), the cFp76 hidden-info restrictions, the cFp76 budget
guidance (50 MB target, 90 MB hard stop), and the cFp76 non-claims and
stop conditions. cFp75 writes only a decision note and audit report,
updates AI Lab metadata, and updates project state. It does not execute
benchmarks, run command probes, generate JSONL artifacts, or change policy
behavior. cFp76 should follow as a benchmark-only feature consumer phase.

Search-consumer action features phase (cFp76):

cFp76 implements `search-consumer-action-features-v0` as a read-only
consumer of committed cFp68-cFp74 artifacts under
`<suiteId>/search-consumer-action-features-v0/cFp76/`. Source consistency is
`ready` for both suites. cFp76 emits one root feature row per cFp68 eligible
root (current 3,979, robust 32,147), joining cFp69 public-action counts,
cFp70 availability data, cFp71 outcome/transition counts, cFp72 branching
budgets, cFp73 casebook labels, and cFp74 second-ply/over-budget status, and
carries cFp68 skipped roots into skipped-root rows (current 63, robust 340).
cFp76 audits whether per-root-public-action feature rows are derivable from
committed cFp69-cFp74 artifacts. Because those artifacts expose only
aggregate per-root count maps and not a durable per-public-action identity,
cFp76 does not fabricate a `publicActionRef`: `consumerReadinessStatus` is
`action_feature_source_gap`, `action-features.jsonl` is empty (0 bytes), and
`action-feature-gaps.jsonl` carries 5 rows (one per cFp69/cFp70/cFp71/cFp72/
cFp74), with the cFp69 row carrying an `affectedActionFeatureCountEstimate`
(current 18,820). Robust `root-features.jsonl` is 79,683,914 bytes, below
the 90 MB hard stop; the 50 MB robust target applies only to
`action-features.jsonl`. Robust repeat hashes matched exactly across two
runs. cFp76 does not re-observe roots, rebuild sampled states, execute
commands, count third-ply surfaces, run rollouts, compute values, rank or
choose actions, change policy behavior, or wire product gameplay. cFp77
should add a narrow public-action-identity artifact derived from
cFp69/cFp70 sources before any future cFp76-style action-feature row can be
populated.
