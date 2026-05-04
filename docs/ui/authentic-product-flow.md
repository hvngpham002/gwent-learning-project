# Authentic Product Flow

This document tracks the current opt-in authentic product loop after cEp9.

## Routes

- `/` remains the legacy app.
- `/?engine=1` remains the diagnostic engine shell.
- `/?engine=1&ui=authentic` and `/?engine=1&ui=authentic&view=pregame` open the authentic pre-game setup screen.
- `/?engine=1&ui=authentic&view=deck-builder` opens the browser-local catalog deck builder.
- `/?engine=1&ui=authentic&view=card-studio` opens browser-local Card Studio for custom cards and leaders.
- `/?engine=1&ui=authentic&view=official-porting` opens the official-card porting review tool for staged Game8 official candidates. It is an authoring route and does not add official staged cards to product deck sources.
- `/?engine=1&ui=authentic&view=match` starts a direct authentic match from the URL seed, then shows the mulligan screen first.
- `/?engine=1&ui=authentic&view=harness` opens the cEp1 card foundation harness.
- `/?engine=1&ui=authentic&view=ui-component-foundation` opens the review surface for shared authentic UI primitives.

Runtime engine state is not encoded into the URL. In-app transitions are coordinated by `AuthenticGameApp` and the engine adapter.

## In-App Flow

1. Pre-game selects a human deck, catalog opponent, Human vs AI mode, Standard round, Bo3 format, and visible seed.
2. Pre-game and deck builder can open `card studio →`; Card Studio saves browser-local custom cards/leaders, exports/imports JSON, and returns to the prior authentic surface without starting a match.
3. `begin match →` starts an engine match and lands on `AuthenticMulliganScreen`.
4. Deck-builder `play →` saves the selected local deck, starts an engine match with that inline `CatalogDeckPreset`, and lands on `AuthenticMulliganScreen`.
5. Mulligan confirms only an engine-legal `choose_mulligan` move. Zero selected cards is the keep-hand path when that legal move is present. One selected card redraws that card immediately; if fewer than two redraws have been used, the replacement remains in hand and may be selected for the next redraw.
6. Human one-card redraws briefly animate the selected card sliding out and its replacement sliding in. After the AI's legal mulligan command applies, the mulligan screen presents the opponent choice with hidden card backs only, waits for the AI presentation to finish, then opens the wax-seal `Start the match?` modal before `AuthenticMatchScreen` renders the match table. `review hand` dismisses the modal and leaves the mulligan screen available; the footer `start match` action reopens the same modal rather than entering the match directly.
7. Round-resolved ledger actions dismiss the overlay only. Rule resolution remains engine-owned.
8. Match-concluded ledger actions either rematch with the same documented setup/seed behavior or return to setup.

## Navigation

- `setup` from mulligan or an in-progress match opens the wax-seal `Return to setup?` modal before discarding the current match view and clearing the engine adapter state.
- Returning to setup after game end does not require the abandon warning.
- `rematch` restarts the same setup and seed, then returns to the mulligan screen.
- `← back` from deck builder returns to pre-game and preserves browser-local deck state.
- `← back` from Card Studio returns to the prior authentic surface when opened in-app, or pre-game when opened directly.
- Button variants are defined in `docs/ui/authentic-button-style-guide.md`. Primary flow actions share the same visual language: `begin match →`, mulligan `keep hand` / `confirm mulligan` / `start match`, and round `next round →` use an orange fill with white text, then switch on hover to a black border, transparent background, and orange text.

## Custom Catalog Runtime

Card Studio records live in browser localStorage under `gwent_custom_catalog_v1`. Playable custom records are merged with the current catalog for deck-builder/pre-game validation and are passed into `startEngineMatch` as the active runtime catalog. The Redux engine adapter stores that serializable runtime catalog snapshot and uses it for legal moves, command execution, scoring, selectors, and `legal-heuristic-v0` AI observation.

Draft custom records remain visible in Card Studio but do not enter match runtime. If a local deck references a draft or deleted custom source, pre-game and deck builder block play with a validation error instead of deleting the deck.

## Official Porting Runtime Boundary

Official porting review state lives in browser localStorage under `gwent_official_porting_v1`. It contains review overrides, image crop metadata, approvals, and notes for staged official candidates. It is not merged into deck builder, pre-game, or match runtime in cBp3.

## In-Match Card Inspection

Visible cards in the authentic match screen are read-only inspectable through right-click. cEp5.3 adds:

- A small in-match card context menu with a single `inspect` action, opened by right-click on a visible card surface (human hand, public board card, row horn, public weather, public discard browser cards, Medic prompt option cards), and a leader-specific menu opened by right-click on either score-card leader.
- A read-only inspect modal that renders the large authentic card art plus source ID, instance ID, faction, kind, rows, abilities (with display name/status/glyph/description), tags, image path, printed strength for unit/hero cards, effective strength and modifier list for board cards (sourced from `selectEngineScoreBreakdown`), origin/zone label, board row label when inspecting a board card, and side/owner label when known.
- A read-only leader inspect modal that shows leader name, faction, ability display name/description, used/ready state, owner, and image path.

