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

Open the opt-in authoring route:

```text
/?engine=1&ui=authentic&view=official-porting
```

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

The promotion manifest at `src/data/catalog/cards/official-promotion.ts` exports `officialPromotionManifest` with `directPromotedCandidateCount` (156), `deferredCandidateCount` (1), `promotedCatalogSourceCount` (160), `splitResolutions`, and counts by faction (Neutral 21, Northern Realms 25, Nilfgaard 29, Monsters 35, Scoia'tael 24, Skellige 26) and kind (heroes 25, units 126, specials 4, weather 5).

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

## Future Promotion

Future phases should:

- Promote official leaders into `src/data/catalog/leaders/*` and add official faction starter deck presets once leader abilities are scoped.
- Add side-deck authoring UI and persistence so Berserker decks can be exercised end-to-end in Deck Builder.
- Source the missing `/images/scoiatael/units/Elven_Skirmisher.png` asset (the only promoted card whose preferred path is not yet present in the repo image manifest).
- Revisit `neutral.cow-bovine-defense-force` once an Avenger rules phase lands.
- Update deck-builder source sets and `currentDeckPresets` only when rule and image gaps are intentionally accepted or fixed.
