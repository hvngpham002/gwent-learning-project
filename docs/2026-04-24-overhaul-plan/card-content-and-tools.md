# Card Content And Tooling Plan

The card system should let the current app remain playable while making future card population straightforward. The goal is not to require every card up front. The goal is to make adding the next card boring.

## Source Data Model

Cards should be source data, not hardcoded deck-builder logic.

Suggested source file layout:

```text
src/data/catalog/
  cards/
    neutral.json
    northern-realms.json
    nilfgaard.json
    monsters.json
    scoiatael.json
    skellige.json
  leaders/
    northern-realms.json
    nilfgaard.json
    monsters.json
    scoiatael.json
    skellige.json
  deck-presets/
    current-northern-realms.json
    current-nilfgaard.json
    training-small-nr.json
```

Suggested image layout:

```text
public/images/cards/
  neutral/
    geralt-of-rivia.png
    decoy.png
  northern-realms/
    blue-stripes-commando.png
  nilfgaard/
    young-emissary.png
  monsters/
  scoiatael/
  skellige/
```

The catalog record should store `image: "/images/cards/northern-realms/blue-stripes-commando.png"` or allow an image override. The simple convention is:

```text
public/images/cards/{faction}/{assetSlug}.png
```

`assetSlug` should be filesystem-safe. For namespaced IDs such as `northern-realms.blue-stripes-commando`, the default slug is the part after the dot: `blue-stripes-commando`.

## Card Record Shape

Example unit:

```json
{
  "sourceId": "northern-realms.blue-stripes-commando",
  "name": "Blue Stripes Commando",
  "faction": "northern_realms",
  "kind": "unit",
  "strength": 4,
  "rows": ["close"],
  "abilities": ["tight_bond"],
  "tags": ["non_hero"],
  "deckLimit": 3,
  "image": "/images/cards/northern-realms/blue-stripes-commando.png",
  "description": "Tight Bond."
}
```

Example hero:

```json
{
  "sourceId": "neutral.geralt-of-rivia",
  "name": "Geralt of Rivia",
  "faction": "neutral",
  "kind": "hero",
  "strength": 15,
  "rows": ["close"],
  "abilities": [],
  "tags": ["hero"],
  "deckLimit": 1,
  "image": "/images/cards/neutral/geralt-of-rivia.png"
}
```

Example special:

```json
{
  "sourceId": "neutral.skellige-storm",
  "name": "Skellige Storm",
  "faction": "neutral",
  "kind": "special",
  "strength": 0,
  "rows": [],
  "abilities": ["skellige_storm"],
  "tags": ["weather"],
  "deckLimit": 3,
  "image": "/images/cards/neutral/skellige-storm.png"
}
```

Example linked card:

```json
{
  "sourceId": "neutral.gaunter-odimm",
  "name": "Gaunter O'Dimm",
  "faction": "neutral",
  "kind": "unit",
  "strength": 2,
  "rows": ["siege"],
  "abilities": ["muster"],
  "linkedSourceIds": ["neutral.gaunter-odimm-darkness"],
  "tags": ["non_hero"],
  "deckLimit": 1,
  "image": "/images/cards/neutral/gaunter-odimm.png"
}
```

## Runtime Identity

Use two IDs:

- `sourceId`: stable catalog identity, for deck lists and content editing.
- `instanceId`: unique runtime card identity, generated when a deck is instantiated.

This fixes duplicate-ID issues from the audit. If a deck includes three Blue Stripes Commandos, all three share `sourceId` but have distinct `instanceId`.

## Ability Registry

Card data should list ability IDs. Rule code should live in the engine ability registry.

```ts
type AbilityId =
  | "tight_bond"
  | "medic"
  | "morale_boost"
  | "spy"
  | "muster"
  | "commanders_horn"
  | "decoy"
  | "frost"
  | "fog"
  | "rain"
  | "clear_weather"
  | "skellige_storm"
  | "mardroeme"
  | "berserker"
  | "avenger";
```

Unknown ability IDs should fail validation unless explicitly marked as `status: "unimplemented"` for content staging. The UI can show unimplemented cards as unavailable in deck builder.

## Deck Presets

Deck presets should reference source IDs and counts:

```json
{
  "presetId": "current-northern-realms",
  "name": "Current Northern Realms",
  "faction": "northern_realms",
  "leaderSourceId": "northern-realms.foltest-lord-commander",
  "mainDeck": [
    { "sourceId": "northern-realms.blue-stripes-commando", "count": 3 },
    { "sourceId": "neutral.decoy", "count": 2 }
  ],
  "sideDeck": []
}
```

This removes hardcoded name lookups like "find Blue Stripes Commando, push three copies."

## Validation Rules

Catalog validation should check:

- unique `sourceId`;
- valid faction;
- valid kind;
- valid row list for kind;
- strength present and non-negative where required;
- known ability IDs;
- all linked source IDs exist;
- image path present;
- deck limit valid;
- heroes not duplicated beyond limit;
- leaders stored separately from main decks;
- deck preset main deck satisfies minimum size once the product enforces it;
- side deck references only side-deck-eligible cards where rules require it.

## Card Studio

Card Studio is an in-game content tool. It should not be entangled with match rules.

Minimum feature set:

- create/edit card record;
- choose faction, kind, rows, strength, abilities, tags, deck limit;
- enter image path and preview it;
- validate record live;
- save draft to localStorage;
- import catalog JSON;
- export card pack JSON;
- mark ability as implemented/unimplemented;
- add exported cards to deck builder session.

Browser limitation:

- A static browser app cannot safely write directly to `src/data/catalog`.
- Default flow should be "export JSON, then commit it to the repo."
- A future local dev-only file-write endpoint can be added later, but it is not required for the first overhaul.

## How To Add A Card After The Overhaul

1. Put the image at `public/images/cards/{faction}/{assetSlug}.png`.
2. Add the card JSON record under `src/data/catalog/cards/{faction}.json`, or create it in Card Studio and export/import the pack.
3. If the card uses only existing ability IDs, no rule code is needed.
4. If the card needs a new ability, add an ability registry entry and tests.
5. Add the card to a deck preset or select it in Deck Builder.
6. Run catalog validation and tests.

## Current-Amount Playability

The game should stay playable with the current card count by providing:

- default current Northern Realms preset;
- default current Nilfgaard preset if usable;
- small training presets for simulation;
- clear UI messaging for incomplete factions;
- deck builder filters that hide or warn on unimplemented cards.

Future cards should expand the catalog, not alter engine assumptions.
