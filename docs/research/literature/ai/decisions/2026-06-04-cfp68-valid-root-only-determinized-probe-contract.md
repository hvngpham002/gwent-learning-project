# cFp68 Valid-Root-Only Determinized Probe Contract

Date: 2026-06-04

## cFp67 Recap

cFp67 found no narrow public-only reconstruction class for the remaining
post-cFp66 invalid sampler roots. Current had 63 invalid roots and robust had
340 invalid roots, all classified as `candidate_valid_root_only_skip`.

cFp68 accepts that recommendation by making skip accounting a first-class
contract before any probe result can be reported.

## Contract Design

cFp68 reads only committed cFp61 sampler-materialization roots and cFp67
invalid-root casebook records. It emits deterministic artifacts under
`determinized-probe-contract/cFp68/` for current and robust starter suites:

- `eligible-roots.jsonl` contains only cFp61 roots with valid materialization,
  prior availability, complete requested samples, all samples valid, zero
  invalid samples, and no invalid reason counts.
- `skipped-roots.jsonl` contains only invalid cFp61 roots matched to cFp67
  casebook records.
- `summary.json` and `report.md` record source consistency, skip counters,
  skipped-root percentages, and determinization budget.
- Future probes must consume both eligible and skipped files, and must report
  skipped counts and percentages beside every result.

## Counts

| Suite | Total cFp61 roots | Eligible valid roots | Skipped invalid roots | Skipped % | Status |
|---|---:|---:|---:|---:|---|
| Current starter matrix | 4,042 | 3,979 | 63 | 1.559% | probe-ready |
| Robust starter matrix | 32,487 | 32,147 | 340 | 1.047% | probe-ready |

## Determinization Budget

| Suite | Eligible roots | Requested samples per eligible root | Total requested samples | Total valid samples |
|---|---:|---|---:|---:|
| Current starter matrix | 3,979 | 8: 3,979 | 31,832 | 31,832 |
| Robust starter matrix | 32,147 | 8: 32,147 | 257,176 | 257,176 |

## Skip Counters

| Dimension | Current | Robust |
|---|---|---|
| Suite | `benchmark-v1-starter-matrix-v1`: 63 | `benchmark-v1-starter-matrix-robust-v1`: 340 |
| Phase | playing 57; round_end 6 | playing 312; round_end 28 |
| Round | 1: 28; 2: 28; 3: 7 | 1: 222; 2: 96; 3: 22 |
| Policy | auto-resolver 6; v0 47; v1 10 | auto-resolver 28; v0 246; v1 66 |
| Faction | Monsters 4; Nilfgaard 11; Northern Realms 39; Scoia'tael 6; Skellige 3 | Monsters 26; Nilfgaard 102; Northern Realms 136; Scoia'tael 37; Skellige 39 |
| Provenance label | mixed 42; round-end 6; board-only 6; discard-only 9 | mixed 229; round-end 28; board-only 54; discard-only 29 |
| Invalid reason | `insufficient_prior_remaining`: 63 | `insufficient_prior_remaining`: 340 |
| Skip reason | `sampler_invalid_public_zone_count_deficit`: 63 | `sampler_invalid_public_zone_count_deficit`: 340 |
| Matchup | all matchup counters present in `summary.json`; sum 63 | all matchup counters present in `summary.json`; sum 340 |

## Source Consistency

Both suites are probe-ready. Materialization roots read equal cFp61 summary root
counts; cFp67 records read equal cFp67 summary invalid-root counts; records
emitted equal cFp61 root counts; duplicate cFp61 keys are 0; duplicate cFp67
keys are 0; missing cFp67 records are 0; extra cFp67 records are 0; valid roots
emitted as skipped are 0; invalid roots emitted as eligible are 0; invalid
eligible sample-count roots are 0; contract-mismatch skipped roots are 0.

## Hidden-Info Safety

cFp68 artifacts contain public benchmark root metadata, scalar counts,
enum-like eligibility and skip classifications, source artifact hashes, and
aggregate counters only. They do not include private card identities, sampled
private payloads, engine logs, terminal payloads, action references, or debug
payloads. The artifact serializer scanner and a direct exact-token scan passed.

## Why This Is Still Not Search

cFp68 does not execute PIMC, ISMCTS, MCTS, rollouts, action evaluation, action
ranking, search move selection, product AI behavior, sampler behavior changes,
engine rules, legal moves, benchmark suite definitions, or product gameplay.
It is only the accounting boundary a later probe must consume.

## cFp69 Recommendation

cFp69 should implement the first benchmark-only `determinized-pimc-probe-v0`
sanity probe over cFp68 eligible roots only, with shallow/no-op or one-ply
public-action scaffolding before any strength claims. It must consume cFp68
skip artifacts and report skipped-root counts and percentages beside every
probe result.
