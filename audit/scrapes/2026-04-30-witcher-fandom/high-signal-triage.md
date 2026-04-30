# Witcher Fandom Scrape High-Signal Triage - 2026-04-30

Sources:

- https://witcher.fandom.com/wiki/Monsters_Gwent_deck
- https://witcher.fandom.com/wiki/Nilfgaardian_Empire_Gwent_deck
- https://witcher.fandom.com/wiki/Northern_Realms_Gwent_deck
- https://witcher.fandom.com/wiki/Scoia%27tael_Gwent_deck
- https://witcher.fandom.com/wiki/Skellige_Gwent_deck
- https://witcher.fandom.com/wiki/Gwent_neutral_cards

Firecrawl was unavailable due account credits, so this scrape used the public
Witcher Fandom MediaWiki API. Raw API snapshots and the generated comparator
output live in this folder.

## Raw Comparator Counts

- Parsed wiki card pages: 186.
- Parsed current catalog card sources: 162.
- Name matches: 159.
- Missing by naive card-source comparison: 27.
- Matched records with inferred differences: 29.

These counts are not final defects. The first comparator does not include the
leader catalog, so the 22 official leaders appear as false missing rows. Ability
inference is deliberately rough and over-flags words that appear in explanatory
text, especially Tight Bond references to Commander's Horn, weather names inside
Clear Weather text, and Mardroeme/Berserker transform text.

## High-Confidence Catalog Reconciliation Items

1. Kambi and Hemdall are incorrectly represented as one source.
   - Wiki Kambi: Skellige unit, close row, 0 strength, summons a powerful unit
     when removed from the battlefield.
   - Wiki Hemdall: Skellige hero, close row, 11 strength, transformed version of
     Kambi.
   - Current catalog: `skellige.kambi-hemdall`, hero, close row, 0 strength,
     no ability, Kambi image.
   - Required direction: split into a Kambi battlefield trigger source and a
     Hemdall replacement/side-deck-only source. This likely belongs with the
     Avenger/Summon rule work rather than as a pure data typo.

2. Cerys has the right ability family but lacks the linked target.
   - Wiki: "Summon Shield Maidens: Summons all Shield Maidens from deck and
     hand."
   - Current catalog: `skellige.cerys` has `abilities: ["muster"]` but no
     `linkedSourceIds`.
   - User confirmation: keep the current Muster-style representation; the
     target group is Shield Maidens.
   - Required direction: link to `skellige.clan-drummond-shield-maiden` and add
     regression coverage that Cerys pulls Shield Maidens from hand/deck.

3. Kayran is missing its real ability and Agile row support.
   - Wiki: Monsters hero, 8 strength, Hero + Morale Boost + Agile close/ranged.
   - Current catalog: `monsters.kayran`, hero, 8 strength, ranged only, no
     ability.
   - Required direction: set rows to close/ranged and abilities to
     `agile`/`morale_boost`. This depends on the already-confirmed rule that a
     hero can source its own row ability while remaining immune as a receiver.

4. Toad is missing Scorch - Ranged.
   - Wiki: Monsters unit, 7 strength, Ranged, Scorch - Ranged against the
     opponent's strongest ranged unit(s) if that opponent ranged row totals 10+.
   - Current catalog: `monsters.toad`, ranged, no ability.
   - Required direction: represent as row-scoped `scorch_range`, not generic
     whole-board `scorch`.

5. Schirru is too generic.
   - Wiki/user-confirmed: Scorch - Siege against the opponent's strongest siege
     unit(s) if that opponent siege row totals 10+.
   - Current catalog: `scoiatael.schirru`, siege unit, `abilities: ["scorch"]`.
   - Required direction: represent as row-scoped `scorch_siege`, not generic
     whole-board `scorch`.

6. Clan Dimun Pirate needs self-including global Scorch semantics.
   - User-confirmed: if no card is stronger, it destroys itself; if tied at
     highest, it destroys tied cards and itself. Effective strength after
     modifiers/weather is used.
   - Current catalog: `skellige.clan-dimun-pirate`, ranged unit,
     `abilities: ["scorch"]`.
   - Required direction: keep as whole-board unit-source Scorch, but engine
     behavior must include the source card as eligible.

7. Triss Merigold row appears wrong.
   - Wiki: neutral hero, close row, 7 strength, no special ability.
   - Current catalog: `neutral.triss-merigold`, ranged row.
   - Required direction: change to close unless a stronger in-game source
     contradicts the wiki snapshot.

8. Siege Tower has a catalog name typo.
   - Wiki: "Siege Tower".
   - Current catalog: `northern-realms.siege-tower` name is `"\tSiege Tower"`.
   - Required direction: remove the leading tab.

9. Transformed Vildkaarl names are source-name mismatches, not missing cards.
   - Wiki page names include `Transformed Vildkaarl` and `Transformed Young
     Vildkaarl`.
   - Current catalog uses `skellige.vildkaarl` and `skellige.young-vildkaarl`
     with `side_deck_only`.
   - Required direction: no immediate gameplay issue unless display names should
     include the `Transformed` prefix.

## Likely False Positives From The Comparator

- The 22 leader rows are false missing rows because the comparator only checked
  card sources, not `src/data/catalog/leaders`.
- Biting Frost, Impenetrable Fog, Torrential Rain, Skellige Storm, and Clear
  Weather kind mismatches are parser artifacts from wiki type fields. User
  confirmed these should remain special neutral weather cards, except Skellige
  Storm is also a neutral special weather card with the `skellige_storm` ability.
- Tight Bond cards reported as missing `commanders_horn` are parser artifacts
  from the phrase "unless a Commander's Horn..." in the Tight Bond text.
- Geralt/Ciri `muster` vs `muster_roach` is a naming specialization, not a
  defect; user confirmed the current Roach-specific representation is correct.
- Villentretenmerth `scorch` vs `scorch_close` is a naming specialization, not a
  defect.
- Bovine Defense Force `summon` is a source-text artifact. Bovine is the
  replacement summoned by Cow; user confirmed Bovine itself has no ability.
- Cow `summon` vs `avenger` is naming only. User confirmed current Cow Avenger
  representation is correct and should share semantics with Kambi.
- Clear Weather should clear all active weather entries, including Skellige
  Storm. Current `clearWeather` command behavior iterates all
  `state.weather.entries`, so this appears structurally correct; add an explicit
  regression if a rule patch touches weather tests.
- Mardroeme/Berserker rows reported as missing extra abilities are parser
  artifacts from transformation text.

## Recommended Spec Impact

Do a focused reconciliation implementation before broadening more rules:

- Catalog fixes: Cerys links, Kayran row/abilities, Toad ability, Schirru
  ability, Triss row, Siege Tower name typo, Kambi/Hemdall split.
- Engine fixes: hero-source row effects, row-scoped unit Scorch for
  `scorch_range`/`scorch_siege`, generic unit-source whole-board Scorch with
  self-including Clan Dimun behavior, and shared Kambi/Cow Avenger battlefield
  removal summon semantics.
- Tests: source-level catalog assertions plus engine traces for Cerys, Kayran,
  Toad, Schirru, Clan Dimun, Kambi/Hemdall, Triss row legality, and Clear
  Weather clearing Skellige Storm.
