# cFp61 Hidden-Multiset Materialization Decision Note

Date: 2026-05-27

Status: accepted implementation decision

## Summary

cFp61 implements the sampler materialization step that cFp60 deliberately
deferred. It uses the opponent-seat `known_preset_decklist_prior` for official
starter benchmark roots, materializes deterministic in-memory hidden opponent
hand/deck source-multiset samples, validates those samples against public counts
and duplicate limits, and writes aggregate-only artifacts under
`sampler-materialization/cFp61/`.

This phase remains evaluation infrastructure. It does not run PIMC, ISMCTS,
MCTS, rollouts, action evaluation, action ranking, search move selection, policy
behavior changes, engine rule changes, legal move changes, product AI wiring, or
product difficulty changes.

## Decisions

### 1. Did materialization succeed for all cFp60 official starter roots?

Partially. The current starter suite produced 4,042 roots and the robust starter
suite produced 32,487 roots. All 36,529 roots are `prior_available`.

After the prompt-reveal repair, valid roots are:

- current starter suite: 3,979 valid roots;
- robust starter suite: 32,146 valid roots.

Every valid root reports:

- `sampleCountRequested: 8`
- `sampleCountGenerated: 8`
- `sampleCountValid: 8`
- `sampleCountInvalid: 0`

Invalid roots are kept in the artifact with safe reason counts and zero
generated samples.

### 2. What invalid reason counts remain?

The repaired contract leaves safe `insufficient_prior_remaining` counts:

- current starter suite: 63 roots;
- robust starter suite: 341 roots.

These roots are states where public known subtraction plus observed hidden counts
cannot be reconciled to the opponent-seat known preset prior without peeking at
hidden hand/deck identities. The materializer records the invalid reason and
does not fabricate samples for those roots.

### 3. Are sampled hidden multisets deterministic across repeat runs?

Yes. The robust sampler-materialization command was run twice with identical
hashes:

| File | Hash |
|---|---|
| `manifest.json` | `4734054121cab2ab44a491016d313b85ad001fe5b940c4156f341893e79813e0` |
| `summary.json` | `09508114efac409e0e705f92e84cc3d49c9727e6cf1d151ccfe0d3063fc88ca2` |
| `roots.jsonl` | `c42b4cd4d43d1bfe539f30b8f812ea0c00d3fd8db2bb743bcbe07629d19a620c` |
| `report.md` | `739e21df95bd1c69242f5b3d03ff02057c16381e4236cd2c3f31e0a26efc61c6` |

The current suite hashes are:

| File | Hash |
|---|---|
| `manifest.json` | `dce47b639ad740e16da0577b8a20230cb629d47f48cd9c3a5819ba38dd8bf77f` |
| `summary.json` | `5e6aa42c623bd7852ea5bceb3ba0d67a128fa6c67cd46978372c5ef98225b7a4` |
| `roots.jsonl` | `1ee53a81182dcc24c77083d0cf5ebfd02082f2d40176676b28b695c82af86061` |
| `report.md` | `f44bfe59c537ab7c5f219a2e4a328a2fd3141783d160c3696e0e32f1796bb027` |

### 4. Are sample aggregate stats plausible and hidden-info-safe?

Yes. Root artifacts include only scalar/status fields and aggregate sample
statistics: hand/deck unique-count min/max/average, duplicate-pressure buckets,
and hand/deck overlap buckets. They do not serialize sampled hand maps, sampled
deck maps, sampled order, sampled multiset hashes, raw move payloads, raw state,
runtime card identifiers, or card identity strings.

The artifact scanner passes on both generated suites and rejects injected unsafe
keys, runtime id prefixes, sampled-map fields, sampled/materialized-source
fields, and representative catalog-like card identity strings.

### 5. Is the project ready for a first `determinized-pimc-probe-v0`?

Not for all roots. The valid-root sampler path is ready for a first
benchmark-only probe, but the invalid roots should either be skipped with safe
reason accounting or receive a narrower sampler refinement for non-prior hidden
hand cards before any broad `determinized-pimc-probe-v0` run. Any probe must
remain separate from product AI, serialize no hidden sample identities, and
report determinization-risk metrics before making strength claims.

## Recommended Next Step

Either add a small sampler refinement for non-prior hidden hand cards, or build
the first benchmark-only `determinized-pimc-probe-v0` only over valid cFp61
roots with explicit invalid-root skip accounting. Keep it out of product
gameplay and do not interpret it as a fair hidden-information agent until
Long-style determinization-risk metrics are measured.
