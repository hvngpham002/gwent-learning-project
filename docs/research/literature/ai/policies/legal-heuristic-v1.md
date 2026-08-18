# Legal Heuristic v1

Date: 2026-05-22

## Purpose

`legal-heuristic-v1` is the first strategic hand-authored AI baseline
above `legal-heuristic-v0`. It is deterministic, hidden-info safe, and
available for product playtesting as of cFp24.1. It is not an ML agent,
search policy, faction specialist, rating system, or product difficulty
tier.

The product Human vs AI flow still defaults to `legal-heuristic-v0`.
Human testers can select `legal-heuristic-v1` from the pre-game `AI
policy` selector or deep-link it with `?ai=legal-heuristic-v1` on `/` or
`/match`. Invalid `ai` query values fall back to v0, and
`legal-first-v0` remains benchmark-only.

## Current State

The policy ID remains `legal-heuristic-v1`. The latest behavior implementation
phase is cFp53: Round-One Overinvestment Selected-Play Guard Repair. The latest
reproduction/debug phase is cFp52: Round-One Guard Fixture Reproduction Debug.
The latest analysis phase is cFp56: Temporal Round-One Overinvestment
Casebook. The latest rating-ledger phase is cFp57: Multi-Period Rating Ledger.
The latest sampler public-transfer memory phase is cFp66: Sampler
Public-Transfer Memory.
The latest post-cFp66 invalid-root casebook phase is cFp67: Post-cFp66
Invalid-Root Casebook.
The latest valid-root-only determinized probe contract phase is cFp68:
Valid-Root-Only Determinized Probe Contract.
The latest determinized-pimc-probe-v0 scaffold phase is cFp69:
Determinized PIMC Probe v0 Sanity.
The latest sampled-world action availability phase is cFp70:
Sampled-World Action Availability Probe v0.
The latest one-ply public action outcome skeleton phase is cFp71:
One-Ply Public Action Outcome Skeleton.
The latest post-one-ply branching budget phase is cFp72:
Post-One-Ply Branching Budget Probe v0.
The latest post-one-ply branching budget casebook phase is cFp73:
Post-One-Ply Branching Budget Casebook.
The latest bounded second-ply public-action scaffold phase is cFp74:
Bounded Second-Ply Public-Action Scaffold v0.
The latest sampler public-zone accounting phase is cFp65: Sampler Public-Zone
Accounting Repair Probe. The latest sampler public-zone provenance phase is
cFp64: Sampler Public-Zone Provenance Casebook. The latest sampler public-count
repair phase is cFp63: Sampler Public-Count Repair. The latest sampler
invalid-root casebook phase is cFp62: Sampler
Invalid-Root Casebook.
The latest sampler-materialization phase is cFp61: Hidden-Multiset
Materialization Sampler. The latest sampler-readiness phase is cFp60:
Known-Preset Sampler Contract And Public Action Abstraction. The latest
search-readiness profiler phase is cFp59:
Search-Readiness Root Profiler. The latest instrumentation phase is cFp55:
Round-One Temporal Spend Instrumentation. cFp60 adds benchmark-only
`known_preset_decklist_prior`, sampled-world validation summaries, hidden-info-safe
public action abstraction, and deterministic sampler-readiness artifacts without
changing `legal-heuristic-v1` gameplay, search behavior, engine rules, legal moves,
or product difficulty. cFp61 materializes hidden opponent hand/deck
source-multiset samples in memory from the cFp60 known preset prior and writes
aggregate-only sampler-materialization artifacts with no sampled identities.
cFp62 reruns that materialization path for invalid roots only, writes
scalar-only invalid-root casebook artifacts, and classifies all 404 current and
robust invalid roots as `public_zone_count_deficit`. cFp63 repairs
public-known duplicate-card accounting defensively and adds scalar
duplicate-reference diagnostics; both current and robust suites report zero
duplicate public references and zero duplicate fixed-known-hand references, so
the same 404 strict invalid roots remain.
cFp64 labels those 404 roots in a scalar-only public-zone provenance casebook:
current has 42 mixed public-zone, 6 round-end, 6 board-only, and 9 discard-only
roots; robust has 230 mixed public-zone, 28 round-end, 54 board-only, and 29
discard-only roots. No cFp64 root is ambiguous or zero-zone, duplicate
public/fixed-known-hand references remain zero. cFp65 makes that public-zone
accounting explicit by separating main-deck-attributable, side-deck-only, and
off-prior public cards with scalar diagnostics, keeps strict conservation, and
keeps unresolved roots invalid when no public-only adjustment covers the
deficit.
cFp66 adds benchmark-only, perspective-specific public-transfer memory. It
tracks only cards already public or prompt-revealed to the perspective seat and
later moved into hidden opponent hand/deck zones, accounts for those known
hidden cards in cFp61 materialization, and serializes only scalar diagnostics.
Current counts remain 3,979 valid / 63 invalid roots; robust improves from
32,146 valid / 341 invalid to 32,147 valid / 340 invalid. Remaining cFp62
invalid roots still classify as `public_zone_count_deficit`.
cFp67 reads the committed post-cFp66 cFp61/cFp62/cFp64 artifacts and writes a
scalar-only invalid-root decision casebook. Current has 4,042 total roots,
3,979 valid, 63 invalid, and 1.559% invalid; robust has 32,487 total roots,
32,147 valid, 340 invalid, and 1.047% invalid. Every remaining invalid root is
classified exactly once as `candidate_valid_root_only_skip`; there are 0
`candidate_deeper_reconstruction` and 0 `classification_unavailable` roots.
All remaining invalid roots are `public_transfer_memory_not_applicable` and
`persistent_public_zone_count_deficit`; current has 63 one-card deficits, while
robust has 339 one-card and 1 multi-card deficit. cFp67 recommends cFp68
proceed only with valid roots and explicit skip counters.
cFp68 reads committed cFp61 sampler-materialization roots and cFp67 invalid-root
casebook records, then writes deterministic contract artifacts under
`determinized-probe-contract/cFp68/`. Current has 3,979 eligible valid roots,
63 skipped invalid roots, and 1.559% skipped; robust has 32,147 eligible valid
roots, 340 skipped invalid roots, and 1.047% skipped. Both suites are
probe-ready: every cFp61 root maps to exactly one eligible or skipped record,
every invalid root has a matching cFp67 skip record, no cFp67 records are extra,
and duplicate root keys are 0. The eligible determinization budget is 31,832
requested/valid samples for current and 257,176 requested/valid samples for
robust, all at 8 samples per eligible root. All skipped roots use
`sampler_invalid_public_zone_count_deficit`.
cFp69 consumes the cFp68 eligible and skipped contract artifacts, re-observes
the matching benchmark roots, filters probe work to eligible roots only, and
writes deterministic `determinized-pimc-probe-v0/cFp69/` artifacts. Current has
3,979 probe roots, 63 skipped roots, and 1.559% skipped; robust has 32,147
probe roots, 340 skipped roots, and 1.047% skipped. Sample budgets match cFp68:
31,832 requested/consumed/valid samples for current and 257,176 for robust,
with 0 invalid samples. The public-action scaffold records legal move, public
action, collision, and largest-bucket scalar stats only. It does not run
rollouts, compute action values, rank actions, choose moves, make strength
claims, or change product AI behavior.
cFp70 consumes the cFp68 eligible/skipped contract artifacts and cFp69
public-action scaffold artifacts, regenerates cFp61 hidden multiset samples in
memory, rebuilds sampled legal-action surfaces, and writes deterministic
`determinized-pimc-action-availability-v0/cFp70/` artifacts. Current has 3,979
availability roots, 63 skipped roots, and 1.559% skipped; robust has 32,147
availability roots, 340 skipped roots, and 1.047% skipped. Sample budgets match
cFp68/cFp69: 31,832 requested/generated/checked samples for current and 257,176
for robust, with 0 failed samples and 0 availability disagreements in both
suites. It does not run rollouts, compute action values, rank actions, choose
moves, make strength claims, or change product AI behavior.
cFp71 consumes cFp68/cFp69/cFp70 artifacts, regenerates the same in-memory
samples through the cFp70 sampled-root rebuild path, executes deterministic
representative public buckets only on cloned sampled roots, and writes
deterministic `determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/` artifacts.
Current has 3,979 outcome roots, 63 skipped roots, 31,832 checked samples,
150,560 completed public action/sample pairs, 0 failed or deferred pairs, and 0
public outcome divergence roots. Robust has 32,147 outcome roots, 340 skipped
roots, 257,176 checked samples, 1,230,736 completed public action/sample pairs,
0 failed or deferred pairs, and 0 public outcome divergence roots. It does not
run rollouts, compute action values, rank actions, choose moves, estimate win
probability, make strength claims, or change product AI behavior.
cFp72 consumes cFp68/cFp69/cFp70/cFp71 artifacts, regenerates the same
in-memory samples through the cFp70 sampled-root rebuild path, executes only the
first-ply representative sampled public bucket on cloned sampled roots, and
writes deterministic
`determinized-pimc-post-one-ply-branching-budget-v0/cFp72/` artifacts. Current
has 3,979 branching roots, 63 skipped roots, 31,832 checked samples, 150,560
completed first-ply public action/sample pairs, 0 failed or deferred pairs, and
an average post-one-ply public action budget of 5.735. Robust has 32,147
branching roots, 340 skipped roots, 257,176 checked samples, 1,230,736 completed
first-ply public action/sample pairs, 0 failed or deferred pairs, and an average
post-one-ply public action budget of 5.765. It counts only the next legal/public
action surface after first-ply execution and does not run rollouts, compute
action values, rank actions, choose moves, estimate win probability, make
strength claims, or change product AI behavior.
cFp73 reads only the committed cFp72 scalar artifacts and writes deterministic
`determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/` artifacts.
Current has 1,291 casebook roots, 63 skipped roots, and 32.445% casebook share
of branching roots. Robust has 10,721 casebook roots, 340 skipped roots, and
33.350% casebook share. Both suites are casebook-ready with 0 status anomalies,
0 very-large/extreme bucket roots, 0 duplicate keys, and 0 source count
mismatches. Robust pressure labels are 2,073 high-threshold, 1,939 large, and
6,709 transition-context-only moderate rows. cFp73 recommends a bounded
benchmark-only second-ply public-action scaffold with explicit budget caps and
skipped-over-budget counters. It does not re-run root observation, rebuild
samples, execute a second ply, run rollouts, compute action values, rank
actions, choose moves, make strength claims, expose an AI Lab runner, or change
product AI behavior.
cFp74 consumes cFp68/cFp69/cFp70/cFp71/cFp72/cFp73 scalar artifacts, reuses the
established sampled-root materialization path, and writes deterministic
`determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/` artifacts. Current
has 3,593 in-cap roots, 386 over-budget roots, 63 inherited skipped roots,
628,847 completed second-ply representative public-action pairs, 0 failed or
deferred pairs, and a compact 7.169 MB second-ply root JSONL. Robust has 28,915
in-cap roots, 3,232 over-budget roots, 340 inherited skipped roots, 5,101,445
completed second-ply representative public-action pairs, 0 failed or deferred
pairs, and a compact 58.288 MB second-ply root JSONL. cFp74 Repair 1 primes
public-transfer memory for eligible over-budget roots without recording them as
observed roots; Repair 2 compacts only the artifact row projection. It does not
count third-ply legal surfaces, run rollouts, compute action values, rank
actions, choose moves, make strength claims, expose an AI Lab runner, or change
product AI behavior.
cFp59 adds benchmark-only hidden-info-safe root-profiler artifacts and AI Lab
metadata. cFp60 adds `known_preset_decklist_prior`, sampled-world validation,
and public action abstraction as sampler-readiness infrastructure only. cFp61 is
sampler-materialization infrastructure only. cFp62 is invalid-root casebook
infrastructure only. cFp63 is sampler repair infrastructure only. cFp66 is
sampler public-transfer memory infrastructure only. cFp67 is post-cFp66
invalid-root casebook infrastructure only. cFp68 is valid-root-only determinized
  probe contract infrastructure only. cFp69 is public-action probe scaffold