Behavior contract:

- Left-click gameplay interactions are unchanged. Hand left-click still selects/deselects through `engineSelectedCardSet`. Board card left-click still dispatches legal target moves. Row left-click still dispatches row target moves. Medic prompt left-click still chooses the prompt option. Discard pile buttons still open/close the discard browser.
- Right-click on a visible card calls `event.preventDefault()` so the browser context menu does not appear, never dispatches an engine command, never triggers a target click, and only opens the inspect menu.
- The context menu and inspect modals close on `close`, click outside (overlay), `Escape`, `inspect` action, opening another menu, or returning to setup/rematch.
- The right-rail `InspectorPanel` keeps its compact selected-card summary and adds a single `inspect details` button that opens the same read-only modal for the selected human hand card; no second strength overlay is rendered.

Hidden-information rules are preserved:

- The match screen wires hand context menus only to the human hand strip rendered from `selectEngineHumanHand`. AI hand backs do not have an `EngineCardViewModel` exposed in the runtime card lookup, so they cannot be inspected through normal product routes.
- AI hand and AI deck card identities (source IDs, instance IDs, names) remain hidden behind backs/counts in normal routes. Public board cards, public weather, public discard cards, visible human prompt options, and visible leaders are the only inspectable surfaces.
- The debug-only `debugAiMulligan=1` route continues to reveal AI mulligan choices for animation inspection. cEp5.3 does not extend that surface and does not add inspect entry points to AI hand backs.

Inspect modal styling reuses the deck-builder inspect-modal vocabulary (`authentic-match__inspect-modal`, `authentic-match__inspect-box`, `authentic-match__inspect-art`, `authentic-match__inspect-facts`, `authentic-match__inspect-section`) without sharing component code; this keeps deck-builder add/remove semantics out of the match surface.

## In-Match Leader And Prompt Presentation

cEp9 makes the completed official leader system legible without changing rule ownership:

- Score-card leaders show a compact status line with category and state. Categories are `active`, `passive`, `setup`, or `unknown/custom`; states include `ready`, `used`, `passive active`, `setup resolved`, `cancelled this round`, `unavailable`, and `no target`.
- Current-round White Flame suppression is displayed as `cancelled this round` from the engine-derived `leader.cancelledThisRound` selector flag, which corresponds to `seat.leaderCancelledRound === state.round`. The visual state clears when the engine clears suppression at round transition.
- The leader action panel remains legal-move-driven. Single active leaders use ability-specific labels such as `clear weather`, `restore card`, `discard and draw`, `look at hand`, and `cancel leader`; multi-move `play_any_weather` keeps the cEp8 menu and row hints. Every action still dispatches the exact selected `UseLeader` legal move target.
- Disabled leader copy comes from the leader status view model. If an active leader is otherwise in an acting state but has no legal move, the UI shows the generic `no target` state rather than computing rule-specific availability.
- Prompt panels use ability-specific titles and body copy for `cancel_leader`, `restore_discard_to_hand`, `draw_opponent_discard`, owner-visible `discard_two_draw_one_from_deck` stage 1 and stage 2, owner-visible `look_three_cards`, and `medic_revive`. Unknown prompt kinds keep the generic fallback.
- Prompt option buttons are generated only from visible legal `choose_prompt_option` moves. Non-owner prompts render no option details; AI-owned stage-2 deck choices and non-owner look-three acknowledgement states use generic pending copy. The look-three-card reveal remains the one-time modal surface; surrounding prompt copy tells the owning player the shown cards close after acknowledgement.

## Hidden Information

The mulligan screen renders the human hand with authentic cards, but AI hand is represented only by card backs and a count. The AI mulligan presentation animates hidden back slots and selected counts only: zero-card keeps play a hidden-back wave, while redraw commands freeze the pre-AI hand during sequential choices, remove selected cards from their original frozen slots, use right-anchored selected slots, push held backs left, and slide selected backs out and replacement backs into those slots one card at a time. After the animation, the AI hand returns to static backs for the player review/start modal. AI deck identities and hidden hand card names/source IDs/instance IDs are not rendered in product text.

Temporary animation debugging is opt-in with query params:

- `debugAiMulligan=1` reveals AI hand cards and debug decision text on the mulligan screen.
- `debugAiMulliganCount=0` forces a zero-card AI keep so the hidden-back wave can be inspected. `debugAiMulliganCount=1` forces the AI to choose a legal one-card redraw, and `debugAiMulliganCount=2` spends both AI redraws sequentially, still one card at a time.

Do not use those debug params for normal hidden-info-safe smoke or product review.
