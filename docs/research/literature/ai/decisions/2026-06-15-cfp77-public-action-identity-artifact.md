# cFp77 — Public Action Identity Artifact Decision

**Date:** 2026-06-15
**Spec:** `docs/spec/2026-06-15-cFp77-specs.md`
**Branch:** `codex/cFp77-public-action-identity-artifact-v0`
**Base:** `dev`

---

## Decision

cFp77 implements `public-action-identity-artifact-v0` as a benchmark-only,
read-only derivation over the committed cFp68/cFp69/cFp76 artifacts. It
observes benchmark roots at the same root-observer position as cFp69 (after
legal moves are generated, before policy selection), builds public action
buckets from legal moves using the existing
`buildPublicActionAbstraction` / `buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey`
contract, and emits:

- one action identity row per collapsed public action bucket per cFp68
  eligible root, in `action-identities.jsonl`;
- one root summary row per cFp68 eligible root, in `root-summaries.jsonl`;
- one skipped-root row per cFp68/cFp69 skipped root, in
  `skipped-roots.jsonl`.

`runPublicActionIdentitiesV0` filters observed roots to the cFp68
eligible-root key set, so cFp68/cFp69-skipped invalid roots are not
double-observed. Source consistency is `ready` for both the current and
robust starter suites (27 checks, all deltas/duplicate/missing-root counts
0, 0 observed-vs-eligible/probe mismatches), so cFp77 reaches
`identityReadinessStatus: identity_ready` and does not stop at
`source_consistency_failed`.

---

## Evidence From cFp77

**Current starter matrix (`benchmark-v1-starter-matrix-v1`):**

- source consistency status: `ready`.
- cFp68 eligible root count: 3,979. cFp68/cFp69 skipped root count: 63 (all
  consistent).
- observed root count: 3,979 (matches cFp68 eligible roots exactly; 0
  missing in either direction).
- action identity rows: 18,820. `cfp69PublicActionCountTotal`: 18,820.
  `actionIdentityRowCountDelta`: 0.
- root summary rows: 3,979. skipped root rows: 63.
- duplicate action identity keys: 0. duplicate observed/eligible/probe root
  keys: 0.
- public action kind totals: `choose_mulligan` 300, `choose_prompt_option`
  290, `pass` 3,162, `play_card` 13,249, `resolve_round_end` 331,
  `use_leader` 1,488.
- action family totals: `mulligan` 300, `prompt` 290, `pass` 3,162,
  `unit_play` 13,249, `round_resolution` 331, `leader` 1,488.
- bucket size class totals: `single` 13,657, `small_collision` 4,044,
  `large_collision` 1,119.
- hidden-info scan status: `clean` (0 hazards).
- `action-identities.jsonl`: 6,704,468 bytes.
- `root-summaries.jsonl`: 4,948,087 bytes.
- `skipped-roots.jsonl`: 103,383 bytes.

**Robust starter matrix (`benchmark-v1-starter-matrix-robust-v1`):**

- source consistency status: `ready`.
- cFp68 eligible root count: 32,147. cFp68/cFp69 skipped root count: 340
  (all consistent).
- observed root count: 32,147 (matches cFp68 eligible roots exactly; 0
  missing in either direction).
- action identity rows: 153,842. `cfp69PublicActionCountTotal`: 153,842.
  `actionIdentityRowCountDelta`: 0.
- root summary rows: 32,147. skipped root rows: 340.
- duplicate action identity keys: 0. duplicate observed/eligible/probe root
  keys: 0.
- public action kind totals: `choose_mulligan` 2,548, `choose_prompt_option`
  2,048, `pass` 25,571, `play_card` 109,695, `resolve_round_end` 2,645,
  `use_leader` 11,335.
- action family totals: `mulligan` 2,548, `prompt` 2,048, `pass` 25,571,
  `unit_play` 109,695, `round_resolution` 2,645, `leader` 11,335.
- bucket size class totals: `single` 110,213, `small_collision` 32,188,
  `large_collision` 11,441.
- hidden-info scan status: `clean` (0 hazards).
- `action-identities.jsonl`: 54,892,627 bytes (~54.89 MB).
- `root-summaries.jsonl`: 40,930,740 bytes (~40.93 MB).
- `skipped-roots.jsonl`: 566,578 bytes.
- determinism: the robust suite CLI was run twice; all 6 artifact hashes
  (manifest.json, summary.json, action-identities.jsonl,
  root-summaries.jsonl, skipped-roots.jsonl, report.md) matched exactly
  across both runs.

---

## cFp77 Artifact Contract

**Artifact family:** `public-action-identities-v0/cFp77/`

**Suites:**
- `benchmark-v1-starter-matrix-v1`
- `benchmark-v1-starter-matrix-robust-v1`

**Files written per suite (all present in both directories):**
- `manifest.json` — schema version, identity run id, suite id, source run
  ids, source artifact SHA-256 references, `identityReadinessStatus`,
  `explicitNonClaims`, `cFp78Recommendation`, artifact hashes.
