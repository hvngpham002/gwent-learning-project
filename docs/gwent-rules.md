# GWENT: The Legendary Card Game — Complete Rules Reference

*Based on the official rulebook from the CD PROJEKT RED 10th-anniversary physical release (© 2025 CD PROJEKT S.A.). Set in the universe created by Andrzej Sapkowski.*

This document is a comprehensive extraction of the printed rules, followed by a thorough edge-case section that works through the logical consequences of combining those rules (e.g. "what happens if a Medic revives a Medic").

---

## 1. Game Overview

Gwent is a two-player dueling card game. Each player represents an army and plays cards onto their side of a shared battlefield, trying to outscore their opponent in **Strength** across up to three rounds. The game first appeared as a minigame in *The Witcher 3: Wild Hunt*.

- **Players:** 2
- **Objective:** Force your opponent to run out of **Gem Counters**. The first player to lose all their gems loses the game.
- **Round structure:** Each round ends when both players have **Passed**. The player with less total Strength on the battlefield loses a gem.

### Golden Rule

> Whenever a card's text contradicts the rules in this manual, **the card takes precedence**.

---

## 2. Components (Box Contents)

- 436 Faction Cards
- 10 Aid Cards (one per faction covering Unit and Special Card abilities, plus one Leader Aid per faction)
- 4 Gem Tokens (2 per player)
- 1 Coin (used to determine first player)
- 1 Score Tracking Board and 4 Score Tokens (2 per player — one for 10s, one for 1s; tokens flip to show "100+" side)
- 1 Paper Game Board
- 2 Rulebooks

---

## 3. Factions

There are 5 factions, each with its own color, symbol, playstyle, and passive faction ability. All cards in a deck must show the chosen faction's color.

| Faction | Symbol | Color | Theme |
|---|---|---|---|
| **Monsters** | Three claw marks | Red | "Muster" — quickly summons swarms of same-name creatures. |
| **Nilfgaard** | Sun | Gold / Yellow | "Spy" and "Medic" — underhanded tactics for card advantage. |
| **Northern Realms** | Fleur-de-lis | Blue | "Tight Bond" — same-name units empower each other. |
| **Scoia'tael** | Crossed arrows | Green | "Agile" units — flexibility between Close Combat and Ranged Combat rows. |
| **Skellige** | Horned helm | Purple | "Berserkers" — transform into more powerful cards. |

### Pre-Constructed (Starter) Decks

- Each faction ships with a recommended starter deck. Cards belonging to a faction's starter deck are marked with a **white star** in the bottom-left corner.
- **Skellige starter cards with a black star** are reserved for the **Side Deck** of the starter deck (used by Berserker/Summon transformations — see §9 and §15).

---

## 4. Deck Construction

A legal deck must contain:

- **Exactly 1 Leader Card**
- **At least 22 Unit Cards** (minimum)
- **At most 10 Special Cards** (maximum)

All cards must be of the chosen faction's color.

> **Useful Tip (from the book):** You may include more Unit Cards than the minimum of 22, but a larger deck reduces the chance of drawing your best cards.

### The Side Deck

