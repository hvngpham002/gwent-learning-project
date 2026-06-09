# cFp70 Sampled-World Action Availability Probe

Date: 2026-06-09

## Decision

cFp70 adds a benchmark-only sampled-world action availability probe under:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/`

The probe uses cFp68 eligible/skipped contract artifacts and cFp69
public-action scaffold artifacts as the source contract. It regenerates cFp61
hidden multiset samples in memory, rebuilds sampled legal-action surfaces in
memory, collapses those surfaces through the existing public action
abstraction, and writes only scalar/public-bucket availability artifacts.

## Results

Current starter matrix:

- 3,979 availability roots.
- 63 skipped roots.
- 1.559% skipped.
- 31,832 requested/generated/checked samples.
- 0 failed samples.
- 0 availability disagreements.
- 3,979 roots in risk bucket `none`.

Robust starter matrix:

- 32,147 availability roots.
- 340 skipped roots.
- 1.047% skipped.
- 257,176 requested/generated/checked samples.
- 0 failed samples.
- 0 availability disagreements.
- 32,147 roots in risk bucket `none`.

Both suites are source-consistency probe-ready. The cFp68/cFp69 eligible and
skipped populations match, benchmark roots are observed, skipped roots are not
probed, duplicate root keys are 0, and public action counts match the cFp69
scaffold.

## Non-Claims

cFp70 is not search gameplay. It does not run rollouts, compute action values,
rank actions, choose moves, make strength claims, alter product AI behavior,
change engine rules, change legal move generation, or change benchmark suite
definitions.

## Hidden-Info Boundary

The committed cFp70 artifacts contain public benchmark root metadata, scalar
sample availability counts, public action bucket aggregates, skipped-root
accounting, source artifact hashes, and deterministic reports only. The
regenerated hidden samples are used only in memory and are not serialized.

The artifact serializer scanner and direct exact-token scan passed for both
cFp70 artifact directories, this note, and the cFp70 audit report.

## cFp71 Recommendation

Because cFp70 found zero availability disagreement and zero rebuild/sample
failures in both suites, cFp71 may proceed to a benchmark-only one-ply public
action outcome skeleton over the same cFp68/cFp69 population. It should still
avoid rollout, value, ranking, move recommendation, product AI wiring, and
strength claims. If later evidence contradicts the zero-disagreement result,
cFp71 should pivot to a disagreement casebook instead.
