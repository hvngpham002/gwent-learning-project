# Authentic Product Flow

This document tracks the current opt-in authentic product loop after cEp7.

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

## Hidden Information

The mulligan screen renders the human hand with authentic cards, but AI hand is represented only by card backs and a count. The AI mulligan presentation animates hidden back slots and selected counts only: zero-card keeps play a hidden-back wave, while redraw commands freeze the pre-AI hand during sequential choices, remove selected cards from their original frozen slots, use right-anchored selected slots, push held backs left, and slide selected backs out and replacement backs into those slots one card at a time. After the animation, the AI hand returns to static backs for the player review/start modal. AI deck identities and hidden hand card names/source IDs/instance IDs are not rendered in product text.

Temporary animation debugging is opt-in with query params:

- `debugAiMulligan=1` reveals AI hand cards and debug decision text on the mulligan screen.
- `debugAiMulliganCount=0` forces a zero-card AI keep so the hidden-back wave can be inspected. `debugAiMulliganCount=1` forces the AI to choose a legal one-card redraw, and `debugAiMulliganCount=2` spends both AI redraws sequentially, still one card at a time.

Do not use those debug params for normal hidden-info-safe smoke or product review.