infrastructure only. cFp70 is sampled-world action availability infrastructure
only. cFp71 is one-ply outcome skeleton infrastructure only. cFp72 is
post-one-ply branching budget infrastructure only. cFp73 is post-one-ply
branching budget casebook infrastructure only. cFp74 is bounded second-ply
public-action scaffold infrastructure only. cFp75 is search-consumer
contract planning infrastructure only. cFp76 is a read-only
search-consumer-action-features-v0 feature consumer over committed
cFp68-cFp74 artifacts, reporting `action_feature_source_gap` infrastructure
only. cFp77 is a read-only public-action-identity-artifact-v0 derivation over
committed cFp68/cFp69/cFp76 artifacts, emitting per-bucket action identity
rows, root summary rows, and skipped-root rows from the existing safe public
action abstraction, infrastructure only. cFp78 is a read-only
public-action-identities-compact-v0 compact projection over committed cFp77
artifacts, emitting slim compact action rows, compact root-index join rows,
and forwarded skipped-root rows without re-observing benchmark roots or
executing candidate actions, infrastructure only. cFp79 is a read-only
search-consumer-action-features-v1 join over committed cFp76 and cFp78
artifacts, emitting normalized root-feature rows and populated action-feature
rows as infrastructure only; robust action features are below the 90 MB hard
stop but above the 50 MB soft target. cFp80 is a read-only
search-consumer-action-features-dictionary-v0 projection over committed cFp79
artifacts, preserving cFp79 row counts, proving 0 reconstruction mismatches,
and reducing robust compact actions to 46,044,793 bytes as infrastructure only.
cFp81 is a read-only search-consumer-action-feature-casebook-v0 aggregate over
committed cFp80 compact artifacts, emitting bounded casebook rows, slice
summaries, skipped-root context, and consumer-readiness labels as
infrastructure only.
cFp82 is a docs/metadata-only search-consumer casebook decision phase over
committed cFp81 evidence. It recommends cFp83
`search-consumer-small-subset-contract-v0` because cFp81 has a usable ordinary
ready slice but the broader robust surface is dominated by high-branching and
high-collision pressure. It creates no runner or artifact family and remains
infrastructure only.
cFp59, cFp60,
cFp61, cFp62, cFp63, cFp64, cFp65, cFp66, cFp67, cFp68, cFp69, cFp70, and
cFp71, cFp72, cFp73, cFp74, cFp75, cFp76, cFp77, cFp78, cFp79, cFp80, cFp81, and cFp82 do not change
`legal-heuristic-v1`
gameplay, search behavior, engine rules, legal moves, or product difficulty.
cFp53 repairs the selected-play
path that cFp52 proved: when the exact selected `play_card` has cFp43 base
geometry and `roundOneOverinvestmentRecommended === true`, the final
playing-phase decision is converted to pass unless an existing tactical
exception applies. cFp54 classifies the 70 remaining cFp53 robust
`round_one_overinvestment` findings as 48 already-guarded suppressed-pass rows,
20 board-floor misses, 1 hand-cap miss, 1 base-geometry exception/non-
recommendation row, and 0 cumulative-spend candidates under the required
bucket precedence. cFp52 replays only the two cFp51 robust
`guard_recommended_play_selected` fixtures and preserves those before-fix
artifacts as historical evidence. cFp51 reads the cFp50 scalar telemetry from
committed public failure-mining artifacts, classifies robust
`round_one_overinvestment` findings, and recommends cFp52 reproduce/debug the
two guard-recommended play cases before any behavior patch.
cFp50 adds hidden-info-safe scalar cFp43 guard-state counts to existing
`round_one_overinvestment` failure-mining findings and regenerates the current,
expanded, and robust failure-mining artifacts without changing policy behavior.
cFp55 extends those same `round_one_overinvestment` findings with scalar
temporal/cumulative fields: first play/board-floor/hand-cap/suppressed-pass
indexes, first suppressed-pass context, first-event gaps, continue-play and
post-geometry spend counts, score-delta sequence counts, and exception sequence
counts before the first suppressed pass.
cFp56 classifies the 70 cFp55 robust rows into 48 late-guard-intervention rows,
21 no-suppressed-pass cumulative candidates with selected base geometry absent,
and 1 no-suppressed-pass selected-base-geometry-present debug candidate. It
recommends pausing hand-tuned v1 round-one heuristic tuning rather than writing
a cFp57 behavior patch from broad late/missing-geometry/catch-up-heavy
evidence.
cFp57 freezes the current committed `ratings/latest` artifacts as named
`cFp57` snapshots for the current, expanded, and robust starter suites, compares
them against the established cFp46/cFp48 baselines, and verifies that each
`cFp57` snapshot matches current `latest`. This is rating-ledger infrastructure
only and does not change policy behavior.
cFp58 records search-readiness and ISMCTS probe design guardrails as research
planning only. cFp59 implements the recommended benchmark-only profiler by
emitting public root scalar/count artifacts for the current and robust starter
matrix suites. cFp60 adds `known_preset_decklist_prior`, sampled-world validation
summaries, and public action abstraction for the current and robust starter
matrix suites. cFp61 adds the first real in-memory hidden opponent source-multiset
materializer for those same suites and writes aggregate-only proof artifacts.
cFp62 adds scalar-only invalid-root evidence for the remaining cFp61 invalid
roots and recommends a narrow sampler-public-count repair before search. cFp63
implements that duplicate-reference repair path and shows the invalid-root
family is not explained by duplicate public references. cFp66 public-transfer
memory repairs one robust root but leaves current unchanged. cFp67 classifies
the remaining 63 current and 340 robust invalid roots as valid-root-only skip
candidates and requires explicit skip counters before any probe result is
reported. cFp68 implements that skip-accounting contract without running a
probe: future probes can consume eligible roots while also reading skipped-root
counts and percentages. cFp69 implements the first benchmark-only
determinized-pimc-probe-v0 scaffold over those eligible roots, carrying skipped
roots into cFp69 skip accounting and emitting public-action scalar counts only.
cFp70 implements a benchmark-only sampled-world action availability probe over
the same roots, carrying skipped roots forward and reporting zero availability
disagreements in both current and robust suites.
cFp71 implements a benchmark-only one-ply public action outcome skeleton over
the same roots, carrying skipped roots forward and reporting zero failed or
deferred pairs plus zero public outcome divergence roots in both current and
robust suites.
cFp72 implements a benchmark-only post-one-ply branching budget probe over the
same roots, carrying skipped roots forward and reporting 150,560 current and
1,230,736 robust completed first-ply pairs, 0 failed/deferred pairs, and
post-one-ply public action budget averages of 5.735 current and 5.765 robust.
cFp59, cFp60, cFp61, cFp62, cFp63, cFp64, cFp65,
cFp66, cFp67, cFp68, cFp69, cFp70, cFp71, and cFp72
are evaluation infrastructure only and do not make search available in product
play.
The latest suite infrastructure phase is cFp48: Robust Starter Matrix
Evaluation Suite, which adds a 25-seed / 1000-record starter matrix, robust
failure-mining artifacts, robust Glicko ratings, a suite-local `cFp48`
snapshot, and a deterministic `cFp48-vs-latest` comparison boundary. cFp47
freezes cFp46 rating artifacts as named `cFp46` snapshots, adds `ledger.json`
per suite, and generates deterministic `cFp46-vs-latest` comparison artifacts
with delta/signal computation. cFp57 extends the ledger across all three current
starter suites with `cFp46-vs-cFp57`, `cFp48-vs-cFp57`, and `cFp57-vs-latest`
comparison artifacts. cFp46 added deterministic rating/RD reports over
existing public benchmark records. The latest committed benchmark record,
round-one guard debug, and ratings/latest artifact refresh remains cFp53. The
latest committed failure-mining artifact refresh is cFp55. The policy and
diagnostics stack builds on the cFp27 through cFp56 chain:

- cFp27: linked-card mulligan diagnostics and conservative low-standalone
  redraw scoring.
- cFp28: hand-quality pass calibration.
- cFp29: Medic timing calibration.
- cFp30: weather-aware non-hero unit placement.
- cFp31: round-investment and future-hand preservation.
- cFp32: stop-loss round sacrifice for non-elimination rounds.
- cFp33: Scoia'tael first-turn choice strategy.
- cFp34: automated failure-mining evaluation infrastructure.
- cFp35: failure-mining calibration and tuning queue.
- cFp36: round resource exhaustion budget gate with diagnostics.
- cFp37: pass-decision alignment — narrows the cFp36 resource gate so it only
  allows pass when round-investment recommends preserve or sacrifice, blocking
  it when recommendation is continue, fight_last_gem, or single-move catch-up.
- cFp38: weathered-row low-tempo scoring penalty — penalizes spending printed
  strength ≥ 6 into own weathered rows where effective strength ≤ 3 when a
  clearly better legal line exists. Tactical exceptions: Spy, strong Medic,
  Muster/linked callers, match-winning plays, last-gem catch-up, no-better-line.
  Repair 1: tightened unit-kind guard to `card.kind === "unit"`, fixed
  `betterNonWeatheredAlternativeAvailable` to be independent of exemption status,
  corrected reason strings to distinguish "penalty applied — still best" from
  "no better visible line".
- cFp39: Medic no-target timing guard — -260 delay penalty for no-target Medic
  plays when a useful non-Medic line exists. Six tactical exceptions preserve
  emergency Medic plays. Three new trace booleans. Medic score adjustment in
  round-investment analysis prevents timing penalty from distorting non-Medic
  decisions.
- cFp43: round-one overinvestment guard for round-1 selected plays that reach
  the board and hand thresholds, with Spy/card-advantage, last-gem,
  opponent-passed, match-winning, cheap catch-up, use-leader/non-play-card, and
  single-card-hand exceptions.
- cFp53: final selected-play guard repair so all playing-phase `play_card`
  return paths honor the existing cFp43 recommendation for the exact selected
  candidate.
- cFp54: analysis-only post-cFp53 casebook over the 70 remaining robust
  `round_one_overinvestment` findings; recommends instrumentation/debug rather
  than behavior from aggregate counts alone.
- cFp55: instrumentation/debug-only temporal and cumulative round-one spend
  fields in failure-mining evidence.
- cFp56: analysis-only temporal casebook over the 70 cFp55 robust
  `round_one_overinvestment` findings; recommends pausing v1 round-one tuning
  for ratings/search/evaluation-ladder depth rather than changing behavior.
- cFp57: evaluation-only rating ledger update; freezes current `ratings/latest`
  as `cFp57` snapshots, compares against cFp46/cFp48 baselines, and confirms
  `cFp57-vs-latest` consistency without changing policy behavior.
- cFp59: evaluation-only search-readiness root profiler; writes public
   scalar/count artifacts for benchmark roots and does not add search gameplay.
- cFp60: evaluation-only sampler-readiness infrastructure; adds
   `known_preset_decklist_prior`, sampled-world validation summaries, hidden-info-safe
   public action abstraction, and deterministic sampler-readiness artifacts for starter
   (4,042 roots) and robust (32,487 roots) suites without changing policy behavior.
- cFp61: evaluation-only sampler-materialization infrastructure; adds real
  in-memory hidden opponent hand/deck source-multiset sampling from the cFp60
  opponent-seat known preset prior and aggregate-only artifacts for starter
  (4,042 roots) and robust (32,487 roots) suites. Valid roots report 8
  requested, 8 generated, 8 valid, and 0 invalid samples; safe invalid roots
  report `insufficient_prior_remaining` with zero generated samples.
- cFp62: evaluation-only sampler invalid-root casebook; reruns the cFp61
  materialization path and writes scalar/count-only artifacts for starter
  (63 invalid roots) and robust (341 invalid roots) suites. All 404 invalid
  roots classify as `public_zone_count_deficit`, with no prompt-reveal,
  raw-hidden, excess-prior, public-overcopy, or incoherent-count cases.
- cFp63: evaluation-only sampler public-count repair; counts each public
  runtime card instance at most once in public-known subtraction, counts
  prompt-revealed opponent hand cards at most once as fixed known hand, and
  adds scalar duplicate-reference diagnostics to the regenerated cFp61/cFp62
  artifacts. Duplicate public and fixed-known-hand references are both 0 across
  current and robust suites, so all 404 invalid roots remain
  `public_zone_count_deficit`. cFp64 should add a scalar public-zone provenance
  casebook before search.
