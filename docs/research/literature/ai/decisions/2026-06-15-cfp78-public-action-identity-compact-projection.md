# cFp78 — Public Action Identity Compact Projection Decision

**Date:** 2026-06-15
**Spec:** `docs/spec/2026-06-15-cFp78-specs.md`
**Branch:** `codex/cFp78-public-action-identity-compact-projection-v0`
**Base:** `dev`

---

## Decision

cFp78 implements `public-action-identities-compact-v0` as a benchmark-only,
read-only compact projection over committed cFp77 artifacts. It reads cFp77
JSONL artifacts as immutable source data and emits slimmer rows without
re-observing benchmark roots, re-executing candidate actions, rebuilding
sampled states, materializing hidden worlds, or computing action values,
rewards, win probabilities, payoff tables, principal variations, or action
rankings.

The compact projection produces three JSONL artifact files per suite:

- `action-identities-compact.jsonl` — one slim compact action row per cFp77
  action identity row, dropping `actionPhase`, `actionRound`, and
  `collisionCountWithinBucket`; renaming `publicActionKind → kind` and
  `publicActionOrdinal → ordinal`; and compacting separate `targetKind`,
  `targetSide`, `targetRow` fields into a single `target` token string
  (`<targetKind>|<targetSide>|<targetRow>` joining non-empty parts, omitted
  entirely when neither `targetKind` nor `targetSide` is present).
- `root-index.jsonl` — one compact root-index row per cFp77 root summary row,
  retaining only the fields needed for cFp79 consumer joins: `rootRef`, suite
  and matchup identity, `policyId`, `faction`, `deckPresetId`, phase/round,
  `publicActionCount`, `legalMoveCount`, and `rootPublicFingerprint`. Drops
  per-root count maps, delta fields, cFp69/cFp70/cFp71/cFp72/cFp74 scalar
  fields, and run-metadata fields.
- `skipped-roots.jsonl` — cFp77 skipped-root rows forwarded verbatim, carrying
  the same cFp68/cFp69 skip classification and counters.

Source consistency is `ready` for both the current and robust starter suites
(18 checks, all 0/0 deltas and mismatch counts, `cfp77IdentityReadinessStatus:
identity_ready`, `cfp77SourceConsistencyStatus: ready`), so cFp78 reaches
`compactReadinessStatus: compact_ready` and does not stop at
`source_consistency_failed`.

Because the robust compact `action-identities-compact.jsonl` (46.86 MB) is
below the 50 MB soft target, `cFp79Recommendation` is `CFP79_RECOMMENDATION_JOIN`:
cFp79 should join cFp76 root features to cFp77/cFp78 public-action identities
to populate `action-features.jsonl`.

---

## Evidence From cFp78

**Current starter matrix (`benchmark-v1-starter-matrix-v1`):**

- source consistency status: `ready` (18 checks, all 0/0 deltas and
  mismatch counts).
- compact action rows: 18,820 (preserved; equals cFp77 action identity row
  count exactly).
- root-index rows: 3,979 (preserved; equals cFp77 root summary row count
  exactly).
- skipped-root rows: 63 (forwarded verbatim from cFp77).
- compact row count deltas vs cFp77: 0 for action rows, 0 for root-index
  rows, 0 for skipped-root rows.
- duplicate compact action keys: 0. cFp77 action keys missing from compact: 0.
- compact action key-hash, kind, ordinal, and move-count mismatches: 0.
- hidden-info scan status: `clean` (0 hazards).
- `action-identities-compact.jsonl`: 5,727,796 bytes.
- `root-index.jsonl`: 2,876,496 bytes.
- `skipped-roots.jsonl`: 104,328 bytes.
- bytes saved vs cFp77 `action-identities.jsonl` (6,704,468): 976,672 bytes
  (~14.57% reduction).
- bytes saved vs cFp77 `root-summaries.jsonl` (4,948,087): 2,071,591 bytes.

**Robust starter matrix (`benchmark-v1-starter-matrix-robust-v1`):**

- source consistency status: `ready` (18 checks, all 0/0 deltas and
  mismatch counts).
- compact action rows: 153,842 (preserved; equals cFp77 action identity row
  count exactly).
- root-index rows: 32,147 (preserved; equals cFp77 root summary row count
  exactly).
- skipped-root rows: 340 (forwarded verbatim from cFp77).
- compact row count deltas vs cFp77: 0 for action rows, 0 for root-index
  rows, 0 for skipped-root rows.
- duplicate compact action keys: 0. cFp77 action keys missing from compact: 0.
- compact action key-hash, kind, ordinal, and move-count mismatches: 0.
- hidden-info scan status: `clean` (0 hazards).
- `action-identities-compact.jsonl`: 46,860,776 bytes (~46.86 MB) — **below**
  the 50 MB soft target, enabling cFp79 consumer feature joins.
- `root-index.jsonl`: 23,918,293 bytes (~23.92 MB).
- `skipped-roots.jsonl`: 571,678 bytes.
- bytes saved vs cFp77 `action-identities.jsonl` (54,892,627): 8,031,851
  bytes (~14.63% reduction).