Some cards can transform into or summon other cards (e.g. Skellige's **Berserkers**, units with **Summon**). The replacement/target cards may **not** start in the main deck — they are kept in a **side deck** next to the play area until triggered.

Players also receive (per player):
- **2 Gem Counters**
- **2 Player Aids** (rules summaries — Player Aid 1 and Player Aid 2)
- **2 Score Tracking Tokens** (10s token and 1s token)

---

## 5. The Board

The play area is divided between the two players. Each player has their own mirrored set of zones.

### Per-Player Zones

1. **Discard Pile** — Where cards that leave the battlefield go (including Spy cards).
2. **Deck** — Face-down draw pile.
3. **Close Combat Row** (sword icon `⚔`) — For melee units.
4. **Ranged Combat Row** (bow icon `🏹`) — For ranged units.
5. **Siege Combat Row** (catapult icon `💥`) — For siege units.
6. **Commander's Horn Slot** — An adjacent slot on each row for playing a **Special** Commander's Horn card onto that row.
7. **Scoring Ladder** — Used with the two score tokens (10s on top rail, 1s on bottom rail; flip tokens if score reaches 100+).
8. **Gem Counters** zone — Starts with 2 gems.
9. **Player Aid 1** — Reference card zone.
10. **Player Aid 2** — Reference card zone.
11. **Leader Card** zone — Face-up Leader for the whole game.

### Shared Zones

12. **Weather Cards** area — A central zone on the board where face-up Weather cards apply to **both** players' matching rows.

### Board Layout Orientation

Rows are laid out so that each player's **Close Combat** row is closest to the middle line (adjacent to the opponent), their **Ranged Combat** row is second, and their **Siege** row is furthest back.

---

## 6. Cards in Detail

### 6.1 Leader Cards

- Chosen before the game and placed face-up in the Leader Card zone.
- Identifiable by the **faction symbol in the top-left corner**.
- Each Leader grants either a **Passive** ability (always in effect, marked with a circled **P**) or an **Active** ability (used once per game in place of playing a card on your turn).
- The Aid Cards describe each Leader's ability.
- **Example Leader — King Bran, The Unifier (Skellige):** Passive — "Friendly Units only lose half their Strength in bad weather conditions. (Rounded down)." Flavor: *"No one can replace Bran. Though they're sure to try."*

### 6.2 Unit Cards

Every Unit Card shows:

- **Strength value** — Top-left corner. Contributes to your round total while on the battlefield.
- **Range icon** — Directly below Strength. Determines which combat row the unit must be played on (sword = Close, bow = Ranged, catapult = Siege).
- **Ability icon(s)** — Below the range icon (e.g. Morale Boost, Tight Bond, Medic, Spy, Muster, Agile, etc.).
- **Faction banner** — Along the side (color-coded).
- **Name and description** — Below the artwork.

When a Unit is placed, its Strength is added to the player's total for that round, and its ability (if any) resolves **immediately**.

### 6.3 Hero Cards

Heroes are a subset of Unit Cards distinguished by:

- The word **"HERO"** printed above their name.
- Their Strength value icon is **spiked** and filled with the faction's color.

**Heroes are the ONLY cards not affected by any special abilities** — meaning they are immune to Special Card, Unit Card, *and* Leader Card abilities. This is one of the most important rules in the game (see §13 for edge-case implications).

### 6.4 Special Cards

Special Cards (e.g. Weather, Decoy, Scorch, Commander's Horn) have **no Strength value** of their own. Their ability is shown by an icon in the top-left corner and described on the Aid Cards. Special Card abilities resolve **immediately** when played to the appropriate area.

### 6.5 Where Cards Are Played

- **Units** are played to the row matching their range icon.
- **Special "row-based" cards** (Commander's Horn, Decoy, Scorch, Mardroeme) are played directly to a combat row.
- **Weather cards** are played face-up to the shared Weather Cards area and affect both players' matching rows.

All card effects **must be applied if possible** when played — you cannot "choose not to" resolve an ability that can trigger.

---

## 7. Starting the Game

1. **Coin flip** to determine the first player. Some Leader or Faction abilities may override this (notably Scoia'tael — see §11).
2. Each player shuffles their deck and **draws 10 cards**. This hand will be used for the **entire game** (across up to 3 rounds) — you do **not** re-draw at the start of later rounds (except via abilities that draw cards).
3. **Mulligan step:** Each player may then redraw **up to 2 cards**, one card at a time. For each redraw, choose 1 current hand card, draw its replacement from the deck, then shuffle the chosen card back into the deck. Because redraws resolve sequentially, the replacement card from the first redraw is part of the current hand and may be chosen for the second redraw.
4. These 10 cards (after mulligan) are the player's hand for the rest of the game.

> **Tip (from the book):** Most of the time you must spread your starting hand across 2 or 3 rounds. Passing is often the best strategy.

---

## 8. Rhythm of Play

### 8.1 Turn Options

On your turn you must choose **exactly one** of:

1. **Play a card** (from your hand).
2. **Use your active Leader ability** (once per game only; only if Leader is Active).
3. **Pass.**

### 8.2 Passing

- Passing means **sitting out the rest of this round**.
- The other player continues playing one card per turn until they also pass.
- Once you pass you cannot play again until the next round begins.

### 8.3 Resolution (End of Round)

When **both players have passed**:

- Each player sums the **Strength** of all their cards currently on the battlefield (both Units and Heroes — plus any ongoing modifiers from Weather, Tight Bond, Morale Boost, Horn, Mardroeme).
- The player with the **lowest** total Strength **loses** the round and **removes a gem**.
- In a **draw**, **both players remove a gem** — *unless* Nilfgaard's faction ability is in play (Nilfgaard wins draws).
- Cards occupying a player's battle rows are placed in that row-side player's
  **discard pile** (exception: Monsters keep one Unit — see §11). This includes
  Spy cards: a Spy on the opponent's side goes to the opponent's discard pile.
  Global Weather/Special cards that do not occupy a side are discarded to their
  controller's discard pile unless the effect says otherwise.
- The winner of the round **starts the next round**.

### 8.4 Game End

- The game ends as soon as a player has **no Gem Counters left**.
- That player loses; the other player wins.
- If **both players lose their last gem at the same time**, the game ends in a **draw**.

> Because the game is best-of-3 rounds and you only draw 10 cards total, hand management across rounds is critical.

---

## 9. Playing a Card — Placement Rules

- Units go on the row matching their range icon.
- Some Special Cards (like Decoy) go directly on a combat row; their effect is resolved per the Player Aid.
- **All card effects must be applied if possible.**
- Unit Card abilities and Special Card abilities both resolve **immediately after the card is placed**.

### Discard Pile Rule

> Row-occupying battlefield cards sent to discard go to the discard pile for
> the side they currently occupy. This includes round cleanup and Scorch
> destruction. A Spy on the opponent's side therefore goes to the opponent's
> discard pile. Global cards that do not occupy a side use their controller's
> discard unless an effect says otherwise.

This matters: a Spy's controller is still the player who played or revived it
for on-play effects such as drawing cards, but discard placement follows the
side of the table the Spy currently occupies when a row card is sent to discard.

---

## 10. Keeping Score

Each player tracks their total Strength on their own scoring ladder:

- The top rail is numbered 10, 20, 30, … 90 — place one score token here to indicate the **tens** digit.
- The bottom rail is numbered 1, 2, … 9 — place the other token here to indicate the **ones** digit.
- If the score reaches 100+, **flip both tokens** to the "100" side and continue marking the 10s and 1s as normal.

---

## 11. Faction Abilities (Appendix)

Each faction's passive ability is always in effect.

| Faction | Faction Ability |
|---|---|
| **Monsters** | At the end of each round, **one Unit Card stays on the battlefield** (carrying over to the next round). To choose it, the controlling player shuffles all their Unit Cards on the battlefield **excluding Heroes**, and draws one at random. |
| **Nilfgaard** | **Wins the round whenever there is a draw.** (Overrides the normal rule that both players lose a gem on a tie.) |
| **Northern Realms** | **Draws a card from the deck whenever a round is won.** |
| **Scoia'tael** | **Decides who goes first** at the start of the game (overrides the coin flip). |
| **Skellige** | At the **start of the third round**, **two random Unit Cards, excluding Heroes**, are taken from the controlling player's **discard pile** and put on the battlefield. Shuffle the discard pile and choose two at random. |

---

## 12. Unit Card Abilities (Appendix)

These abilities appear on Unit Cards (icons below Strength). All resolve when the card is played, unless stated otherwise.

| Icon / Name | Description |
|---|---|
| **Agile** (circular arrows) | Place on either the **Close Combat** *or* **Ranged Combat** row. **Cannot be moved once placed.** |
| **Commander's Horn** (Unit) | Doubles the Strength of all **other** Unit Cards on this card's row — unless there is already a horn-icon card affecting this row. |
| **Medic** (cross in circle) | Choose one Unit Card in the discard pile **excluding Heroes**, and **play it immediately**. |
| **Morale Boost** (cross with arrows) | Add **+1 Strength** to all units on the row (**excluding itself**). |
| **Muster** (horned helm with face) | Find **all specified cards** (typically same-name or same-creature-group copies) in both the **hand and deck**, and play them immediately. Then shuffle the deck. |
| **Tight Bond** (clasped hands) | Multiply this Unit's Strength by the **number of allies with the same name** currently on your side of the battlefield (including itself). |
| **Scorch** (Unit, skull icon on a Close-Combat unit) | If the opponent has a total Strength of **10 or higher** on the **row directly opposite** this card, the Unit Card(s) with the **highest Strength excluding Heroes** on that opposite row are sent to the discard pile. |
| **Spy** (eye) | **Play onto the opponent's battlefield** — its Strength counts toward the **opponent's** total. Then draw **two cards** from your deck. |
| **Summon** (stag/deer icon) | When this card is discarded from the battlefield in **any instance** (including at the end of a round), it is **replaced** with the corresponding card from the **side deck**. |
| **Berserker** (bear icon) | The specified card is played from the **side deck**, while the Berserker is **removed from the game entirely** (not sent to the discard pile). Triggered by Mardroeme. |
| **Mardroeme** (Unit, mushroom icon) | Triggers the transformation of all "Berserker" cards on **its row**. |

---

## 13. Special Card Abilities (Appendix)

| Icon / Name | Description |
|---|---|
| **Commander's Horn** (Special) | **Doubles** the Strength of **all Unit Cards** on its row. **Only one per row.** |
| **Decoy** (scarecrow icon) | Replace one Unit Card, **excluding Heroes**, on **the controlling player's side** of the battlefield. The replaced Unit returns to the player's hand. The Decoy itself has **Strength value 0** and now occupies that row slot. |
| **Mardroeme** (Special) | Place on a combat row. Triggers the transformation of all Berserker cards on that row. |
| **Scorch** (Special) | Send the Unit Card(s) with the **highest Strength, excluding Heroes**, on the **entire battlefield** (both sides) to the discard pile, then discard itself. |

---

## 14. Weather Cards (Appendix)

Weather cards are played face-up into the shared Weather Cards area and affect the relevant row on **both** players' sides. Multiple weather cards can be active simultaneously.

| Card | Effect |
|---|---|
| **Biting Frost** (snowflake) | Sets Strength of all **Close Combat** (sword) Units to **1** for both players. |
| **Impenetrable Fog** (cloud) | Sets Strength of all **Ranged Combat** (bow) Units to **1** for both players. |
| **Torrential Rain** (raindrop) | Sets Strength of all **Siege** (catapult) Units to **1** for both players. |
| **Skellige Storm** (lightning) | Sets Strength of all **Ranged AND Siege** Units to **1** for both players. |
| **Clear Weather** (sun) | **Discard all Weather cards currently on the battlefield**; their effects are cancelled. Discard this card after playing (one-shot). |

**Important:** Heroes are immune to Weather (as it is a special ability). Weather does not set a Hero's Strength to 1.

---

## 15. Order of Operations (FAQ — Multiple Effects)

When multiple Strength modifiers apply simultaneously, resolve them in this order:

1. **Weather cards** first (set applicable units to Strength 1).
2. **Tight Bond** second (multiply by number of same-name allies).
3. **Morale Boost** third (+1 per Morale Boost on the row, excluding self).
4. **Commander's Horn** last (doubles).

### Worked Example (from the book)

> If three "Tight Bond" Unit Cards with a printed Strength of **4** are in play, their Strength is multiplied by 3, for a total of **12 Strength each**.

### Derived Example (Weather + everything)

Base Strength **4**, Tight Bond (3 same-name allies), Morale Boost +1 on the row, Commander's Horn on the row, with **Biting Frost** active and this is a Close Combat unit:

- Weather → sets base to **1**.
- Tight Bond × 3 → **3**.
- Morale Boost +1 → **4**.
- Commander's Horn × 2 → **8** per unit.

Without Weather:

- Tight Bond: 4 × 3 = **12**.
- Morale Boost: 12 + 1 = **13**.
- Commander's Horn: 13 × 2 = **26** per unit.

### Ongoing vs One-shot Effects (FAQ)

These abilities remain active **as long as the card stays on the battlefield**:
- Weather cards
- Tight Bond
- Morale Boost
- Commander's Horn
- Mardroeme

One-shot effects include: Medic (plays one card), Spy (draw on play), Muster (play on play), Scorch, Decoy, Summon (triggers on discard), Berserker (triggers when Mardroeme is on row).

---

## 16. Specific Card FAQ (from the rulebook)

| Card | Clarification |
|---|---|
| **Clan Dimun Pirate** | Its Scorch ability follows the **Special Card Scorch** rules — it affects the **whole battlefield**. **Clan Dimun Pirate cannot discard itself.** |
| **Eredin, Destroyer of Worlds** | Restore a Unit Card **or** Special Card of the player's choice from their discard pile. (Notable — Medic is Units only and excludes Heroes; Eredin is broader.) |
| **Emhyr var Emreis, The Relentless** | Draw a Unit Card or Special Card of the player's choice **from their deck**, then shuffle the deck. (Effectively a tutor for any card type.) |

---

## 17. Edge Cases and Interaction Ruling Guide

This section systematically works through interactions not explicitly spelled out in the rulebook but determinable from the rules as printed. Where a derivation is being made, it is labeled **[Derived]**.

### 17.1 Heroes — The Untouchables

Heroes are immune to **Special Card, Unit Card, and Leader Card abilities**. Consequences:

- **[Derived] Weather does not affect Heroes.** Weather is a Special Card ability — Heroes keep their printed Strength in Frost, Fog, Rain, or Storm.
- **[Derived] Commander's Horn does not double Hero Strength.** Horn is a special ability; Heroes keep their base value even if a Horn is on their row.
- **[Derived] Morale Boost does not raise a Hero by +1.** Same logic.
- **Heroes cannot be chosen by Scorch** (explicit).
- **Heroes cannot be targeted by Decoy** (explicit).
- **Heroes cannot be revived by Medic** (explicit).
- **Heroes cannot be pulled back by Skellige's third-round ability** (explicit "excluding Heroes").
- **Heroes cannot be chosen as the Monsters "kept on the battlefield" unit** (explicit "excluding Heroes").
- **[Derived] Heroes *can* still be chosen by Eredin, Destroyer of Worlds**, whose FAQ text says "Unit Card or Special Card of the player's choice" — with no Hero exclusion. The Golden Rule says the card takes precedence.
- **[Derived] Heroes *can* still be tutored from deck by Emhyr var Emreis** for the same reason.
- **[Derived] A Hero's *own* abilities still function.** A Hero with Muster, Scorch, or Tight Bond printed on it still resolves that ability when played — the Hero rule prevents **external** abilities from affecting the Hero, but it doesn't prevent the Hero from *being* an ability source.

### 17.2 Medic — Chain Revivals

**Rule:** Medic plays the revived unit immediately, and Unit abilities resolve immediately after placement.

- **What if a Medic revives a Medic?** The revived Medic **also** resolves its ability — it revives another Unit from the discard pile. This can chain as long as there are eligible (non-Hero) Units in the discard pile and new Medic effects in the chain. **[Derived]** There is no printed cap on the chain length.
- **Medic revives a Spy.** The revived Spy's ability still fires: it goes to the **opponent's** side and **you draw 2 cards**. Net effect: you spend the Medic to give the opponent a Spy's Strength while drawing two cards. This is only rarely worth it.
- **Medic revives a Muster unit.** The Muster fires, pulling all same-name copies from your **hand and deck** (not the discard pile). Potentially a huge combo — but it only pulls copies that are currently in hand/deck.
- **Medic revives a Summon unit.** The Summon trigger is **on discard**, not on play. So replaying a Summon unit does **not** trigger Summon again until it leaves the battlefield once more. **[Derived]**
- **Medic revives a Morale Boost / Tight Bond / Commander's Horn unit.** Their ongoing effects apply from the moment they are placed — same as any other play.
- **Medic revives a Decoyed unit.** Perfectly legal — the unit was in your hand, but could also be in the discard pile later.
- **Medic revives a Berserker.** The Berserker sits on its row. If a Mardroeme is already on that row, it transforms using the side deck. **[Derived — see 17.9.]**
- **If the discard pile has no legal (non-Hero) Unit Card, does the Medic still play?** Yes — the Medic Unit itself is placed and its Strength counts. Its ability simply has no legal target and fails to resolve.
- **Can Medic revive an opponent's card from their discard pile?** No — "the discard pile" in context refers to your own. (The printed Medic text doesn't explicitly restrict to own discard, but the entire rules' logic of cards being controlled by the player who played them means you can only access your own discard pile.) **[Derived]**

### 17.3 Spy Interactions

- **Spy is a Unit Card** played onto the **opponent's** side, Strength counts for the opponent.
- **You draw 2 cards.**
- **Whose side is the Spy on?** Physically the opponent's. **Control** still belongs to the player who played it.
- **Discard placement:** Row-card discard follows board side. Your Spy is
  physically on the opponent's side, so it goes to the **opponent's** discard
  pile when round cleanup or Scorch sends it to discard. Its controller still
  matters before discard for the Spy draw and other controller-based effects.
- **Can the opponent Decoy your Spy?** The rulebook says Decoy replaces a Unit Card on **the controlling player's side of the battlefield**. The "controlling player" of Decoy is whoever plays the Decoy. Their "side" is their own. Since the Spy is sitting on the opponent's side, the opponent *could* pick it up with Decoy. **[Derived]** The replaced card returns to *the Decoy-player's hand* — so the opponent would get **your** Spy card in their hand. Whether they can then play it is a grey area: decks require single-faction color, but nothing in the rulebook explicitly forbids playing a mismatched-faction card that someone else "handed" you — this is a genuine rules gap. Most casual playgroups would treat the stolen Spy as unplayable from the opponent's hand. **[Derived — rulebook silent.]**
- **Can you Decoy your own Spy after playing it?** No — the Spy is on the opponent's side, not yours. Decoy requires a target on the controlling player's own side. **[Derived]**
- **Weather affects Spies.** Weather sets all matching-row Units to 1 regardless of side — including Spies.
- **Spy's Strength counts for opponent, so it adds to opponent's round total** — a big Spy can cost you a round. But the 2 cards drawn often overcompensate.
- **Can you play a Spy onto a specific row on the opponent's side?** Yes — it goes onto the opponent's row matching its range icon (opponent's side, Spy's row).
- **If the deck has 0 or 1 cards when you play a Spy, you only draw what remains.** **[Derived]** The rulebook doesn't detail empty-deck behavior, but you simply cannot draw cards that aren't there.

### 17.4 Decoy Edge Cases

- **Decoy replaces a Unit Card on your own side, excluding Heroes.**
- **The replaced Unit returns to your hand.** You may replay it on a later turn (re-triggering its on-play ability).
- **Decoy's Strength is 0** — you lose the Strength of the replaced Unit this turn.
- **Good combos with Decoy:**
  - Bounce a Spy you already played? No — Spies are on the opponent's side, not yours. Decoy cannot target them from your side.
  - Bounce a Medic for a second revival? Yes — replay the Medic to grab another unit from the discard.
  - Bounce a big Tight Bond or Morale Boost unit to protect it from Scorch? Yes — removing it from the board removes it from Scorch consideration.
- **Can you Decoy a Special Card like Commander's Horn?** No — Decoy replaces **Unit Cards** only. Special Cards stay where they are until the round ends.
- **Can you Decoy a Summon-triggered unit?** Yes — and when it's Decoyed back to your hand, it **leaves the battlefield**, which is a discard event — but Decoy specifies "returns to the player's hand," not the discard pile. **[Derived]** This means returning via Decoy likely does **not** trigger Summon (since Summon triggers on being *discarded*, and Decoy explicitly sends it to hand). However, the rulebook does not address this explicitly; some groups may rule otherwise.
- **Can you Decoy your own Agile unit placed on Close Combat to re-place on Ranged?** Yes — Agile locks once placed, but once Decoyed it's back in hand, and a replay is a fresh placement.

### 17.5 Scorch Interactions

Two separate Scorch effects exist — don't confuse them:

| Type | Scope | Trigger |
|---|---|---|
| **Scorch (Special Card)** | Whole battlefield (both sides) | Always, when the Special card is played. |
| **Scorch (Close-Combat Unit ability)** | The **opposite row** only | Only if the opponent has **≥10 Strength** on that opposite row. |
| **Clan Dimun Pirate (unit)** | Whole battlefield (both sides) — treated as the Special version per the FAQ. Cannot discard itself. | On play. |

- **Heroes are excluded** from both Scorch effects.
- **Ties are resolved by discarding all tied highest-Strength non-Hero units.** **[Derived from "Unit Card(s)" — the plural suggests multiple may be destroyed.]**
- **What if the highest-Strength unit on the field is a Hero?** Scorch targets the next-highest non-Hero. If *all* units on the relevant area are Heroes, nothing is discarded.
- **What if your own unit is the highest Strength on the battlefield when you play Special Scorch?** You destroy your own unit. There is no "my side only" restriction — it's "the entire battlefield."
- **Where do Scorched cards go?** Scorched row cards go to the discard pile for
  the side they occupied when destroyed. A Spy destroyed while sitting on the
  opponent's side goes to the opponent's discard pile, even though its
  controller remains the player who played it.
- **What if the Unit-ability Scorch is played but the opposite row has < 10 Strength?** The Scorch effect simply doesn't fire. The unit still lands and contributes its own Strength.
- **Does Scorch affect Strength counted *after* Horn/Weather modifiers?** **[Derived]** Yes — "highest Strength" means highest current effective Strength on the battlefield. A Weather-muted unit at 1 won't be the highest if buffed units are around; a Horn-doubled unit will likely be scorched.
- **Clan Dimun Pirate and its own Strength:** Even if the Pirate is tied for highest Strength, the FAQ states it "cannot discard itself."

### 17.6 Commander's Horn Stacking and Adjacency

- **Only one horn effect per row.** This applies whether the horn is a Unit Card's Horn ability or a Special Card Horn — only one ever affects a row.
- **Unit Horn wording** says it doubles "all **other** Unit Cards on this card's row." So a Unit-Horn card itself uses its own printed Strength (not doubled).
- **Special Horn wording** says it doubles "**all** Unit Cards on its row." Since the Special Horn has no Strength of its own, it effectively doubles every Unit on the row.
- **[Derived] Horn does NOT double Heroes** (Heroes are immune to special abilities).
- **Horn is an ongoing effect** — if the Horn-providing Unit is Decoyed or Scorched, the Horn effect ends immediately.

### 17.7 Morale Boost Interactions

- **"Add 1 Strength to all units on the row (excluding itself)."**
- **Two Morale Boost units on the same row:** Each one excludes **itself** but boosts the other. Net: each gets +1 from the other, the rest of the row gets +2.
- **Three Morale Boost units on the same row:** Each one gets +2 from the other two; the rest of the row gets +3. **[Derived]**
- **Morale Boost does not affect Heroes on the row** — Heroes are immune.

### 17.8 Tight Bond Interactions

- **"Multiply the Strength of this Unit by the number of allies with the same name."**
- "Allies" means units on **your side**. **[Derived — the rulebook does not explicitly say cross-row or same-row.]** The FAQ example ("three Tight Bond Unit Cards with printed Strength 4... multiplied by three for a total of 12 each") does not specify same-row placement, and common interpretation is side-wide.
- **Base Strength** is multiplied — not current effective Strength. So Weather first sets to 1, then Tight Bond multiplies the **weathered** value of 1. This is the printed order of operations.
- **Are there Hero Tight Bonds?** **[Derived]** A Hero with Tight Bond printed would use its own ability (Heroes are not immune to their own abilities). In practice this situation is not standard.

### 17.9 Berserker / Mardroeme Interactions

- **Berserker by itself does nothing** — it just sits on the row with its Strength.
- **Mardroeme** (Unit or Special) triggers transformation of all Berserkers **on its row**.
- **When triggered:** Berserker is removed **from the game** (not discarded). A specified side-deck card is played in its place.
- **[Derived] If Mardroeme is already on a row and a new Berserker is played/revived there,** it should transform immediately — Mardroeme's effect is listed as ongoing, and Berserkers transform when Mardroeme is on their row.
- **[Derived] If multiple Berserkers are on one row and Mardroeme lands,** all of them transform at once.
- **Skellige faction ability and transformed units:** The Skellige faction ability pulls **Unit Cards from your discard pile** — a Berserker is removed from the game, so it can never come back via Skellige's ability. The transformed unit, however, if later discarded, **is** eligible.
- **[Derived] Mardroeme ongoing** means if you have a Mardroeme card on a row and later somehow get a new Berserker onto that row (via Medic, Muster, Skellige comeback), it transforms too.

### 17.10 Summon Interactions

- **Trigger:** When the Summon card is **discarded from the battlefield** — *any* way, including end-of-round cleanup.
- **Replacement** comes from the side deck.
- **[Derived] Decoy does NOT trigger Summon** — Decoy returns the card to hand, not to discard.
- **[Derived] Scorch DOES trigger Summon** — Scorch sends the highest-Strength unit(s) to discard, which is exactly the Summon condition.
- **[Derived] Monsters faction "one Unit stays" interaction:** If a Summon unit is selected to stay on the battlefield, it isn't discarded, so Summon doesn't trigger. Other Summon units that weren't chosen *do* go to discard and trigger their Summons.
- **[Derived] Side-deck exhaustion:** If the Summon target is already in play (or was used), the rulebook doesn't address what happens. Most groups rule that if the specified side-deck card is unavailable, no replacement happens.

### 17.11 Muster Interactions

- **"Find all specified cards in the hand and deck and play them immediately, then shuffle the deck."**
- **Does NOT pull from discard pile** — only hand and deck.
- **Already-played Muster units are not affected** — Muster doesn't move cards that are already on the battlefield.
- **Muster + Weather:** Weather is active on the row when Musters land; they come in at Strength 1 if weather applies.
- **Muster and Monsters faction ability:** Great synergy — a Muster brings multiple Units out, one of which gets preserved between rounds.
- **[Derived] Muster played while opponent has active Scorch threat:** Because Muster places the card(s) *before* Scorch checks, a bunch of small Muster units can be a defensive play even when big units would be scorched.
- **[Derived] Medic revives a Muster unit:** The Muster triggers, pulling all same-name copies from hand and deck — but the revived Muster was already in the discard, so it only pulls remaining copies (not itself again from discard).

### 17.12 Weather Interactions

- **Multiple weather cards can be active at once** (FAQ explicit).
- **Skellige Storm** sets both Ranged **and** Siege to Strength 1 — it's effectively Impenetrable Fog + Torrential Rain in one card.
- **Clear Weather** removes all active weather cards (including the opponent's), then is discarded.
- **[Derived] Clear Weather playing onto a board with no weather** — it has no effect but is still discarded after play.
- **Heroes ignore weather** (Hero immunity to special abilities).
- **King Bran (Skellige Leader, Passive):** "Friendly Units only lose **half** their Strength in bad weather conditions. (Rounded down)." This means if a Close Combat unit with Strength 7 is under Biting Frost, it would normally become 1 — but with King Bran, it loses only half of its Strength: 7 − ⌊7÷2⌋ = 7 − 3 = **4**. **[Derived from card text.]** Note King Bran overrides normal weather via the Golden Rule.
- **[Derived] Weather + Commander's Horn on Units:** Weather sets to 1 first; Horn then doubles to 2.

### 17.13 Draws, Ties, and Nilfgaard

- Default rule for a Strength **tie** at end of round: **both players lose a gem.**
- **Nilfgaard's faction ability overrides this:** "Wins the round whenever there is a draw." So Nilfgaard vs. anyone on a tied round: Nilfgaard player wins the round; opponent loses a gem; Nilfgaard does not.
- **Nilfgaard vs. Nilfgaard on a tie:** **[Derived]** The rulebook doesn't explicitly resolve this. Most reasonable reading: both "win on draw" abilities cancel or the normal rule re-applies and both lose a gem. Common house rule: treat as a normal draw (both lose a gem). **[Rulebook silent.]**

### 17.14 Game-End Simultaneous Loss

- If **both players lose their last gem at the same time** (e.g. a drawn round when both are on 1 gem), the **game is a draw**.

### 17.15 Scoia'tael First-Player Rule

- Scoia'tael's faction ability "Decides who goes first at the start of the game." This **overrides the coin flip**. **[Derived — Scoia'tael vs Scoia'tael:]** The rulebook doesn't specify a tiebreaker; in practice, coin flip presumably still resolves it.

### 17.16 Northern Realms Card-Draw Trigger

- "Draws a card from the deck whenever a round is won." **[Derived] If the deck is empty, nothing is drawn.** No additional penalty.

### 17.17 Monsters Between-Round Persistence

- At the end of a round, **one non-Hero Unit Card** (shuffled, chosen at random) remains on the Monsters player's battlefield.
- All other cards (including Heroes, all Special Cards, and Weather) are discarded as normal.
- **[Derived] If the Monsters player has no non-Hero Units on the field at round end,** nothing persists (nothing to draw from).
- **[Derived] If the Monsters player has exactly one non-Hero Unit,** that unit stays automatically.
- **[Derived] Kept unit carries its accumulated state:** Its ongoing bonuses are lost since their sources (Horn, Morale Boost) are discarded. Only the kept unit's own printed Strength and its own ongoing abilities matter in round 2+.
- **[Derived] If the kept unit is a Tight Bond unit**, its multiplier is now based on how many same-name allies are on the board at the start of the new round (typically just the 1 kept unit, so ×1).

### 17.18 Skellige Third-Round Return

- At the start of round 3, two random non-Hero Unit Cards from the Skellige player's discard pile are placed on the battlefield.
- **[Derived] They go to the row matching their range icon.** The rulebook doesn't specify but the rule of card placement (§9) applies.
- **[Derived] Their on-play Unit abilities** — do they fire? The rulebook says abilities resolve "immediately after the card is placed on the appropriate row," and Skellige's ability says the cards are "put on the battlefield." A charitable reading: treat this as "played" for ability purposes. A strict reading: they're placed, not played, so abilities don't fire. **[Rulebook silent — adopt house rule for consistency. Majority community reading: abilities do fire.]**
- **If the Skellige discard pile has fewer than 2 non-Hero Units,** you simply take what's there (0 or 1).
- **The returned Spy interaction:** If a Spy ends up returning via Skellige's ability, does it go to the opponent's side? **[Derived]** Strictly reading "put on the battlefield" without specifying side is ambiguous. Most natural reading: it's placed on your own side, because the Skellige ability specifies "the controlling player's" discard pile — implying all of this is for the Skellige player's own board. **[Rulebook silent.]**

### 17.19 Pass vs. No Legal Plays

- The rules specify three turn options: play a card, use active Leader ability, or pass. **[Derived]** If you have zero cards in hand and have already used your Leader (or it's Passive), you must pass.
- **There is no penalty for passing early** — it's a deliberate strategic choice and often correct.

### 17.20 Empty Deck Scenarios

- **[Derived]** The rulebook doesn't detail what happens if an ability says "draw from deck" and the deck is empty. The natural resolution is: draw as many cards as are available, and no more. Cards that require a deck search (Emhyr, Muster) simply find 0 copies there.

### 17.21 Clan Dimun Pirate Self-Protection

- Clan Dimun Pirate has a Scorch effect (whole-battlefield), but the FAQ explicitly says **it cannot discard itself**, even if tied for highest Strength. So it safely clears big threats including its equals.

### 17.22 Agile Unit Placement

- Agile: Place on either Close Combat **or** Ranged Combat — choose at placement.
- **"Cannot be moved once placed."** So you cannot later relocate an Agile unit to the other row.
- **[Derived] Agile + Decoy:** Decoy bounces the Agile unit back to your hand. Next placement is fresh — you can choose a different row this time.
- **[Derived] Agile + Skellige third-round ability:** The returned Agile unit can presumably be placed on either eligible row, as its on-play placement choice applies. **[Rulebook silent on exact placement mechanics.]**

### 17.23 Leader Active-Ability Usage

- Active Leader abilities are **usable once per game** — not once per round.
- Using the Leader's active ability **replaces** your card-play for that turn.
- **[Derived]** You cannot use an active Leader ability during the opponent's turn (turns are discrete and per-player).

### 17.24 What Counts as an "Ally"?

- **[Derived]** "Allies" refers to friendly Units — i.e., units on your side of the battlefield. This affects Tight Bond counting (same-name allies).

---

## 18. Quick Reference Sheet

### Turn Actions (pick exactly one)

1. Play a card.
2. Use active Leader ability (once per game).
3. Pass (ends your participation in this round).

### Round End Triggers

- Both players have passed.
- Calculate total Strength on each player's side.
- Lower total loses the round and removes a gem.
- Tie → both lose a gem (unless Nilfgaard is playing).

### Card Ability Resolution Order (same board moment)

1. Weather (set to 1)
2. Tight Bond (multiply)
3. Morale Boost (+1 each)
4. Commander's Horn (×2)

### Hero Immunity Summary

Heroes are not affected by: Weather, Commander's Horn, Morale Boost, Scorch (Unit or Special), Decoy, Medic, Skellige return, Monsters "one stays", or any other Leader/Unit/Special Card ability. Heroes *retain* their own printed abilities.

### Discard Rules

- Row cards sent to discard by round cleanup or Scorch → **board-side** discard
  pile, including Spies.
- Global cards and non-row effect discards → **controller's** discard pile unless
  an effect says otherwise.
- Berserkers triggered by Mardroeme → **removed from game**, *not* discarded.

### Deck Construction

- **1** Leader Card.
- **≥22** Unit Cards.
- **≤10** Special Cards.
- Single-faction color only.

---

*Compiled from the CD PROJEKT RED physical Gwent rulebook (10th-anniversary edition, © 2025 CD PROJEKT S.A.). Extractions labeled **[Derived]** or **[Rulebook silent]** are inferences from the printed rules rather than direct quotations — use the Golden Rule (card text over rulebook) when printed card text addresses the situation explicitly.*