- `summary.json` — `sourceConsistency` (27 boolean/count checks plus
  `status`), `countSummaries` (by phase, round, policy, faction, deck
  preset, matchup, public action kind, target kind, target side, bucket
  size class, action family), row counts, artifact byte sizes, hidden-info
  scan status.
- `action-identities.jsonl` — one row per collapsed public action bucket per
  cFp68 eligible root.
- `root-summaries.jsonl` — one row per cFp68 eligible root.
- `skipped-roots.jsonl` — one row per cFp68/cFp69 skipped root.
- `report.md` — prose summary of source consistency, row counts, count
  summaries, artifact sizes, hidden-info safety, source artifact
  references, non-claims, and the cFp78 recommendation.

**Source artifacts read (read-only, 14 references per suite):** cFp68
`determinized-probe-contract` (manifest, summary, eligible-roots,
skipped-roots, report), cFp69 `determinized-pimc-probe-v0` (manifest,
summary, probe-roots, skipped-roots, report), cFp76
`search-consumer-action-features-v0` (manifest, summary,
action-feature-gaps, report). No cFp68-cFp76 artifact directory was
modified.

---

## cFp77 Identity Row Schema

### Action identity row (`action-identities.jsonl`)

Each row carries:

- `rootRef` — a compact join key (`root_NNNNNN`, zero-padded to 6 digits)
  assigned by sorting cFp68 eligible-root keys ascending and numbering them
  sequentially. Joins to the matching `root-summaries.jsonl` row.
- `publicActionRef` — `public_action_NNN`, derived from the zero-based
  sorted bucket ordinal within the root (not from raw move IDs).
- `publicActionKeyHash` — full SHA-256 hex digest of the safe public bucket
  key.
- `publicActionOrdinal` — zero-based sorted bucket ordinal.
- `publicActionKind`, `actionPhase`, `actionRound`, `sourceClass`,
  `moveCount`, `collisionCountWithinBucket` (`moveCount - 1`, floored at 0).
- `targetKind`, `targetSide` (omitted when `"none"`), `targetRow`,
  `strengthBucket`, `optionIndexLabel` (all omitted when not applicable).

### Root summary row (`root-summaries.jsonl`)

Each row extends the cFp69 root identity (suite id, matchup id, seed,
mirror group/index, step, decision index, phase, round, seat id, policy id,
faction, deck preset id, root public fingerprint) with:

- `rootRef` — the same join key used by `action-identities.jsonl` rows for
  this root.
- `identityRunId`, `identityReadinessStatus`, `cFp69ProbeStatus`,
  `sourceConsistencyStatus`.
- `legalMoveCount`, `publicActionCount`, `publicActionCollisionCount`,
  `largestPublicActionBucketSize`, `observedActionIdentityRowCount`.
- `cfp69PublicActionCount`, `cfp69LegalMoveCount`, `publicActionCountDelta`,
  `legalMoveCountDelta`.
- public action kind counts, target kind counts, target side counts, and
  bucket size class counts for this root.

### Skipped root row (`skipped-roots.jsonl`)

Carries the cFp68/cFp69 skipped-root identity and classification fields
(`skipReason`, phase/round/policy/faction splits, provenance label),
matching the existing cFp68/cFp69/cFp76 skip accounting style.

---

## cFp77 Source Consistency

`buildPublicActionIdentitiesV0SourceConsistency` computes 27 checks,
including:

- cFp68 eligible/skipped root counts vs. actual `eligible-roots.jsonl` /
  `skipped-roots.jsonl` row counts (deltas);
- cFp69 probe/skipped root counts vs. actual `probe-roots.jsonl` /
  `skipped-roots.jsonl` row counts (deltas);
- cFp76 root feature row count vs. actual cFp76 row count, and confirmation
  that cFp76 readiness is `action_feature_source_gap` with 0 action feature
  rows and a positive action-feature-gap row count;
- observed root count vs. cFp68 eligible root count, with 0 roots missing in
  either direction;
- observed root count vs. cFp69 probe root count, with 0 roots missing in
  either direction;
- 0 duplicate observed/cFp68 eligible/cFp69 probe/cFp69 skipped root keys;
- 0 roots with a public action count or legal move count mismatch against
  cFp69;
- action identity row count equals `cfp69PublicActionCountTotal` with delta
  0;
- 0 duplicate action identity keys;
- 0 skipped root key mismatches between cFp68 and cFp69;
- source artifact reference count 15 with 0 empty hashes, including the
  cFp76 root-feature row artifact used for actual-row-count validation.

All 27 checks are `true`/0 for both suites, so `sourceConsistency.status` is
`ready` and `identityReadinessStatus` is `identity_ready`.

---

## rootRef Compaction Redesign

The spec's action identity row schema lists the full cFp69 root identity
(suite id, matchup id, seed, mirror group/index, step, decision index,
phase, round, seat id, policy id, faction, deck preset id, root public
fingerprint, plus `schemaVersion`/`identityRunId`) as fields on every action
identity row. A first implementation followed this literally and produced a
robust `action-identities.jsonl` of 169,049,225 bytes — over the spec's 90
MB hard stop, which requires redesign with "a smaller safe projection or
deterministic casebook subset" before commit.

