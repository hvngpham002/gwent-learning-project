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

Yes. The current starter suite produced 4,042 roots and the robust starter suite
produced 32,487 roots. All 36,529 roots are `prior_available` and
`materializationStatus: "valid"`.

Every valid root reports:

- `sampleCountRequested: 8`
- `sampleCountGenerated: 8`
- `sampleCountValid: 8`
- `sampleCountInvalid: 0`

### 2. What invalid reason counts remain?

None. Both required suites have empty invalid reason counts.

During implementation, the first local current-suite run exposed
`insufficient_prior_remaining` roots. The fix was not a behavior change: public
known subtraction now covers public board/discard rows on both sides, acting-seat
visible hand cards that belong to the opponent preset, and removed-from-game
cards that left public play through visible transforms. The materializer still
does not inspect opponent hidden hand/deck identities.

### 3. Are sampled hidden multisets deterministic across repeat runs?

Yes. The robust sampler-materialization command was run twice with identical
hashes:

| File | Hash |
|---|---|
| `manifest.json` | `301314e27394c0eeecf5cc29d75d3a95f14e0abbaa722072afd5190b58de4391` |
| `summary.json` | `24bac4933e378063ca170c367db1e4e5ca0ee2e2c55dd89ffdb281b8126fd21c` |
| `roots.jsonl` | `963c1cec7e895147bfef14782d44866bcad1aff9df1f97a1a2f68154d472397f` |
| `report.md` | `d99b5483c83a54d964f22618894f9c74f69dcac38f09aad8901f7cfcec42a148` |

The current suite hashes are:

| File | Hash |
|---|---|
| `manifest.json` | `65ea38eadefbc3fceb9535b5bee976fe41b39c63df45f45ca1e4d49c807f2ea6` |
| `summary.json` | `7b05a5875719707aef594d96322b710caa87257ebb8f388442516b5b66b5191c` |
| `roots.jsonl` | `9ea59eec18ec1e4e5c5838581bdc7c9fb3d8affc4676679b69b8e1a71d97f0ae` |
| `report.md` | `12197fc436a708e8854874d5f060edfe7a2654cf3f38294c79485489c462b10e` |

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

Yes, with the cFp58/cFp60 guardrails still in force. The next phase can build a
benchmark-only `determinized-pimc-probe-v0` on top of cFp61 samples, but it must
remain separate from product AI, serialize no hidden sample identities, and
report determinization-risk metrics before making strength claims.

## Recommended Next Step

Implement the first benchmark-only `determinized-pimc-probe-v0` prototype using
the cFp61 materialized samples and the cFp60 public action abstraction. Keep it
out of product gameplay and do not interpret it as a fair hidden-information
agent until Long-style determinization-risk metrics are measured.
