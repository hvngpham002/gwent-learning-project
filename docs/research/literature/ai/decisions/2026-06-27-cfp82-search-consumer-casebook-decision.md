# cFp82 - Search Consumer Casebook Decision

**Date:** 2026-06-27
**Spec:** `docs/spec/2026-06-27-cFp82-specs.md`
**Branch:** `codex/cFp82-search-consumer-casebook-decision`
**Base:** `dev`

---

## Decision

cFp82 selects the first path from the spec: proceed to a small deterministic
consumer-subset contract.

The recommended next phase is:

```text
cFp83: search-consumer-small-subset-contract-v0
```

cFp82 is a docs/metadata decision phase only. It does not create a benchmark
artifact family and does not modify the committed cFp81, cFp80, cFp79, cFp78,
or cFp76 artifact directories.

---

## Evidence From cFp81

The cFp81 casebook reached `casebook_ready` for both starter suites while
preserving the committed cFp80 source data as read-only input.

| Suite | cFp80 roots | cFp80 compact actions | Inherited skipped roots | Skipped percent | Casebook rows | Slice summaries | Readiness |
|---|---:|---:|---:|---:|---:|---:|---|
| current | 3,979 | 18,820 | 63 | 1.56% | 80 | 95 | `casebook_ready` |
| robust | 32,147 | 153,842 | 340 | 1.05% | 80 | 95 | `casebook_ready` |

cFp81 source consistency was `ready` for both suites. The cFp80 source status
was `dictionary_ready`, reconstruction passed with 0 mismatches, row-count
deltas were 0, dictionary group checks passed, compact action dictionary
references resolved, and compact action root references resolved. The robust
cFp80 compact action artifact remained below the 50 MB target.

The non-overlapping combined-readiness rows are the decision evidence:

| Suite | Label | Actions | Roots | Action percent | Root percent |
|---|---|---:|---:|---:|---:|
| current | `consumer_ready` | 3,086 | 1,211 | 16.40% | 30.43% |
| current | `consumer_ready_high_branching` | 10,552 | 2,357 | 56.07% | 59.24% |
| current | `consumer_ready_high_collision` | 5,163 | 2,840 | 27.43% | 71.37% |
| current | `consumer_ready_over_budget_context` | 19 | 6 | 0.10% | 0.15% |
| robust | `consumer_ready` | 24,405 | 9,580 | 15.86% | 29.80% |
| robust | `consumer_ready_high_branching` | 85,651 | 19,094 | 55.67% | 59.40% |
| robust | `consumer_ready_high_collision` | 43,629 | 23,338 | 28.36% | 72.60% |
| robust | `consumer_ready_over_budget_context` | 157 | 45 | 0.10% | 0.14% |

The robust casebook artifacts were small and deterministic: `casebook-rows.jsonl`
was 42,703 bytes, `slice-summaries.jsonl` was 41,906 bytes, and the robust
repeat hashes matched exactly in the cFp81 report.

---

## Why Not Direct Search/Value Yet

The robust suite has 153,842 compact action rows, but only 24,405 actions are
in the ordinary `consumer_ready` combined slice. High-branching covers 85,651
actions and high-collision covers 43,629 actions. Those pressures are not
errors, but they mean the current evidence is not a safe basis for direct
action-quality claims.

cFp81 describes coverage and readiness. It does not evaluate move strength,
estimate outcome quality, choose moves, or prove that a broader consumer can
interpret high-branching or high-collision contexts correctly. Moving straight
to search or value work would turn descriptive coverage evidence into a
behavioral claim that cFp81 did not establish.

---

## Why Not Pause Entirely

The ordinary ready slice is not empty or anecdotal. In the robust suite it
covers 24,405 actions across 9,580 roots, with source consistency ready and
all cFp80 consistency gates passing. That is enough to define a bounded
consumer input surface for a future benchmark-only subset contract.

The correct response is therefore not a full pause. It is a smaller next phase
that isolates low-risk ready contexts, preserves skipped-root accounting, and
keeps any high-pressure contexts out of the default consumer subset unless a
future spec names a separate diagnostic bucket.

---

## Selected cFp83 Contract

cFp83 should implement `search-consumer-small-subset-contract-v0` as a
benchmark-only deterministic subset contract over committed cFp80/cFp81
evidence. It should be a contract for future consumer experiments, not a
search-playing policy and not an action-quality artifact.

---

## cFp83 Minimum Contract

cFp83 should:

- consume committed cFp80 and cFp81 artifacts read-only;
- produce a deterministic subset of roots/actions suitable for future
  consumer experiments;
- include only low-risk `consumer_ready` contexts by default unless the spec
  defines a separate diagnostic bucket;
- preserve cFp68/cFp69 skipped-root accounting;
- include exact source artifact references and row-count source consistency;
- emit scalar public-safe identifiers only;
- stay below small artifact targets;
- make no action-quality claim;
- compute no action values, outcome estimates, rewards, win rates, payoffs,
  rankings, or recommended moves;
- execute no candidate actions;
- rebuild no sampled states;
- materialize no hidden worlds;
- change no engine, policy, sampler, deck, catalog, rating, or UI behavior.

---

## Explicit Non-Claims

cFp82 does not add search gameplay, values, rankings, reward labels, rollouts,
training export, product-selectable search AI, AI Lab runner buttons, browser
benchmark execution, or any gameplay behavior. It does not change
`legal-heuristic-v1`, `legal-heuristic-v0`, engine rules, legal moves, sampler
behavior, benchmark suite definitions, deck/catalog data, or rating artifacts.

---

## Hidden-Info Safety

cFp82 is docs/metadata only. It emits no new machine-readable benchmark rows,
does not copy cFp81 row payloads into a new artifact family, and does not
materialize hidden worlds or sampled states. The decision uses aggregate public
counts from committed cFp81 summaries and casebook rows.

---

*End of cFp82 decision note.*
