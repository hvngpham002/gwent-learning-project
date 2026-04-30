# Witcher Fandom Card Source Triage - 2026-04-30

Source: Witcher Fandom MediaWiki API snapshots from the six pages requested by the user.

## Counts

- Wiki card pages parsed: 186
- Current catalog cards parsed: 162
- Name matches: 159
- Wiki cards missing in current catalog by name: 27
- Matched records with inferred field differences: 29

## High-Signal Missing Wiki Cards

- Hemdall (skellige, hero, close, 11): Hero: Not affected by any Special Cards or abilities.
- Kambi (skellige, unit, close, 0): When this card is removed from the battlefield, it summons a powerful new Unit Card to take its place.

## Selected Mismatches / Review Items

- Cerys -> skellige.cerys
  - Wiki: hero, rows=close, strength=10, inferred=none
  - Current: hero, rows=close, strength=10, abilities=muster
  - Raw ability: Hero: Not affected by any Special Cards or abilities. Summon Shield Maidens: Summons all Shield Maidens from deck and hand.
  - Issues: abilities
- Skellige Storm -> neutral.skellige-storm
  - Wiki: unit, rows=-, strength=-, inferred=skellige_storm
  - Current: special, rows=-, strength=0, abilities=skellige_storm
  - Raw ability: Reduces the Strength of all Range and Siege Units to 1.
  - Issues: kind
- Biting Frost -> neutral.biting-frost
  - Wiki: unit, rows=-, strength=-, inferred=frost
  - Current: special, rows=-, strength=0, abilities=frost
  - Raw ability: Sets the strength of all Close Combat cards to 1 for both players.
  - Issues: kind
- Bovine Defense Force -> neutral.bovine-defense-force
  - Wiki: unit, rows=close, strength=8, inferred=summon
  - Current: unit, rows=close, strength=8, abilities=none
  - Raw ability: -
  - Issues: abilities
- Cirilla Fiona Elen Riannon -> neutral.cirilla-fiona-elen-riannon
  - Wiki: hero, rows=close, strength=15, inferred=muster
  - Current: hero, rows=close, strength=15, abilities=muster_roach
  - Raw ability: Hero: Not affected by any Special Cards or abilities. Muster: Find the Roach card in your deck and play it instantly. /expired [https://www.thewitcher.com/en/my-rewards My Rewards]}}
  - Issues: abilities
- Clear Weather -> neutral.clear-weather
  - Wiki: unit, rows=-, strength=-, inferred=clear_weather, frost, fog, rain
  - Current: special, rows=-, strength=0, abilities=clear_weather
  - Raw ability: Removes all Weather Card (Biting Frost, Impenetrable Fog and Torrential Rain) effects.
  - Issues: kind, abilities
- Cow -> neutral.cow
  - Wiki: unit, rows=-, strength=0, inferred=summon
  - Current: unit, rows=close, strength=0, abilities=avenger
  - Raw ability: When this card is removed from the battlefield, it summons a powerful new Unit Card to take its place.
  - Issues: abilities
- Geralt of Rivia -> neutral.geralt-of-rivia
  - Wiki: hero, rows=close, strength=15, inferred=muster
  - Current: hero, rows=close, strength=15, abilities=muster_roach
  - Raw ability: Hero: Not affected by any Special Cards or abilities. Muster: Find the Roach card in your deck and play it instantly. /expired [https://www.thewitcher.com/en/my-rewards My Rewards]}}
  - Issues: abilities
- Impenetrable Fog -> neutral.impenetrable-fog
  - Wiki: unit, rows=-, strength=-, inferred=fog
  - Current: special, rows=-, strength=0, abilities=fog
  - Raw ability: Sets the strength of all Ranged Combat cards to 1 for both players.
  - Issues: kind
- Skellige Storm -> neutral.skellige-storm
  - Wiki: unit, rows=-, strength=-, inferred=skellige_storm
  - Current: special, rows=-, strength=0, abilities=skellige_storm
  - Raw ability: Reduces the Strength of all Range and Siege Units to 1.
  - Issues: kind
- Torrential Rain -> neutral.torrential-rain
  - Wiki: unit, rows=-, strength=-, inferred=rain
  - Current: special, rows=-, strength=0, abilities=rain
  - Raw ability: Sets the strength of all Siege Combat cards to 1 for both players.
  - Issues: kind
- Triss Merigold -> neutral.triss-merigold
  - Wiki: hero, rows=close, strength=7, inferred=none
  - Current: hero, rows=ranged, strength=7, abilities=none
  - Raw ability: Hero: Not affected by any Special Cards or abilities.
  - Issues: rows