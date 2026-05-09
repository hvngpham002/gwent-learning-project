# Authentic UI Foundation (cEp1)

This document describes the authentic UI foundation introduced in `cEp1`. It
covers what the foundation owns, how to open the original harness, and how the
foundation relates to the current authentic product routes.

## What This Is

`cEp1` introduces the production substrate for the selected
`docs/ui-handoff/` Direction A design without changing engine rules, legal moves,
scoring, prompts, AI policy, simulation, or export code.

The foundation contains:

- production design tokens scoped under a `.gwent-authentic` wrapper, in
  `src/styles/gwent-tokens.css`;
- catalog-aware display metadata for factions, rows, abilities, leaders, and
  card kinds, in `src/components/gwent/displayMetadata.ts`;
- an authentic card view-model helper in `src/components/gwent/cardViewModel.ts`;
- an authentic SVG card-art fallback in `src/components/gwent/SvgCardArt.tsx`;
- the `AuthenticCard` and `AuthenticCardBack` rendering components in
  `src/components/gwent/`;
- a small product UI harness/gallery component in
  `src/components/gwent/AuthenticUiHarness.tsx`;
- the canonical `/ui-harness` route, with the old
  `?engine=1&ui=authentic&view=harness` URL retained as a compatibility alias
  by `src/appMode.ts`.

## What The Foundation Does Not Own

The cEp1 foundation itself deliberately stopped short of product flows. Later
Cluster E phases now provide match, pre-game, deck builder, mulligan, navigation,
and component-review screens on top of it. The foundation layer still does not
own:

- a Card Studio or content-authoring tool;
- repository image management;
- engine rules, legal moves, AI policy, deck validation, scoring, prompts, or
  future route cleanup;
- final drag-and-drop card play or full game-end browser automation.

Those behaviors belong to the current product screens and future Cluster E
phases, not to this reusable visual substrate.

## Routes

| URL | Behavior |
|---|---|
| `/` | Authentic pre-game setup screen. |
| `/match` | Direct development match route. Starts the default setup, shows the cEp6 mulligan flow first, then the match table after start confirmation. |
| `/deck-builder` | Catalog-backed browser-local authentic deck builder. |
| `/card-studio` | Browser-local Card Studio. |
| `/official-porting` | Official card porting review tool. |
| `/components` | Consolidated review page for authentic tokens, typography, buttons, cards, alerts, modals, and game-surface primitives. |
| `/ui-harness` | Authentic UI foundation harness. |
| `/engine-diagnostic` | Diagnostic engine shell (`EngineGameManager`). |
| `/legacy` | Temporary legacy Redux UI holding route. |
| `/ai-lab` | Reserved for the upcoming AI Lab route; not implemented in cEp15. |

`/?engine=1`, `/?engine=1&ui=authentic`, and
`/?engine=1&ui=authentic&view=...` remain compatibility aliases for cEp15.
`VITE_ENGINE_UI=1` no longer overrides `/`; the root route remains authentic
pre-game even when the env flag is present.

## Opening The Harness

```sh
npm run dev
```

Then open:

```
http://localhost:5173/ui-harness
```

The harness shows:

- a compact top bar with title and catalog counts;
- faction palette chips;
- row glyph chips;
- all displayable catalog ability glyph chips;
- a sample card row across factions and kinds;
- hidden, faction, and discard card backs;
- a missing-image fallback example;
- a row of card sizes (xs, sm, md, lg).

Stable browser-smoke selectors:

- `authentic-ui-harness` for the harness root;
- `authentic-card` for visible authentic cards;
- `authentic-card-back` for hidden card backs;
- `authentic-metadata-swatch` for the metadata chips.

## Card Image Convention

Card art lives at `/images/<faction>/<source-id-derived-name>.<ext>` matching
the `image` field on each catalog card source under `src/data/catalog/cards/`.
The authentic card component treats catalog images as complete card faces and
keeps the custom strength badge visible above the source face. Card fronts and
backs use one shared catalog card display frame from
`src/components/gwent/cardViewModel.ts`: `md` is the `1.00x` source frame at
`86.5px` by `147px`, and other sizes scale from that frame:

- `xs`: `0.50x`, `43.25px` by `73.5px`, `7.5px` bottom crop
- `sm`: `0.75x`, `64.875px` by `110.25px`, `11.25px` bottom crop
- `md`: `1.00x`, `86.5px` by `147px`, `15px` bottom crop
- `lg`: `1.50x`, `129.75px` by `220.5px`, `22.5px` bottom crop

`xl` is currently a compatibility alias for the largest `1.50x` frame until a
fifth product size is needed.

When real art is added, drop image files at the paths declared in the catalog
sources. No code changes are required for the harness to pick them up.

Card-back images should be placed in `public/images/card-backs/`. Supported
filenames:

- `northern_realms.png`, `.jpg`, or `.jpeg`
- `nilfgaard.png`, `.jpg`, or `.jpeg`
- `monsters.png`, `.jpg`, or `.jpeg`
- `scoiatael.png`, `.jpg`, or `.jpeg`
- `skellige.png`, `.jpg`, or `.jpeg`
- `neutral.png`, `.jpg`, or `.jpeg`
- `discard.png`, `.jpg`, or `.jpeg`

The back resolver first uses the existing faction default images such as
`public/images/northern_realms/default-northern_realms.png` and
`public/images/nilfgaard/default-nilfgaard.png`. It also accepts dashed names
such as `northern-realms.png`, suffixes such as `northern_realms_back.png` and
`northern-realms-back.png`, and faction-local paths such as
`public/images/northern_realms/card_back.png`. Faction back images are stretched
to fit the card-back frame.

If a faction-specific back is missing, the component falls back to a
faction-colored synthetic sleeve rather than the generic closed card. If a
discard back is missing, it falls back to `/images/other-graveyard.png`.

## SVG Fallback Notes

`SvgCardArt` is only a deterministic placeholder for missing source art. It does
not encode playable rows or card rules. Fallback rule-like badges are kept in
the left-side card badge stack: strength at the top-left, then the primary row
glyph for unit/hero cards, then the primary ability glyph when a glyph exists.

## Hidden Information Notes

`AuthenticCardBack` never receives a card view model. It accepts only `size`
and an optional faction sleeve hint, so it cannot leak hidden card identity by
construction. The harness is a static gallery; it does not consume engine state
and so cannot render hidden hand contents at all. Future phases that wire the
authentic card path to live engine state must continue to render backs/counts
only for hidden zones.

## Relationship To The Match Screen

`cEp2` built the engine-backed match table on top of this foundation, and
`cEp3` through `cEp6` added product interactions, pre-game setup, deck builder,
the dedicated mulligan flow, handoff modals, and shared button/typography review
surfaces:

- the same `.gwent-authentic` wrapper provides design tokens and font stacks;
- `AuthenticCard`/`AuthenticCardBack` render hand, board, and pile cards
  driven by engine selectors;
- display metadata helpers translate catalog ids into faction/row/ability
  presentation;
- the SVG fallback continues to cover missing card art during catalog
  expansion.

The match and mulligan screens dispatch engine commands and render legal moves;
they do not compute rule outcomes in React. Current product-flow behavior is
tracked in `docs/ui/authentic-product-flow.md`, while shared standard button
rules are tracked in `docs/ui/authentic-button-style-guide.md`.
