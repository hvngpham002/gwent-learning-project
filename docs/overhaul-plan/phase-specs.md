# Phase Specs

Each phase below is written so the orchestrator can hand it to another implementation instance. The implementer should stay inside the named phase unless explicitly authorized to continue.

These phases are the coarse roadmap. Actual specs under `docs/spec/` may split or insert work, and `docs/PROJECT_STATE.md` is the operational source of truth for current state and completed phase mapping.

## Universal Definition Of Done

Every implementation phase must report:

- files changed;
- behavior added or changed;
- audit findings addressed, by ID where possible;
- tests run and results;
- remaining risks or follow-up work;
- screenshots or smoke reproduction notes when UI changes;
- `Project State Update`, describing the `docs/PROJECT_STATE.md` update or why none was required.

Every engine-facing phase must include deterministic tests where feasible. If no test is added, the report must explain why.

## Phase 0: Baseline Safety Net

**Cluster:** A. Baseline and safety net

**Objective:** Preserve enough of the current game behavior to migrate safely without guessing what broke.

**Scope:**

- Add a minimal test runner if none exists.
- Create test fixtures for current playable NR-vs-NR setup.
- Add audit regression fixture names for `R-001` through `R-012`, even if many start as skipped/pending.
- Add a smoke checklist for current human vs AI play with the current card count.

**Acceptance criteria:**

- `npm run build` still passes.
- There is a repeatable command for tests, even if the first pass has only a small number of tests.
- Regression fixture list includes round end, mulligan, Spy discard, Decoy, Medic, Weather, Horn, and game end.
- No game behavior is intentionally changed.

**Non-goals:**

- Do not fix audit bugs.
- Do not migrate architecture yet.

## Phase 1: Catalog Schema and Identity Model

**Cluster:** B. Data foundation

**Objective:** Define card data and card instance identity so future cards can be added without hardcoded deck assembly.

**Scope:**

- Create a card catalog schema with stable `sourceId`, `name`, `faction`, `kind`, `strength`, `rows`, `abilities`, `tags`, `deckLimit`, `image`, and optional `linkedSourceIds`.
- Create leader, faction, deck preset, and side-deck schema types.
- Define runtime `cardInstanceId` separately from `sourceId`.
- Define image path convention: `public/images/cards/{faction}/{assetSlug}.png` or explicit override.
- Create catalog validation rules.
- Create an ability registry shape that maps data ability IDs to engine resolver capability, without embedding per-card logic in card data.

**Acceptance criteria:**

- Current code can import schema types without breaking.
- Validator can detect duplicate `sourceId`, missing required fields, invalid factions, invalid rows, missing image path string, and unknown ability IDs.
- Design supports current cards and future cards with no hardcoded name lookups.

**Non-goals:**

- Do not convert all cards yet.
- Do not build the card editor UI yet.

## Phase 2: Current Card Migration and Card Studio Plan

**Cluster:** B. Data foundation

**Objective:** Move existing card definitions into the new catalog path and design the user-facing card creation workflow.

**Scope:**

- Migrate existing neutral, Northern Realms, and Nilfgaard card definitions into catalog packs.
- Preserve enough default deck presets for the game to remain playable with the current card set.
- Add placeholder empty packs for Monsters, Scoia'tael, and Skellige with clear extension points.
- Add a source-of-truth guide for adding card images and card details.
- Create the Card Studio implementation spec: form fields, validation, preview, localStorage draft save, JSON export/import, and deck-preset integration.

**Acceptance criteria:**

- Current cards can be loaded from the catalog.
- Default playable decks are assembled from deck presets and catalog references, not hardcoded `.find(name)` calls.
- Missing future faction data does not crash the app unless that faction is selected without a valid deck preset.
- The docs tell a future maintainer exactly where to drop an image and where to add card metadata.

**Non-goals:**

- Card Studio UI implementation may be deferred to Phase 11 if this phase gets large.
- Do not require all official cards to exist.

## Phase 3: Core Match State and Transactions

