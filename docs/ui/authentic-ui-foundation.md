# Authentic UI Foundation (cEp1)

This document describes the authentic UI foundation introduced in `cEp1`. It
covers what the foundation is, what it is not yet, how to open the harness, and
how the harness relates to the future engine-backed match screen.

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
- an opt-in route variant `?engine=1&ui=authentic` driven by
  `src/appMode.ts`.

## What This Is Not Yet

The foundation deliberately stops short of the future product UI. It does not
provide:

- the full match table or hand strip;
- a deck builder or pre-game configuration screen;
- a Card Studio or content-authoring tool;
- spatial card-flight animations or row click targets;
- engine-driven legal target rendering on the authentic card path;
- Medic, Decoy, round-end overlay, or discard browser interactions.

These belong to later Cluster E phases (`cEp2` and beyond).

## Routes

| URL | Behavior |
|---|---|
| `/` | Legacy Redux UI (default route). Unchanged. |
| `/?engine=1` | Existing diagnostic engine shell (`EngineGameManager`). Unchanged. |
| `/?engine=1&ui=authentic` | Opt-in authentic UI foundation harness. New. |
| `/?ui=authentic` | Legacy UI. The authentic harness requires `engine=1`. |

`VITE_ENGINE_UI=1` continues to enable the engine UI without `engine=1`. When
this env flag is present and `ui=authentic` is set, the authentic harness still
renders.

## Opening The Harness

```sh
npm run dev
```

Then open:

```
http://localhost:5173/?engine=1&ui=authentic
```

The harness shows:

- a compact top bar with title and catalog counts;
- faction palette chips;
- row glyph chips;
- ability glyph chips;
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
keeps the custom strength badge visible above the source face. The image face
currently extends 15px past the bottom edge and is clipped by the card frame;
this is controlled by
`AUTHENTIC_CARD_SOURCE_FACE_BOTTOM_CROP_PX` in
`src/components/gwent/cardViewModel.ts` for later fine-tuning.

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

## Hidden Information Notes

`AuthenticCardBack` never receives a card view model. It accepts only `size`
and an optional faction sleeve hint, so it cannot leak hidden card identity by
construction. The harness is a static gallery; it does not consume engine state
and so cannot render hidden hand contents at all. Future phases that wire the
authentic card path to live engine state must continue to render backs/counts
only for hidden zones.

## Relationship To The Future Match Screen

`cEp2` will build the engine-backed match table on top of this foundation:

- the same `.gwent-authentic` wrapper provides design tokens and font stacks;
- `AuthenticCard`/`AuthenticCardBack` will render hand, board, and pile cards
  driven by engine selectors;
- display metadata helpers will translate catalog ids into faction/row/ability
  presentation;
- the SVG fallback will continue to cover missing card art during catalog
  expansion.

`cEp2` must not regress the rules: the match screen will dispatch engine
commands and render legal moves, never compute rule outcomes in React.
