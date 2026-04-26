# Project State

## Last Updated

- Date: 2026-04-26
- Phase/spec: post-`cEp1` authentic fallback row/ability badge polish
- Latest relevant commit: `cEp1` implementation commit plus follow-up authentic card rendering and fallback badge tuning

## Required Reading For Every Coding Instance

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- Active spec under `docs/spec/`
- Latest relevant report under `audit/reports/`
- `docs/gwent-rules.md` when touching rules
- For Cluster E UI work: `docs/overhaul-plan/cluster-e-ui-plan.md`, `docs/ui-handoff/README.md`, and the relevant prototype file under `docs/ui-handoff/prototype/`

## Current Architecture

- Legacy UI remains the default route.
- Engine UI is opt-in through `?engine=1` or `VITE_ENGINE_UI=1`.
- An opt-in authentic UI foundation harness is now available at `?engine=1&ui=authentic`. It is a gallery-only foundation, not a playable match screen.
- The pure engine under `src/game/core/` owns rules, legal moves, scoring, prompts, command transactions, round resolution, and game end.
- The Redux engine adapter stores `MatchState`, status/locks, command history, event logs, adapter errors, and UI-only selection while dispatching engine commands.
- Catalog and deck preset data under `src/game/catalog/` and `src/data/catalog/` define card, leader, faction, ability metadata, and current playable presets.
- Authentic UI components under `src/components/gwent/` provide the production card visual path, faction/row/ability/leader display metadata, and the opt-in harness. They do not import legacy rule helpers, legacy AI modules, or engine board state, and they are covered by the forbidden-imports check.
- The selected front-facing product UI direction is the `docs/ui-handoff/` Authentic Tactical Card Table handoff. The diagnostic engine shell remains the engine UI default until later Cluster E phases promote the engine-backed authentic match screen.

## Completed Phase Ledger

| Spec ID | Original roadmap mapping | Report | Outcome |
|---|---|---|---|
| `cAp0` | Cluster A Phase 0 | `audit/reports/2026-04-24-cAp0-report.md` | Added baseline safety net, smoke notes, and initial regression fixture structure. |
| `cBp1` | Cluster B Phase 1 | `audit/reports/2026-04-24-cBp1-report.md` | Added catalog schema, identity model, validators, and ability registry shape. |
| `cBp2` | Cluster B Phase 2 | `audit/reports/2026-04-24-cBp2-report.md` | Migrated current cards/presets into catalog paths and documented Card Studio direction. |
| `cCp3` | Cluster C Phase 3 | `audit/reports/2026-04-25-cCp3-report.md` | Added pure match state, setup, seeded RNG, commands, events, and transactions. |
| `cCp4` | Cluster C Phase 4 | `audit/reports/2026-04-25-cCp4-report.md` | Added legal move generation as the engine UI/AI contract. |
| `cCp5` | Inserted command transaction split before original Cluster C Phase 5 | `audit/reports/2026-04-25-cCp5-report.md` | Added immutable command execution, validation, stateful transactions, and Redux-ready command semantics. |
| `cCp6` | Cluster C Phase 6 | `audit/reports/2026-04-25-cCp6-report.md` | Added ability resolver coverage for current and placeholder abilities. |
| `cCp7` | Original Cluster C Phase 5 scoring pipeline, delivered after command transactions | `audit/reports/2026-04-25-cCp7-report.md` | Added shared scoring pipeline, effective-strength breakdowns, and Scorch integration. |
| `cCp8` | Original Cluster C Phase 7 round/game resolver | `audit/reports/2026-04-25-cCp8-report.md` | Added atomic round settlement, game end, idempotency state, and faction passives. |
| `cDp1` | Cluster D Phase 8 split | `audit/reports/2026-04-25-cDp1-report.md` | Added Redux engine adapter, thunks, selectors, locks, history, and adapter tests. |
| `cDp2` | Cluster D Phase 9 split | `audit/reports/2026-04-25-cDp2-report.md` | Added opt-in engine UI shell with mulligan, pass, round resolution, and scripted preview AI. |
| `cDp3` | Cluster D Phase 9 split | `audit/reports/2026-04-25-cDp3-report.md` | Added legal-move-backed human card play through button-driven target actions. |
| `cDp4` | Cluster D Phase 9 split | `audit/reports/2026-04-25-cDp4-report.md` | Added legal-move-backed leader and prompt controls plus special-action diagnostics. |
| `cDp5` | Cluster D Phase 10 split | `audit/reports/2026-04-25-cDp5-report.md` | Replaced pass-only preview AI with deterministic `legal-heuristic-v0` over engine legal moves. |
| `cDp6` | Cluster D Phase 10 shell polish split | `audit/reports/2026-04-25-cDp6-report.md` | Added shell view-model helpers, clearer status/next-action UX, grouped target actions, hidden-info-safe activity summaries, and round history display. |
| `cDp7` | Cluster D browser smoke hardening split | `audit/reports/2026-04-25-cDp7-report.md` | Added Playwright Chromium browser smoke coverage for opt-in routing, `dp6-smoke` mulligan/play flow, hidden-info display, and mobile overflow, plus CI browser execution. |
| `cDp8` | Cluster D / simulation foundation split | `audit/reports/2026-04-26-cDp8-report.md` | Added pure headless AI-vs-AI simulation smoke runner, compact logs/metrics, max-step failure status, deterministic replay helper, docs, and forbidden-import coverage for `src/game/sim`. |
| `cDp9` | Cluster D / simulation diagnostics split | `audit/reports/2026-04-26-cDp9-report.md` | Added bounded batch seed suites, compact aggregate diagnostics, replay diagnostics, deterministic fingerprints, and batch simulation docs over the cDp8 runner. |
| `cDp10` | Cluster D / hidden-info-safe export contract split | `audit/reports/2026-04-26-cDp10-report.md` | Added deterministic in-memory simulation export rows with safe perspective observations, per-row legal action encoding, chosen action indices, sparse terminal reward placeholders, summaries, diagnostics, and docs. |
| `cDp11` | Cluster D / safe export validation and JSONL boundary split | `audit/reports/2026-04-26-cDp11-report.md` | Added runtime validation, recursive redaction scanning, deterministic in-memory JSONL serialization, JSONL parsing/round-trip reconstruction, tests, and docs for `sim-export-v1`. |
| `cEp1` | Cluster E / authentic UI foundation | `audit/reports/2026-04-26-cEp1-report.md` | Added Direction A production tokens, catalog-aware display metadata, authentic card and card-back components with deterministic SVG fallback, opt-in `?engine=1&ui=authentic` harness, focused tests, browser smoke, and docs without changing engine rules or replacing the default route. |
| `cWp0` | Workflow hardening inserted before continuing Cluster D | `audit/reports/2026-04-25-cWp0-report.md` | Added living state docs, agent instructions, stable plan path, CI workflow, checks, and versioning policy. |

