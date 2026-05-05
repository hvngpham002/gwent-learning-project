# Authentic Product Flow

This document tracks the current opt-in authentic product loop after cEp13.

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
7. Round-resolved ledger actions dismiss the overlay only. Rule resolution remains engine-owned. cEp10: the non-game-end ledger reads `You hold the field.` / `<opponent> holds the field.` / `Neither side yields.`, lists score, gem-loss `◆ before → after` rows (or `gem loss: none`), and the engine-supplied next-starter label, then offers exactly one primary `next round →` action. The action only updates local dismissed-overlay state — it does not dispatch any engine command, does not advance any timer, and does not re-resolve the round. The overlay key embeds `activeMatchKey` so dismissed-state cannot survive into a fresh match.
8. Match-concluded ledger actions either rematch with the same documented setup/seed behavior or return to setup. cEp10: the match-end ledger reads `Victory over <opponent>.` / `Defeat against <opponent>.` / `Draw.` with eyebrow `match concluded · X to Y`, renders real `roundHistory` rows, and renders standing rows (`result`, `rounds humanWins - aiWins`, `gems humanGems - aiGems`, or `gems unknown` when data is unavailable) from engine state only — no MMR, rank, ladder, streak, reward, or XP placeholders. When `onReturnToPreGame` is wired, navigation is `change deck` ghost + `rematch` primary; direct match (`view=match`) shows `close` ghost + `rematch` primary. The match-end ledger does not ship `Escape` dismissal because the same outcome is only reachable through visible navigation; non-game-end ledgers do dismiss on `Escape`.

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

## Selected-Card Targeting (cEp11)

cEp11 makes selected-card targeting in the authentic match UI spatial and legible without changing engine legality or command execution. A pure helper in `src/components/gwent/matchViewModel.ts` drives every product target affordance:

- `buildSelectedCardTargetViewModel({ selectedCard, selectedPlayMoves, cardLookup })` returns one of three states (`"no-selection"`, `"no-targets"`, `"has-targets"`) with `selectedCardLabel`, `instructionLabel`, `rowTargets` (keyed by `seatId:row`), `cardTargets` (keyed by visible `cardId`), `rowHornTargets` (keyed by own `seatId:row`), an optional `weatherTarget`, an optional `fallbackActions` list for `target.kind === "none"` (and any non-spatial PlayCard target shape that may be added later), and a compact `rightRailLabel` such as `choose a highlighted row.`, `choose a highlighted card.`, `choose a highlighted row or card.`, `choose a highlighted horn slot.`, `target the weather panel.`, or `use the action button below.` Right-rail copy reads `no card selected.` when no hand card is active and `no legal targets.` when the engine exposes no PlayCard moves for the selection.
- The helper consumes only the selected human hand card, the legal `PlayCardMove[]` for that selection, and a public visible-card `{ name }` lookup. It never receives card source IDs, instance IDs, or hidden hand identities, and the focused unit tests assert that no user-facing label contains raw `seat_a:...` / `seat_b:...` instance IDs or hidden opponent source IDs. `cardLabel` falls back to a public `card` literal when a card target is missing from the visible-card lookup.

`AuthenticMatchScreen.tsx` consumes the view model directly and no longer relies on `groupTargetActions` from the diagnostic engine-shell helper for selected-card target presentation:

