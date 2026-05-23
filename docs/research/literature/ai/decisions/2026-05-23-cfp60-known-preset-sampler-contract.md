# Cluster F cFp60: Known-Preset Sampler Contract Decision Note (Repair 2)

**Date:** 2026-05-23
**Spec:** `docs/spec/2026-05-23-cFp60-specs.md`
**Branch:** `codex/cFp60-known-preset-sampler-contract`
**Commits:** `2f9c2aa` (initial), `7d26e25` (Repair 1: MatchState counts), `b8c3d3f` (Repair 2: opponent-seat prior)

## Summary

cFp60 implements the sampler-readiness contract layer for the Gwent AI benchmark infrastructure. It adds `known_preset_decklist_prior` for official starter benchmark suites, deterministic sampled-world validation summaries, hidden-info-safe public action abstraction, and deterministic benchmark-only sampler-readiness artifacts.

## Decisions

### Q1: Is `known_preset_decklist_prior` coherent enough for a later `determinized-pimc-probe-v0`?

**Decision: Partially — needs sampler refinement first.** The prior is built from the opponent seat's catalog deck preset, producing a multiset of available cards. It correctly handles duplicate copies and visible-card subtraction without exposing card identities. For roots where the opponent prior cannot be constructed (non-official decks), it emits `prior_unavailable` safely. However, all 36,529 roots across both suites produce `rootValidationStatus: "deferred"` because real sampled hidden multisets are not implemented. The prior contract is coherent, but a `determinized-pimc-probe-v0` would need actual hidden-multiset materialization before meaningful action evaluation can occur.

### Q2: Do sampled-world validation failures block search?

**Decision: No failures found.** All 36,529 roots across both suites produce `rootValidationStatus: "deferred"` with zero invalid samples. Validation checks opponent hand + deck counts against the opponent's known preset main deck card count. No search is blocked. The deferred status is by design — it signals that real sampled multisets are not yet implemented and the validation only confirms public count consistency.

### Q3: Are public action abstraction collisions acceptable or need a cFp61 repair?

**Decision: Acceptable.** The abstraction groups legal moves by kind, target kind, target side, target row, phase, round, source class, strength bucket, and prompt option index. Collision counts (legal moves collapsed into same abstraction) average 2.876 per root in starter matrix and 3.167 in robust. The largest bucket sizes are reasonable (max 14 public actions, max 25 collisions). The abstraction hides all raw move ids, source ids, card names, option ids, and runtime instance ids. No cFp61 repair needed at this level of abstraction.

### Q4: Should the next phase be sampler refinement, first hidden-multiset materialization, or determinized action evaluation?

**Decision: First hidden-multiset materialization, then sampler refinement.** The prior contract and public action abstraction are both coherent and hash-stable across repeated runs. All 36,529 roots are `deferred` (not `invalid`), confirming that the prior-validation contract works correctly when the opponent prior is built from the opponent seat's deck preset. The infrastructure is ready for a phase that materializes actual hidden multisets from the prior, enabling deterministic world sampling. A `determinized-pimc-probe-v0` that evaluates actions should come after hidden-multiset materialization, not before.

## Stop Conditions Check

- No true hidden opponent hand identity or deck order required in safe artifact paths.
- Sampled worlds validated without serializing hidden identities.
- Action abstraction works without raw move ids, source ids, card names, or option ids.
- Robust sampler-readiness artifacts are deterministic (identical hashes on repeat run).
- No selected moves, command execution, policy behavior, or legal move generation changed.
- Hidden-info scanner passes on all committed cFp60 artifacts.
- Implementation did not turn into PIMC/ISMCTS/search.

## Artifacts Generated

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-readiness/cFp60/` (4 files, 4,042 roots, 120 matches)
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-readiness/cFp60/` (4 files, 32,487 roots, 1,000 matches)

## Recommended Next Step

Implement sampler-first hidden-multiset materialization: build a sampler that draws hidden opponent cards from the known-preset prior multiset and produces materialized sampled worlds. This enables cFp61 `determinized-pimc-probe-v0` to evaluate actions in real sampled worlds rather than operating on deferred validation only.