## Current Cluster D Status

The engine UI can start a current Northern Realms vs Nilfgaard match, complete human and AI mulligans, render engine state, play human cards through engine legal moves, use implemented legal leader moves, resolve human prompts from legal prompt moves, pass, resolve rounds, and show game end without auto-starting a new game.

The AI seat now uses `legal-heuristic-v0`, a deterministic policy that observes public state plus its own hand, selects from engine legal moves, and dispatches exact engine commands for mulligan, card play, prompt choice, useful Clear Weather leader use, and pass decisions.

The opt-in shell now has a compact phase/round/actor/status banner, human hand playable/disabled affordances, grouped selected-card target buttons, prompt ownership clarity, hidden-info-safe recent activity summaries, round-end score context, and a compact round history list.

The browser smoke harness now runs the opt-in engine shell through Playwright Chromium against a built Vite preview server. It checks default-route legacy behavior, `/?engine=1&seed=dp6-smoke` mulligan and first-play flow, AI hand-count-only display, hidden-info-safe recent activity text, and mobile horizontal overflow.

The headless simulation harness now runs the current Northern Realms vs Nilfgaard AI-vs-AI match without React, Redux, timers, browser APIs, localStorage, or filesystem writes. It uses the same pure engine legal moves, seat observations, `legal-heuristic-v0`, command conversion, and command execution path as the engine UI, with simulation-only round-end auto-resolution, compact step logs, summary metrics, max-step protection, and replay from command logs.

The batch simulation layer now runs the fixed `current-smoke-v1` six-seed suite over the cDp8 runner, continues after per-seed failures, returns compact per-run diagnostics by default, aggregates completion/max-step/prompt/replay/failure metrics, and supports opt-in raw single-run results for debugging only.

The safe simulation export layer now builds deterministic in-memory `sim-export-v1` datasets from replayed pre-command states. Rows include `safe-observation-v1` acting-seat observations, `legal-action-v1` ordered legal action lists, chosen action indices, sparse `reward-v1` terminal placeholders, compact outcome metadata, and export diagnostics. Default rows exclude raw final states, command logs, full events, `cardsById`, raw engine card instance ids, opponent hidden hand identities, opponent deck identities/order, and own deck order.

