# Authentic Deck Builder V1

The authentic deck builder is available at `/?engine=1&ui=authentic&view=deck-builder`.

It edits browser-local `CatalogDeckPreset` objects using the current catalog cards and leaders. The localStorage key is `gwent_authentic_decks_v1`; when no saved decks exist, local editable copies are seeded from the current catalog presets with `local-` preset IDs.

Validation blocks structural deck errors: unknown cards/leaders, wrong-faction cards, deck-limit overflow, fewer than 22 battlefield cards, more than 10 specials, and non-empty side decks. Planned or placeholder abilities are warnings only so current incomplete catalog content remains visible and playable without changing engine rules.

Import accepts either a raw `CatalogDeckPreset` or:

```json
{
  "schemaVersion": "catalog-deck-preset-v1",
  "preset": {
    "presetId": "local-example",
    "name": "Example",
    "faction": "northern_realms",
    "leaderSourceId": "northern-realms.foltest-lord-commander-of-the-north",
    "mainDeck": [{ "sourceId": "neutral.geralt-of-rivia", "count": 1 }],
    "sideDeck": []
  }
}
```

Export and clipboard copy use the wrapper shape above. The browser never writes imported or exported deck JSON into repository source files.
