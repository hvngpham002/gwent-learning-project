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
or H100/Slurm workflow.

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
search; cFp59 completes that profiler without adding a search policy. Search
policies, v1.1/v2 policy tuning, ML exports, Python notebooks,
mechanics/competitive deck suites, browser benchmark execution, and product
difficulty tiers remain future work.