cFp77 redesigned the row shape to drop the repeated root-identity fields
from `action-identities.jsonl` and replace them with a single compact
`rootRef` (`root_NNNNNN`) join key into `root-summaries.jsonl`, which already
carries one row per eligible root with the full root identity. The redesign
also:

- drops the derivable `actionFamily` and `bucketSizeClass` per-row fields
  (both remain computable via `actionFamilyFor`/`bucketSizeClassFor` for the
  `summary.json` count summaries, which still report action family and
  bucket size class totals); and
- omits `targetKind`/`targetSide` from a row entirely when the value is
  `"none"`, instead of writing the literal string.

This is a deviation from the literal per-row schema in
`docs/spec/2026-06-15-cFp77-specs.md`, but it is the exact mitigation the
spec anticipates for an over-budget artifact, and it preserves every safe
field's information: any consumer can recover the full root identity for an
action identity row via `rootRef` → `root-summaries.jsonl`, and recover
`actionFamily`/`bucketSizeClass` via the documented pure functions. The
redesign reduced the robust `action-identities.jsonl` from 169,049,225 bytes
to 54,892,627 bytes (~54.89 MB) — below the 90 MB hard stop, though still
above the 50 MB soft target, which is why `cFp78Recommendation` is the
"compact further or build a casebook subset" (`CFP78_RECOMMENDATION_SIZE`)
text rather than the "join cFp76 to cFp77" (`CFP78_RECOMMENDATION_JOIN`)
text.

---

## Hidden-Info Safety

The hidden-info scanner (`scanPublicActionIdentitiesV0ArtifactsForHiddenInfo`)
checks `manifest.json`, `summary.json`, `action-identities.jsonl`,
`root-summaries.jsonl`, and `skipped-roots.jsonl` (not `report.md`, which may
contain prose card/leader names) against a hazard token list covering: a
private card-state lookup map; a final match-state payload; command and
event logs; the player's own and opponent's hand arrays; unsafe debug and
decision-trace payloads; raw move, action-reference, and label identifiers;
card-instance and card/source identifier fields; deck order; sampled
hand/deck/world payloads; hidden hand/deck payloads; hand and deck source
count fields; and search-strength fields covering best/selected-action
labels, action and expected-value estimates, reward targets, payoff
tables/matrices, rollout rewards, win-probability estimates, and
principal-variation lines. It also checks for colon-suffixed seat-instance
runtime prefixes (seat A / seat B forms), and for catalog card/leader names
and source IDs derived from the current catalog.

Both the current and robust artifact sets scan clean (`hiddenInfoScanStatus:
"clean"`, 0 hazards). The decision note above avoids writing the literal
hazard substrings; references to disallowed fields use prose or backtick
identifiers that do not match the word-boundary hazard patterns (e.g. "raw
move identifiers" rather than the literal token).

The direct exact-token `rg --pcre2` scan over both cFp77 artifact
directories, this decision note, and the cFp77 report returns no matches.

---

## cFp77 Budgets And Size Results

- Robust `action-identities.jsonl`: 54,892,627 bytes (~54.89 MB) — below the
  90 MB hard stop, above the 50 MB robust target.
- Robust `root-summaries.jsonl`: 40,930,740 bytes (~40.93 MB) — below the
  90 MB hard stop.
- Robust `skipped-roots.jsonl`: 566,578 bytes.
- Current artifacts: `action-identities.jsonl` 6,704,468 bytes,
  `root-summaries.jsonl` 4,948,087 bytes, `skipped-roots.jsonl` 103,383
  bytes — all comfortably under target.
- Because `action-identities.jsonl` is at or above the 50 MB target for the
  robust suite, `cFp78Recommendation` is `CFP78_RECOMMENDATION_SIZE`:
  cFp78 should compact the cFp77 action row projection or create a
  deterministic casebook subset before consumer work.

---

## Non-Claims

cFp77 `public-action-identity-artifact-v0` explicitly does NOT:

- Choose actions or recommend best actions.
- Rank actions or compute action ordering.
- Estimate action values or expected values.
- Estimate win probability or reward targets.
- Compute payoff tables or principal variations.
- Run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- Execute candidate actions, rebuild sampled states, or materialize hidden
  worlds.
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

cFp77's source consistency is `ready` and action identity rows are complete
for both suites (`identityReadinessStatus: identity_ready`). Per the spec's
"Expected cFp78 Decision Logic": because the robust
`action-identities.jsonl` (54.89 MB) is at or above the 50 MB robust target
(though below the 90 MB hard stop), cFp78 should compact the cFp77 action
row projection — for example, by further narrowing per-row fields, sharing
more counts via `root-summaries.jsonl`, or producing a deterministic
casebook subset — before joining cFp76 root features to cFp77 public-action
identities to populate `action-features.jsonl`.

cFp78 should not recommend rollout, value estimation, action ranking,
best-action selection, win probability, or reward targets from cFp77 alone.

---

*End of cFp77 decision note.*
