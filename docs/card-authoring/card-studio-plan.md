# Card Studio Implementation Plan

Card Studio is planned as a browser-side authoring tool for catalog records. It should create and validate JSON-compatible source data without coupling to match rules or Redux gameplay state.

## Form Fields

Card fields:

- `sourceId`
- `name`
- `faction`
- `kind`
- `strength`
- `rows`
- `abilities`
- `tags`
- `deckLimit`
- `image`
- `linkedSourceIds`
- `description`
- `status`

Leader fields:

- `sourceId`
- `name`
- `faction`
- `ability`
- `image`
- `description`

Deck preset fields:

- `presetId`
- `name`
- `faction`
- `leaderSourceId`
- `mainDeck`
- `sideDeck`

## Live Validation

Use the existing catalog validators from `src/game/catalog/validators.ts`. Validation should run on every form change and show structured errors from `{ path, code, message }`.

Minimum warnings:

- unknown ability ID;
- linked source ID not found;
- deck preset card or leader reference not found;
- invalid row list for the selected card kind;
- invalid image path;
- duplicate `sourceId`.

## Image Preview

The image field should render a preview using the browser path stored in the record. The UI should show a missing-image state when the asset cannot load.

The default helper should suggest:

```text
/images/cards/{faction}/{assetSlug}.png
```

Existing migrated records may continue to use legacy paths.

## Draft Save

Save in-progress cards, leaders, and presets to `localStorage` under a namespaced key such as:

```text
gwent.card-studio.drafts.v1
```

Draft save should not write to `src/data/catalog`. A static browser app cannot safely write source files.

## JSON Import And Export

Support import/export for:

- a single card record;
- a card pack array;
- a leader pack array;
- a deck preset.

Exported JSON should be plain data that can be pasted into `src/data/catalog/*` and committed.

## Ability Status Warnings

Card Studio should read `CATALOG_ABILITY_METADATA` and `CATALOG_LEADER_ABILITY_METADATA`.

When an ability has `status: "planned"` or `status: "placeholder"`, show a warning that the card may be valid source data but not fully implemented in live rules yet.

## Deck Preset Integration

Card Studio should allow adding a valid card draft to a deck preset draft by `sourceId`. Preset editing should display resolved card names but store only:

```ts
{ sourceId, count }
```

Side-deck entries should use the same shape as main-deck entries, even when the current live game has no side-deck support.

## Out Of Scope For The First UI

- direct file writes to the repository;
- match simulation;
- live gameplay rule execution;
- deck legality beyond catalog reference validation;
- automatic image upload.
