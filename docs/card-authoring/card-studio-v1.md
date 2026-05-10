# Card Studio V1

Card Studio V1 is a browser-local authoring surface for custom catalog cards and leaders in the authentic UI:

```text
/card-studio
```

It is for prototyping playable custom content and exporting handoff JSON. It does not write repository files, upload images, author new abilities, or change engine rules.

The old `/?engine=1&ui=authentic&view=card-studio` URL remains a compatibility alias, not the canonical docs target.

## Storage

Custom content is stored in `localStorage` under:

```text
gwent_custom_catalog_v1
```

The stored shape is:

```ts
{
  schemaVersion: "custom-catalog-v1",
  cards: CustomCardRecord[],
  leaders: CustomLeaderRecord[],
  activeRecordId?: string
}
```

Each record wraps a catalog-compatible `source` object with authoring metadata:

```ts
{
  recordId: string,
  createdAt: string,
  updatedAt: string,
  source: CatalogCardSource | CatalogLeaderSource,
  imageMode: "path" | "data_url",
  draft: boolean
}
```

Records are normalized when read. If localStorage is missing, blocked, or corrupted, the app falls back to an empty in-memory custom catalog and shows a compact warning.

## Creating Playable Content

Playable card source IDs must use lowercase custom IDs:

```text
custom_[a-z0-9_]+
```

Playable leader source IDs must use:

```text
custom_leader_[a-z0-9_]+
```

A playable custom card needs a non-empty name, unique source ID, known faction/kind/rows, valid strength, valid deck limit, valid image, and only known abilities that are already implemented by the engine. `none` is valid by itself, but it cannot be mixed with another ability. Unit and hero cards need at least one row; multi-row cards need `agile`; special cards use strength `0` and no rows.

A playable custom leader needs a non-empty name, unique `custom_leader_...` source ID, non-neutral faction, valid image, and an implemented leader ability.

Use `save playable` only after the validation panel has no structural errors and no unimplemented ability warnings. Use `save draft` for incomplete cards, planned abilities, placeholder abilities, or records that are only being previewed/exported.

## Drafts

Draft records stay visible in Card Studio and can be edited, duplicated, previewed, imported, exported, and copied. They do not enter the playable source set.

Deck builder and pre-game validation block local decks that reference draft, deleted, or otherwise unplayable custom sources. The deck is preserved so the user can repair it; references are not silently deleted except when the user confirms deletion of referenced custom content.

## Images

Path mode stores a browser path in the source record:

```text
/images/custom/my-card.png
```

Permanent images should eventually live under `public/images/custom/` or the long-term catalog image path, then be referenced by `/images/...` in the exported source data.

Upload mode accepts PNG, JPEG, and WebP files up to 1 MB. The file is read as a browser-local data URL, stored in localStorage, and used by Card Studio, deck builder previews, and engine match rendering for that browser session. Data URL exports can be large and are not a substitute for committed image assets.

## Import And Export

Selected-record export uses:

```json
{
  "schemaVersion": "custom-catalog-record-v1",
  "record": {}
}
```

Bundle export uses:

```json
{
  "schemaVersion": "custom-catalog-bundle-v1",
  "cards": [],
  "leaders": []
}
```

Import accepts those two schema versions only. Unknown schemas and malformed JSON produce structured errors. Import never overwrites existing records silently: source ID and name collisions are suffixed, and intra-bundle `linkedSourceIds` are updated when an imported card source ID is renamed.

For portable deck handoff, export both the deck JSON from deck builder and the Card Studio bundle that defines any custom source IDs used by that deck.

## Runtime Flow

`AuthenticGameApp` owns the browser-local custom catalog store for the authentic route. Playable custom card and leader sources are merged with the current catalog before they are passed to deck builder, pre-game validation, and match start.

When a match starts with custom content, `startEngineMatch` receives the active runtime catalog arrays. The Redux engine adapter stores that serializable catalog snapshot and uses it for deck setup, legal moves, command execution, scoring selectors, card/leader view models, and `legal-heuristic-v0` AI observation. This keeps custom cards playable without a global mutable catalog.

Hidden-information rules do not change. Custom AI hand and deck cards remain hidden from the human view until the engine makes them public through normal play, discard, weather, or event exposure.

## Permanent Migration

To migrate a prototype into permanent repository catalog data:

1. Export the selected record or full bundle from Card Studio.
2. Move production art into `public/images/custom/` or the long-term catalog image location.
3. Replace any data URL image with a stable `/images/...` path.
4. Add the source record to `src/data/catalog/cards/` or `src/data/catalog/leaders/` in a coding phase.
5. Update or create deck presets if needed.
6. Run catalog/project validation before committing.

Do not use Card Studio as a source file writer. It is intentionally browser-local in V1.
