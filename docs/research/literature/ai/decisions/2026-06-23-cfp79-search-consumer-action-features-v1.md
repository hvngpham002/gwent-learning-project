# cFp79 - Search Consumer Action Features v1 Decision

**Date:** 2026-06-23
**Spec:** `docs/spec/2026-06-23-cFp79-specs.md`
**Branch:** `codex/cFp79-search-consumer-action-features-v1`
**Base:** `dev`

---

## Decision

cFp79 implements `search-consumer-action-features-v1` as a benchmark-only,
read-only feature join over committed cFp76 and cFp78 artifacts. It does not
modify either source artifact family.

The join uses cFp78 `root-index.jsonl` as the bridge from cFp76 public root
identity fields to cFp78 `rootRef`, then emits:

- one normalized root-feature row per joined cFp76/cFp78 eligible root;
- one action-feature row per cFp78 compact public action identity row;
- one skipped-root row per cFp76/cFp78 skipped root identity.

Root-level feature evidence remains in `root-features.jsonl`; action rows only
carry action-local fields and `rootRef` joins. This keeps cFp79 normalized and
does not duplicate the cFp76 root-feature payload into every action row.

---

## Evidence From cFp79

**Current starter matrix (`benchmark-v1-starter-matrix-v1`):**

- consumer readiness status: `features_ready`.
- source consistency status: `ready`.
- root feature rows: 3,979.
- action feature rows: 18,820.
- skipped root rows: 63.
- `root-features.jsonl`: 9,548,373 bytes.
- `action-features.jsonl`: 10,518,156 bytes, below the 50 MB soft target.
- `skipped-roots.jsonl`: 108,675 bytes.
- hidden-info scan status: `clean`.

**Robust starter matrix (`benchmark-v1-starter-matrix-robust-v1`):**

- consumer readiness status: `features_ready`.
- source consistency status: `ready`.
- root feature rows: 32,147.
- action feature rows: 153,842.
- skipped root rows: 340.
- `root-features.jsonl`: 77,755,094 bytes, below the 90 MB hard stop.
- `action-features.jsonl`: 86,029,163 bytes, below the 90 MB hard stop but
  above the 50 MB soft target.
- `skipped-roots.jsonl`: 592,758 bytes.
- hidden-info scan status: `clean`.
- robust repeat determinism: all 6 artifact hashes matched exactly across two
  robust runs.

**Robust artifact hashes (both robust runs identical):**

- `manifest.json`:
  `e29e031831d4b7b6656396b4486c0c27cd5dbabdaf12f01d5e2775d3a14e09fe`
- `summary.json`:
  `8ba1ce9b11fb00f642355fd136dc91b0edec217ed4e743e1a326e09ba67ab456`
- `root-features.jsonl`:
  `3c92b9ad317f1b2031a672cfab5588ad6cd9f5fa8b9174061d25c42f5a2e68b3`
- `action-features.jsonl`:
  `749fb2828c9c4419e1091f06cdff0bc2d0c7ecfd3e24e4be22811b948c64c5df`
- `skipped-roots.jsonl`:
  `8ba5c854c1bfceed63d47e0259a78a8f4a2c6e769070d9cdff86c394a8805872`
- `report.md`:
  `b91f03b37f231baa5d684fa5de221daf3421d86f00f6070447b9514d49cef6c1`

---

## Source Consistency

The cFp79 source consistency object proves:

- cFp76 remained at `consumerReadinessStatus: action_feature_source_gap`.
- cFp76 source consistency was `ready`.
- cFp78 remained at `compactReadinessStatus: compact_ready`.
- cFp78 source consistency was `ready`.
- cFp76 and cFp78 summary counts matched actual loaded row counts.
- every cFp76 root feature joined exactly one cFp78 root-index row.
- every cFp78 root-index row joined exactly one cFp76 root feature.
- every cFp79 action-feature row referenced an emitted root feature.
- every cFp78 action identity key appeared exactly once in cFp79 action rows.
- duplicate cFp79 root refs: 0.
- duplicate cFp79 action identity refs: 0.
- source artifact reference count: 12.
- source artifact empty hash count: 0.

---

## Size Result

cFp79 reaches `features_ready`, but the robust action-feature artifact is
86,029,163 bytes. This is below the 90 MB hard stop and therefore safe to keep
as evidence, but it is above the 50 MB soft target.

The largest robust action-row field contributors were:

| Field | Approx bytes |
|---|---:|
| schemaVersion | 10,768,940 |
| actionIdentityRef | 7,999,784 |
| consumerReadinessStatus | 6,461,364 |
| publicActionRef | 5,692,154 |
| sourceConsistencyStatus | 5,076,786 |
| collisionCountWithinBucket | 4,617,999 |
| rootFeatureRef | 4,615,260 |
| moveCountBucket | 4,392,553 |
| hasOptionIndexLabel | 4,153,734 |
| hasStrengthBucket | 3,846,050 |
| rootRef | 3,538,366 |
| featureRunId | 3,384,524 |

These are mostly required per-row schema/readiness/join fields. cFp80 should
therefore compact or dictionary-encode the cFp79 action-feature projection
before any consumer casebook work.

---

## Non-Claims

cFp79 `search-consumer-action-features-v1` explicitly does NOT:

- choose actions or recommend best actions;
- rank actions or compute action ordering;
- estimate action values or expected values;
- estimate win probability or reward targets;
- compute payoff tables or principal variations;
- run rollout search, PIMC evaluation, or ISMCTS/MCTS;
- execute candidate actions, rebuild sampled states, or materialize hidden
  worlds;
- re-observe benchmark roots;
- modify cFp76 or cFp78 artifact directories;
- select moves for product AI;
- change `legal-heuristic-v1` or `legal-heuristic-v0` behavior;
- change engine rules, legal moves, sampler behavior, deck/catalog data,
  benchmark suite definitions, or rating artifacts;
- add AI Lab runner buttons or execute benchmarks from the browser;
- add difficulty tiers, export training data, or add Python tooling.

---

## Recommended Next Step

cFp80 should first define a compact or dictionary-encoded cFp79 projection, or
a deterministic subset over cFp79 action features, before any broader
search-consumer casebook. cFp80 must still remain benchmark-only and must not
add rollout, value estimation, action ranking, best-action selection, win
probability, reward targets, search gameplay, or product AI wiring.

---

*End of cFp79 decision note.*
