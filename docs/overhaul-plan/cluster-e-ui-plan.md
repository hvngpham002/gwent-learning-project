# Cluster E UI Product Plan

This plan integrates the selected UI handoff in `docs/ui-handoff/` into the overhaul roadmap. Cluster E is now the product-facing UI track: it should turn the deterministic engine and Redux adapter into the authentic card-table game experience, then layer deck configuration, deck building, card authoring, and broader match modes on top.

## Source Decision

The UI direction is the `docs/ui-handoff/` design handoff, reviewed in full on 2026-04-26:

- `README.md`
- `prototype/tokens.css`
- `prototype/shared.jsx`
- `prototype/pre-game-screen.jsx`
- `prototype/deck-builder-screen.jsx`
- `prototype/match-screen.jsx`
- `prototype/match-engine.jsx`
- `prototype/tweaks-panel.jsx`
- `prototype/Gwent - Prototype.html`

The canonical visual direction is **Authentic Tactical Card Table**, also called Direction A in `tokens.css`.

Use these traits as product requirements:

- warm parchment and ink palette;
- `EB Garamond` for the authentic body/display voice, including standard buttons and labels, with `JetBrains Mono` reserved for data/debug text such as seeds, imported JSON, runtime IDs, and compact numeric badges;
- restrained ink-red accent, brass/gold secondary detail, faction color stripes;
- small radius, paper/card texture feel, tactical table density;
- match screen as the primary product surface, not a marketing landing page.

## Production Boundaries

The handoff is a design reference, not production logic.

Do not port:

- `prototype/match-engine.jsx`;
- `prototype/tweaks-panel.jsx`;
- browser-global wiring from `Gwent - Prototype.html`;
- prototype stub card pools, leader arrays, or localStorage deck model as production data;
- any stale prototype-era paths that remain in older specs or examples; the handoff README now includes a production note pointing to current catalog, engine, adapter, and authentic component paths.

Production code must use the current architecture:

- card and leader data from `src/game/catalog/` and `src/data/catalog/`;
- rules, legal moves, prompts, scoring, and round/game resolution from `src/game/core/`;
- AI decisions from `src/game/ai/`;
- simulation/export code from `src/game/sim/`;
- Redux engine adapter state and selectors from the engine lane under `src/store/`.

The UI may select, inspect, animate, and dispatch exact engine commands. It may not compute rule outcomes, infer game end, mutate card zones, invent legal targets, or expose hidden opponent card identities.

## Route Strategy

The legacy UI should remain the default until the product UI is meaningfully playable. The existing opt-in engine shell remains useful as a diagnostic harness.

Recommended rollout:

- keep `/` as the legacy route for now;
- keep the current `?engine=1` shell available during the first UI foundation phase;
- introduce the authentic product UI behind an explicit opt-in such as `?engine=1&ui=authentic` while it is incomplete;
- once the authentic match screen can complete a current human-vs-AI game, promote it to the normal engine route and keep the old shell behind a dev/debug flag only if it still catches regressions.

## Screen Mapping

### Match Screen

The `prototype/match-screen.jsx` layout is the target match experience:

- top bar with exit, title, round, actor, and phase context;
- left column for opponent score/gems, deck/discard piles, weather/pass actions, and player score/gems;
- center card table with six tactical rows ordered opponent siege/ranged/close, divider, player close/ranged/siege, plus hand strip;
- right column for selected-card inspector, legal target/actions, prompts, and battle log;
- round-end overlay and discard browser as product interactions.

Production match UI must be driven by engine view models and legal moves. The prototype's toy `playCard`, `resolveMedic`, `resolveDecoy`, `aiTurn`, and scoring helpers are explicitly out of scope.

### Pre-Game Screen

The `prototype/pre-game-screen.jsx` layout is the target match setup experience:

- top bar with product title and deck-builder entry;
- deck selection panel;
- mode/opponent/format/seed panel;
- bottom summary and Begin Match action.

Production pre-game should create engine match configuration from catalog presets, selected controllers, policy IDs, and deterministic seeds. Prototype-only mode labels may be used as UX inspiration, but unavailable modes must be disabled or hidden until implemented.

### Deck Builder

The `prototype/deck-builder-screen.jsx` layout is the target deck-building experience:

- deck list column;
- searchable/filterable card pool;
- selected deck/stat/validation column;
- import/export/save/play actions.

Production deck builder must be catalog-backed, use the real deck validator, and support current incomplete card content. It should make future card population easier by exposing image path conventions and export/import workflows, but it should not require browser code to write directly to repository files.

### Card Visual System

The `prototype/shared.jsx` `GameCard`, `CardBack`, faction metadata, row glyphs, ability glyphs, and `SvgCardArt` placeholder establish the visual vocabulary.

