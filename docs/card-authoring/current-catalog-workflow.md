# Current Catalog Card Authoring Workflow

The legacy default route still has legacy card-data paths, but the current engine/authentic product path consumes catalog source data. New content should be added to the catalog source tree.

## Browser-Local Card Studio

The authentic UI now includes Card Studio at:

```text
/?engine=1&ui=authentic&view=card-studio
```

Card Studio creates browser-local custom cards and leaders under localStorage key `gwent_custom_catalog_v1`. It does not write files into the repository. Use it for prototyping, previewing authentic card faces, validating source IDs/abilities/images, and exporting handoff JSON.

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
/?engine=1&ui=authentic&view=official-porting
```

Official candidates are not Card Studio custom records, do not use `custom_*` source IDs, and do not enter deck-builder source sets until a later promotion/codegen phase.

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