- **Board rows.** Each row container renders as a `<div data-testid="authentic-board-row">`. When the selected card has a legal `board_row` move on that row, the row itself is marked with `data-row-target="true"` plus the exact legal `data-drop-move-id`, receives the highlighted target styling, and accepts click/drop on the row without rendering a separate `play here` button. The row's aria label reads `Play <card> on your close combat row` (or `opponent` for cross-board plays). Row score, weather tint, horn display, empty-row label, and right-click inspection on existing board cards are unchanged.
- **Board cards.** Visible legal `card_instance` targets stay rendered as `<button data-testid="authentic-board-card-target">` with the target ring/click surface on the card itself and an aria like `Choose <card> for <selected card>`. The old visible `choose` badge is removed. Right-click inspection still works on these target buttons and never dispatches the move. Non-target board cards remain inspectable but do not look actionable.
- **Horn slots.** Every row reserves an icon-only horn slot immediately after the row label. Selecting Commander's Horn marks each legal own-row slot with `data-testid="authentic-board-row-horn-target"` and the exact legal `data-drop-move-id`; the slot is a `<div>`, not a visible target button, and renders only the war-horn icon until a horn card occupies it. The aria reads `Place Commander's Horn on your <row> horn slot`; click/drop dispatches the exact `row_horn` PlayCard move.
- **Weather panel.** Selecting a weather card highlights the Weather panel itself. The panel carries `data-testid="authentic-weather-target"` plus the exact `data-drop-move-id`; clicking or dropping on the panel dispatches the exact `weather` PlayCard move whether the panel is empty or already populated. The old visible `play weather` button is removed, and existing weather card right-click inspection is unchanged.
- **Right-rail fallback.** Global/no-target plays (e.g. Special Scorch represented as `target.kind === "none"`) remain compact right-rail buttons (`<button data-testid="authentic-target-action">`) with safe lowercase labels like `play scorch` and aria `play scorch (global effect)`. The right-rail `Actions` block always renders a single `<p data-testid="authentic-target-hint">` that mirrors the helper's `rightRailLabel` so the right rail tells the player what to do without inventing a fake spatial location for global effects. The `data-target-state="no-selection|no-targets|has-targets"` attribute lets tests and styling react without re-deriving state.
- **Selection lifecycle.** The cEp10 selection-clear effect already covers stale selection on phase / prompt / turn / hand changes; cEp11 keeps the same dispatch path. Selecting a different hand card recomputes the spatial targets immediately because the helper is a pure function of selection + legal moves.

The cEp11 polish reuses the existing accent / ink / rule / parchment tokens — no one-off color system. Focus-visible styling on every spatial target keeps keyboard navigation clear, and badge sizes shrink at the 390px mobile breakpoint to avoid overlapping card strength medallions, row labels, or the row score column. Hidden-info safety is reverified: visible board / weather / discard / leader card names may appear because they are already public; AI hand and AI deck identities never reach the target view-model because they are not in the visible-card lookup the helper receives. The leader weather choice menu added in cEp8 is unchanged — cEp11 covers selected hand-card targeting, not leader targeting.

## Drag And Card Flight (cEp12)

cEp12 layers native pointer drag/drop and restrained card-flight presentation on top of the cEp11 legal target surface. It is a product UI polish phase only: engine legal moves, command execution, scoring, AI policy, catalog data, route defaults, deck builder, Card Studio, and the Redux engine adapter behavior are unchanged.

- Drag sources are only visible playable human hand cards in the default authentic match route. AI hand backs, AI deck cards, hidden identities, board cards, weather cards, discard cards, prompt cards, leaders, and fallback/global action buttons are not draggable.
- Pointer dragging uses a small movement threshold so normal click selection remains intact. Right-click inspection still opens the cEp5.3 inspect menu and never starts a drag. Touch dragging is deferred; touch users keep the existing tap/click controls.
- A drag may dispatch only when the pointer is released on an existing cEp11 spatial target that carries a legal `PlayCard` move id: highlighted board row, visible board-card target, icon-only row-horn slot, or Weather panel target. Invalid drops cancel locally and dispatch no engine command.
- The right rail now uses `buildSelectedCardDragTargetViewModel(...)` for drag-specific hint copy such as `drag to a highlighted row.` or `drag to the weather panel.` Global/no-target cards such as Scorch remain compact right-rail fallback actions and do not receive fake spatial drag targets.
- Drop targets expose presentation-only `data-drop-move-id` and `data-drop-state="idle|active"` attributes. Hand cards expose `data-drag-state` so smoke tests can verify ready, dragging, disabled, and idle states without re-deriving legality.
- While dragging, the UI renders a pointer-following preview of the visible human hand card only. The preview is not an engine object and has `pointer-events: none`; it exists solely to make the interaction legible.
- Successful human hand plays capture the visible source hand-card rectangle and a legal target destination rectangle, then render a transient card-flight overlay while dispatching the exact existing `PlayCard` command immediately. Board-card and horn targets still use their exact target element; broad board-row and Weather-panel targets resolve to the actual row/weather card strip insertion area so the flight fades toward where the card will appear instead of the center of the large panel. The overlay never delays rules, prompts, AI, round resolution, or game end. If the source or target rectangle is unavailable, the existing public event pulse remains the fallback.
- AI plays and other hidden-origin movement do not animate from hidden locations. Public activity and board/weather/discard state remain hidden-info-safe.
- Reduced-motion users get a near-static opacity transition rather than transform-heavy motion.

## Weather Row Overlays (cEp13)

cEp13 adds generated active-weather overlays to the authentic match board before the next AI phase. This is a product UI polish phase only: engine weather rules, scoring, legal moves, command execution, AI policy, catalog data, deck builder, Card Studio, route defaults, and legacy UI are unchanged.

- Four runtime row-strip assets live under `public/images/weather-overlays/`: `biting-frost-row.svg`, `impenetrable-fog-row.svg`, `torrential-rain-row.svg`, and `skellige-storm-row.svg`. They are user-converted SVGs derived from the approved Imagegen concept sheet, with Skellige Storm intentionally using a distinct teal-black/violet lightning sea-storm treatment rather than a rain variant. The original cEp13 PNG strips remain as provenance/fallback assets.
- `buildWeatherRowOverlayViewModel({ row, weatherCards })` maps public Weather-zone cards into presentation effects. Frost marks close-combat rows, Fog marks ranged rows, Rain marks siege rows, and Skellige Storm marks both ranged and siege rows. Clear Weather produces no overlay.
- `AuthenticMatchScreen` renders the overlay stack behind each affected board row's contents at roughly 80% opacity. Cards, effective-strength badges, row labels, scores, empty-state text, legal targets, drag/drop targets, and right-click inspection remain above the overlay and keep their existing behavior; active-weather row labels, scores, and empty text stay light/white for contrast. Unit strength medallion text turns red when the engine score modifiers include active weather, including printed-1 cards whose final strength remains 1.
- Rows expose `data-weather-overlay` and child overlay spans expose `data-weather-effect` for browser smoke coverage. These attributes contain only public effect names, never card instance IDs or hidden card identities.
- Multiple weather effects can stack when the engine allows more than one relevant Weather-zone card. Skellige Storm is rendered as its own effect and later in the stack so it remains visually distinct when paired with Fog or Rain.

## Round And Match Flow (cEp10)

cEp10 makes round resolution, match-end, and post-match navigation feel like a coherent product flow without changing engine rules. The round/match ledger and the right-rail resolve-round action are now driven by pure view-model helpers in `src/components/gwent/matchViewModel.ts`:

- `buildResolveRoundActionViewModel({ phase, canResolveRound, promptOpen, canHumanAct })` returns `{ visible, enabled, label, disabledReason }`. The right-rail action panel renders the `resolve round` primary button only when `phase === "round_end"`, dispatches `resolveEngineRoundEnd(humanSeat)` exactly when enabled, and shows a single compact reason line (`prompt pending`, `waiting for opponent`, `waiting for round resolution`) when visible-but-disabled. No second action panel is introduced; the existing right-rail `Round End` and `Game End` informational panels stay display-only.
- `buildMatchLedgerViewModel({ rounds, humanSeat, aiSeat, seatLabels, winner, gemsBySeat, canReturnToSetup, matchRunKey })` returns a `MatchLedgerViewModel` with `kind: "round" | "match_end"`, eyebrow, title, score / gem-loss / next-starter rows for the round kind, real round-history and standing rows for the match-end kind, and route-aware action buttons. The model also carries `escapeDismisses` (true only for round ledgers) and a stable `key` that incorporates `activeMatchKey` so rematch and setup transitions invalidate any stale dismissed-overlay cache.

The `RoundOverlay` React component now consumes the ledger view-model directly: it renders the eyebrow, title, summary table, history table, standing rows, and action buttons exactly as the helper dictates and never derives win/loss/score/gem state from board cards or events. The dialog wrapper keeps `role="dialog"` / `aria-modal="true"` and ties its accessible name to the rendered Alert title id (`authentic-round-overlay-alert-title`).

Hidden-info contract:

- The ledger view-model only reads `RoundResult[]`, the engine `winner`, public seat gem counts, and seat labels. It never receives card source IDs, instance IDs, or hidden hand identities, and unit tests assert no such strings appear in the serialised view-model.
- The right-rail Battle Log, recent activity, and round-history section continue to use existing hidden-info-safe summaries; cEp10 does not change their behavior.

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