**Cluster:** C. Pure game engine

**Objective:** Create the pure, deterministic engine state and transaction model.

**Scope:**

- Introduce seat-neutral types: `SeatId`, `PlayerId`, `MatchState`, `Zone`, `BoardSlot`, `RoundState`, `GamePhase`.
- Represent rows, horn slots, weather area, side deck, discard, hand, deck, leader, and removed-from-game zone.
- Store card instances with `sourceId`, `instanceId`, `owner`, `controller`, `currentZone`.
- Add seeded RNG interface and deterministic seed plumbing.
- Define commands and events, for example `PlayCard`, `Pass`, `UseLeader`, `ChooseMulligan`, `ResolveRoundEnd`.
- Return transaction results as `{ state, events, prompts }`.

**Acceptance criteria:**

- Pure engine module has no React, Redux, DOM, or localStorage dependency.
- Every transaction is deterministic given state, command, and RNG seed.
- Replay skeleton can apply a list of commands to reconstruct state.
- Card ownership and controller are distinct, enabling Spy cleanup to be correct.

**Audit drivers addressed:** `R-001`, `R-004`, `R-006`, `R-008`, `R-010`, `R-012`.

## Phase 4: Legal Move Generator

**Cluster:** C. Pure game engine

**Objective:** Make the engine the only source of legal actions.

**Scope:**

- Implement `getLegalMoves(state, seat)` with legal card plays, legal rows, legal targets, leader use, pass, and mulligan choices.
- Include prompt-based decisions for interactive chains such as Medic, Decoy, Scoia'tael first-player choice, and leader targets.
- Legal moves must include enough metadata for UI rendering and AI scoring.
- Human UI and AI should eventually consume this same API.

**Acceptance criteria:**

- Legal move generator rejects illegal row placement, second Horn on occupied Horn slot, invalid Medic targets, invalid Decoy targets, and leader reuse.
- Legal move generator treats Agile rows correctly.
- Legal move generator does not leak hidden info beyond the acting seat's observation for AI-facing callers.

**Audit drivers addressed:** `F-3.10`, `F-3.14`, `F-3.15`, `F-4.4`, `F-8.1`, `F-8.3`, `F-9.2`.

## Phase 5: Scoring Pipeline

**Cluster:** C. Pure game engine

**Objective:** Replace scattered score helpers with one rule-correct scoring pipeline.

**Scope:**

- Implement one score function used by UI, round end, AI, simulations, and tests.
- Apply modifier order from the rulebook: Weather, Tight Bond, Morale Boost, Commander's Horn.
- Enforce Hero immunity centrally.
- Support Skellige Storm and King Bran hook points.
- Return breakdowns for explainability and UI tooltips.

**Acceptance criteria:**

- Audit worked examples pass: no-weather Tight Bond/Morale/Horn and weather-on Biting Frost example.
- Heroes ignore weather, Horn, Morale, Scorch, Decoy, Medic, and faction persistence as applicable.
- AI no longer uses a divergent mini-calculation for ranking basic unit plays.

**Audit drivers addressed:** `F-5.11`, `F-5.17`, `F-8.6`, `F-10.1`, `F-10.4`, Phase 11 carry-forward.

## Phase 6: Ability Resolver

**Cluster:** C. Pure game engine

**Objective:** Centralize all card and leader abilities in one resolver path.

**Scope:**

- Implement ability resolver registry for current and planned abilities.
- Cover current abilities: Spy, Medic, Muster, Tight Bond, Morale Boost, Scorch, Scorch Close, Commander's Horn, Decoy, Frost, Fog, Rain, Clear Weather, Skellige Storm, leader Clear Weather.
- Add structured placeholders for missing abilities: Unit Horn/Dandelion, Summon/Avenger, Berserker, Mardroeme, Roach/Hero Muster, all leader abilities.
- Ability resolution must produce prompts where human choice is needed and policy hooks where AI choice is needed.

**Acceptance criteria:**

