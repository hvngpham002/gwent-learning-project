# Handoff: Gwent UI — Pre-game, Deck Builder, Match

## Overview

This package is a complete UI design for a Gwent-style card game built on top of the existing TypeScript engine in `src/`. It covers three connected screens — **Pre-game (lobby)**, **Deck Builder**, and **Match** — in a single visual direction we'll call **"Authentic Tactical Card Table"** (parchment-and-ink, EB Garamond display + JetBrains Mono labels, ink-red `#8a3a1f` accent on warm parchment `#f4ecd8`). The match screen includes a discard pile component, a card-flight animation when units are killed/scorched/resurrected, a Medic prompt that opens a discard browser, and a Decoy swap prompt.

## About the Design Files

The files in `prototype/` are **design references**, not production code. They are written as inline-Babel JSX loaded by `Gwent - Prototype.html` so they can run in a browser preview without a build step. **Do not ship them as-is.** Your job is to recreate them inside the existing codebase at `src/` — which already has React + TypeScript, Redux Toolkit (`src/store/`), a deterministic game engine (`src/game/`), card catalogs (`src/data/cards/`), and a `GwentCard` component (`src/components/card/GwentCard.tsx`).

The prototype's `match-engine.jsx` is a **toy reducer** used only to make the prototype clickable. **Do not port it.** Wire the UI to the real engine in `src/game/sim/` and `src/store/slices/gameSlice.ts`. The prototype's `CARD_POOL` in `deck-builder-screen.jsx` is a stub of ~25 cards — replace it with the real catalog (`src/data/cards/northern-realms.ts`, `src/data/cards/nilfgaardian-empire.ts`, `src/data/cards/neutral.ts`, etc.).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, layout, and interaction behaviors. All design tokens are in `prototype/tokens.css` as CSS custom properties — drop that file in as-is (rename if you want, e.g. `src/styles/gwent-tokens.css`) and import once at app root. Pixel measurements and the visual identity should be reproduced accurately. The card-art SVG placeholders in `shared.jsx` (`SvgCardArt`) are stand-ins for real illustration; keep the placeholder for now and swap to real art later.

## Target Codebase Map

| Prototype file | Becomes | Notes |
|---|---|---|
| `tokens.css` | `src/styles/gwent-tokens.css` | Drop in as-is. Import once in root layout. |
| `shared.jsx` — `FACTIONS`, `ABILITIES` | `src/components/gwent/factions.ts` | Already partially exists in `src/types/card.ts` (`Faction`, `CardAbility` enums). Add display metadata (color, glyph, short name) keyed by enum. |
| `shared.jsx` — `GameCard`, `CardBack`, `SvgCardArt` | `src/components/gwent/Card.tsx` | The repo already has `src/components/card/GwentCard.tsx` — extend that component to support the new visual treatment via a prop (`variant: 'classic' \| 'authentic'`) so existing call-sites keep working. |
| `match-engine.jsx` | **Discard.** | Use existing `src/game/sim/` + `src/store/slices/gameSlice.ts`. The prototype's `playCard`/`resolveMedic`/`resolveDecoy`/`aiPickMove` map to existing actions/selectors. |
| `match-screen.jsx` | `src/components/gwent/MatchScreen.tsx` (+ subcomponents) | Split into `MatchTopBar`, `ScoreCard`, `Row`, `DiscardPile`, `DeckPile`, `Inspector`, `BattleLog`, `MedicPrompt`, `DecoyPrompt`, `DiscardBrowser`, `RoundEndOverlay`, `CardFlight`. Wire to `gameSelectors`. |
| `deck-builder-screen.jsx` | `src/components/gwent/DeckBuilderScreen.tsx` | Persist via Redux (`uiSlice` for active deck) + `localStorage` middleware. Replace `CARD_POOL` with real card data. |
| `pre-game-screen.jsx` | `src/components/gwent/PreGameScreen.tsx` | Reads decks from store. On "Begin Match" dispatches `startMatch({deckId, mode, opponent, seed, bestOf})`. |
| `tweaks-panel.jsx` | **Discard.** | Tweak panel is a design tool; not part of the shipped UI. |

## Screens