The export validation and JSONL boundary now validates `sim-export-v1` datasets at runtime, scans recursively for raw-debug and hidden-info hazards, can reject system action rows for policy-only datasets, serializes validated datasets to deterministic in-memory `sim-export-jsonl-v1` strings, and parses JSONL back into rows/reconstructed datasets with structured issues for malformed input.

It cannot yet provide strong strategic AI parity, polished spatial board interactions, full deck-building flows, persistence, PvP, JSONL file writing, Python ML exports, fixed neural action vectors, model training, or default-route engine gameplay.

## Current Cluster E Status

The authentic UI foundation now ships behind `?engine=1&ui=authentic`:

- production Direction A tokens load via `src/styles/gwent-tokens.css`, scoped under a `.gwent-authentic` wrapper so the legacy UI is unaffected;
- `src/components/gwent/displayMetadata.ts` exposes deterministic faction, row, ability, leader-ability, and card-kind display metadata with documented fallbacks for unknown ids;
- `src/components/gwent/AuthenticCard.tsx` and `AuthenticCardBack.tsx` render current catalog cards through a UI view model with image-failure fallback to a deterministic `SvgCardArt` placeholder;
- `src/components/gwent/AuthenticUiHarness.tsx` shows sample Northern Realms, Nilfgaard, neutral, hero, and special cards alongside a hidden card back, missing-image fallback example, and metadata chips for browser smoke;
- authentic card source images use tuned per-size targets: `xs` is `63px` by `95px` with `12px` crop, `sm` is `70px` by `115px` with `12px` crop, `md` is `86.5px` by `147px` with `15px` crop, and `lg` is `118px` by `200px` with `20px` crop;
- deterministic fallback card art keeps rule-like markers in the left-side badge stack: fallback unit/hero cards show row and ability glyphs below the strength medallion, all displayable catalog abilities have fallback glyph coverage, and the old decorative top-right hero ring has been removed so it is not mistaken for playable-row or rule metadata;
- `AuthenticCardBack` uses faction default back images such as `public/images/northern_realms/default-northern_realms.png`, stretches those backs to fit, and still supports override candidates under `public/images/card-backs/`;
- `src/appMode.ts` adds `getEngineUiVariantFromSearch` so `?engine=1&ui=authentic` reaches the harness without disturbing `/` or `?engine=1`;
- the forbidden-imports check now scans `src/components/gwent/` so the new product UI path stays free of legacy rule helpers and AI;
- new unit and component tests cover the route helper, display metadata, and card view model;
- the existing Playwright Chromium smoke now also covers the authentic harness at desktop and mobile widths and asserts no leaked internal IDs.

The harness is intentionally a gallery foundation, not a playable match screen, deck builder, or pre-game flow. `cEp2` will build the engine-backed match table on top of the same components and tokens.

## Current Cluster E Direction

Cluster E is now the product-facing UI track, integrated in `docs/overhaul-plan/cluster-e-ui-plan.md`.

The selected UI is the `docs/ui-handoff/` Authentic Tactical Card Table handoff: parchment-and-ink styling, EB Garamond display text, JetBrains Mono labels, faction-striped cards, dense tactical rows, pre-game setup, deck builder, match table, discard browser, prompts, and round-end overlay.

The handoff is a design source, not a logic source. Cluster E implementations must not port `prototype/match-engine.jsx`, `prototype/tweaks-panel.jsx`, browser-global prototype wiring, stub card pools, or stale legacy code paths. Production UI must consume current catalog data, engine legal moves, engine prompts, Redux engine adapter selectors, and AI policies.

Recommended Cluster E sequence:

- `cEp1`: authentic UI foundation, Direction A tokens, card visual system, and opt-in route/gallery harness;
- `cEp2`: engine-backed authentic match table v1;
- `cEp3`: product match interactions, prompts, discard browser, and round overlay;
- `cEp4`: pre-game setup and match configuration;
- `cEp5`: catalog-backed deck builder v1;
- `cEp6`: Card Studio and content workflow;
- `cEp7`: promote product UI and expand modes when coverage is ready.

## Known Architectural Rules

- Engine legal moves are the UI/AI contract.
- React and Redux may not compute rule outcomes.
- Engine UI and adapter paths may not use legacy rule helpers or legacy AI.
- AI hidden hand details must not appear in the default human engine view.
- `docs/gwent-rules.md` is the authority for rule behavior.