- Human and AI ability resolution share the same execution path.
- Medic cannot be skipped when a legal target exists.
- Medic chains stop according to rules and do not over-chain after non-Medic revives.
- Muster pulls from legal zones, removes from source zones, and preserves deck order or shuffles only when rules require it.
- Decoy remains a special placeholder or row occupant without becoming a fake Unit.
- Spies return to controller discard when removed.

**Audit drivers addressed:** `R-004`, `R-005`, `R-009`, `R-010`, `R-012`, `F-8.*`, `F-9.*`, `F-10.4`.

## Phase 7: Round, Game, and Faction Resolver

**Cluster:** C. Pure game engine

**Objective:** Make round and game progression atomic, idempotent, and faction-aware.

**Scope:**

- Implement atomic pass-to-round-end resolution.
- Determine round winner from the shared scoring pipeline.
- Apply Nilfgaard draw-win, Monsters keep-one, Northern Realms draw-on-win, Scoia'tael first-player choice, and Skellige round-3 return.
- Implement game end and simultaneous last-gem draw from post-decrement state only.
- Remove auto-new-game from rule resolution; make it a UI command after game end.

**Acceptance criteria:**

- `ResolveRoundEnd` cannot apply twice to the same logical round.
- Winner starts the next round except explicit rule exceptions.
- `gameEnd` is derived from authoritative post-round state.
- No reducer or engine transition calls `Math.random()` directly.
- Current card set remains playable even if some faction packs are empty.

**Audit drivers addressed:** `R-001`, `R-002`, `R-008`, `F-5.3` through `F-5.10`, `F-6.*`, `F-7.*`.

## Phase 8: Redux Adapter and UI State Machine

**Cluster:** D. App migration

**Objective:** Wrap the engine in Redux without letting Redux or React own rule outcomes.

**Scope:**

- Create a Redux slice that stores engine `MatchState`, command history, prompt state, and UI-only selection.
- Add an action lock for resolving commands, prompts, animations, and AI thinking.
- Convert selectors to view models.
- Keep timers and animations outside rule transitions.

**Acceptance criteria:**

- Components dispatch engine commands, not ad hoc rule mutations.
- `canPlayerAct` is false during prompts unless the prompt expects player input.
- Pass, card play, leader use, and modal choices are mutually exclusive.
- No component re-computes game-end winner or round-end effects.

**Audit drivers addressed:** `F-4.2`, `F-4.10`, `F-4.11`, `F-6.2`, `F-6.3`, `R-007`.

## Phase 9: Human Play Migration

**Cluster:** D. App migration

**Objective:** Restore the current human playable experience using the engine-backed UI.

**Scope:**

- Update hand, board, weather row, leader, pass, mulligan, Decoy, Medic, and row-selection flows to use legal moves.
- Render prompts from engine transaction results.
- Preserve current visual styling unless it blocks usability.
- Add basic user-visible explanation for why a card cannot be played, where practical.

**Acceptance criteria:**

- Current NR-vs-NR game is playable end to end.
- Human cannot play after passing, cannot skip mandatory Medic when legal, cannot use invalid rows, and cannot spend Horn on an occupied Horn slot.
- Human leader ability works if legal for the selected leader.

**Non-goals:**

- Do not build full deck builder yet unless Phase 11 is pulled forward.

## Phase 10: AI Policy Migration

**Cluster:** D. App migration

**Objective:** Move the existing AI onto legal moves and shared engine scoring.

**Scope:**

- Replace direct `state.opponent` assumptions with seat-parameterized policy inputs.
- AI receives an observation and legal moves, then returns a selected move.
- Port current heuristic strategy as `HeuristicPolicyV1`.
- Ensure AI uses shared scoring and legal-target metadata.
- Keep simple delays as UI presentation only.

**Acceptance criteria:**

- AI can play either seat in tests.
- AI never chooses an illegal move because illegal moves are not in its action set.
- Agile, Horn, Medic, Decoy, Weather, Scorch, and Leader decisions use engine metadata.
- AI-vs-human current game remains playable.