- cFp64: evaluation-only sampler public-zone provenance casebook; writes
  scalar/count-only artifacts for starter (63 roots) and robust (341 roots)
  suites under `sampler-public-zone-provenance/cFp64/`. Every cFp62
  `public_zone_count_deficit` root appears exactly once and receives exactly
  one provenance label. Current labels are mixed 42, round-end 6, board-only 6,
  and discard-only 9; robust labels are mixed 230, round-end 28, board-only 54,
  and discard-only 29. No ambiguous or zero-zone rows appear, duplicate
  reference totals remain 0, and the recommended next step is a narrow cFp65
  sampler accounting repair before search.
- cFp65: evaluation-only sampler public-zone accounting repair probe; records
  explicit scalar main-deck-attributable, side-deck-only, off-prior public, and
  uncovered-deficit counts in regenerated cFp61/cFp62/cFp64 sampler artifacts.
  It does not inspect hidden opponent hand/deck identities, add placeholders,
  weaken conservation, or make search gameplay available. If public-only
  accounting cannot cover remaining deficits, the roots remain invalid and the
  next prerequisite is event-history/public-transfer memory before search.
- cFp66: evaluation-only sampler public-transfer memory; adds
  perspective-specific benchmark memory for cards that were public or
  prompt-revealed to the seat and later moved into hidden opponent hand/deck
  zones. Current remains 3,979 valid / 63 invalid; robust improves to 32,147
  valid / 340 invalid. The remaining invalid roots still classify as
  `public_zone_count_deficit`, so a future spec must explicitly choose
  valid-root-only skip accounting or deeper public-state reconstruction before
  any determinized probe.
- cFp67: evaluation-only post-cFp66 invalid-root decision casebook; reads
  committed cFp61/cFp62/cFp64 artifacts and writes scalar-only cFp67 casebook
  artifacts for current and robust suites. Current has 63 invalid roots
  (1.559%) and robust has 340 invalid roots (1.047%). Every remaining invalid
  root is classified exactly once as `candidate_valid_root_only_skip`, with no
  deeper-reconstruction or unavailable classifications. cFp68 should proceed
  only with valid roots and explicit skip counters.
- cFp68: evaluation-only valid-root-only determinized probe contract; reads
  committed cFp61 sampler-materialization roots and cFp67 invalid-root casebook
  records, then writes deterministic contract artifacts for current and robust
  suites. Current has 3,979 eligible / 63 skipped roots; robust has 32,147
  eligible / 340 skipped roots. Skip counters cover suite, phase, round,
  matchup, policy, faction, deck preset, provenance label, invalid reason, and
  skip reason. cFp68 does not run search or change policy behavior.
- cFp69: evaluation-only determinized-pimc-probe-v0 sanity scaffold; consumes
  cFp68 eligible/skipped artifacts, re-observes benchmark roots, emits one
  probe record per eligible root, and carries skipped roots into cFp69 skip
  accounting. Current has 3,979 probe / 63 skipped roots; robust has 32,147
  probe / 340 skipped roots. cFp69 records only zero/one-ply public-action
  scaffold counts and does not run rollouts, rank actions, choose moves, make
  strength claims, or change policy behavior.
- cFp70: evaluation-only sampled-world action availability probe; consumes
  cFp68 eligible/skipped artifacts and cFp69 public-action scaffold artifacts,
  regenerates cFp61 hidden multiset samples in memory, and emits scalar/public
  bucket availability artifacts. Current has 3,979 availability / 63 skipped
  roots; robust has 32,147 availability / 340 skipped roots. Both suites have
  0 failed samples and 0 availability disagreements. cFp70 does not run
  rollouts, rank actions, choose moves, make strength claims, or change policy
  behavior.
- cFp72: evaluation-only post-one-ply branching budget probe; consumes
  cFp68/cFp69/cFp70/cFp71 artifacts, regenerates samples in memory through the
  cFp70 rebuild path, executes only the first-ply representative public bucket
  on cloned sampled roots, then counts the next legal/public action surface.
  Current has 3,979 branching / 63 skipped roots and 150,560 completed
  first-ply pairs; robust has 32,147 branching / 340 skipped roots and
  1,230,736 completed first-ply pairs. Both suites have 0 failed/deferred pairs.
  cFp72 does not run rollouts, rank actions, choose moves, make strength claims,
  or change policy behavior.
- cFp73: evaluation-only post-one-ply branching budget casebook; reads
  committed cFp72 scalar artifacts and emits selected scalar casebook rows plus
  skipped-root scalar rows. Current has 1,291 casebook / 63 skipped rows; robust
  has 10,721 casebook / 340 skipped rows. Both suites are casebook-ready with
  0 status anomalies and 0 very-large/extreme bucket roots. cFp73 recommends a
  bounded benchmark-only second-ply public-action scaffold with explicit caps
  and skipped-over-budget counters, not product AI wiring or a search policy.

Current cFp55 artifact totals, unchanged in finding counts from cFp53/cFp54:

- `benchmark-v1-smoke-v1`: 11 win / 1 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 102 win / 17 loss / 1 draw vs v0.
- Current 120-record failure mining: 300 findings (`suspicious_pass=234`,
  `round_three_low_resource=36`, `weathered_row_play=18`,
  `round_one_overinvestment=6`, `medic_timing_risk=0`), with
  103 suppressed suspicious-pass findings, including
  `round_one_overinvestment_pass=81`.
- `benchmark-v1-starter-matrix-expanded-v1`: 400 completed / 0 policy failures /
  0 engine errors, with v1 recording 305 wins, 90 losses, and 5 draws against
  v0.
- `benchmark-v1-starter-matrix-robust-v1`: 1000 completed / 0 policy failures /
  0 engine errors / 0 replay failures, with v1 recording 776 wins, 206 losses,
  and 18 draws against v0.
- Expanded failure mining: 878 findings
  (`suspicious_pass=671`, `round_three_low_resource=86`,
  `weathered_row_play=86`, `round_one_overinvestment=26`,
  `medic_timing_risk=7`), with 376 suppressed suspicious-pass findings,
  including `round_one_overinvestment_pass=290`.
- Robust failure mining: 2301 findings (`suspicious_pass=1754`,
  `weathered_row_play=239`, `round_three_low_resource=226`,
  `round_one_overinvestment=70`, `medic_timing_risk=11`,
  `matchup_skew=1`), with 919 suspicious-pass findings suppressed, including
  `round_one_overinvestment_pass=705`.

The next behavior decision should not broaden the round-one guard from aggregate
finding counts alone. The cFp49 casebook confirms the robust
`round_one_overinvestment` signal is durable and loss-correlated (71 findings,
69 losses, 2 draws). cFp50 exposes the missing scalar guard-state telemetry at
the failure-mining boundary. cFp51 shows the remaining robust signal is mostly
late suppressed passes and board-floor misses, with only two direct
guard-recommended play-selected cases. cFp52 confirms those two direct cases as
real selected-play contradictions, and cFp53 converts those selected-play
contradictions into selected passes in the post-repair debug artifacts. cFp54
classifies the remaining 70 robust findings and finds no new behavior-ready
bucket: the dominant 48-row group is already guarded by suppressed-pass
telemetry, 20 rows never reached the board floor, and no row reaches the
cumulative-spend candidate bucket after required precedence. Future round-one
cFp56 uses the cFp55 temporal/cumulative spend fields and still finds no narrow
public behavior rule: most rows are late-guard, missing selected play-card base
geometry, or catch-up/card-advantage/exception heavy. It does not justify
threshold widening, cumulative-spend tuning, or exception weakening.

cFp41 adds that expanded discovery surface without changing policy behavior:
`benchmark-v1-starter-matrix-expanded-v1` runs the official starter-deck
matrix over 10 deterministic seeds for 400 records. Use
`npm run benchmark:long -- --profile v1-expanded` to produce the expanded
artifact bundle before selecting the next tuning patch.

cFp37 is a behavior repair that fixes the cFp36 pass-policy regression. The
cFp36 resource budget gate was mechanically correct but too broad: it could
force pass even when round-investment said `continue` or `fight_last_gem`.
cFp37 introduces `shouldPassForResourceExhaustion` with 10 hard-block
conditions that prevent the resource gate from overriding continue,
fight_last_gem, and single-move catch-up signals. The change restores
cFp35-level benchmark totals without deleting cFp36 diagnostics.

## Product Playtest Toggle

cFp24.1 adds a product-safe policy registry for playable policies:

- `legal-heuristic-v0`: stable/default product policy.
- `legal-heuristic-v1`: experimental playtest policy backed by the cFp24
  benchmark artifacts.

The selector is intentionally labelled `AI policy`, not difficulty. It
does not add rank, MMR, training mode, or player-facing balance promises.
The selected policy id is public and appears in pre-game, mulligan, and
match surfaces so testers can verify which controller is active.

AI Lab policy status now consumes the same product policy metadata. When
future product policies are registered, `/ai-lab` should derive their
implemented/playtest status from the registry instead of duplicating
status strings by hand.

## Hidden-Info Boundary

v1 receives only `EnginePolicyInput`: the acting seat id, its
`SeatObservation`, and the legal moves produced by the engine. It does
not inspect raw `MatchState`, `cardsById`, command logs, event logs,
opponent hand identities, opponent deck identities/order, or runtime card
instance ids outside legal moves and the acting-seat observation.

cFp24 extends visible `SeatCardSummary` records with public catalog
metadata:

- `linkedSourceIds`
- `deckLimit`

Prompt option summaries may include card summaries only for cards already
exposed by the prompt to the acting seat, such as own hand discard sets,
own discard restore choices, opponent discard choices, deck choices
revealed by the discard/draw leader prompt, or look-three reveal cards.

## Feature Groups

The policy extracts cheap features from the observation:

- score totals, score delta, round, phase, turn, pass flags, and gems;
- own/opponent hand, deck, and discard counts;
- public row totals and row occupancy;
- active weather and visible weather penalties;
- own/opponent leader used and current-round cancellation flags;
- own hand source, kind, ability, strength, link, and deck-limit data;
- legal move groups for mulligan, prompt, play, leader, and pass moves.

It does not simulate future engine states or run lookahead.

## Mulligan

v1 uses `linkedSourceIds` rather than name-prefix matching.

- Roach is redrawn when a `muster_roach` caller such as Geralt or Ciri is
  also in hand.
- One-way Muster callers are kept, while linked targets in hand are
  redrawn. Examples include base Gaunter with Darkness, Cerys with Shield
  Maidens, and Arachas Behemoth with regular Arachas.
- Same-source Muster keeps the first playable copy and redraws duplicates
  beyond the first. Examples include Light Longship, regular Arachas,
  Crones, and Vampires.
- Base Gaunter is treated as the preferred caller for Darkness. Darkness
  without base Gaunter is treated as same-source Muster, keeping one copy
  and redrawing extras.
- Heroes are not redrawn unless they are an explicit linked summoned
  target.
- Low standalone no-ability units (strength ≤ 3, no strategic ability, not
  a Muster caller) are redrawn as a conservative generic class. This
  catches `neutral.roach` when no `muster_roach` caller is in hand,
  without hard-coding a Roach-specific rule.
- Strategically important low-strength cards are NOT redrawn by the low-
  standalone rule: Spies, Medics, Tight Bond pieces, Morale Boost pieces,
  Agile units, Berserker/Mardroeme pieces, Decoy, Scorch, weather/special
  cards, Commander's Horn, Muster callers, and Heroes.

The shared `rankMulliganCandidates` helper (exported from
`legalHeuristicPolicyV1`) produces `LegalHeuristicV1MulliganCandidateRank`
entries with reason kind, confidence, and standalone value. Sort order:
higher confidence first, lower standalone value first, lower printed
strength first, `moveId` as deterministic tie-breaker.

When no redraw candidate exceeds the threshold, v1 keeps the hand.

## Round And Pass Strategy

