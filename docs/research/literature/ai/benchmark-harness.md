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
artifacts for the smoke suite: a JSON manifest, JSON summary, JSONL match
ledger, and Markdown report.

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

- deferred in cFp21;
- future Glicko/TrueSkill work should consume ledger records only;
- ratings must remain stratified by suite, matchup, policy, deck, and
  sample count.

Robustness probe:

- deferred in cFp21;
- future approximate best-response or exploitability-style diagnostics
  must state their observation contract and should not be presented as
  exact exploitability.

## Current Scope

The built-in suite is `benchmark-smoke-v1`. It runs the existing six
simulation smoke seeds over current Northern Realms versus current
Nilfgaard, comparing `legal-heuristic-v0` with the deterministic
benchmark-only `legal-first-v0` baseline. Mirroring is enabled, so the
suite produces two records per seed.

The harness supports explicit catalog deck presets per seat. It still
uses `currentCatalogCards` and `currentCatalogLeaders`. cFp22 adds
public smoke-suite file artifacts only; custom catalog snapshots, browser
execution, Python tooling, ratings, search, and model training are
intentionally out of scope.

## Product AI Lab Boundary

cEp17 adds `/ai-lab` as a read-only authentic product dashboard for
benchmark and policy visibility. The screen mirrors static cFp21 status:
`benchmark-smoke-v1`, six seeds, mirrored twelve-record expectations,
current Northern Realms versus current Nilfgaard,
`legal-heuristic-v0`, and benchmark-only `legal-first-v0`.

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

The command writes:

```text
docs/research/literature/ai/benchmark-results/benchmark-smoke-v1/latest/
  manifest.json
  summary.json
  records.jsonl
  report.md
```

The default run id is `benchmark-smoke-v1:latest`. The `latest/` path is
intentionally stable and should be reviewed with:

```bash
git diff -- docs/research/literature/ai/benchmark-results/benchmark-smoke-v1/latest
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
not serialize unsafe debug results.

## Deferred Work

Glicko and TrueSkill are deferred because cFp21 establishes the ledger
and fixed-suite substrate they should consume. Approximate best response
is deferred because Batch B treats it as a later robustness probe, not as
the first evaluation layer. Search policies, `legal-heuristic-v1`, ML
exports, Python notebooks, and product difficulty tiers remain future
work.