**Audit drivers addressed:** `R-006`, `R-007`, `F-3.15`, `F-4.4`, `F-5.17`, `F-8.1`, `F-9.2`, `F-10.4`.

## Phase 11: Deck Builder and Card Authoring UI

**Cluster:** E. Content and game modes

**Objective:** Let users assemble decks and add card data without changing rule code.

**Scope:**

- Build Deck Builder over the catalog and deck validator.
- Build Card Studio UI for creating or editing catalog-compatible card records.
- Support image path entry, preview, validation, local draft save, JSON export, JSON import, and deck preset creation.
- Add default "current cards" presets so game remains playable with incomplete catalog.

**Acceptance criteria:**

- User can build a legal deck from current cards.
- User can add a custom card record through Card Studio, export it, import it, and use it in a deck if its ability is known.
- App clearly marks cards whose ability is unknown or unimplemented.
- Deck builder supports side deck where applicable.

**Non-goals:**

- The browser-only app does not need to write directly to repo files. Export/import is enough unless a local dev server write endpoint is explicitly approved later.

## Phase 12: Match Modes

**Cluster:** E. Content and game modes

**Objective:** Make match configuration independent from "human is player, AI is opponent."

**Scope:**

- Add match setup with two seats and controller type: human, local human, bot.
- Support human vs AI, local PvP, and AI vs AI.
- Add seed selection for deterministic replay.
- Add replay viewer skeleton from event logs.

**Acceptance criteria:**

- Same engine supports all three modes.
- Seat swap tests pass.
- AI vs AI can complete a match without UI input.
- PvP does not expose hidden hand info to the wrong local player except where same-device UI deliberately allows it.

## Phase 13: Simulation Harness

**Cluster:** F. Simulation and ML

**Objective:** Run many games headlessly for AI evaluation and later ML.

**Scope:**

- Add batch simulation runner that takes deck presets, policies, seeds, and match count.
- Emit JSONL event logs and summary metrics.
- Add policy interfaces for random, heuristic, scripted, and future learned policies.
- Add deterministic replay from command logs.

**Acceptance criteria:**

- AI vs AI simulation can run without React.
- Same seed and policies produce the same result.
- Logs include enough detail to reconstruct state and train/evaluate policies.
- Metrics include win rate, average score differential, average rounds, pass timing, card advantage, and illegal move count.

## Phase 14: ML Readiness

**Cluster:** F. Simulation and ML

**Objective:** Shape the engine into a training environment for a future "Gwent master."

**Scope:**

- Define observation space per seat.
- Define action encoding and legal action masks.
- Define reward signals for match win, round win, card advantage, and score differential.
- Add baseline evaluation protocol and tournament/Elo harness.
- Add export format for Python or other ML tooling.

**Acceptance criteria:**

- A random legal policy and heuristic policy can be evaluated through the same environment.
- Observation does not include hidden opponent hand/deck unless a cheat/debug flag is explicit.
- Action masks prevent illegal model outputs from corrupting state.
- Logs are stable enough for offline supervised learning or reinforcement learning experiments later.

**Non-goals:**

- Do not train a production-quality model in this phase.

## Phase 15: Cleanup, Audit Closure, and Documentation

**Cluster:** G. Cleanup and hardening

**Objective:** Remove old paths and close the architectural migration.

**Scope:**

- Remove or quarantine legacy `GameManager`, `useAI`, and `useGameLogic` paths after active behavior is migrated.
- Update README to match actual architecture.
- Produce an audit closure matrix for `R-001` through `R-012` and all completed phase findings.
- Document how to add cards, abilities, deck presets, policies, and match modes.
- Add final regression tests for known audit traces.

**Acceptance criteria:**

- No active rule path bypasses the engine.
- Human, AI, PvP, and simulation all use shared legal moves and resolvers.
- Audit closure matrix is explicit about fixed, deferred, and intentionally unsupported items.
- Build, lint, tests, and a manual smoke pass are green.
