# Official Card Porting

cBp3 adds a staging and review lane for official Witcher 3 Gwent cards scraped from Game8. This is separate from Card Studio custom content.

## Source Input

The factual input artifact is:

```text
audit/scrapes/2026-04-29-game8-gwent-cards.json
```

Expected scrape contract:

- `schemaVersion`: `game8-gwent-card-port-v1`
- `counts.totalInstances`: `254`
- `counts.uniqueCards`: `181`
- `instances.length`: `254`
- `uniqueCards.length`: `181`

Tests fail clearly if those counts or the schema version drift.

## Official Is Not Custom

Official candidates are not stored in `gwent_custom_catalog_v1`, do not use `custom_*` source IDs, and are not added to the default deck builder source pool in this phase. Card Studio remains for browser-local custom cards and leaders only.

The staging exports live under:

```text
src/data/catalog/official/
```

Important exports:

- `game8OfficialCardCandidates`
- `game8OfficialLeaderCandidates`
- `game8OfficialImageCandidates`
- `officialPortingSummary`

Current catalog source IDs are preserved when a scraped official card or leader clearly matches by faction and normalized name. Duplicate physical copies collapse into one candidate with `copyCount` and `game8CopyIds`.

## Images

Game8-hosted image URLs are stored only as provenance. Do not download or commit those images into `public/images/`.

Preferred production image paths use:

```text
/images/<faction>/heroes/<Name>.png
/images/<faction>/units/<Name>.png
/images/<faction>/specials/<Name>.png
/images/<faction>/weather/<Name>.png
/images/<faction>/leaders/<Name>.png
```

The image manifest records the preferred path, Game8 image URL provenance, whether the preferred path exists in the repo image manifest, crop metadata, and approval state. Browser-local uploaded preview images can be used in the review UI, but they remain localStorage data URLs and should be replaced with stable `/images/...` paths before promotion.

## Review Route

Open the authoring route:

```text
/official-porting
```

The old `/?engine=1&ui=authentic&view=official-porting` URL remains a cEp15 compatibility alias, not the canonical docs target.

The route lets reviewers:

- search and filter official card and leader candidates;
- inspect source IDs, factions, kinds, rows, strengths, abilities, tags, and leader ability mappings;
- preview candidates with authentic card and leader components;
- edit staging overrides without changing permanent catalog files;
- review image paths and crop metadata;
- mark image/data approval;
- import, export, or copy a review bundle.

Review state is browser-local under:

```text
gwent_official_porting_v1
```

The browser does not write repository files or image files.

## Review Bundle

Exported review bundles include:

- schema version `official-porting-v1`;
- scrape metadata and count summary;
- image crop and approval overrides;
- staging data overrides;
- approved source IDs;
- reviewer notes;
- unresolved issue summary.

Bundles do not include engine runtime instance IDs, match state, AI observations, or hidden hand/deck information.

## Rule And Playability Flags

Candidates remain visible even when they are not engine-ready. Unsupported rules are reported through `portingStatus` and `portingIssues`, not by dropping cards.

Current flags include:

- any catalog ability whose metadata status is not `implemented`;
- official Berserker scrape candidates that are still represented as combined base/replacement rows, have null/zero source strength, or lack a transform link, flagged with non-rule data issues such as `transform_link_required` or `catalog_split_required`;
- all leaders except executable `clear_weather` leaders;
- leaders whose scraped ability has no current catalog leader ability ID.

After cCp9, Mardroeme, Berserker, and Skellige Storm are no longer reported as unimplemented engine rules. Skellige Storm has full scoring and legal-move support; Mardroeme is a real row-based ongoing ability; Berserker transforms through the side deck via `linkedSourceIds[0]`. Official Berserker candidates remain conservatively flagged for data split or transform-link work until promotion.

## Promotion Status (cBp4 + cBp4.1)

cBp4 promoted 157 engine-ready official non-leader candidates from the cBp3 staging layer into permanent `src/data/catalog/cards/*` packs. cBp4.1 then split the two combined Skellige Berserker scrape candidates into four real catalog records, removed the redundant combined Cow/Bovine source, and added a `side_deck_only` tag plus narrow Deck Builder V1 guards.