### 1. Pre-game (`pre-game-screen.jsx`)

**Purpose:** Player picks a deck, picks a game mode + opponent, configures format/seed, clicks Begin Match.

**Layout (1200×780, fixed):**
- Top bar (height auto, ~50px): `← menu` button left · "Prepare for Battle" italic title · "open deck builder →" button right
- Body: 2-column grid (1fr 1fr), 28px padding, 24px gap
  - **Left card (Deck):** white-paper box `var(--bg-paper)`, 1px border `var(--rule-strong)`, radius 4, padding 20, shadow `var(--shadow)`. Lists every saved deck as a tall button (50×70 leader thumbnail + name in italic display + faction + card count + "✓ ready" or "incomplete"). Selected button has `var(--accent)` 2px border and `rgba(138,58,31,0.10)` tint. Bottom: "＋ create or edit a deck…" full-width ghost button → goes to deck builder.
  - **Right card (Mode):** same chrome. 2×2 grid of mode tiles (Casual / Ranked / Training / Seed Suite, with emoji glyphs). Below, an `<select>` for opponent (Eredin / Emhyr / Foltest mirror / Random), opponent description italic. Below, two columns: format toggle (Bo1 / Bo3) and seed input (mono font).
- Bottom bar (height auto): summary line italic + large "Begin Match →" button. Disabled (grey + opacity 0.5) if deck not valid.

**Background:** subtle 120×120 SVG dot+grid pattern at 6% opacity over `var(--bg)`.

### 2. Deck Builder (`deck-builder-screen.jsx`)

**Purpose:** Edit deck composition. Add/remove cards from a filtered pool, set leader, rename, save, import/export.

**Layout (1200×780):**
- Top bar: `← back` · "Deck Builder" italic title · button row (`＋ New`, `↓ Import`, `↑ Export .json`, `📋 Copy`, `Save`, `Play →`).
- Body: 3-column grid `220px 1fr 320px`.
  - **Left (Decks list):** `var(--bg-2)` background. Each saved deck is a card with name + faction + card count. Selected has `var(--accent)` border + tint. "🗑 delete current" at bottom (only if >1 deck).
  - **Center (Card pool):** `var(--bg-paper)`. Header: editable deck name (click ✎ pencil → input with bottom-border accent), faction + leader summary. Filter pills: `all / heroes / units / specials`. Body: auto-fill grid, `minmax(120px, 1fr)`, 8px gap. Each tile: card art (md size) + "name…" mono caption. Click adds card; cards at max are 40% opacity + `not-allowed`. A circular accent badge (top-right of card) shows `n/max` when in deck.
  - **Right (Stats panel):** `var(--bg-2)`. Sections: composition (units / specials / heroes / strength) with red accent if invalid, leader `<select>` + description, list of cards in deck (mono font, sorted by strength desc, `−` button to remove one).
- **Import modal:** scrim + 540px box. Textarea for JSON paste (mono, light cream background), "upload file…" ghost button (hidden `<input type=file>`), error line in accent red, cancel/import buttons.

**Validation:** deck valid iff `totalUnits ≥ 22 && totalSpecials ≤ 10`. (Check existing `src/utils/deckBuilder.ts` for the canonical rule and use that.)

**Persistence:** prototype uses `localStorage` with key `gwent_decks_v1` and `defaultDecks()` seed. In the real app, persist via Redux + a localStorage middleware, keyed off user/profile if you have auth.

### 3. Match (`match-screen.jsx`)

**Purpose:** Play a round. Inspect cards, choose legal placements, watch animations resolve, browse the discard, respond to ability prompts.