If the opponent has passed, v1 passes when already ahead. If behind, it
looks for the cheapest known legal play or useful leader action that gets
ahead. If no known catch-up exists and the AI is not on its last gem, it
passes to avoid wasting cards. On the last gem, it passes only when a
simple visible upper-bound estimate still cannot catch the opponent. The
upper bound includes visible linked hand targets for Muster callers, but
does not assume hidden deck contents.

When neither side has passed, v1 scores useful plays and leader actions,
prefers high-impact low-tempo plays such as early Spies, avoids obvious
overkill against a passed opponent, and can voluntarily pass only when
its lead clears a simple hand-pressure safety threshold. cFp24.2 replaced
the earlier `scoreDelta > 12 && ownHandCount < opponentHandCount` rule:
opponent hand count now increases the required lead instead of making a
pass more attractive. The current helper charges 6 points of pressure per
opponent hand card, 8 points per card on v1's last gem, and requires at
least a 24-point lead normally or 36 points on the last gem. A lead in
the 18-30 range is therefore not treated as safe against an active
opponent with 9-12 cards when v1 has useful legal plays. It does not
bluff, bait Scorch/weather, or plan multi-turn sacrifice lines.

## Prompt And Leader Handling

Prompt choices are resolved before normal play:

- `cancel_leader` keeps the blunt v0 reaction behavior and cancels when
  the AI owns the prompt.
- `look_three_cards` chooses the acknowledgement by legal order.
- Medic, restore-discard, draw-opponent-discard, and deck-draw prompts
  use strategic card value rather than raw printed strength only.
- Discard/draw stage 1 discards the lowest-value legal hand set; stage 2
  chooses the highest-value revealed deck option.
- Unknown prompts fall back to exposed target strength, then move id.

Leader moves are scored by visible usefulness. Clear Weather must
materially help the AI more than the opponent. Weather-pulling leaders
must hurt the opponent more than the AI. Row Scorch leaders use exposed
target metadata. Restore/draw/discard/look/cancel leaders receive
conservative value only when their legal metadata indicates a useful
current context.

## Benchmark Suites

cFp24 registers v1 in `defaultBenchmarkPolicies` and adds:

- `benchmark-v1-smoke-v1`: current Northern Realms versus current
  Nilfgaard, `legal-heuristic-v1` versus `legal-heuristic-v0`, six smoke
  seeds, mirrored seats, 12 public records.
- `benchmark-v1-starter-matrix-v1`: five official starter decks, all 10
  unordered pairings, both v1/v0 policy assignments, 3 seeds, mirrored
  seats, 120 public records.

Latest cFp36-repair results (repaired policy code):

- v1 smoke: `legal-heuristic-v1` records 10 wins, 2 losses, and 0 draws
  against v0 (unchanged from cFp35).
- v1 starter matrix: `legal-heuristic-v1` records 89 wins, 29 losses,
  and 2 draws against v0 (120 records). Benchmark progression:
  cFp35 / origin-dev baseline: 102/16/2, pre-repair cFp36 branch:
  88/30/2, repaired cFp36 branch: 89/29/2. cFp36 has a net benchmark
  regression versus the cFp35 baseline. The repair improves the first
  cFp36 implementation by +1 win, recovering one win/loss by allowing
  exception plays to proceed correctly.

These are fixed-suite evidence, not ratings or proof of broad strength.

## Failure Mining (cFp34-cFp35)

cFp34 adds `npm run benchmark:v1-failure-mining`, which reruns
`benchmark-v1-starter-matrix-v1` with opt-in in-memory v1 decision traces and
writes hidden-info-safe findings to:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/
```

The artifact bundle contains `manifest.json`, `summary.json`, `findings.jsonl`,
`report.md`, and cFp35's `tuning-queue.md`. It is intended as evidence for
future tuning specs and is not a policy change. cFp34's first artifact reported
388 findings over 120 records, including 315 broad `suspicious_pass` findings.
cFp35 recalibrates that evaluator so `suspicious_pass` is not emitted solely
because `stopLossRecommended === false`; the refreshed artifact reports 295
findings, including 222 calibrated suspicious-pass findings and 93 suppressed
broad-pass candidates recorded only as aggregate analyzer-noise counts.

The cFp35 tuning queue ranked `round_resource_exhaustion`,
`weathered_row_low_tempo`, `medic_no_target_timing`, `skellige_matchup_skew`,
and `remaining_suspicious_pass`. That queue has since been partially worked
through by cFp36 through cFp43: round-resource/pass-priority, weathered-row
low-tempo, Medic timing, expanded failure-mining, the cFp42 casebook, and the
cFp43 round-one overinvestment guard are all now recorded as completed phases.
`leader_underuse` remains deferred until a safe public leader-availability
summary exists. The command is CPU/Node benchmark infrastructure and runs
locally under the active setup recorded in
`docs/compute/experiment-status-ledger.md`.

## Known Limitations

- Immediate tempo and upper-bound estimates are intentionally simple, and
  only count visible linked Muster targets rather than hidden deck
  contents.
- Weather and Scorch scoring use visible row state and current score
  entries, not engine simulation.
- Faction-specific strategy profiles are not implemented.
- v1 can still overcommit or over-pass in lines that require sacrifice,
   baiting, hand-reading, or multi-turn valuation beyond the cFp31 round-
   investment and future-hand preservation gate.
- Benchmarks use starter decks and smoke decks only; mechanics stress
  decks and competitive lists remain deferred.
- Glicko, TrueSkill, search, ML training, Python tooling, browser
  benchmark execution, and product difficulty tiers remain deferred.

## Decision Tracing (cFp25)

cFp25 adds a hidden-info-safe decision trace layer that records why v1
chose each move, without exposing opponent hand identities, AI deck
order, or raw engine state.

Trace contract:

- `src/game/ai/decisionTrace.ts` defines the `AiDecisionTrace` schema
  (`ai-decision-trace-v1`), including public state, pass analysis,
  selected move summary, top candidate summaries (redacted), and a
  human-readable reason string.
- `src/game/ai/explainLegalHeuristicV1Decision` is a pure function that
  calls `legalHeuristicPolicyV1.selectMove` and returns both the same
  move and a trace. Policy parity is tested: `explainLegalHeuristicV1Decision(input).move`
  must equal `legalHeuristicPolicyV1.selectMove(input)` for mulligan,
  prompt, pass, play card, leader, and round-end cases.
- Traces are accumulated in the Redux engine slice (`diagnosticTraces`)
  during product matches and reset on rematch/setup.
- The product match screen (`AuthenticMatchScreen.tsx`) collects traces
  after each AI decision, provides `copy diagnostics` and
  `download diagnostics` controls near the battle log, and generates a
  versioned `gwent-product-playtest-diagnostics-v1` export that includes
  metadata, command/event summaries, decision traces, and a hidden-info
  safety scan result.
- Candidate summaries redact unplayed AI hand card names to
  `"hidden hand play"`, preventing human players from learning the AI's
  hidden hand.

### Selected Move Label Redaction

All selected move labels are redacted via `safeSelectedMoveLabel` to
prevent card name leakage from the AI's hidden hand:

- `play_card` → `"hidden hand play"` (never `"Play <card name>"`)
- `choose_mulligan` → `"mulligan hidden card"` or `"keep hand"`
- `choose_prompt_option` → `"resolve prompt option"`
- `use_leader` → `"use leader"`
- `pass` → `"pass"`
- `resolve_round_end` → `"resolve round end"`

The `optionId` field was replaced with `optionRef` in `AiDecisionSelectedMove`
to avoid exposing any potential engine identifiers. `optionRef` is a
deterministic local diagnostic reference (`option_<decision action index>`)
and is never derived from the raw engine prompt option ID, because some prompt
option IDs embed card instance tokens such as revive/restore/discard-draw
targets.

### Policy Last-Gem Upper Bound

cFp25 repair exports `uniqueCardTempoUpperBound` from
`legalHeuristicPolicyV1` and stores `ownScore + uniqueCardTempoUpperBound` as
`policyLastGemUpperBound` in the pass analysis. This matches the policy's own
surrender gate logic
(`ownScore + uniqueCardTempoUpperBound`), replacing the previous
approximate heuristic (`ownScore + opponentHandCount * 50`). The heuristic
value is still available as `diagnosticApproxUpperBound` for reference.
`lastGemSurrenderAllowed` is based on `policyLastGemUpperBound`.

### Nilfgaard Tie-Aware Catch-Up (cFp26)

cFp26 repairs two issues exposed by a product playtest export:

1. `legal-heuristic-v1` previously treated a reachable tied score as
   insufficient when deciding whether catch-up is possible. This is wrong
   for Nilfgaard, because Nilfgaard wins tied rounds when exactly one
   seat is Nilfgaard.
2. The diagnostic reason text could say `"catch-up move"` even when the
   selected move was `pass`.

The fix adds public faction awareness (`ownFaction`, `opponentFaction`) to
`SeatObservation` and introduces tie-aware helpers in the v1 policy:

```ts
const ownWinsTiedRound = (features) =>
  features.input.observation.ownFaction === "nilfgaard" &&
  features.input.observation.opponentFaction !== "nilfgaard";

const minimumScoreToWinRound = (features) =>
  ownWinsTiedRound(features)
    ? features.opponentScore         // tie is enough — Nilfgaard wins
    : features.opponentScore + 1;    // must exceed — draw loses