Production should prefer one of these approaches:

- extend the existing `src/components/card/GwentCard.tsx` with `variant: 'classic' | 'authentic'` if that avoids breaking current call sites;
- or create a `src/components/gwent/` product card wrapper around catalog view models if the existing card component is too tightly coupled to legacy state.

Either way, hidden zones must render backs/counts only.

## Cluster E Phase Plan

### `cEp1`: Authentic UI Foundation

Goal: establish the visual system without changing game rules.

Scope:

- add Direction A design tokens to production styling;
- import or document the required fonts;
- add shared faction/row/ability display metadata mapped to current catalog IDs;
- add an authentic card rendering path with `SvgCardArt`/image fallback;
- add a small product UI route or gallery harness behind an opt-in flag;
- preserve the current engine shell and legacy route.

Acceptance:

- no new UI code imports legacy rule helpers or legacy AI;
- cards can render current catalog cards, card backs, hero/unit/special states, strength, rows, faction stripe, and abilities;
- missing images degrade to a deterministic placeholder;
- browser smoke covers the opt-in route at desktop and mobile widths.

### `cEp2`: Engine-Backed Match Table V1

Goal: replace the button-heavy engine shell with the first authentic, engine-backed match screen.

Scope:

- build `MatchScreen` and subcomponents for top bar, score cards, rows, hand, piles, inspector, action panel, and battle log;
- map engine state/selectors into product view models;
- render legal card plays and row/target choices from engine legal moves;
- keep the diagnostic shell available if needed;
- do not add deck builder or pre-game yet.

Acceptance:

- a current Northern Realms vs Nilfgaard human-vs-AI match can progress through mulligan, card play, leader use where implemented, pass, round resolution, and game end;
- hidden AI hand/deck identities are not visible;
- React components dispatch engine commands only;
- Playwright smoke covers at least one card play, one AI response, one pass/round transition, and mobile overflow.

### `cEp3`: Product Match Interactions

Goal: make the match screen feel like the selected handoff rather than a thin shell.

Scope:

- spatial row click targets;
- selected-card inspector and legal target list;
- discard pile browser grouped by card category/row;
- Medic and Decoy prompt presentations over engine prompt options;
- round-end overlay based on engine round history;
- UI-only card flight/transition hooks where safe.

Acceptance:

- prompt choices are legal-move backed;
- discard browser never exposes hidden opponent zones;
- round-end overlay observes resolved engine state and does not drive rule transitions;
- browser tests cover prompt ownership and discard browser hidden-info safety.

### `cEp4`: Pre-Game And Match Configuration

Goal: make match start a product flow instead of a query-param/debug setup.

Scope:

- build the pre-game screen from the handoff;
- support deck preset selection from current catalog presets;
- support controller choices that are actually implemented: human vs AI first, then disabled placeholders for future modes;
- support deterministic seed entry/copy;
- start engine matches from selected config.

Acceptance:

- users can start a playable current match without editing the URL;
- invalid or unavailable deck/mode choices are clearly disabled;
- selected seed and policy IDs are visible in debug-safe context;
- route smoke covers pre-game to match transition.

### `cEp5`: Catalog-Backed Deck Builder V1

Goal: add the deck builder over real catalog data.

Scope:

- build deck list, card pool, selected deck, stats, validation, import/export, save/load, and play-from-builder flows;
- use existing catalog/deck validation rules rather than prototype counts only;
- support incomplete catalog content gracefully;
- keep local persistence/export import browser-only unless a file-writing tool is separately approved.

Acceptance:

- a legal current deck can be assembled and used to start a match;
- illegal decks explain validation failures;
- export/import round-trips catalog-compatible deck data;
- unknown or unimplemented abilities are visible and cannot silently enter unsupported gameplay.

### `cEp6`: Mulligan Screen And Product Navigation

Goal: complete the current product loop before adding content-authoring tools.

Scope:

- add a dedicated authentic mulligan screen before the match table;
- keep mulligan command flow legal-move-backed through the engine, using sequential one-card redraws up to two times per seat;
- present AI mulligan choices after the human keep/confirm decision with hidden-safe backs/counts in the normal route and explicit debug-only reveal controls for animation inspection;
- require player confirmation in the start-match modal before leaving mulligan for the match table;
- tighten navigation between pre-game, deck builder, mulligan, match, round overlay, and match end;
- clarify rematch/change-deck/setup exits;
- clear stale engine adapter state when returning to setup from mulligan or match;
- consolidate shared authentic buttons, modal buttons, alerts, toasts, and typography decisions into a reviewable UI component foundation route;
- keep hidden AI information hidden on every product screen.