**Layout (1200×780):**
- Top bar (~46px): `← exit` · "Gwent" italic · "round N · your turn|opponent thinking…" mono.
- Body: 3-column grid `240px 1fr 280px`.
  - **Left (board chrome):** scoreboard cards (opp top, me bottom), each a 240px-wide card with leader thumbnail, name, faction blurb, gem dots (filled accent, empty hollow), big score number on the right (turns red `var(--accent)` when it's that side's turn). Between them: weather summary card, deck+discard pile pair for each side, "Pass Round" primary button at bottom.
  - **Center (board):** 6 rows top-to-bottom: opp siege / opp ranged / opp close / **center divider (4px gradient with red glow)** / me close / me ranged / me siege. Each row: 60px glyph column (svg path for row type, mono row label, weather/horn icons) · units area · 60px score column. Active weather row tinted blue `rgba(106,154,196,0.18)`. Legal-target row gets `var(--accent)` 2px inset shadow + faint accent tint and is clickable. Below the rows: hand strip (`var(--bg-2)`, 138px min-height, mono "hand · N" label, cards in a flex row; selected card translates up 10px).
  - **Right (inspector):** selected-card preview (lg size + name + meta + ability description italic), legal-targets list (clickable buttons that match the legal rows), optional Strategist's note panel (toggle via `tweaks.showAdvisor`), battle log (mono, 3-column grid: timestamp / actor / event).

**Discard pile component (`DiscardPile`):**
- 60×84 box. If empty: dashed border, "empty" mono label.
- If non-empty: card back stacked behind (offset +4,+4, opacity 0.5) + top discard card on top. Circular count badge top-right (22×22, accent fill, parchment text). Clicking opens the **Discard browser**.

**Discard browser modal:** 1080px wide, max 90% viewport, dark scrim 0.72. Header: pile-owner label + count + close button. Body sections: Heroes / Close combat / Ranged / Siege / Specials, each with italic title + dotted divider + flex-wrap of `md`-size cards. Empty piles show italic "The pile is empty.".

**Card-flight animation (`flying` state + `@keyframes flyTo`):**
- Triggered by death (Scorch resolution) and Medic resurrection.
- Captures source `getBoundingClientRect()` and target rect, renders a `position: fixed` clone of the card with a CSS animation: 0% at source, 50% halfway with `rotate(15deg) scale(1.05)` arcing 60px upward, 100% at target with `rotate(360deg) scale(0.5) opacity:0`. 850ms cubic-bezier `.55,.05,.4,1.0`.
- For Medic, source = the discard pile center (pile-owner side), target = the unit's native row.
- After 900ms the flying entry is removed and the real state shows the card in its new home.

**Medic prompt:**
- Opens automatically when a Medic-ability unit is played and there's at least one eligible discard card (`type === 'unit' && ability !== 'medic'`).
- Modal: parchment box, accent label "MEDIC ABILITY", italic instruction "Resurrect a unit from your discard pile.", flex-wrap of `lg` cards. Each card lifts 6px on hover. Click → `resolveMedic` → animation → AI turn. "skip" ghost button cancels.

**Decoy prompt:** same shape as Medic but with all your non-Hero board units as picks.

**Round-end overlay:** radial-gradient backdrop, mono "ROUND N COMPLETE" label, huge italic "Victory" / "Defeat" / "Stalemate" headline (gold/dim/cream), score breakdown, "continue" primary button → `nextRound`.

## Interactions & Behavior

- **Card selection:** click a hand card → it lifts 10px, inspector populates, legal rows highlight. Clicking it again de-selects.
- **Play resolution:** click a highlighted row OR an inspector "↵ play" button. State updates immediately (React); animations fire 80ms later via the captured rects.
- **Spy:** card placed on opponent's matching row, +2 cards drawn from your deck.
- **Scorch:** finds max-strength non-hero across the field, removes all ties, animates them to their respective discards, scorch card itself goes to your discard.
- **Commander's Horn:** sets `state.hornedRow = '${side}.${row}'`, doubles the row's score.
- **Decoy:** opens prompt; on pick, swaps the chosen unit back to your hand and places the Decoy in its slot.
- **Weather:** sets `state.weather[row] = true`. Active weather tints the row blue and reduces non-hero strength to 1 in score calculation.
- **Clear Weather:** resets all three weather flags.
- **Pass:** sets `passed[side] = true`. When both sides have passed, round-end overlay fires.
- **AI turn:** 800ms after your move (or after a prompt resolves). Picks the strongest unit in hand, plays to its native row. 50% chance to pass if behind by 8+. Replace this with the real engine's policy in production (`src/game/ai/legalHeuristicPolicyV0.ts` already exists).
- **Round end → next round:** loser drops a gem, all board units move to their owners' discards, weather + horn cleared.