- bytes saved vs cFp77 `root-summaries.jsonl` (40,930,740): 17,012,447 bytes.
- determinism: the robust suite CLI was run twice; all 6 artifact hashes
  (manifest.json, summary.json, action-identities-compact.jsonl,
  root-index.jsonl, skipped-roots.jsonl, report.md) matched exactly across
  both runs.

**Robust artifact hashes (both runs identical):**

- `manifest.json`:
  `676dd5984f35f1ee788cf99285be785a444e73cfeec04014345251364d606193`
- `summary.json`:
  `9c8d30827d1ffe435aa2a05bfb244c01495257457bfc149eeb50e8d6891ba8a8`
- `action-identities-compact.jsonl`:
  `f0d88b47024953583422fc3da10752c990ed035b292db28b3345d7dc276a0886`
- `root-index.jsonl`:
  `ec53c3a4933cef77a19f07ed39f6c7fec304cd2134cdea205466f40e076f9d0d`
- `skipped-roots.jsonl`:
  `39c560f502f4b05e8e292179e60664ab3ec89553efa7b45fa47c52b80d5267fd`
- `report.md`:
  `168e8e7011ec3862b28d37369f0f434adf6e52d10bab4f1ab5373e01c4d701bd`

---

## cFp78 Artifact Contract

**Artifact family:** `public-action-identities-compact-v0/cFp78/`

**Suites:**
- `benchmark-v1-starter-matrix-v1`
- `benchmark-v1-starter-matrix-robust-v1`

**Files written per suite (all present in both directories):**
- `manifest.json` — schema version, compact run id, suite id, source cFp77
  run id, source artifact SHA-256 references (6 cFp77 files), `compactReadinessStatus`,
  `explicitNonClaims`, `cFp79Recommendation`, artifact hashes.
- `summary.json` — `sourceConsistency` (18 boolean/count checks plus `status`),
  `compactReadinessStatus`, row counts, artifact byte sizes, bytes saved vs
  cFp77, `isBelowCompactActionTarget`, `hiddenInfoScanStatus`, `phaseId`.
- `action-identities-compact.jsonl` — one slim compact action row per cFp77
  action identity row.
- `root-index.jsonl` — one compact root-index row per cFp77 root summary row.
- `skipped-roots.jsonl` — cFp77 skipped-root rows forwarded verbatim.
- `report.md` — prose summary of source consistency, row counts, artifact
  sizes, bytes saved, hidden-info safety, source artifact references,
  non-claims, and the cFp79 recommendation.

**Source artifacts read (read-only, 6 references per suite):** cFp77
`public-action-identities-v0/cFp77/` (manifest, summary,
action-identities, root-summaries, skipped-roots, report). No cFp77 artifact
directory was modified.

---

## Compact Row Schemas

### Compact action row (`action-identities-compact.jsonl`)

Each compact action row carries:

- `schemaVersion: "public-action-identities-compact-v0-action-v1"`
- `rootRef` — the cFp77 join key into `root-index.jsonl` (same value as in
  the source cFp77 action identity row).
- `publicActionRef` — carried from cFp77 (`public_action_NNN`).
- `publicActionKeyHash` — carried from cFp77 (full SHA-256 hex digest).
- `ordinal` (renamed from `publicActionOrdinal`) — zero-based sorted bucket
  ordinal.
- `kind` (renamed from `publicActionKind`) — public action kind string.
- `target` (optional) — compact target token joining non-empty
  `[targetKind, targetSide, targetRow]` with `|` separator; omitted when
  neither `targetKind` nor `targetSide` is present (e.g. for `pass`
  or `resolve_round_end`).
- `sourceClass` — carried from cFp77.
- `strengthBucket` (optional), `optionIndexLabel` (optional) — carried when
  present in source cFp77 row.
- `moveCount` — carried from cFp77.

Fields dropped vs cFp77 action identity rows: `actionPhase`, `actionRound`,
`collisionCountWithinBucket` (equals `moveCount - 1`, derivable).

### Compact root-index row (`root-index.jsonl`)

Each compact root-index row carries:

- `schemaVersion: "public-action-identities-compact-v0-root-index-v1"`
- `rootRef` — the cFp77 join key (same as in source cFp77 root summary row).
- `cfp77RootRef` — explicit reference confirming the source cFp77 root
  summary row.
- `suiteId`, `matchupId`, `seed`, `mirrorGroupId`, `mirrorIndex`, `step`,
  `decisionIndex`, `phase`, `round`, `seatId`, `policyId`, `faction`,
  `deckPresetId`, `rootPublicFingerprint` — root identity carried from cFp77.
- `publicActionCount`, `legalMoveCount` — carried from cFp77 root summary.

Fields dropped vs cFp77 root summary rows: all per-root count maps (`publicActionKindCounts`,
`targetKindCounts`, etc.), `cfp69PublicActionCount`, `cfp69LegalMoveCount`,
delta fields, `identityRunId`, `identityReadinessStatus`, `cFp69ProbeStatus`,
`sourceConsistencyStatus`, `publicActionCollisionCount`,
`largestPublicActionBucketSize`, `observedActionIdentityRowCount`.

### Compact skipped-root row (`skipped-roots.jsonl`)

