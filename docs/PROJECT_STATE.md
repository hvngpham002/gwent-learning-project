# Project State

## Last Updated

- Date: 2026-04-25
- Phase/spec: `cDp7` engine browser smoke harness spec
- Latest relevant commit: `c1dbef7` (`cDp6` implementation); `cDp7` spec pending commit

## Required Reading For Every Coding Instance

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- Active spec under `docs/spec/`
- Latest relevant report under `audit/reports/`
- `docs/gwent-rules.md` when touching rules

## Current Architecture

- Legacy UI remains the default route.
- Engine UI is opt-in through `?engine=1` or `VITE_ENGINE_UI=1`.
- The pure engine under `src/game/core/` owns rules, legal moves, scoring, prompts, command transactions, round resolution, and game end.
- The Redux engine adapter stores `MatchState`, status/locks, command history, event logs, adapter errors, and UI-only selection while dispatching engine commands.
- Catalog and deck preset data under `src/game/catalog/` and `src/data/catalog/` define card, leader, faction, ability metadata, and current playable presets.

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
| `cWp0` | Workflow hardening inserted before continuing Cluster D | `audit/reports/2026-04-25-cWp0-report.md` | Added living state docs, agent instructions, stable plan path, CI workflow, checks, and versioning policy. |

## Current Cluster D Status

The engine UI can start a current Northern Realms vs Nilfgaard match, complete human and AI mulligans, render engine state, play human cards through engine legal moves, use implemented legal leader moves, resolve human prompts from legal prompt moves, pass, resolve rounds, and show game end without auto-starting a new game.

The AI seat now uses `legal-heuristic-v0`, a deterministic policy that observes public state plus its own hand, selects from engine legal moves, and dispatches exact engine commands for mulligan, card play, prompt choice, useful Clear Weather leader use, and pass decisions.

The opt-in shell now has a compact phase/round/actor/status banner, human hand playable/disabled affordances, grouped selected-card target buttons, prompt ownership clarity, hidden-info-safe recent activity summaries, round-end score context, and a compact round history list.

It cannot yet provide strong strategic AI parity, polished spatial board interactions, full deck-building flows, persistence, PvP, simulations, ML exports, or default-route engine gameplay.

## Known Architectural Rules

- Engine legal moves are the UI/AI contract.
- React and Redux may not compute rule outcomes.
- Engine UI and adapter paths may not use legacy rule helpers or legacy AI.
- AI hidden hand details must not appear in the default human engine view.
- `docs/gwent-rules.md` is the authority for rule behavior.

## Active Risks And Limits

- Browser click-through is still mostly manual; existing coverage is helper, core, Redux, and route smoke.
- Engine UI is not default.
- `legal-heuristic-v0` is intentionally weak and deterministic; it proves legal-move AI plumbing but is not full strategic AI.
- Current catalog is incomplete by design.
- Placeholder leader/card abilities remain deferred until scoped specs implement them.
- The immediate AI action loop remains effect-driven and intentionally delay-free; shell summaries make the aftermath legible, but richer pacing remains deferred.
- Mobile layout has wrapping safeguards for controls and target groups, but final spatial board UX remains out of scope.

## Next Recommended Step

Implement `docs/spec/2026-04-25-cDp7-specs.md`: add a small Playwright browser smoke harness for the opt-in engine shell, cover default-route opt-in behavior, `dp6-smoke` mulligan/play flow, hidden-info display, mobile overflow, and GitHub Actions browser execution. Defer AI-vs-AI simulation until the browser smoke guardrail exists.

## Update Requirements

- Every implementation phase must update this file.
- Every spec-only phase should update this file if it changes roadmap, status, or next step.
- CI enforces this on relevant pull requests through `npm run check:project-state`.