```

These helpers are used in both the catch-up candidate filter and the
last-gem impossible-pass gate. The engine rule is: if exactly one seat is
Nilfgaard, that Nilfgaard seat wins tied rounds; if neither or both are
Nilfgaard, the round is a draw.

The diagnostic reason text was also fixed: it now checks whether the
*selected* move is a non-pass catch-up play rather than claiming
catch-up based on the top sorted candidate alone.

What tracing CAN explain:
- Which move was selected and its score relative to alternatives.
- Why pass was safe or unsafe (score delta, opponent hand pressure,
  required lead, last-gem status).
- Whether a move was a catch-up attempt or a voluntary pass.

What tracing CANNOT explain (by design):
- Exact opponent hand composition (hidden info).
- Future hidden deck contents beyond a conservative upper-bound estimate.
- Hidden opponent leader abilities beyond usage/turn metadata.
- Multi-turn lookahead that v1 does not compute.

cFp25 is a diagnostics phase, not a tuning phase. No constants,
thresholds, or decision logic were changed.

### Pass Decision Diagnostics (cFp26.1)

cFp26.1 exports structured pass-decision diagnostics from the v1 policy
for decision traces and product diagnostics. These diagnostics explain
why v1 chose to pass, without changing any selected-move behavior.

The pass diagnostics include:

- `ownWinsTiedRound` — whether this seat is the sole Nilfgaard faction
- `minimumScoreToWinRound` — opponent score (Nilfgaard tie wins) or
  opponent score + 1 (must exceed)
- `policyUpperBound` — `ownScore + uniqueCardTempoUpperBound`,
  matching the last-gem surrender gate
- `policyUpperBoundCanWinRound` — whether `policyUpperBound >= minimumScoreToWinRound`
- `hasSingleMoveCatchUp` — whether any single play/leader move can reach
  `minimumScoreToWinRound`
- `bestSingleMoveCatchUpScore` / `Tempo` / `Kind` — metadata for the
  best single-move catch-up candidate (null when none exists)
- `preserveHandPassRecommended` — whether v1 would pass to preserve its
  hand (requires: opponent passed, scoreDelta ≤ 0, no single-move
  catch-up, ownGems > 1, pass is legal)

These fields are exposed on `AiDecisionPassAnalysis` and available in
product diagnostic exports via `passAnalysis`.

cFp26.1 is a diagnostics-only addition. No v1 decision logic changed.

### Mulligan Diagnostics (cFp27)

cFp27 adds hidden-info-safe mulligan diagnostics and conservative low-
standalone redraw scoring to the v1 policy. The mulligan diagnostics
explain why v1 chose a redraw target (or kept the hand) without exposing
AI hand card names, source IDs, or instance IDs.

The mulligan diagnostics are exposed as `mulliganAnalysis` on
`AiDecisionTrace` (null during playing phase) and include:

- `mulliganLegal` — whether a mulligan move is legal
- `selectedCardCount` — number of cards in the selected mulligan redraw
- `candidateCount` — number of ranked redraw candidates considered
- `selectedReasonKind` — one of `"linked_payload"`, `"muster_duplicate"`,
  `"low_standalone_unit"`, `"keep_hand"`, or `"unknown"`
- `selectedConfidence` — confidence score (0-100) of the selected redraw,
  or null for keep-hand
- `selectedStandaloneValueBucket` — `"low"` (< 80), `"medium"` (80-179),
  `"high"` (≥ 180), or null for keep-hand
- `topCandidateConfidence` — confidence of the best redraw candidate
- `topCandidateReasonKind` — reason kind of the best redraw candidate

Internal reason kinds are mapped to exported categories:
- `linked_roach_payload` / `one_way_linked_payload` → `"linked_payload"`
- `same_source_muster_duplicate` → `"muster_duplicate"`
- `low_standalone_unit` → `"low_standalone_unit"` (broad quality class,
  not a named card)

### Hand-Quality Pass Calibration (cFp28)

cFp28 calibrates voluntary safe-pass decisions against future-round hand
quality. Motivated by a product playtest export in which a `+29` round-1
lead (just above `requiredLead` of `24`) was voluntarily passed, leaving
the AI with no unit cards for a future must-win round.

Two new diagnostic types classify aggregate hand shape:

- `AiDecisionHandQuality`: `"empty"` (no cards), `"poor"` (no units, only
  specials/weather), `"thin"` (exactly one unit in 3+ cards), `"healthy"`
  (otherwise).
- `AiDecisionTempoBucket`: `"none"` (≤ 0), `"low"` (1-5), `"medium"`
  (6-10), `"high"` (≥ 11).

`AiDecisionHandShapeAnalysis` is a hidden-info-safe struct exposed on
playing-phase `AiDecisionTrace` via `handShapeAnalysis`. It counts unit,
hero, and special/weather cards in hand, buckets best tempo values, and
classifies future-round viability. No card names, source IDs, instance
IDs, cardIds, linkedSourceIds, or raw abilities are included.

Voluntary pass now requires extra safety buffer when the future hand is
poor or thin:

- `poor` future hand: `scoreDelta >= requiredLead + 18`
- `thin` future hand: `scoreDelta >= requiredLead + 10`
- `healthy` or `empty` future hand: unchanged (`scoreDelta >= requiredLead`)

This gate only applies when `opponentPassed === false`, `isLastGem ===
false`, and the pass is voluntary (not forced by catch-up impossibility).
The last-gem catch-up-impossible pass and opponent-passed pass behavior
are unchanged.

When hand quality blocks a voluntary pass, v1 selects the best positive
useful play. If no positive play exists, passing is still allowed.

cFp28 is still a heuristic, not lookahead or search. It only considers
aggregate hand shape for the next round, not multi-round simulation or
exact card sequencing.

### cFp28 Benchmark Results

Because selected-move behavior changed, benchmark artifacts were refreshed:

- Smoke benchmark: `legal-heuristic-v1` records 6 wins and 6 losses
  against v0 (changed from 5/7 after cFp27).
- Starter matrix: `legal-heuristic-v1` records 88 wins and 32 losses
  against v0 (changed from 89/31 after cFp27).

### cFp28 Repair: Hand-Shape Field Semantics

A follow-up repair aligned the hand-shape diagnostic fields with their
documented semantics:

- `unitCardCount` now strictly counts cards with `kind === "unit"`. Hero
  cards are no longer included in this count.
- `heroCardCount` tracks `kind === "hero"` cards separately.
- `futureRoundHandQuality` uses `unitTempoCardCount` (= `unitCardCount +
  heroCardCount`) rather than `unitCardCount` alone, so heroes continue to
  contribute to future-round viability assessment.
- `specialOnlyHand` is `true` only when the hand contains zero units AND
  zero heroes (i.e. only specials/weather remain).
- `noUnitFutureRisk` is `true` only when `unitTempoCardCount === 0` and
   the hand is non-empty.
- Pass-buffer constants (`EXTRA_BUFFER_POOR` = 18, `EXTRA_BUFFER_THIN` =
   10) and the `getFutureHandExtraBuffer` helper were extracted from inline
   code into `decisionTrace.ts` and shared by both the policy and
   explanation modules to prevent divergence.

### Medic Timing Calibration (cFp29)

cFp29 calibrates Medic source card valuation based on own-discard revive
target availability. Motivated by a product playtest in which the AI played
a Medic source early with no meaningful revive target in its own discard
pile, because `cardStrategicValue(...)` gave every Medic card a flat `+260`
bonus regardless of whether the ability could actually convert value.

Key changes:

- `SeatObservation` now includes `ownDiscard: SeatCardSummary[]`, populated
  from the engine discard pile. This is safe because own-discard is public
  game information visible to the acting seat.
- `cardStrategicValue(...)` accepts `{ includeMedicAbilityBonus? }` option.
  The flat `+260` bonus is now gated behind this option (defaults to `true`).
  `scorePlayMove(...)` passes `{ includeMedicAbilityBonus: false }` for
  Medic sources, replacing the flat bonus with contextual utility.
- `medicSourceUtility(...)` replaces the flat bonus with discard-aware
  utility: negative penalty when no revive targets exist, scaled positive
  utility when targets are available.
- `medicReviveTempoForSource(...)` injects expected revive tempo into
  `estimateImmediateTempo(...)` for own-row Medic plays.
- `AiDecisionMedicTimingAnalysis` is a hidden-info-safe struct exposed on
  playing-phase traces via `medicTimingAnalysis`. It includes:
  - `medicPlayLegal`: whether at least one Medic play-card move is legal
  - `medicPlayCandidateCount`: unique Medic source cards in hand
  - `ownDiscardReviveCandidateCount`: unique revive targets in own discard
  - `bestReviveStrengthBucket`: bucketed best non-Spy printed strength
  - `bestReviveValueBucket`: `none` / `weak` / `medium` / `strong`
  - `noTargetMedicRisk`: true when Medic is legal but discard is empty
  - `selectedMedicWithNoTarget`: true when selected move is a no-target Medic
- No card names, source IDs, instance IDs, cardIds, linkedSourceIds, or raw
  abilities are included in the diagnostic trace.
- Prompt-target Medic value is preserved; `promptCardValue(...)` continues to
  use the full `includeMedicAbilityBonus` default so Medic targets remain
  attractive when resolving a Medic prompt.

### cFp29 Benchmark Results

Because selected move scoring changed, the v1 benchmark artifacts were
refreshed after the cFp29 review repairs:

- Smoke benchmark (`benchmark-v1-smoke-v1`): v1 records 10 wins, 2 losses,
  and 0 draws against v0.
- Starter matrix (`benchmark-v1-starter-matrix-v1`): v1 records 90 wins,
  29 losses, and 1 draw against v0.

### Weather-Aware Unit Placement (cFp30)

cFp30 calibrates non-hero unit placement tempo based on active weather on
the target row. Motivated by a product playtest diagnostic export in which
the AI repeatedly played high-value non-hero units into its own weathered
rows, reducing their effective board value from full printed strength to 1.

Key changes:

- `estimateImmediateTempo(...)` now uses weather-adjusted effective strength
  for board-row placements of non-hero units. Active weather rows are derived
  from `observation.weather`, excluding `clear_weather` entries.
- Non-hero units placed on weathered rows use base placed strength `1` instead
  of printed strength. Heroes remain weather-immune and keep printed strength.
- Commander's Horn on a weathered row doubles the weather-adjusted strength
  (so a non-hero on a weathered horned row scores about `2`, not `20`).
- Spy placement on opponent weathered rows uses weather-adjusted signed tempo
  (e.g., `-1` not `-4` for strength-4 Spy into Fogged ranged row).
- `AiDecisionWeatherPlacementAnalysis` is a hidden-info-safe struct exposed on
  playing-phase traces via `weatherPlacementAnalysis`. It includes:
  - `selectedMoveIntoWeatheredRow`: whether the selected move targets a weathered row
  - `selectedMoveSide` / `selectedMoveRow`: placement target metadata
  - `selectedPrintedStrengthBucket` / `selectedEffectiveStrengthBucket`: strength
    buckets before/after weather adjustment
  - `ownWeatheredRows` / `opponentWeatheredRows`: public row names only
  - `candidateWeatheredOwnRowPlayCount` / `candidateWeatheredOpponentRowPlayCount`:
    counts of candidates that place into weathered rows
- `scanWeatherPlacementAnalysis` in `matchDiagnostics.ts` provides targeted
  hidden-info scanning for weather-placement diagnostics, catching source IDs
  and ability arrays within the weather-placement subtree.
- No card names, source IDs, instance IDs, cardIds, linkedSourceIds, or raw
  abilities are included in the diagnostic trace.

Weather adjustment logic mirrors engine scoring:

- Biting Frost affects close combat rows.
- Impenetrable Fog affects ranged rows.
- Torrential Rain affects siege rows.
- Skellige Storm affects ranged and siege rows.
- Clear Weather removes weather but is not itself an active row penalty.
- King Bran weather reduction is deferred (not readily available via public
   leader metadata in the observation).

### cFp30 Benchmark Results

Because selected move scoring changed, the v1 benchmark artifacts were
refreshed after cFp30:

- Smoke benchmark (`benchmark-v1-smoke-v1`): v1 records 9 wins, 3 losses,
  and 0 draws against v0 (changed from cFp29 10/2/0).
- Starter matrix (`benchmark-v1-starter-matrix-v1`): v1 records 96 wins,
  23 losses, and 1 draw against v0 (changed from cFp29 90/29/1).

### Round Investment Preservation (cFp31)

cFp31 adds round-investment awareness to prevent v1 from overcommitting
Round 1 and exhausting its hand, leaving Rounds 2/3 as low-card
formalities. Motivated by product playtest diagnostics showing v1
refusing to pass unless its lead exceeded the safety threshold, then
passing Rounds 2/3 because it had burned all useful cards.

Key changes:

- `AiDecisionRoundInvestmentRisk` enum: `"none"`, `"watch"`, `"high"`,
  `"critical"` — classifies future-hand depletion risk.
- `AiDecisionRoundInvestmentRecommendation` enum: `"none"`,
  `"preserve_future_hand"`, `"sacrifice_round"`, `"fight_last_gem"`,
  `"continue"`.
- `AiDecisionRoundInvestmentAnalysis` struct exposed on playing-phase
  traces via `roundInvestmentAnalysis`. It includes:
  - Board investment counts (own units, heroes, horns, total cards)
  - Positive future move counts (unit and non-unit)
  - Future-round hand quality classification
  - Current and estimated-after-move hand counts
  - Selected move flags (spends hand card, card-advantage, would leave
    no positive unit move, would leave no unit tempo card)
  - Non-elimination round flag, score delta, risk, and recommendation
- `shouldPassForRoundInvestment(...)` gates `choosePlayingMove` before
  returning the best useful play. It checks:
  - **Critical risk**: estimated hand after move ≤ 1, no positive unit
    moves remain, hand was large enough that preservation matters
    (`ownHandCount > 2`). Exception: if the move wins the match, play it.
  - **Preservation**: ahead or near-even (`scoreDelta >= -10`), continuing
    would leave no positive future plays, and estimated hand after move ≥ 2.
  - **Sacrifice**: behind (`scoreDelta < 0`), no single-move catch-up,
    and future-hand risk is `high`.
- **Exceptions**: Last-gem rounds always fight. Single-card hands always
  play. Card-advantage moves (Spy) are never blocked.
- `scanRoundInvestmentAnalysis` in `matchDiagnostics.ts` validates hidden-
  info safety for round-investment diagnostics.
- No card names, source IDs, instance IDs, cardIds, linkedSourceIds, or raw
  abilities are included in the diagnostic trace.
- `policy-round-investment` reason kind added to trace explanation for
  round-investment pass decisions.

### cFp31 Benchmark Results

cFp31.1 refreshed the cFp31 benchmark artifacts on macOS after the
Windows `tsx` binary resolution issue blocked the original cFp31 branch
from regenerating them:

- Smoke benchmark (`benchmark-v1-smoke-v1`): 9 wins, 3 losses, 0 draws
   against v0.
- Starter matrix (`benchmark-v1-starter-matrix-v1`): 103 wins, 15 losses,
   2 draws against v0.

### Stop-Loss Round Sacrifice (cFp32)

cFp32 adds a stop-loss gate that triggers `sacrifice_round` for non-elimination
rounds where catch-up is publicly impossible or too expensive and the selected
move would burn scarce future hand. Motivated by a product playtest diagnostic
export (`gwent-diagnostics-ep4-mp6cglwp.json`) in which v1 spent cards in
Round 1 despite being behind by 12, having no single-move catch-up, and having
`policyUpperBoundCanWinRound === false`.

Key changes:

- `catchUpStatus` field on `AiDecisionRoundInvestmentAnalysis`: `"single_move_catch_up"` /
  `"upper_bound_possible"` / `"upper_bound_impossible"`.
- `stopLossRecommended` boolean and `stopLossReason` string (`"none"`,
  `"upper_bound_impossible"`, `"low_hand_no_clean_catch_up"`,
  `"weathered_low_tempo"`, `"medium_medic_target"`).
- `shouldPassForRoundInvestment` now checks `stopLossRecommended` before
  returning the best useful play. The stop-loss gate fires when:
  - legal pass exists, opponent has not passed
  - `ownGems > 1` (last-gem rounds stay under existing logic)
  - score delta < 0 (behind)
  - no single-move catch-up
  - upper-bound cannot win OR the selected move burns the last useful unit
  - hand size ≤ 4 OR weathered low-tempo placement OR medium-or-worse Medic target
- **Exceptions**: Last-gem rounds, opponent-passed rounds, Spy/card-advantage
  moves, and single-card hands are never blocked by the stop-loss gate.
- Explanation layer updated with "stop-loss" reason strings that mirror the
  policy's `stopLossReason` field.
- `policy-round-investment` reason kind used for stop-loss pass decisions.

### cFp32 Benchmark Results

- Smoke benchmark (`benchmark-v1-smoke-v1`): 10 wins, 2 losses, 0 draws
  against v0 (changed from cFp31 9/3/0).
- Starter matrix (`benchmark-v1-starter-matrix-v1`): 102 wins, 16 losses,
  2 draws against v0 (changed from cFp31 103/15/2).

### Scoia'tael First-Player Prompt (cCp32.1)

cCp32.1 moves the Scoia'tael faction first-player choice from pre-game setup
to a post-mulligan engine prompt. `legal-heuristic-v1` resolves
`scoiatael_choose_first` deterministically with `scoiatael-first-player:self`
for now. This is intentionally simple: no faction-specific mulligan/first-turn
strategy has been tuned yet.

The public seat observation now exposes:

- `ownHasPostMulliganFirstPlayerChoice`
- `opponentHasPostMulliganFirstPlayerChoice`

Both fields are derived only from public faction identity. They exist so a
future Cluster F phase can make mulligan decisions with the first-player choice
in mind without leaking hidden cards.

### Scoia'tael First-Turn Choice (cFp33)

cFp33 replaces `legal-heuristic-v1`'s deterministic
`scoiatael-first-player:self` prompt fallback with a deterministic
post-mulligan hand-shape heuristic. The decision is based only on:

- **Legal prompt moves** (presence of self/opponent options)
- **Own hand summary** (counts by ability bucket, best opening tempo)
- **Public state** (no opponent hand, no deck contents)

Hand shape features computed from `SeatCardSummary`:

- Spy count (`"spy"` ability) → +35 initiative
- Muster/Muster Roach count (`"muster"`, `"muster_roach"`) → +25 initiative
- Best opening printed strength → +25 for 8+, +12 for 5-7
- Commander's Horn + 3+ proactive cards → +8 initiative
- Scorch count → +28 reaction
- Weather count (2+) → +24 reaction, (1) → +10 reaction
- Decoy without Spy → +8 reaction
- Medic count → +6 reaction
- Weak proactive (strength ≤ 4) + reactive density (≥ 2) → +18 reaction

Decision threshold: `reactionScore >= initiativeScore + 12` → choose opponent.
Ties default to `self` for stability.

Reason kinds (hidden-info-safe enums):

- `spy_or_card_advantage_opener` — go first with Spy
- `muster_or_thinning_opener` — go first with Muster/thinning
- `strong_tempo_opener` — go first with 8+ best opening
- `reactive_weather_or_scorch` — let opponent start with weather/scorch
- `weak_proactive_reactive_hand` — let opponent start for weak+reactive
- `default_go_first` — tie/bias → self
- `only_legal_option` — single option available

`AiDecisionScoiataelFirstTurnAnalysis` exposes counts, scores, tempo bucket,
and reason kind — never card names, source IDs, instance IDs, or ability
arrays. A targeted `scanScoiataelFirstTurnAnalysis` scanner rejects raw
source IDs, card names, instance IDs, and ability arrays in the analysis
subtree.

`v0` remains unchanged with its deterministic `self` fallback.

### Round Resource Exhaustion Tuning (cFp36)

cFp36 adds a conservative non-elimination round resource budget gate to
`legal-heuristic-v1`. The policy becomes more willing to pass or sacrifice a
non-elimination round when board investment already exceeds the budget for the
current hand quality and round.

Budget calculation:

- `AiDecisionHandQuality` classification determines the base budget:
  `"healthy"` → 5 board cards, `"thin"` → 4, `"poor"` → 3.
- Floor: 2, cap: 6.
- Round 2: -1 adjustment if own gems > opponent gems (safer to preserve).
- Score delta >= 10: -1 adjustment (already favorable).
- Score delta < -15: +1 (behind, may need more investment).
- Round 3: budget set to maximum cap (6) — no resource preservation needed.
- Last-gem (ownGems <= 1): budget set to cap (6) — always fight.
- Opponent passed or own passed: budget set to cap (6) — no preservation needed.

Resource pressure:

- `AiDecisionRoundResourcePressure` enum: `"none"`, `"watch"`, `"high"`, `"critical"`.
- Pressure only applies when board investment >= budget.
- Under-budget investment returns `"none"`.
- At budget: `"watch"`. Over by 1: `"high"`. Over by 2+: `"critical"`.

Resource exhaustion decision:

- `resourceExhaustionRecommended` is `true` ONLY when the budget is exceeded
  with a budget-exceeded reason: `"round_budget_exceeded"`, `"thin_future_hand"`,
  `"poor_future_hand"`, `"last_useful_unit"`.
- Exception reasons produce `resourceExhaustionRecommended === false`:
  `"exception_last_gem"`, `"exception_card_advantage"`,
  `"exception_leader"`, `"exception_match_winning_play"`, `"round_three_no_budget"`.

Exceptions preserved (never block play):

- Last-gem rounds: always fight.
- Spy/card-advantage moves: always play.
- Free leader actions (use_leader): always play.
- Match-winning play: if opponent is on last gem and this move reaches
  minimumScoreToWinRound, always play.
- Cheap single-move catch-up: if the candidate catches up to
  minimumScoreToWinRound with overkill <= 3 and doesn't leave no future unit
  tempo, allow it.
- Single-card hand: nothing meaningful to preserve.
- Round 3: no resource preservation.
- Opponent already passed: no preservation needed.

New diagnostic fields on `AiDecisionRoundInvestmentAnalysis`:

- `roundResourceBudget`: calculated budget (2-6).
- `roundResourcePressure`: `"none"` / `"watch"` / `"high"` / `"critical"`.
- `resourceExhaustionRecommended`: boolean.
- `resourceExhaustionReason`: reason enum.

### cFp36 Repair

A follow-up repair fixed four issues:

1. `buildRoundResourcePressure` now correctly returns `"none"` when board
   investment is under budget (floor budget caused false pressure signals).
   Removed the unused `_selectedMove` parameter to fix lint error.
2. Exception reasons now produce `resourceExhaustionRecommended === false`;
   only budget-exceeded reasons set it to `true`.
3. Added `exception_match_winning_play` check and cheap single-move catch-up
   logic to `buildRoundResourceExhaustionDecision` and
   `shouldPassForRoundInvestment`.
4. Moved the play-card exception reason check in
   `explainLegalHeuristicV1Decision.ts` before the `bestMove` block so that
   exception reason strings (e.g. "round resource pressure ignored — card
   advantage move") can actually appear in the trace reason when a useful
   play_card is selected and an exception applies.

Benchmark progression (v1 starter matrix, 120 records): cFp35 / origin-dev
baseline: 102/16/2, pre-repair cFp36 branch: 88/30/2, repaired cFp36 branch:
89/29/2. cFp36 has a net benchmark regression versus the cFp35 baseline.
The pre-repair cFp36 branch (88/30/2) was lower than the baseline due to
a separate code path in the initial implementation. The repair improves the
first cFp36 implementation by +1 win, recovering one win/loss by allowing
exception plays to proceed correctly. The tuning queue still ranks
`round_resource_exhaustion` as #1 for further tuning.

### Pass Decision Alignment (cFp37)

cFp37 keeps the cFp36 round-resource diagnostics but narrows the resource-gate
pass decision. `shouldPassForResourceExhaustion` only allows pass when
round-investment already recommends `preserve_future_hand` or
`sacrifice_round`, and blocks the resource gate when the diagnostic says
`continue`, `fight_last_gem`, or when a single-move catch-up with public
upper-bound viability still exists.

Benchmark totals after cFp37:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 102 win / 16 loss / 2 draw vs v0.
- Failure mining: 295 findings; suspicious_pass = 222.

cFp37 restores the cFp35 benchmark/failure-mining baseline without deleting
cFp36 diagnostics.

### Weathered Row Low-Tempo Tuning (cFp38)

cFp38 implements the narrow second-pass weathered-row guard from
`docs/spec/2026-05-18-cFp38-specs.md`. It penalizes own-side non-hero unit
placements with printed strength >= 6 when weather collapses effective strength
to <= 3 and a clearly better legal line exists. It preserves tactical
exceptions for Spy/card-advantage, strong Medic value, Muster/linked callers,
match-winning lines, last-gem catch-up, and no-better-line cases.

Benchmark totals remain at the cFp37 baseline:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 102 win / 16 loss / 2 draw vs v0.
- Failure mining: 295 findings; weathered_row_play = 21.

### Medic No-Target Timing Guard (cFp39)

cFp39 implements the narrow no-target Medic delay guard from
`docs/spec/2026-05-18-cFp39-specs.md`. It adds a -260 delay penalty (`MEDIC_NO_TARGET_DELAY_PENALTY`)
when a no-target Medic source play is selected and a useful non-Medic line exists
(score >= 25 among non-Medic play_card moves and leader moves). Six tactical
exceptions prevent the penalty from blocking emergency or match-winning plays:

1. Medic is the only legal non-pass play
2. Last-gem catch-up (ownGems <= 1, scoreDelta < 0, candidate reaches minimumScoreToWinRound)
3. Match-winning play (opponent on last gem, candidate reaches minimumScoreToWinRound)
4. Round 3 with low hand count (ownHandCount <= 2)
5. Opponent passed and Medic play reaches minimumScoreToWinRound
6. No useful non-Medic line exists (hasUsefulNonMedicLine returns false)

Key implementation details:

- `isNoTargetMedicSourcePlay(...)` identifies Medic plays with zero revive candidates.
- `hasUsefulNonMedicLine(...)` checks non-Medic play_card and leader moves for score >= 25.
- `shouldApplyNoTargetMedicDelayPenalty(...)` combines the above with exception checks.
- Medic scores are conditionally adjusted (+260) in
  `buildLegalHeuristicV1RoundInvestmentAnalysis` when computing
  `positiveUnitSourceCardIds` — only when
  `shouldApplyNoTargetMedicDelayPenalty(features, move)` returns true. Medic cards
  that do not trigger the cFp39 penalty (e.g. no useful non-Medic line exists) are
  scored at their raw `scoreMove` value for this computation.
- A Medic-specific clear-round-benefit exception in
  `shouldPassForRoundInvestment` is placed **before** `shouldPassForResourceExhaustion`,
  allowing no-target Medic plays that clearly put the AI ahead when behind to bypass
  resource exhaustion blocking.
- `AiDecisionMedicTimingAnalysis` gains three new booleans:
  `selectedNoTargetMedicDelayRisk`, `betterNonMedicAlternativeAvailable`,
  `noTargetMedicDelayPenaltyApplied`.
- Product diagnostics remain hidden-info safe (no card names, source IDs, or raw abilities).

Benchmark totals:

- `benchmark-v1-smoke-v1`: 10 win / 2 loss / 0 draw vs v0.
- `benchmark-v1-starter-matrix-v1`: 104 win / 14 loss / 2 draw vs v0.
- Failure mining: 296 findings (suspicious_pass=225, weathered_row_play=22,
  medic_timing_risk=3, round_one_overinvestment=9, round_three_low_resource=34).

cFp39 adds 10 fixture tests to `engineAiPolicy.test.ts` covering:
- No-target Medic delay penalty when useful non-Medic line exists
- Medic-only hand exception
- Strong revive target preservation
- Prompt ranking unchanged
- Opponent-passed catch-up
- Last-gem emergency
- Select/explain parity
- Hidden-info safety
- Conditional Medic score compensation in positiveUnitSourceCardIds (repair)
- Weak no-target Medic without penalty not incorrectly compensated (repair)

### Recursive Scoring Guard (cFp41.1)

cFp41.1 repairs a stack overflow found by the cFp41 expanded benchmark
(`benchmark-v1-starter-matrix-expanded-v1`, matchup
`starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0`, seed
`starter-matrix-expanded-010`, mirror index `0`,
`policy_select_failed`, `Maximum call stack size exceeded`).

Root cause: cFp38/cFp39 alternative-line helpers called full recursive
scoring. `hasUsefulNonMedicLine` called `scorePlayMove(candidate)`, and
`hasClearlyBetterNonWeatheredLine` called `scoreMove(candidate)`. Both
`scorePlayMove` and `scoreMove` re-entered the same guards
(`shouldApplyNoTargetMedicDelayPenalty` → `hasUsefulNonMedicLine`,
`hasClearlyBetterNonWeatheredLine` → `scoreMove` → `scorePlayMove`),
creating an infinite recursion loop that blew the call stack.

Fix: added `scorePlayMoveForAlternativeScan`, a non-recursive tempo-based
helper that computes `cardStrategicValue + tempo * 14` without calling any
cFp38/cFp39 guard helpers. Rewrote `hasUsefulNonMedicLine` to use it for
play-card candidates. Rewrote `hasClearlyBetterNonWeatheredLine`'s
different-card branch to use `scorePlayMoveForAlternativeScan` instead of
`scoreMove`. The same-card +4 effective strength branch already used
non-recursive `effectivePlacedStrengthForPolicy` and was unchanged.

No constants, thresholds, scoring formulas, or AI policy tuning changed.
The alternative-scan helper preserves the rough threshold meaning of
`MIN_USEFUL_MOVE_SCORE` but does not include cFp38/cFp39 contextual
penalties because it is only deciding whether an alternative line exists.

cFp41.1 adds:
- 1 exact expanded-run regression test in `benchmarkHarness.test.ts`.
- 1 helper-level recursion guard test in `engineAiPolicy.test.ts` with
  no-target Medic + weathered low-tempo placement fixture.
- Stale `Recommended cFp36 Scope` heading in `failureMining.ts` replaced
  with `Recommended Next Scope`.

### Expanded Benchmark Artifact Refresh (cFp41.2)

cFp41.2 commits the post-cFp41.1 expanded artifact boundary generated by:

```bash
npm run benchmark:long -- --profile v1-expanded
```

The durable artifact set lives under:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/
```

