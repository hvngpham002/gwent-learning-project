# cFp80 - Search Consumer Action Feature Dictionary v0 Decision

**Date:** 2026-06-26
**Spec:** `docs/spec/2026-06-26-cFp80-specs.md`
**Branch:** `codex/cFp80-search-consumer-action-feature-dictionary-v0`
**Base:** `dev`

---

## Decision

cFp80 implements `search-consumer-action-features-dictionary-v0` as a
benchmark-only, read-only dictionary projection over committed cFp79 artifacts.
It does not modify cFp79, cFp76, or cFp78 artifacts.

The projection emits:

- one cFp80 root-feature row per cFp79 root-feature row;
- one compact action-feature row per cFp79 action-feature row;
- one cFp80 skipped-root row per cFp79 skipped-root row;
- `dictionaries.json`, mapping deterministic integer ids back to repeated
  public/scalar action strings.

Compact action rows omit row-constant cFp79 readiness and join fields. They also
declare cFp80 action schema/run constants once in `manifest.json` and
`summary.json` rather than repeating those constants in every compact action row.
This keeps the artifact plain JSON/JSONL and reviewable while meeting the robust
50 MB action target.

---

## Evidence From cFp80

**Current starter matrix (`benchmark-v1-starter-matrix-v1`):**

- consumer readiness status: `dictionary_ready`.
- source consistency status: `ready`.
- root feature rows: 3,979.
- compact action feature rows: 18,820.
- skipped root rows: 63.
- `root-features.jsonl`: 9,600,100 bytes.
- `action-features-compact.jsonl`: 5,615,464 bytes.
- cFp79 `action-features.jsonl`: 10,518,156 bytes.
- compact action bytes saved: 4,902,692.
- compact action percent saved: 46.61%.
- `skipped-roots.jsonl`: 109,368 bytes.
- `dictionaries.json`: 95,304 bytes.
- reconstruction status: `passed`.
- reconstruction mismatch count: 0.
- hidden-info scan status: `clean`.

**Robust starter matrix (`benchmark-v1-starter-matrix-robust-v1`):**

- consumer readiness status: `dictionary_ready`.
- source consistency status: `ready`.
- root feature rows: 32,147.
- compact action feature rows: 153,842.
- skipped root rows: 340.
- `root-features.jsonl`: 78,173,005 bytes.
- `action-features-compact.jsonl`: 46,044,793 bytes, below the 50 MB target.
- cFp79 `action-features.jsonl`: 86,029,163 bytes.
- compact action bytes saved: 39,984,370.
- compact action percent saved: 46.48%.
- `skipped-roots.jsonl`: 596,498 bytes.
- `dictionaries.json`: 743,205 bytes.
- reconstruction status: `passed`.
- reconstruction mismatch count: 0.
- hidden-info scan status: `clean`.

**Robust dictionary counts:**

| Dictionary | Count |
|---|---:|
| actionKinds | 6 |
| moveCountBuckets | 3 |
| optionIndexLabels | 1 |
| publicActionRefs | 14 |
| readinessStatuses | 4 |
| rootRefs | 32,147 |
| schemaVersions | 8 |
| sourceClasses | 6 |
| strengthBuckets | 1 |
| targets | 15 |

**Robust artifact hashes (both robust runs identical):**

- `manifest.json`:
  `fd1d4b55ff205b0188db58ad46397d3fdf386b2bcc32c7b47a50eee25c5a6fb4`
- `summary.json`:
  `0351a3e47db87ea6d93411e0972e7398eac6ac486e25816d49ee7a4a0423b3dd`
- `dictionaries.json`:
  `32d6c8abdd55db5fa3cc5b01937c1f8cf1f1cb4c158cef35d7fb98d5086a93e9`
- `root-features.jsonl`:
  `5d47d1c844c924d762500426230319dac4eb31615a9e6125d41f86de57b34035`
- `action-features-compact.jsonl`:
  `50bdc24d52937c014cdb09351d96bf4d6f8004d20d9682150fc56b8b4e6aaa83`
- `skipped-roots.jsonl`:
  `009dee8765f7d84e0d08f13bd9e5599b4cf3dd1256a0d684fb09e3e8ca654297`
- `report.md`:
  `3fcd0bcd183538b9cb291390ffa162640a52c72675d3ddba7c6e5cd4c1e9873a`

---

## Source Consistency

The cFp80 source consistency object proves:

- cFp79 remained at `consumerReadinessStatus: features_ready`.
- cFp79 source consistency was `ready`.
- cFp79 root, action, and skipped summary counts matched actual loaded rows.
- cFp80 root, compact action, and skipped row counts matched cFp79 counts.
- every compact action row referenced valid dictionary ids for root and public
  action references.
- duplicate reconstructed action identity references: 0.
- reconstruction mismatch count: 0.
- source artifact reference count: 6.
- source artifact empty hash count: 0.

---

## Non-Claims

cFp80 `search-consumer-action-features-dictionary-v0` explicitly does NOT:

- choose actions or recommend best actions;
- rank actions or compute action ordering;
- estimate action values or expected values;
- estimate win probability or reward targets;
- compute payoff tables or principal variations;
- run rollout search, PIMC evaluation, or ISMCTS/MCTS;
- execute candidate actions, rebuild sampled states, or materialize hidden
  worlds;
- re-observe benchmark roots;
- modify cFp79, cFp76, or cFp78 artifact directories;
- select moves for product AI;
- change `legal-heuristic-v1` or `legal-heuristic-v0` behavior;
- change engine rules, legal moves, sampler behavior, deck/catalog data,
  benchmark suite definitions, or rating artifacts;
- add AI Lab runner buttons or execute benchmarks from the browser;
- add difficulty tiers, export training data, or add Python tooling.

---

## Recommended Next Step

cFp81 may create a benchmark-only action-feature casebook or
consumer-readiness report over cFp80 compact artifacts.

cFp81 must still remain benchmark-only and must not add rollout, value
estimation, action ranking, best-action selection, win probability, reward
targets, search gameplay, or product AI wiring.

---

*End of cFp80 decision note.*
