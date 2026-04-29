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

## Future Promotion

A later promotion/codegen phase should consume the reviewed bundle, move approved source records into `src/data/catalog/cards/*` and `src/data/catalog/leaders/*`, place production images under `public/images/`, and update deck-builder source sets only when rule and image gaps are intentionally accepted or fixed.