Acceptance:

- pre-game `begin match →`, deck-builder `play →`, direct match, and rematch show mulligan before the match table;
- human mulligan dispatches exact engine commands only from legal moves, one selected current-hand card at a time;
- AI mulligan presentation finishes before the start-match confirmation modal appears;
- abandoning an in-progress match uses authentic confirmation UI and a later start begins from a fresh mulligan;
- shared standard buttons use the seal-style proportions, lowercase labels, and documented hover treatment across product, debug, alert, toast, and modal surfaces;
- the component foundation route documents tokens, typography, buttons, cards, alerts, modals, and game-surface primitives for review;
- product routes remain opt-in and backward compatible;
- browser smoke covers desktop/mobile mulligan and hidden-info safety.

### `cEp7`: Card Studio And Content Workflow

Goal: make future card population easier for the user and support full in-game custom card/leader creation.

Scope:

- add an authentic Card Studio route for browser-local custom cards and leaders;
- support cards and leaders as draft or playable custom records;
- allow unit, hero, special/weather, and leader creation over known catalog factions, rows, abilities, and leader abilities;
- include live authentic card/leader preview;
- support path-based images for permanent repo workflows plus local uploaded image data URLs for browser-local prototypes;
- validate source IDs, factions, rows, ability applicability, implemented-vs-unimplemented ability status, leader fields, deck limits, linked source IDs, and image metadata;
- export/import selected records and full custom catalog bundles as JSON;
- integrate playable custom cards/leaders into the deck builder and pre-game validation;
- extend the runtime engine adapter catalog path so custom sources can be used by setup, legal moves, selectors, scoring, command execution, and AI observation.

Acceptance:

- a user can create a custom card or leader through the UI, export it, import it, and include playable custom sources in a deck when all abilities are implemented;
- draft custom records with planned/placeholder abilities can be saved and previewed but cannot silently enter playable decks or match start;
- custom cards can render in the deck builder and at least one engine-backed match path;
- hidden-info behavior still holds for custom AI hand/deck contents;
- docs explain browser-local storage, JSON backup, image path/upload limits, and where repo images/catalog data belong for permanent source commits.

### `cEp8`: Product Promotion And Mode Expansion

Goal: make the new UI the main game experience and open the path for broader modes.

Scope:

- promote the authentic engine-backed UI to the default app experience when smoke and manual play are clean;
- add or unlock local PvP and AI-vs-AI product mode surfaces when existing engine support is sufficient;
- keep replay/simulation/debug surfaces clearly separated from normal play;
- retire or quarantine obsolete shell/legacy UI paths only after replacement coverage exists.

Acceptance:

- default route reaches the new product UI;
- current human-vs-AI remains playable;
- local PvP or AI-vs-AI UI entry points do not leak hidden information beyond intentional same-device constraints;
- final browser smoke covers default route, setup, match, mobile width, and hidden-info safety.

### Actual Post-cEp7 Polish Slices

The live sequence after cEp7 intentionally split the old cEp8 promotion idea
into smaller product-polish phases. Product promotion remains future work until
the authentic match loop is cleaner.

- `cEp8`: Weather leader choice UI. Closed the multi-legal-leader-move gap for
  `play_any_weather` by rendering an exact legal-move choice menu with row
  hints.
- `cEp9`: Leader status and prompt polish. Made active/passive/setup/used/
  suppressed leader state and prompt-specific copy legible without changing
  engine rules.
- `cEp10`: Round and match flow polish. Current active handoff. Refine
  resolve-round actions, round-resolved ledgers, match-end ledgers, and
  rematch/change-deck/close navigation while keeping round/game resolution
  engine-owned.

## Relationship To ML Work

The existing simulation and safe export work remains valuable and should not be discarded. However, Cluster E should now prioritize making the engine visible and playable through the selected UI. ML work should resume after the product UI has a stable engine-backed match surface, unless a small export/tensorization decision is needed to unblock future training design.

The old "pretty-good" AI can be revisited after `cEp2` or `cEp3`, when the user can judge gameplay quality in the authentic match UI. That work should remain a policy upgrade over legal moves, not a UI rule path.

## Design Handoff Reading Rule

Any Cluster E implementation spec must require the coding instance to read:

- `docs/PROJECT_STATE.md`;
- this file;
- `docs/ui-handoff/README.md`;
- the relevant prototype file for the target screen;
- `docs/gwent-rules.md` if any rule-facing behavior is touched.

Reports for Cluster E must call out:

- which handoff details were implemented;
- which handoff details were intentionally deferred;
- whether any prototype logic was avoided or replaced with engine-backed behavior;
- hidden-info checks;
- responsive/browser smoke evidence.