Forwarded verbatim from cFp77 `skipped-roots.jsonl` without modification.

---

## cFp78 Source Consistency

`buildPublicActionIdentitiesCompactV0SourceConsistency` computes 18 checks:

1. `cfp77IdentityReadinessStatus === "identity_ready"`
2. `cfp77SourceConsistencyStatus === "ready"`
3. cFp77 summary-reported action identity row count vs actual input row count
   (delta 0)
4. cFp77 summary-reported root summary row count vs actual input row count
   (delta 0)
5. cFp77 summary-reported skipped-root row count vs actual input row count
   (delta 0)
6. compact action row count vs cFp77 action identity row count (delta 0)
7. compact root-index row count vs cFp77 root summary row count (delta 0)
8. compact skipped-root row count vs cFp77 skipped-root row count (delta 0)
9. 0 compact action rows with missing `rootRef`
10. 0 compact root-index rows with missing `cfp77RootRef`
11. 0 duplicate compact action keys
12. 0 cFp77 action identity keys missing from compact output
13. 0 compact action key-hash mismatches vs cFp77
14. 0 compact action `kind` mismatches vs cFp77 `publicActionKind`
15. 0 compact action `ordinal` mismatches vs cFp77 `publicActionOrdinal`
16. 0 compact action `moveCount` mismatches vs cFp77 `moveCount`
17. `sourceArtifactReferenceCount > 0` (6 references)
18. `sourceArtifactEmptyHashCount === 0`

All 18 checks are `true`/0 for both suites, so `sourceConsistency.status` is
`ready` and `compactReadinessStatus` is `compact_ready`.

---

## Hidden-Info Safety

cFp78 reuses `scanPublicActionIdentitiesV0TextForHiddenInfo` from cFp77's
artifact module via `scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo`,
applying it to all 5 machine-readable artifact text fields (manifest.json,
summary.json, action-identities-compact.jsonl, root-index.jsonl,
skipped-roots.jsonl). The compact row schema was designed to carry only
safe projection fields: no raw move IDs, card/source identities, deck order,
sampled hands/decks, hidden payloads, action values, expected values, win
probabilities, reward targets, payoff tables, principal variations, or
action rankings.

Both the current and robust artifact sets scan clean (`hiddenInfoScanStatus:
"clean"`, 0 hazards). The decision note above avoids writing the literal
hazard substrings; references to disallowed fields use prose or backtick
identifiers that do not match the word-boundary hazard patterns.

The direct exact-token `rg --pcre2` scan over both cFp78 artifact directories,
this decision note, and the cFp78 report returns no matches.

---

## cFp78 Budgets And Size Results

- Robust `action-identities-compact.jsonl`: 46,860,776 bytes (~46.86 MB) —
  **below** the 50 MB soft target. Compact is enabled; cFp79 JOIN
  recommendation applies.
- Robust `root-index.jsonl`: 23,918,293 bytes (~23.92 MB) — below the 90 MB
  hard stop.
- Robust `skipped-roots.jsonl`: 571,678 bytes.
- Current artifacts: `action-identities-compact.jsonl` 5,727,796 bytes,
  `root-index.jsonl` 2,876,496 bytes, `skipped-roots.jsonl` 104,328 bytes —
  all comfortably under target.
- Bytes saved (robust `action-identities-compact.jsonl` vs cFp77
  `action-identities.jsonl`): 8,031,851 bytes (~14.63% reduction).
- Because the robust compact `action-identities-compact.jsonl` is below the
  50 MB target, `cFp79Recommendation` is `CFP79_RECOMMENDATION_JOIN`: cFp79
  should proceed to join cFp76 root features to cFp78 compact action
  identities.

---

## Non-Claims

cFp78 `public-action-identities-compact-v0` explicitly does NOT:

- Choose actions or recommend best actions.
- Rank actions or compute action ordering.
- Estimate action values or expected values.
- Estimate win probability or reward targets.
- Compute payoff tables or principal variations.
- Run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- Execute candidate actions, rebuild sampled states, or materialize hidden
  worlds.
- Re-observe benchmark roots.
- Modify cFp77 artifact directories.
- Select moves for product AI.
- Change `legal-heuristic-v1` or `legal-heuristic-v0` behavior.
- Change engine rules, legal moves, sampler behavior, deck/catalog data,
  benchmark suite definitions, or rating artifacts.
- Add AI Lab runner buttons or execute benchmarks from the browser.
- Add difficulty tiers, export training data, or add Python tooling.
- Expose raw move IDs, card/source identities, deck order, sampled
  hands/decks, or hidden payloads.

---

## Recommended Next Step

cFp78's source consistency is `ready` and compact action rows are complete
for both suites (`compactReadinessStatus: compact_ready`). The robust
`action-identities-compact.jsonl` (46.86 MB) is below the 50 MB soft target.
cFp79 should join cFp76 root features to cFp78 compact action identities
to populate `action-features.jsonl` with per-public-action feature rows.
cFp79 should not recommend rollout, value estimation, action ranking,
best-action selection, win probability, or reward targets from cFp78 alone.

---

*End of cFp78 decision note.*
