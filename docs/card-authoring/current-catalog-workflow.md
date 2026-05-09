# Current Catalog Card Authoring Workflow

The named legacy route still has legacy card-data paths, but the current engine/authentic product path consumes catalog source data. New content should be added to the catalog source tree.

## Browser-Local Card Studio

The authentic UI now includes Card Studio at:

```text
/card-studio
```

Card Studio creates browser-local custom cards and leaders under localStorage key `gwent_custom_catalog_v1`. It does not write files into the repository. Use it for prototyping, previewing authentic card faces, validating source IDs/abilities/images, and exporting handoff JSON.

The old `/?engine=1&ui=authentic&view=card-studio` URL remains a cEp15 compatibility alias.

Playable custom records can enter the deck builder and engine matches only when they use implemented ability IDs. Draft records with planned or placeholder abilities can be saved, previewed, imported, and exported, but they are blocked from playable decks and match start.

Permanent source migration remains a code/data workflow:

1. Export the selected Card Studio record or full bundle as JSON.
2. Move real art into `public/images/custom/` or the long-term catalog image path.
3. Replace any browser-local data URL image with a stable `/images/...` path.
4. Add the source record to `src/data/catalog/cards/` or `src/data/catalog/leaders/` in a later coding phase.
5. Run catalog and project validation.

Uploaded image previews are stored as data URLs in browser storage and in exported JSON. They are useful for prototypes, but they can make JSON large and are not a substitute for committed image assets.

## Official Card Porting

Official Witcher 3 Gwent cards scraped from Game8 use a separate staging workflow documented in `docs/card-authoring/official-card-porting.md`.

The official porting route is:

```text
/official-porting
```

Official candidates are not Card Studio custom records and do not use `custom_*` source IDs.

The old `/?engine=1&ui=authentic&view=official-porting` URL remains a cEp15 compatibility alias.

cBp4 promoted 157 engine-ready official non-leader candidates into the permanent catalog under `src/data/catalog/cards/*`. cBp4.1 then split the two combined Skellige Berserker scrape candidates into four catalog records (`skellige.berserker`, `skellige.vildkaarl`, `skellige.young-berserker`, `skellige.young-vildkaarl`), removed the redundant combined Cow/Bovine source, and added a `side_deck_only` tag plus narrow Deck Builder V1 guards. Follow-up cleanup pruned exact duplicate Nilfgaard typo records, records the Game8 Menno spelling mismatch as a duplicate resolution to the existing catalog source, and consolidates Dwarven Skirmisher to one Close Combat Muster source with `deckLimit: 3` rather than a scrape-derived ranged/close split. The promotion manifest lives at `src/data/catalog/cards/official-promotion.ts` and exposes `directPromotedCandidateCount`, `deferredCandidateCount`, `promotedCatalogSourceCount`, `splitResolutions`, `duplicateResolutions`, and counts by faction/kind. Legacy current entries remain authoritative.

cBp5 promoted the remaining official leader candidates into permanent leader packs and added official faction starter deck presets without implementing new leader engine rules. `currentCatalogLeaders` now contains all `22` official leaders (5/5/5/5/2 by faction). Newly added leader ability IDs use `placeholder` metadata and do not produce executable leader legal moves; only `clear_weather` remains executable. The leader manifest lives at `src/data/catalog/leaders/official-promotion.ts` and exposes `officialLeaderPromotionManifest`. Five new official starter presets — `official-northern-realms-starter`, `official-nilfgaard-starter`, `official-monsters-starter`, `official-scoiatael-starter`, `official-skellige-starter` — are appended to `currentDeckPresets` after the unchanged `current-northern-realms` and `current-nilfgaard` presets, and `getDefaultPreGameSelection()` continues to default to the current Northern Realms vs Nilfgaard matchup.

When you tag a card `side_deck_only` (a `tags` entry), Deck Builder V1 hides it from the main-deck pool and refuses to add it to a main deck. cBp5 added linked side-deck support: when a main-deck card has `linkedSourceIds` pointing to side-deck-only replacements (e.g. Berserker → Vildkaarl), Deck Builder auto-syncs the deck's `sideDeck` to mirror the linked replacement counts. Validation accepts a non-empty side deck only when every entry exists, is tagged `side_deck_only`, belongs to the deck faction, is linked from a main-deck card, and matches the derived count. Mismatches surface as visible errors (`unknown_side_deck_card`, `invalid_side_deck_card`, `wrong_faction_side_deck_card`, `unlinked_side_deck_card`, `side_deck_count_mismatch`). Free-form side-deck editing remains intentionally unsupported.

The same `linkedSourceIds` field also drives normal Muster resolution. Official Monster and Scoia'tael Muster groups now list their same-name or same-creature-group linked sources so the engine can pull those cards from hand/deck when a Muster card is played.

## Files

Card source packs live in:

```text
src/data/catalog/cards/
```

Leader source packs live in:

```text
src/data/catalog/leaders/
```

Current playable deck presets live in:

```text
src/data/catalog/deck-presets/
```

Stable aggregate exports are available from:

```text
src/data/catalog/index.ts
```

## Images

The long-term image convention is:

```text
public/images/cards/{faction}/{assetSlug}.png
```

The current migrated records preserve the existing legacy image paths, such as:

```text
public/images/northern_realms/blue_stripes_commando.png
```

For new cards, prefer the long-term convention unless you are migrating an existing asset. Store the browser path in the catalog record, for example:

```ts
image: "/images/cards/northern-realms/blue-stripes-commando.png"
```

## Source IDs And Asset Slugs

Use a stable `sourceId` that is not copied from legacy runtime IDs. The format should be:

```text
{pack}.{filesystem-safe-card-name}
```

Examples:

```text
neutral.geralt-of-rivia
northern-realms.blue-stripes-commando
nilfgaard.emhyr-var-emreis-the-relentless
```

Use lowercase ASCII, hyphen-separated words, and no runtime copy suffixes. If the card name contains punctuation or accents, normalize the `sourceId` while preserving the display `name`.

The default `assetSlug` should be the part after the dot. For `northern-realms.blue-stripes-commando`, the slug is `blue-stripes-commando`.

## Card Records

Add card details as plain JSON-compatible objects. Do not use functions, class instances, `Set`, or `Map` in source packs.

Required card fields:

```ts
{
  sourceId: "northern-realms.blue-stripes-commando",
  name: "Blue Stripes Commando",
  faction: "northern_realms",
  kind: "unit",
  strength: 4,
  rows: ["close"],
  abilities: ["tight_bond"],
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/cards/northern-realms/blue-stripes-commando.png",
  description: "Tight Bond."
}
```

Use `linkedSourceIds` for side-deck, summon, avenger, Roach, or Muster relationships. Example:

```ts
linkedSourceIds: ["neutral.roach"]
```

## Deck Presets

Deck presets reference `sourceId` plus `count`; they do not reference display names.

```ts
mainDeck: [
  { sourceId: "northern-realms.blue-stripes-commando", count: 3 },
  { sourceId: "neutral.decoy", count: 2 },
],
sideDeck: [],
```

Use `sideDeck: []` even when no side deck is needed.

The current presets intentionally mirror the existing hardcoded deck assembly, including known omissions documented by the audit. Do not silently add omitted legacy cards to a current preset unless the live deck builder changes in the same phase.

## Validation

Run the catalog and project checks after editing source packs:

```bash
npm test
npm run build
```

Catalog validation covers source ID uniqueness, known factions/kinds/rows/abilities, linked card references, leader references, and deck preset references.
