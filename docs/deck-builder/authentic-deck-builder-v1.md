# Authentic Deck Builder V1

The authentic deck builder is available at `/?engine=1&ui=authentic&view=deck-builder`.

It edits browser-local `CatalogDeckPreset` objects using the current catalog cards/leaders plus playable browser-local Card Studio sources. The localStorage key is `gwent_authentic_decks_v1`; when no saved decks exist, local editable copies are seeded from the current catalog presets with `local-` preset IDs.

Local deck identity is normalized on read and write. Browser-local `presetId` values stay unique, and deck names are trimmed, whitespace-normalized, and auto-suffixed (`Name 2`, `Name 3`) when create, duplicate, import, rename, or stale localStorage would otherwise collide. Editing a selected deck updates that deck in place by stable `presetId`.

Validation blocks structural deck errors: unknown cards/leaders, wrong-faction cards, deck-limit overflow, fewer than 22 battlefield cards, more than 10 specials, and side-deck shape violations. Planned or placeholder abilities are warnings only so current incomplete catalog content remains visible and playable without changing engine rules.

Linked side decks are now first-class. cBp5 added `computeLinkedSideDeckRequirements(deck, cards)` and `syncLinkedSideDeck(deck, cards)`. When a main-deck card has `linkedSourceIds` pointing to side-deck-only replacements (today: Skellige Berserker → Vildkaarl base/replacement pairs), the deck builder automatically syncs `deck.sideDeck` to the derived requirements during `addCardToDeck`, `removeCardFromDeck`, `changeDeckFaction`, and `duplicateDeckPreset`. The screen surfaces a compact `side deck · linked replacements` section in the right rail when the active deck has any synced replacements; the main-deck card pool still hides `side_deck_only` cards, and there is no free-form side-deck pool. Validation accepts a non-empty side deck only when every entry exists, is tagged `side_deck_only`, belongs to the deck faction, is linked from a main-deck card, and matches the derived count; mismatches surface as `unknown_side_deck_card`, `invalid_side_deck_card`, `wrong_faction_side_deck_card`, `unlinked_side_deck_card`, or `side_deck_count_mismatch`. Side-deck-only cards in `mainDeck` continue to emit `side_deck_only_main_deck`. JSON import/export and `play →` preserve valid linked side decks; invalid side decks produce visible errors instead of silently shipping into the engine.

Card Studio custom content follows a stricter rule. Playable custom cards/leaders appear in the pool and leader picker only after Card Studio validation passes with implemented abilities. Draft or otherwise unplayable custom sources are not addable; if an existing local/imported deck still references one, validation produces a blocking error such as a Card Studio draft/deleted-source reason. Missing custom references are not deleted silently.

The card pool shows neutral cards plus cards from the selected deck faction. Wrong-faction cards are hidden by the faction-aware pool. Cards from the relevant pool that cannot be added, such as cards at `deckLimit` or specials after `10/10`, are dimmed and expose a short reason in metadata/title text while keeping the visual card surface uncluttered. Disabled add state is only an interaction guard; validation still catches imported or stale invalid decks.

New and existing decks expose a faction selector derived from current catalog leaders and faction card data. Changing faction requires confirmation when cards would be removed, resets the leader to the new faction's default leader, keeps neutral cards, removes wrong-faction cards, and leaves side decks empty because side-deck editing is not part of V1.

`Duplicate` creates a selected local copy with a unique ID and name while preserving faction, leader, main deck, and side deck. `Reset to catalog` is available when a local deck maps to a current catalog preset by `local-${catalogPresetId}` or normalized name; it requires confirmation, restores the catalog composition, faction, leader, and name, and preserves the local `presetId`.

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

Export and clipboard copy use the wrapper shape above. Import never overwrites an existing local deck. If the imported ID or final name changes because of conflicts, the builder shows a notice such as `Imported as Current Northern Realms 2.` while keeping structured errors visible for rejected JSON. The browser never writes imported or exported deck JSON into repository source files.

Deck JSON can reference playable custom source IDs as long as the same browser-local custom catalog exists. For portable handoff, export both the deck JSON and the Card Studio bundle.
