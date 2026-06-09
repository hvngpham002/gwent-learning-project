# cFp69 Determinized PIMC Probe v0 Sanity

Date: 2026-06-08

## cFp68 Contract Recap

cFp68 created a valid-root-only determinized probe contract over committed
cFp61 sampler-materialization roots and cFp67 invalid-root casebook records.
Every root is either `eligible_valid_root` or `skipped_invalid_root`.

| Suite | Total cFp68 roots | Eligible roots | Skipped roots | Skipped % | Sample budget |
|---|---:|---:|---:|---:|---:|
| Current starter matrix | 4,042 | 3,979 | 63 | 1.559% | 31,832 requested / valid |
| Robust starter matrix | 32,487 | 32,147 | 340 | 1.047% | 257,176 requested / valid |

## cFp69 Probe Design

cFp69 consumes the cFp68 eligible and skipped artifacts, re-observes the
matching benchmark root streams, filters probe work to cFp68 eligible roots
only, and carries skipped roots into cFp69 skip accounting. The committed probe
mode is `one_ply_public_action_scaffold`: it collapses legal moves into public
action buckets and reports scalar counts only.

No rollout was run. No action value was computed. No action ranking was
produced. No move was selected by search. No strength claim is made. No product
AI behavior changed. Skipped roots were excluded from probe work and reported
separately.

## Counts

| Suite | Probe roots | Skipped roots | Skipped % | Probe status |
|---|---:|---:|---:|---|
| Current starter matrix | 3,979 | 63 | 1.559% | 3,979 completed |
| Robust starter matrix | 32,147 | 340 | 1.047% | 32,147 completed |

## Source Consistency

Both suites are probe-ready.

| Check | Current | Robust |
|---|---:|---:|
| cFp68 eligible roots read | 3,979 | 32,147 |
| cFp68 skipped roots read | 63 | 340 |
| benchmark observed roots read | 4,042 | 32,487 |
| eligible roots not observed | 0 | 0 |
| observed roots not in cFp68 contract | 0 | 0 |
| skipped roots incorrectly probed | 0 | 0 |
| duplicate observed root keys | 0 | 0 |
| duplicate cFp68 eligible root keys | 0 | 0 |
| duplicate cFp68 skipped root keys | 0 | 0 |
| eligible plus skipped delta from cFp68 total | 0 | 0 |
| cFp68 eligible sample-count mismatch roots | 0 | 0 |
| public action abstraction failed roots | 0 | 0 |

## Sample Budget

| Suite | Requested samples per root | Requested | Consumed | Valid | Invalid |
|---|---|---:|---:|---:|---:|
| Current starter matrix | 8: 3,979 | 31,832 | 31,832 | 31,832 | 0 |
| Robust starter matrix | 8: 32,147 | 257,176 | 257,176 | 257,176 | 0 |

## Public Action Scaffold

| Suite | Legal move stats | Public action stats | Collision stats | Largest bucket stats |
|---|---|---|---|---|
| Current starter matrix | min 1 / max 32 / avg 7.627 / p50 8 / p90 13 / p95 15 | min 1 / max 13 / avg 4.730 / p50 5 / p90 9 / p95 10 | min 0 / max 25 / avg 2.897 / p50 2 / p90 8 / p95 10 | min 1 / max 26 / avg 3.191 / p50 2 / p90 6 / p95 11 |
| Robust starter matrix | min 1 / max 32 / avg 7.964 / p50 9 / p90 13 / p95 15 | min 1 / max 14 / avg 4.786 / p50 5 / p90 9 / p95 10 | min 0 / max 25 / avg 3.178 / p50 2 / p90 9 / p95 10 | min 1 / max 26 / avg 3.397 / p50 3 / p90 7 / p95 11 |

| Public action kind presence | Current roots | Robust roots |
|---|---:|---:|
| choose_mulligan | 300 | 2,548 |
| choose_prompt_option | 186 | 1,383 |
| pass | 3,162 | 25,571 |
| play_card | 2,888 | 23,423 |
| resolve_round_end | 331 | 2,645 |
| use_leader | 1,488 | 11,335 |

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
| Matchup and deck preset | all counters present in `summary.json`; sums 63 | all counters present in `summary.json`; sums 340 |

## Source Artifact Hashes

| Suite | cFp68 summary | cFp68 eligible roots | cFp68 skipped roots | cFp69 summary | cFp69 probe roots | cFp69 skipped roots |
|---|---|---|---|---|---|---|
| Current starter matrix | `3b52cb515229480cb22725492c925f1e2ccc8099bd5c0b10de851a802201a029` | `43c0dffc9742df50c18418eaa93e83effd429b37b53b36d56b92adb76e2d4d87` | `b2b8dda27d7f61437aee50f4d0d3bae16f4b2c6595352e638c041edfbd2e2406` | `d5be37fa882ae443029653c1b80854af74fb18a54aeeb026dcf0a40195ffbfc6` | `fd1bdf4048231ffca218fa934aef7e4ed6452f258bb0f4b125cd994491277a9f` | `63de4c0f60b8aeb56ea6a9dbc59643b9dabf931862683ba53ff08396ba29535c` |
| Robust starter matrix | `2ade0597b1f3f4edf11047846d31cb2d281df50b21e9c374010fda71530d03db` | `7396adbf22084b0ab0515fdc6fb239bcd2e32c72404bfc5d800eebff62f5d97f` | `91353f4a302cf755f7c2bb3196df5bf5643c31fa590287074531dccf5af0dd50` | `8c8ceb1dfd2ffaa2d8910c22f7fb6ee167fafcd0ff5ac5fe6a4d6ed6fdf52039` | `c6688e88f8341e260254eef8bb7d6bb65a0bd9c78daceae35663232449878627` | `5d51db39d4c7170b38f1789e139744b3b2b1f22b96fb418b800ffad2c12e2cad` |

The robust command was repeated and produced identical cFp69 hashes.

## Hidden-Info Safety

cFp69 artifacts contain public benchmark root metadata, scalar sample-budget
counts inherited from cFp68, public-action bucket counts, skipped-root
accounting, source hashes, and aggregate counters only. They do not serialize
private card identities, raw legal moves, sampled hidden worlds, engine logs,
debug traces, action ranking, value estimates, rollout results, or product AI
wiring. The artifact serializer scanner passed, and a direct exact-token scan
over both cFp69 artifact directories, this decision note, and the cFp69 audit
report passed.

## cFp70 Recommendation

cFp70 should add the first one-ply sampled-world action-availability probe over
the same cFp68 eligible roots, still without rollout/value/strength claims. It
should measure whether public action buckets remain available across sampled
worlds and report action-availability disagreement/risk, with cFp68/cFp69 skip
accounting attached.