The run completed 400/400 matches with 0 policy failures, 0 engine errors, and
0 replay failures. `legal-heuristic-v1` recorded 310 wins, 85 losses, and 5
draws against `legal-heuristic-v0`. Expanded failure mining reported 964
findings, with the top queue still pointing at round-resource exhaustion:
148 combined round-one overinvestment / round-three low-resource findings,
followed by weathered-row low-tempo (86), Medic no-target timing (11),
Skellige matchup skew (72), and remaining calibrated suspicious-pass
contradictions (717).

cFp41.2 does not change AI behavior, engine rules, legal moves, UI behavior,
catalog data, deck presets, benchmark suite shape, ratings, search, training, or
product difficulty. It updates committed artifacts plus AI Lab/product metadata
so `/ai-lab` shows the exact expanded result instead of the earlier cFp41.1
guard-only status string.

### Round Resource Exhaustion Casebook (cFp42)

cFp42 reads the committed cFp41.2 public expanded artifacts and creates the
decision note:

```text
docs/research/literature/ai/decisions/2026-05-20-cfp42-round-resource-casebook.md
```

The casebook splits the broad `round_resource_exhaustion` queue into two
sub-signals:

- `round_one_overinvestment`: 51 findings, 38 warning / 13 watch, and
  48 loss / 3 draw / 0 win. This is the behavior-actionable signal because it
  points at early round-1 hand depletion before later match loss.
