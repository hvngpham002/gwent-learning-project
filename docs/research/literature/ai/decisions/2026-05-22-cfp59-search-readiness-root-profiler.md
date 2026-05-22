# cFp59 Search-Readiness Root Profiler

Date: 2026-05-22

Status: accepted readout

## Decision

cFp59 implemented the hidden-info-safe root profiler recommended by cFp58. The
profiler is opt-in, benchmark-only, and observes each headless benchmark root
after legal moves are generated and before policy selection. It writes public
scalar/count artifacts only and does not influence selected moves.

No PIMC, ISMCTS, rollout search, oracle search, search gameplay, product search
policy, AI behavior change, engine rule change, legal move change, benchmark
suite change, failure-mining change, rating change, catalog/deck change, or
product difficulty change was introduced.

## Artifact Results

| Suite | Matches | Roots | Completed | Largest legal moves | Largest target expansion |
| --- | ---: | ---: | ---: | ---: | ---: |
| `benchmark-v1-starter-matrix-v1` | 120 | 4,042 | 120 | 32 | 26 |
| `benchmark-v1-starter-matrix-robust-v1` | 1,000 | 32,487 | 1,000 | 32 | 26 |

Artifact paths:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-readiness/cFp59/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-readiness/cFp59/`

Robust repeat hashes matched:

| File | Hash |
| --- | --- |
| `manifest.json` | `bbb96c187188b5842173bedd48dc3b3ca5fc588b90682e8678390c7b75b26248` |
| `summary.json` | `0315c98cea925e478af8442ee99a1e09b0881f5736e5f901cb81179e051bf181` |
| `roots.jsonl` | `dbd660b053d61d5d526974dd2d9e3004a96392e6e30686ecca5f4601c365bf53` |
| `report.md` | `0a8e97ef018d2aa60b504aa55931ea767b16a7a3c7fe6177caf082bac8c6bf0c` |

The targeted hidden-info scan passed for both cFp59 artifact directories.

## Branching Readout

Current suite root phase counts:

- mulligan: 348
- playing: 3,357
- round end: 337

Robust suite root phase counts:

- mulligan: 2,948
- playing: 26,866
- round end: 2,673

The largest legal-move and target-expansion roots are playing-phase roots, not
prompt or mulligan roots. In the robust suite, legal move counts have p50 9,
p90 13, and p95 15; target expansion has p50 0, p90 4, and p95 6. Prompt roots
are present but sparse by distribution: prompt-option p95 is 0, though the max
prompt-option count reaches 20. Mulligan roots have p95 11 and max 11, but they
do not dominate the largest branching roots.

## Next Search Step

cFp60 should target a benchmark-only `determinized-pimc-probe-v0` path only if
it first adds the missing named sampler contract:

- `known_preset_decklist_prior` for starter benchmark suites;
- sampled-world validation against public counts, visible cards, revealed
  prompt data, and known preset decklists;
- public action abstraction for reporting without runtime ids or raw labels.

This is a better next step than SO-ISMCTS because the observed root branching
is tractable enough for a simpler determinized probe, while the project still
lacks the sampler and public action abstraction needed before an information-set
tree can be interpreted safely. If sampler validation proves difficult, cFp60
should stop at a sampler/profiler refinement rather than running search.