The promotion manifest at `src/data/catalog/cards/official-promotion.ts` exports `officialPromotionManifest` with `directPromotedCandidateCount` (154), `deferredCandidateCount` (1), `promotedCatalogSourceCount` (159), `splitResolutions`, `duplicateResolutions`, and counts by faction (Neutral 21, Northern Realms 25, Nilfgaard 29, Monsters 35, Scoia'tael 23, Skellige 26) and kind (heroes 25, units 125, specials 4, weather 5). Duplicate resolutions map the spelling-mismatched Game8 Menno candidate (`nilfgaard.menno-coehorn`) to the existing `nilfgaard.menno-coehoorn` catalog source and the scrape-split Dwarven Skirmisher candidate (`scoiatael.dwarven-skirmisher-2`) to the single official Close Combat Dwarven Skirmisher source (`scoiatael.dwarven-skirmisher`, `deckLimit: 3`).

Combined-card cleanup (cBp4.1):

- `skellige.berserker-vildkaarl` is resolved by `skellige.berserker` (4 strength close, ability `berserker`, `linkedSourceIds[0] = "skellige.vildkaarl"`) and `skellige.vildkaarl` (14 strength close, ability `morale_boost`, tag `side_deck_only`).
- `skellige.young-berserker-young-vildkaarl` is resolved by `skellige.young-berserker` (2 strength ranged, ability `berserker`, `linkedSourceIds[0] = "skellige.young-vildkaarl"`) and `skellige.young-vildkaarl` (8 strength ranged, ability `tight_bond`, tag `side_deck_only`).
- `neutral.cow-bovine-defense-force` is removed from the permanent catalog and stays deferred in cBp3 staging with `catalog_split_required:avenger` plus `rule_gap:avenger`. The legacy split records `neutral.cow` (with planned `avenger` ability) and `neutral.bovine-defense-force` remain intact.

Side-deck-only guardrails:

- `tags` may include `"side_deck_only"`. `isSideDeckOnlyCard` exposes the predicate.
- Deck Builder V1 hides side-deck-only cards from the main-deck card pool, returns a blocked `getDeckBuilderAddState` (reason code `side_deck_only`, visible reason `side deck only`), refuses to add them via `addCardToDeck`, and emits a `side_deck_only_main_deck` validation error if an imported deck has one in `mainDeck`.
- Side-deck editing UI is intentionally absent. Non-empty `sideDeck` arrays remain unsupported in Deck Builder V1.

Other invariants from cBp4 still apply:

- Existing legacy current entries are preserved as authority. Promotion only appends unmatched scrape candidates and never overwrites current `strength`, `deckLimit`, `abilities`, `description`, or `linkedSourceIds`. Default Northern Realms and Nilfgaard deck presets are unchanged.
- Promoted faction packs are plain hand-authored TypeScript data; they do not import the Game8 scrape JSON or the cBp3 staging modules at runtime.
- Image paths are reconciled against existing repo assets; the deterministic `AuthenticCard` SVG fallback covers any unresolved path.

## Leader Promotion (cBp5)

cBp5 promotes the remaining official leader candidates and adds five official faction starter deck presets without implementing new leader engine rules.

Leader catalog:

- `currentCatalogLeaders` now contains all `22` official leaders: 5 Northern Realms + 5 Nilfgaard (preserved) plus 5 Monsters, 5 Scoia'tael, and 2 Skellige (added).
- New permanent records live in `src/data/catalog/leaders/{monsters,scoiatael,skellige}.ts` with deterministic `/images/<faction>/leaders/<Name>.png` paths. Image binaries are not committed; missing images fall back to `AuthenticLeaderCard`'s synthetic faction-styled rendering.
- `src/data/catalog/leaders/official-promotion.ts` exports `officialLeaderPromotionManifest` with `officialLeaderCandidateCount` (22), `promotedLeaderSourceCount` (22), preserved/added/promoted source ID groups, `countsByFaction` (5/5/5/5/2), `executableLeaderSourceIds` (clear-weather Foltest only), and `placeholderLeaderAbilityIds`.

Placeholder leader ability metadata:

- New catalog leader ability IDs added with `status: "placeholder"`: `play_any_weather`, `double_close`, `discard_two_draw_one_from_deck`, `restore_discard_to_hand`, `double_spies`, `weather_half_penalty`, `optimize_agile_rows`, `double_ranged`, `draw_extra_card`, `shuffle_discards_into_decks`.
- Engine `legalMoves` and `commands` continue to gate executable leader use to `clear_weather` only. Placeholder leader records validate but do not produce executable legal leader moves.
- `officialPortingSummary.unsupportedLeaderAbilityCounts` now keys non-executable leader abilities by their concrete ability ID instead of collapsing them into `unknown`.

Official starter deck presets:

- New presets: `official-northern-realms-starter`, `official-nilfgaard-starter`, `official-monsters-starter`, `official-scoiatael-starter`, `official-skellige-starter`.
- Each starter deck has at least 22 battlefield cards, at most 10 specials, only neutral plus its own faction, and no `side_deck_only` cards in `mainDeck`.
- The Skellige starter includes `skellige.berserker`, `skellige.young-berserker`, and `skellige.mardroeme`, with a synced `sideDeck` of `skellige.vildkaarl` and `skellige.young-vildkaarl` whose counts mirror the Berserker base counts in `mainDeck`.
- `currentNorthernRealmsDeckPreset` and `currentNilfgaardDeckPreset` remain unchanged. They stay first in `currentDeckPresets`, and `getDefaultPreGameSelection()` continues to default to `current-northern-realms` versus `current-nilfgaard`.
- Official starter presets that include placeholder leader abilities surface a deck-builder warning but remain `playable` in `validateDeckPreset`.
- `neutral.cow` (planned `avenger`) is intentionally excluded from every official starter until Avenger lands.

Linked side-deck Deck Builder support:

- `computeLinkedSideDeckRequirements(deck, cards)` derives `replacement source id -> required count` by summing main-deck counts of cards whose `linkedSourceIds` reference a `side_deck_only` replacement.
- `syncLinkedSideDeck(deck, cards)` rewrites `deck.sideDeck` to match those requirements without touching `mainDeck` order.
- `addCardToDeck`, `removeCardFromDeck`, `changeDeckFaction`, and `duplicateDeckPreset` automatically resync the side deck. Faction changes also clear stale wrong-faction side-deck entries.
- `validateDeckPreset` accepts a non-empty side deck only when every entry exists, is tagged `side_deck_only`, belongs to the deck faction, is linked from at least one main-deck card, and has a count that exactly matches the linked requirement. Error codes are `unknown_side_deck_card`, `invalid_side_deck_card`, `wrong_faction_side_deck_card`, `unlinked_side_deck_card`, and `side_deck_count_mismatch`. Side-deck-only cards in `mainDeck` continue to emit `side_deck_only_main_deck`.
- `AuthenticDeckBuilderScreen` renders a compact `side deck · linked replacements` section listing the synced replacements when the active deck has any. The main-deck card pool still hides `side_deck_only` cards; there is no free-form side-deck pool.
- LocalStorage persistence, JSON export/copy, JSON import, and `play →` all preserve valid linked side decks. Invalid side decks surface visible validation errors instead of silently shipping into the engine.

## Future Promotion

Future phases should:

- Promote leader engine rules so each official leader ability becomes `implemented` and produces real legal leader moves; only `clear_weather` is executable today.
- Implement `avenger` (and unblock `neutral.cow`) and `summon` so currently planned card abilities can be promoted without warnings.
- Current promoted card and leader image paths now resolve to committed public assets after the cBp5 follow-ups. Future official-porting work should keep the disk-existence regression green when adding new permanent sources.
- Update deck-builder source sets and `currentDeckPresets` only when rule and image gaps are intentionally accepted or fixed.