## State Shape (prototype reducer — for reference, replace with real engine)

```ts
type Side = 'me' | 'opp';
type Row = 'close' | 'ranged' | 'siege';
type CardKind = 'unit' | 'hero' | 'special' | 'weather';
type Ability = 'none' | 'tight_bond' | 'morale_boost' | 'spy' | 'medic'
             | 'muster' | 'scorch' | 'commanders_horn' | 'decoy'
             | 'frost' | 'fog' | 'rain' | 'clear_weather';

interface UICard {
  uid: string;       // runtime instance id (different for each copy)
  id: string;        // catalog id
  name: string;
  faction: 'northern_realms' | 'nilfgaard' | 'monsters' | 'scoiatael' | 'skellige' | 'neutral';
  strength: number;
  type: CardKind;
  ability: Ability;
  row?: Row;         // native row
}

interface MatchUIState {
  round: number;
  turn: Side;
  gems: Record<Side, number>;
  weather: Record<Row, boolean>;
  hornedRow: `${Side}.${Row}` | null;
  passed: Record<Side, boolean>;
  rows: Record<Side, Record<Row, UICard[]>>;
  me: { hand: UICard[]; deck: UICard[]; discard: UICard[] };
  opp: { handCount: number; deck: unknown[]; discard: UICard[] };
  log: [string, string, string, string][]; // [time, actor, event, detail]
}
```

The repo's `src/game/sim/exportTypes.ts` already defines a richer canonical state. Map UI state by selecting from it; don't duplicate.

## Design Tokens (`tokens.css`)

```css
--bg: #f4ecd8           /* page parchment */
--bg-2: #ebe1c8         /* recessed parchment */
--bg-paper: #fbf6e8     /* card / panel paper */
--ink: #1f1a12          /* primary text */
--ink-2: #4a3f2c        /* secondary text */
--ink-3: #7a6a4d        /* tertiary text / mono labels */
--rule: rgba(31,26,18,0.18)         /* dotted/faint dividers */
--rule-strong: rgba(31,26,18,0.42)  /* solid borders */
--accent: #8a3a1f       /* ink red — selection, errors, primary CTA */
--gold: #b8862a         /* heroes, victory headline */
--w-frost: #6a9ac4      /* close-row weather tint */
--w-fog: #8a7a9a        /* ranged-row weather tint */
--w-rain: #4a6a7a       /* siege-row weather tint */
--shadow: 0 1px 0 rgba(31,26,18,0.04), 0 8px 24px rgba(31,26,18,0.08)

--font-display: 'EB Garamond', 'Garamond', Georgia, serif
--font-mono:    'JetBrains Mono', 'SF Mono', Menlo, monospace
```

Faction tints (used as left-edge accent on cards and in pickers):
- `northern_realms`: `#3a5a8a` (deep blue)
- `nilfgaard`:      `#1a1a1a` (black/gold)
- `monsters`:       `#5a2a3a` (oxblood)
- `scoiatael`:      `#3a5a3a` (forest)
- `skellige`:       `#7a3a1a` (rust)
- `neutral`:        `#6a5a3a` (brass)

## Typography Scale

- Display title: EB Garamond italic 600, 18–22px (top bars), 56px (round-end).
- Body display: EB Garamond regular/italic, 12–16px, line-height 1.4–1.5.
- Mono labels: JetBrains Mono 400/500, 9–11px, `text-transform: uppercase`, `letter-spacing: 0.10–0.15em`, color `var(--ink-3)`.
- Tabular nums for scores: `font-variant-numeric: tabular-nums`.

## Spacing / Radius / Shadow

- Radius: 3 (controls), 4 (panels). Never more than 4 — this aesthetic resists soft corners.
- Borders: 1px `var(--rule-strong)` on panels, 2px on top/bottom chrome, 1px dotted `var(--rule)` for inline dividers.
- Buttons: 5–8px vertical, 10–14px horizontal padding.
- Card sizes (in `shared.jsx` / `GameCard size=...`): `sm` 60×84, `md` 84×118, `lg` 110×154.

## Animations