## Active Risks And Limits

- Browser click-through is now covered by a small Playwright Chromium smoke harness, but it is intentionally short and does not finish a full game.
- Engine UI is not default.
- `legal-heuristic-v0` is intentionally weak and deterministic; it proves legal-move AI plumbing but is not full strategic AI.
- Current catalog is incomplete by design.
- Placeholder leader/card abilities remain deferred until scoped specs implement them.
- The immediate AI action loop remains effect-driven and intentionally delay-free; shell summaries make the aftermath legible, but richer pacing remains deferred.
- Mobile layout has wrapping safeguards for controls and target groups, but final spatial board UX remains out of scope.
- Playwright browser binaries install outside the repository cache locally, so first-time local setup may require filesystem/network permission. GitHub Actions installs Chromium explicitly before running the browser gate.
- Browser selectors are stable `data-testid` hooks on visible shell regions and controls, but they are still coupled to the current button-driven smoke surface and should be revised when the final spatial board UI lands.
- Browser CI now runs an additional build plus Chromium smoke suite after `npm run ci`; runtime is still small for three tests, but browser install/download time can dominate cold CI runs.
- Headless simulation has max-step protection, but non-termination is still a risk for future policies that repeatedly choose legal no-progress moves; keep bounded runs and status checks around every simulation entrypoint.
- Prompt handling is covered by the cDp8 smoke seed through a Medic prompt, but broader prompt kinds and chained prompt-heavy games need future seed suites.
- Simulation step logs are compact and avoid full observations/state snapshots, but `commandLog`, final state, and event logs can contain hidden card instance/source IDs for replay; they are not hidden-info-safe ML export data yet.
- Replay verifies deterministic command application for the current catalog config, but it does not yet hash observations, validate every intermediate state, or promise cross-version replay compatibility.
- Policy failures are reported as structured `policy_failed` results for missing acting seats, thrown policy exceptions, no selected move, illegal selected moves, or move conversion failure; stronger policy diagnostics and illegal-action metrics belong in later simulation phases.
- Batch diagnostics are intentionally compact and hidden-info cautious by default, but `includeRawResults: true` exposes cDp8 final states and command logs for debugging; those raw results are not ML-safe export rows.
- `current-smoke-v1` is a small fixed seed suite for regression visibility, not a tournament matrix or policy evaluation ladder.
- Safe export rows are hidden-info-safe by explicit field selection plus cDp11 validation/redaction scanning, but future consumers still need file/storage policy before writing JSONL outside memory.
- Legal actions remain per-row lists rather than a fixed model action vector; downstream ML tooling must still define tensorization/masking.
- Reward placeholders are sparse terminal outcomes only; no shaped reward design or round-level training signal exists yet.
- `includeSystemActions: true` can expose simulation auto-resolver rows for diagnostics, but default policy datasets continue to exclude `resolve_round_end`.
- JSONL parsing validates reconstructed datasets and reports malformed input as structured issues, but it is not a replay checker, schema library, compression format, Python bridge, or compatibility guarantee.
- The UI handoff prototype is fixed-size and browser-global by design; Cluster E must adapt it into responsive React/TypeScript components and production styling.
- The UI handoff README contains stale pre-overhaul paths. Use current catalog, engine, Redux adapter, AI, and simulation paths instead.
- The authentic UI foundation harness is a gallery only. It does not exercise engine commands, legal moves, prompts, or AI; future phases must wire those without regressing the hidden-info safety properties already covered for the diagnostic shell.
- The authentic harness depends on a Google Fonts `@import` for `EB Garamond` and `JetBrains Mono`. Production deployments without external font access fall back to the documented serif/monospace stacks.
- Card images are still incomplete by design. The `SvgCardArt` placeholder is a deterministic fallback, not a content workflow.
- Faction-specific card-back files are not present in the repository yet. Until they are added under `public/images/card-backs/`, the authentic back component falls back to synthetic faction-colored sleeves.

## Next Recommended Step

Plan `cEp2`: replace the diagnostic shell with the engine-backed authentic match table. Reuse `AuthenticCard`/`AuthenticCardBack`, the display metadata helpers, and the `.gwent-authentic` token wrapper, drive board/hand/pile rendering from engine selectors and legal moves, and keep hidden zones rendering backs/counts only. Do not move legacy rule helpers or AI into the new UI path.

## Update Requirements

- Every implementation phase must update this file.
- Every spec-only phase should update this file if it changes roadmap, status, or next step.
- CI enforces this on relevant pull requests through `npm run check:project-state`.