- `round_three_low_resource`: 97 findings, 12 warning / 85 watch, and
  81 win / 12 loss / 4 draw. This is mostly a watch/noise signal because all 97
  selected `pass`, most had no positive unit tempo available, and the finding
  appears mostly in v1 wins.

The decision is to use cFp43 for narrow round-one overinvestment fixtures, not a
broad suspicious-pass rewrite and not a broad resource-exhaustion constant
tuning pass. cFp42 does not change `legal-heuristic-v1` behavior, engine rules,
legal moves, benchmark suite shape, UI behavior, catalog data, deck presets,
ratings, search, training, or product difficulty.

### Round-One Overinvestment Guard (cFp43)

cFp43 adds a narrow round-1-only overinvestment guard to
`legal-heuristic-v1`. The guard can choose pass instead of another
hand-spending `play_card` when the selected play would push the AI to at least
7 own board cards in round 1 while leaving 4 or fewer hand cards for later
rounds. It does not change engine rules, legal moves, v0 behavior, UI behavior,
catalog data, deck presets, benchmark suite shape, ratings, search, training, or
product difficulty.

The guard preserves tactical exceptions for last-gem fights, opponent-passed
states, non-play-card/free actions such as leader use, card-advantage plays,
match-winning plays, cheap single-move catch-up, and single-card hands.
Diagnostics add `roundOneBoardAfterSelectedMove`,
`roundOneOverinvestmentRecommended`, and `roundOneOverinvestmentReason` to
`AiDecisionRoundInvestmentAnalysis`. `roundOneOverinvestmentRecommended` is
true only for actual guard-pass recommendations; exception reasons stay false.
The trace enum still reserves `round_one_low_future_hand`, but the current
helper emits `round_one_board_limit` for the active geometry because the guard
requires both board and hand thresholds simultaneously.

cFp43 also updates failure mining with the
`round_one_overinvestment_pass` suppression category so intentional cFp43 passes
do not inflate the remaining `suspicious_pass` queue. Post-cFp43 current
failure mining reports 300 findings, and expanded failure mining reports 878
findings. The expanded round-one overinvestment signal drops from 51 to 26; the
starter-matrix strength regresses from the cFp41.2 expanded artifact
(`310/85/5`) to `305/90/5`, so future changes should watch whether the reduced
failure-mining signal is worth that tradeoff.

### Post-cFp43 Failure-Mining Casebook (cFp44)

cFp44 is an analysis/documentation phase. It reads the stable post-cFp43 public
benchmark artifacts and the expanded failure-mining findings to decide whether
the remaining `round_one_overinvestment` cases justify another behavior patch
or whether v1 heuristic tuning should pause for ratings/search.

Post-cFp43 findings (parsed from committed `findings.jsonl`):
- Current (120 records): 300 findings
  (`suspicious_pass=234`, `round_three_low_resource=36`,
  `weathered_row_play=18`, `round_one_overinvestment=6`, `medic_timing_risk=0`),
  with `round_one_overinvestment_pass=81` suppressed.
- Expanded (400 records): 878 findings
  (`suspicious_pass=671`, `round_three_low_resource=86`, `weathered_row_play=86`,
  `round_one_overinvestment=26`, `medic_timing_risk=7`),
  with `round_one_overinvestment_pass=290` suppressed.

Key findings (exact JSONL values):
- Expanded `round_one_overinvestment`: 26 total, 25 loss / 1 draw.
  Faction split: nilfgaard=10, northern_realms=11, scoiatael=3, skellige=2, monsters=0.
  Loss rate: 25/26 ≈ 96.2%. The cFp43 guard has coverage gaps in its geometry
  (board >= 7, hand <= 4).
- Expanded `round_three_low_resource`: 86 total, 75 win / 6 loss / 5 draw.
  84/86 have positiveUnitMoveCount=0, 2 have positiveUnitMoveCount=1.
  Win rate: 75/86 ≈ 87.2%. Watch/noise — not actionable.
- Current `round_three_low_resource`: 36 total, 32 win / 4 loss.
  35/36 have positiveUnitMoveCount=0, 1 has positiveUnitMoveCount=1.
  Win rate: 32/36 ≈ 88.9%. Watch/noise — not actionable.
- Expanded `weathered_row_play`: 86 total, faction split nilfgaard=40,
  northern_realms=22, monsters=19, skellige=3, scoiatael=2. Stable since cFp41.2.
  cFp38 guard is in place.
- Expanded `medic_timing_risk`: 7 total. 1 is true no-target Medic
  (ownDiscardReviveCandidateCount=0); 6 have revive candidates.
  Faction split: nilfgaard=3, scoiatael=2, northern_realms=2.
  cFp39's -260 delay covers the no-target case. Low confidence signal.
- Broad `suspicious_pass` (671) is too large for direct tuning and needs a classifier pass.

Recommendation: The next behavior spec should target the remaining
`round_one_overinvestment` cases. If those 26 cases are edge cases not worth
complexity, pause v1 heuristic tuning and move toward ratings/search.

cFp44 does not change AI behavior, engine rules, legal moves, UI behavior,
catalog data, deck presets, benchmark suite shape, failure-mining classifiers,
ratings, search, training, or product difficulty.

### Remaining Round-One Overinvestment Calibration (cFp45)

cFp45 is an analysis-only follow-up to cFp44. It reads the 26 remaining
expanded `round_one_overinvestment` findings from the committed public
failure-mining artifact and creates the decision note:

```text
docs/research/literature/ai/decisions/2026-05-21-cfp45-round-one-overinvestment-calibration.md
```

Because the existing `findings.jsonl` artifact exposes only aggregate public
fields, not per-play `AiDecisionTrace` guard evaluation data, cFp45 treats the
case split as a proxy classification rather than a definitive trace-level
diagnosis:

- 15/26 cases look like `handAfter <= 4` was not reached early enough to stop
  cumulative round-1 spending.
- 11/26 cases look like `boardAfter >= 7` was not reached until the final or
  near-final round-1 play.
- No exception-specific pattern can be proven from the current artifact.

Decision: no behavior change. The two proxy groups do not support a single safe
one-step threshold calibration, and cFp43 already produced a +5 loss tradeoff
while reducing the expanded signal from 51 to 26. The recommended next step is
to pause hand-tuned v1 heuristic work for ratings/search, or first add
trace-level guard telemetry to failure mining before attempting another
round-investment patch.

cFp45 updates AI Lab/product metadata so `/ai-lab` points at the latest analysis
phase. It does not change AI behavior, engine rules, legal moves, UI behavior,
catalog data, deck presets, benchmark suite shape, failure-mining classifiers,
ratings, search, training, or product difficulty.

### Glicko Rating Layer For Benchmark Artifacts (cFp46)

cFp46 adds a deterministic, research-local Glicko-style rating layer over
existing public benchmark `records.jsonl` artifacts. It does not change AI
behavior, engine rules, legal moves, UI behavior, catalog data, deck presets,
benchmark suite definitions, failure-mining classifiers, search, training, or
product difficulty.

The rating layer:

- Reads `BenchmarkMatchRecord` rows from the committed records.jsonl files.
- Filters to eligible records (status=`completed`, winner not null, both seat
  results not `none`, replayStatus not `failed`).
- Treats each artifact as one rating period per scope.
- Initializes entities to rating=1500, RD=350, then computes Glicko-1 updates
  using pre-period ratings for all opponents.