- Hand card hover/select: `transform: translateY(-10px)`, transition 0.15s.
- Pool card hover: `translateY(-3px)`, 0.15s.
- Discard browser card hover: `translateY(-6px)`, 0.15s.
- Card flight: 850ms `cubic-bezier(.55,.05,.4,1.0)`. Keyframes:
  - 0%: at source, scale 1, rotate 0, opacity 1.
  - 50%: midpoint with -60px Y, rotate 15deg, scale 1.05.
  - 100%: at target, rotate 360deg, scale 0.5, opacity 0.
- Round-end overlay: instant (no transition specified). Add a 200ms fade-in if you want polish.

## Persistence

- Decks: localStorage key `gwent_decks_v1`. Default seed in `defaultDecks()` (one Foltest tight-bond deck).
- Active deck id: held in component state in the prototype; promote to Redux `uiSlice` in production.
- Tweak panel state (density, advisor toggle): held in `useTweaks` and persisted by the design tool's host. **Do not port the tweak panel.**

## Files in This Bundle

```
prototype/
├── Gwent - Prototype.html        ← entry point; loads React 18.3.1 + Babel standalone, mounts <App/>
├── tokens.css                    ← design tokens (drop into project as-is)
├── shared.jsx                    ← FACTIONS, ABILITIES, GameCard, CardBack, SvgCardArt
├── match-engine.jsx              ← TOY REDUCER — do not port; use real engine
├── match-screen.jsx              ← MatchScreen component (board, hand, prompts, animations, discard browser)
├── deck-builder-screen.jsx       ← DeckBuilderScreen + CARD_POOL stub + LEADERS_NR + storage helpers
├── pre-game-screen.jsx           ← PreGameScreen + GAME_MODES + OPPONENTS
└── tweaks-panel.jsx              ← design-tool only; do not port
```

To preview the prototype: open `Gwent - Prototype.html` in a browser. Use the Tweaks panel (top right) to switch between Pre-game / Deck Builder / Match without going through the flow.

## Implementation Plan (suggested order)

1. **Tokens.** Drop `tokens.css` into `src/styles/`, import in root, verify the CSS variables resolve. (1 hour)
2. **Card component variant.** Extend `src/components/card/GwentCard.tsx` with an `authentic` variant that matches `shared.jsx`'s `GameCard` rendering (faction-tinted left edge, parchment fill, EB Garamond name, mono ability label, strength badge bottom-left). (3–4 hours)
3. **Pre-game.** Wire to existing deck list selector. Stub modes/opponents until backed by real matchmaking. (2 hours)
4. **Deck Builder.** Replace `CARD_POOL` stub with real card data from `src/data/cards/`. Use `src/utils/deckBuilder.ts` for validation. Implement Import/Export against the existing `CatalogDeckPreset` format if it makes sense for round-tripping; otherwise use the prototype's flat `{cards: {id: count}}` shape. (4–6 hours)
5. **Match shell.** Build the 3-column layout, scoreboards, deck/discard piles, row glyphs, hand strip. Wire to existing game state. Hand off animations + prompts as last step. (1–2 days)
6. **Discard browser, Medic, Decoy, Card-flight.** Self-contained; build on top of the live engine. Use `getBoundingClientRect()` from refs the same way the prototype does. (1 day)
7. **Round-end overlay + transitions.** (2 hours)

## Notes for Codex

- **Don't port `match-engine.jsx`.** It exists only to make the prototype clickable; the real engine in `src/game/sim/` is canonical.
- **Don't port `tweaks-panel.jsx`.** It's a design-tool affordance.
- The prototype uses `Object.assign(window, {...})` to share components across `<script type="text/babel">` files because Babel-standalone scripts don't share scope. In your TSX port, replace with named ESM imports.
- All prototype JSX uses inline style objects for speed of iteration. Convert to CSS Modules / styled-components / whatever the codebase uses. Tokens are already CSS variables, so the conversion is mechanical.
- The `SvgCardArt` placeholder is intentionally crude — silhouette + monogram. Keep it as the fallback when real art is missing; pass real image URLs through the same component otherwise.
- Card animation captures bounding rects at click time, not render time. If you switch to a virtualized list anywhere, make sure the source ref is valid at the moment of capture.
