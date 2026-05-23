# Cluster F cFp60: Known-Preset Sampler Contract Decision Note

**Date:** 2026-05-23
**Spec:** `docs/spec/2026-05-23-cFp60-specs.md`
**Branch:** `codex/cFp60-known-preset-sampler-contract`
**Owner:** coding agent

## Summary

cFp60 implements the sampler-readiness contract layer for the Gwent AI benchmark infrastructure. It adds `known_preset_decklist_prior` for official starter benchmark suites, deterministic sampled-world validation summaries, hidden-info-safe public action abstraction, and deterministic benchmark-only sampler-readiness artifacts.

## Decisions

### Q1: Is `known_preset_decklist_prior` coherent enough for a later `determinized-pimc-probe-v0`?

**Decision: Yes.** The prior is built from known catalog deck presets (`official-*-starter`), producing a multiset of available cards minus visible hand counts. It correctly handles duplicate copies and visible-card subtraction without exposing card identities. For roots where the prior cannot be constructed (non-official decks), it emits `prior_unavailable` safely. This is sufficient for a deterministic probe that samples hidden opponent state from known multiset bounds.

### Q2: Do sampled-world validation failures block search?

**Decision: No failures found.** All 4,042 roots in the starter matrix and all 32,487 roots in the robust suite produced `rootValidationStatus: "valid"` with zero invalid samples. Validation checks public count and visible-zone consistency without serializing sampled hidden identities. No search is blocked.

### Q3: Are public action abstraction collisions acceptable or need a cFp61 repair?

**Decision: Acceptable.** The abstraction groups legal moves by kind, target kind, target side, target row, phase, round, source class, strength bucket, and prompt option index. Collision counts (legal moves collapsed into same abstraction) average 2.876 per root in starter matrix and 3.167 in robust. The largest bucket sizes are reasonable (max 14 public actions, max 25 collisions). The abstraction hides all raw move ids, source ids, card names, option ids, and runtime instance ids. No cFp61 repair needed at this level of abstraction.

### Q4: Should the next phase be sampler repair, random-rollout sanity check, or first determinized one-ply probe?

**Decision: First determinized one-ply probe (cFp61).** The known-preset prior, validation summaries, and public action abstraction are all coherent and hash-stable across repeated runs. Hidden-info scanning passes on all committed artifacts. The infrastructure is ready for a `determinized-pimc-probe-v0` that uses the prior to sample worlds and evaluates one-ply moves. Random-rollout sanity checks should come after the first determinized probe establishes baseline metrics.

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

Implement cFp61: `determinized-pimc-probe-v0` — a benchmark-only determinized probe that uses `known_preset_decklist_prior` to sample opponent hidden state, evaluates legal moves in sampled worlds, and produces a `determinized-pimc-probe-v0` artifact with determinization-risk metrics.