- Produces three required scopes: `policy`, `policy_deck`, `policy_faction`
  (plus optional `policy_matchup`).
- Writes rating artifacts under `benchmark-results/<suiteId>/ratings/latest/`
  including manifest.json, ratings.json, and report.md.
- Includes interpretation warnings: ratings are not exploitability, high RD
  means uncertain, do not compare across suite pools, research-local only.

Rating artifacts generated:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/ratings/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/ratings/latest/`

No AI policy, engine rule, UI, or difficulty behavior changed.

### Robust Starter Matrix Evaluation Suite (cFp48)

cFp48 adds `benchmark-v1-starter-matrix-robust-v1`, a deterministic
25-seed / 20-matchup / mirrored starter matrix that produces 1000 public
records. It reuses the same five official starter deck descriptors and the same
v1-vs-v0 matchup builder as the current and expanded starter-matrix suites.

Generated robust artifacts:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/latest/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/snapshots/cFp48/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/comparisons/cFp48-vs-latest/`

The robust policy-level rating report has `legal-heuristic-v1` at rating
1795.34 / RD 30 over 1000 games and `legal-heuristic-v0` at rating 1204.66 /
RD 30 over the same suite. These are suite-local fixed-matrix ratings, not
exploitability, human difficulty, or a behavior change.

No AI policy behavior, engine rule, legal move, UI gameplay behavior, catalog
data, deck preset, Glicko formula, comparison threshold, search, training, or
product difficulty behavior changed.

### Robust Failure-Mining Casebook (cFp49)

cFp49 reviews only committed public artifacts from the cFp48 robust suite and
does not change policy behavior. The casebook classifies the robust
failure-mining queue as follows:

- `round_resource_exhaustion`: needs trace instrumentation. The robust
  `round_one_overinvestment` sub-signal has 71 findings with 69 losses and 2
  draws, but findings do not expose cFp43 guard-state or exception fields.
  `round_three_low_resource` has 226 findings but mostly appears in v1 wins
  with zero positive unit tempo.
- `weathered_row_low_tempo`: analyzer noise or broad signal. cFp30/cFp38
  behavior already exists, but findings do not expose penalty/exemption state.
- `medic_no_target_timing`: watch-only at 11 findings.
- `skellige_matchup_skew`: watch-only at one break-even matchup aggregate.
- `remaining_suspicious_pass`: broad analyzer signal, not a direct behavior
  patch target.

Recommended cFp50 scope: hidden-info-safe failure-mining guard-state telemetry,
centered on remaining round-one overinvestment, before another v1 behavior
patch.

No AI policy behavior, engine rule, legal move, benchmark suite definition,
failure-mining classifier, rating formula, catalog data, deck preset, product
gameplay UI, search, training, or product difficulty behavior changed.

### Round-One Guard-State Telemetry (cFp50)

cFp50 adds hidden-info-safe scalar telemetry to existing
`round_one_overinvestment` failure-mining findings. The new evidence summarizes
round-one cFp43 guard geometry, recommendation counts, exception reason counts,
score-delta direction counts, selected-card-advantage counts, catch-up status
counts, and intentional overinvestment pass counts using only public
`AiDecisionRoundInvestmentAnalysis` fields from in-memory decision traces.

The regenerated failure-mining artifact boundary covers:

- `benchmark-v1-starter-matrix-v1/failure-mining/latest/`
- `benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/`
- `benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/`

The telemetry fields are scalar `number | boolean | null` values. They do not
write card names, source IDs, runtime card instance IDs, move IDs, action refs,
hand/deck/discard arrays, raw traces, raw match states, command logs, or event
logs. Finding-kind counts, tuning-queue ranking, benchmark suite definitions,
rating formulas, and policy behavior are unchanged by this phase.

No AI policy behavior, engine rule, legal move, benchmark suite definition,
failure-mining classifier, rating formula, catalog data, deck preset, product
gameplay UI, search, training, or product difficulty behavior changed.

### Round-One Guard Telemetry Casebook (cFp51)

cFp51 is analysis-only over the cFp50 failure-mining artifacts. It classifies
the 71 robust `round_one_overinvestment` findings into public telemetry
categories:

- 44 `guard_suppressed_late_pass_no_play_recommendation` rows;
- 20 `board_floor_never_reached` rows;
- 4 `guard_base_geometry_exception_or_non_recommendation` rows;
- 2 `guard_recommended_play_selected` rows;
- 1 `hand_cap_never_reached` row;
- 0 `other_no_base_geometry` and 0 `telemetry_unavailable` rows.

Decision: do not tune `legal-heuristic-v1` thresholds from cFp51 alone. Most
rows are already-late cFp43 interventions, board-floor artifacts, or tactical
exception/non-recommendation cases. The only potential direct policy
contradictions are two guard-recommended play-selected rows, so the recommended
cFp52 scope is a reproduction/debug phase for those exact robust fixtures before
any behavior repair.

No AI policy behavior, engine rule, legal move, benchmark suite definition,
failure-mining classifier, rating formula, catalog data, deck preset, product
gameplay UI, search, training, or product difficulty behavior changed.

### Round-One Guard Fixture Reproduction Debug (cFp52)

cFp52 replays only the two cFp51 robust
`guard_recommended_play_selected` fixtures with hidden-info-safe per-decision
debug artifacts under:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp52/
```

The before-fix artifacts confirm real selected-play contradictions: Fixture A
has three selected `play_card` rows with base geometry and
`roundOneOverinvestmentRecommended === true`, and Fixture B has one selected
`play_card` contradiction plus one later suppressed pass. cFp52 does not change
policy behavior and rejects threshold widening, cumulative-spend tuning, and
analyzer calibration as unsupported direct fixes for those two rows.

### Round-One Selected-Play Guard Repair (cFp53)

cFp53 adds a shared selected-play finalization guard in
`legalHeuristicPolicyV1.ts`. Every playing-phase return path that can select a
`play_card` now checks the exact selected candidate against
`buildLegalHeuristicV1RoundInvestmentAnalysis(...)`; if the candidate is a
round-1 hand-spending play, pass is legal, the AI has more than one gem, the
opponent has not passed, and the candidate reports
`roundOneOverinvestmentRecommended === true` for `round_one_board_limit` or
`round_one_low_future_hand`, the final selected move becomes `pass`.

The repair preserves existing exceptions for Spy/card-advantage plays,
match-winning plays, cheap single-move catch-up, use-leader/non-play-card
actions, opponent-passed states, last gem, single-card hand, and
`exception_*` cFp43 reasons. `explainLegalHeuristicV1Decision(...)` now surfaces
the same round-one overinvestment / future-hand reason for cFp53 pass cases that
the policy selects.

Post-repair debug artifacts are written separately under:

```text
docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp53/
```

The cFp53 artifacts preserve the cFp52 before-fix bundle and show both fixtures
completed with zero selected-play contradictions. Fixture A and Fixture B each
produce one selected pass carrying the active round-one overinvestment
recommendation as a suppressed-pass diagnostic.

### Post-cFp53 Round-One Overinvestment Casebook (cFp54)

cFp54 is analysis-only over the committed cFp53 robust failure-mining artifact.
It classifies exactly the 70 remaining robust `round_one_overinvestment`
findings using only public scalar guard telemetry:

- 48 `already_guarded_suppressed_pass` rows.
- 20 `board_floor_never_reached` rows.
- 1 `hand_cap_never_reached` row.
- 1 `base_geometry_exception_or_nonrecommendation` row, sub-labeled
  `exception_single_move_catch_up`.
- 0 `cumulative_spend_candidate` rows.
- 0 `telemetry_unavailable_or_other` rows.

The decision note is:

```text
docs/research/literature/ai/decisions/2026-05-22-cfp54-post-cfp53-round-one-overinvestment-casebook.md
```

cFp54 recommends no behavior patch. If round-one tuning continues, the next
phase should instrument hidden-info-safe temporal/cumulative spend evidence:
first guard-geometry index, first suppressed-pass index, play-card count before
the first suppressed pass, board/hand counts immediately before the first
suppressed pass, selected plays after first base geometry and before selected
pass, and exception sequence counts before the first guard-visible pass.

### Round-One Temporal Spend Instrumentation (cFp55)

cFp55 is instrumentation/debug-only. It extends
`round_one_overinvestment` failure-mining evidence with hidden-info-safe scalar
temporal and cumulative fields. The added field groups are:

- first-event indexes for the first round-one play-card trace, first board-floor
  trace, first hand-cap trace, first base-geometry trace, first selected
  play-card recommendation, and first suppressed overinvestment pass;
- first suppressed-pass context for play-card count before the pass, public
  board/hand/score-delta scalars at the pass, and first-event-to-pass decision
  gaps;
- continue-phase and post-geometry spend counts before the first suppressed
  pass;
- score-delta direction counts before and after the first suppressed pass;
- exception, selected-card-advantage, and single-move-catch-up sequence counts
  before the first suppressed pass.

The regenerated failure-mining artifact boundary covers:

- `benchmark-v1-starter-matrix-v1/failure-mining/latest/`
- `benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/`
- `benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/`

Finding counts remain unchanged: current 300 findings with
`round_one_overinvestment=6`, expanded 878 findings with
`round_one_overinvestment=26`, and robust 2301 findings with
`round_one_overinvestment=70`. The robust repeated run produced identical
failure-mining hashes.

First robust readout from the new fields: the 70 robust
`round_one_overinvestment` rows contain 48 rows with a first suppressed
overinvestment pass. Those 48 rows average 7.85 play-card traces before that
pass (range 7-11), with first-play-to-first-suppressed-pass gaps averaging 8.15
decisions (range 7-13). Only three rows expose a base-geometry-to-suppressed-pass
gap, averaging 1.33 decisions (range 1-2); 66 rows have no selected play-card
base-geometry index under the strict play-card definition. Before the first
suppressed pass, robust rows aggregate 469 behind, 51 tied, and 91 ahead
score-delta trace buckets, plus 5 single-move-catch-up exception reasons, 26
non-play-card exception reasons, 73 selected card-advantage traces, and 264
single-move catch-up traces.

cFp56 can use this telemetry to distinguish late intervention, missing
play-card geometry, cumulative continue-phase spend, and exception-heavy
pre-pass sequences without reading raw traces or private state. cFp55 changes
no AI policy behavior, engine rules, legal moves, benchmark suite definitions,
benchmark records, ratings, debug artifacts, UI gameplay behavior, catalog data,
deck presets, search/training code, or product difficulty.

### Temporal Round-One Overinvestment Casebook (cFp56)

cFp56 is analysis-only over the committed cFp55 robust failure-mining artifact.
It classifies exactly the 70 robust `round_one_overinvestment` findings using
only public scalar temporal/cumulative evidence:

- 48 `late_guard_intervention` rows.
- 21 `no_suppressed_pass_cumulative_continue_candidate` rows.
- 1 `no_suppressed_pass_selected_base_geometry_present` row, sub-labeled
  `recommendation_absent`.
- 0 `no_suppressed_pass_geometry_absent_low_confidence` rows.
- 0 `telemetry_unavailable_or_other` rows.

The decision note is:

```text
docs/research/literature/ai/decisions/2026-05-22-cfp56-temporal-round-one-overinvestment-casebook.md
```

The largest bucket is late guard intervention (48/70), but only 3 of those rows
show selected play-card base geometry before the suppressed pass. Across all 70
rows, 66 are missing selected base geometry, 62 carry catch-up pressure, 54
carry selected-card-advantage pressure, and 27 carry exception sequence
pressure. The 21-row cumulative bucket is also mostly board-floor-never-reached
and is not dominant.

cFp56 recommends pausing hand-tuned v1 round-one heuristic tuning and moving
the next Cluster F work toward ratings/search/evaluation-ladder depth, such as
multi-period rating snapshots or search-readiness/ISMCTS probe design. If
round-one tuning is reopened later, the single Bucket B public fixture should
be replayed before any behavior change. cFp56 changes no AI policy behavior,
engine rules, legal moves, benchmark definitions, generated benchmark
artifacts, ratings, UI gameplay behavior, catalog data, deck presets,
search/training code, or product difficulty.
