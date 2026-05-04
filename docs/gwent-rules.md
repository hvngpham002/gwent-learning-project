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
| **Clear Weather** (sun) | **Discard all Weather cards currently on the battlefield, including Skellige Storm**; their effects are cancelled. Discard this card after playing (one-shot). |

**Important:** Heroes are immune to Weather (as it is a special ability). Weather does not set a Hero's Strength to 1.

> **Clear Weather scope:** Clear Weather (card or leader) iterates every card in the shared weather zone and discards all of them, regardless of which weather effect they emit. Biting Frost, Impenetrable Fog, Torrential Rain, and Skellige Storm are all neutral special weather cards covered by Clear Weather.

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
| **Eredin, Bringer of Death** | Restore a card of the player's choice from their own discard pile (catalog ability `restore_discard_to_hand`). cCp22 implements this as an active one-shot leader resolved through a single-step `choose_card` prompt over the acting seat's own discard pile; **any card kind in own discard is eligible — units, heroes, specials, weather, and side-deck-only / generated cards that physically reach discard.** Heroes are included because the leader text says "card" without Medic's non-hero unit restriction. The cCp18 audit confirmed that the original printed-rulebook table mis-attributed this row to *Eredin, Destroyer of Worlds*; the correct attribution is *Eredin, Bringer of Death*. *Eredin, Destroyer of Worlds* is the discard-cost / deck-draw leader (catalog ability `discard_two_draw_one_from_deck`). See §17.12g. |
| **Eredin, Destroyer of Worlds** | The catalog ability `discard_two_draw_one_from_deck` is an **active one-shot multi-stage prompt leader** (cCp27). Stage 1 opens a `choose_card_set` prompt over the acting seat's hand; the player discards **one or two** hand cards. Stage 2 opens a `choose_card` prompt over every remaining card in the acting seat's deck (visible only to the acting seat); the player chooses any card to draw into hand. After the draw, the remaining acting deck is shuffled through the engine's seeded RNG. Discarded hand cards do **not** trigger battlefield discard effects (no Summon, Avenger, Medic, Spy, Scorch, weather, Muster, Berserker, or Mardroeme); drawn cards do **not** trigger their abilities. Legal-use gates require at least one hand card and one deck card; empty hand or empty deck makes the leader unusable. The leader is consumed only after stage 2 resolves. See §17.12l. |
| **Emhyr var Emreis, The Relentless** | The catalog assigns this leader the ability `draw_opponent_discard`: **draw a card from your opponent's discard pile** (not your own deck). cCp24 implements this as an **active one-shot leader** resolved through a single-step `choose_card` prompt over the **opponent's** discard pile. Any card kind physically in opponent discard is eligible — units, heroes, specials, weather, and side-deck-only / generated cards. The chosen card moves to the acting seat's hand, with `controller` reset to the acting seat and `owner` preserved. Drawn cards do **not** trigger their abilities. Empty opponent discard emits no legal `use_leader` move. The cCp18 audit recorded that an earlier printed-rulebook source said "tutor from your deck" for this same leader; the project treats the catalog as the local authority and the deck-tutor wording is superseded. The cCp18 §C-2 conflict is now settled and implemented. See §17.12i. |
| **Eredin Breacc Glas: The Treacherous** | The catalog ability `double_spies` is a **whole-match passive** (cCp20): every battlefield non-hero card whose source includes the `spy` ability receives a ×2 multiplier on every scoring tick, on both board sides and all rows, regardless of owner or controller. Hero Spies are unaffected (Hero immunity, §17.1). The leader emits no `use_leader` move and never sets `seat.leaderUsed`. See §17.12e. |
| **Crach an Craite** | The catalog ability `shuffle_discards_into_decks` is an **active one-shot leader** (cCp23). When fired, every non-empty discard pile is moved into the same seat's deck and that seat's deck is shuffled deterministically through the engine's seeded RNG; an empty-discard seat is **not** shuffled. A card moves to the deck of the seat whose discard it currently occupies — Spies and other off-owner cards recycle into the discard-pile seat's deck, with `owner` preserved and `controller` reset to the destination seat. Hand, deck, side deck, removed-from-game, board, row horns, weather zone, and leader zone are not touched. The leader emits no legal `use_leader` move when **both** discard piles are empty; a single non-empty discard is enough to enable it. Recycled cards do not resolve their abilities (no `card_played`); they behave normally only if drawn and played later. Skellige's round-three return §17.18 still operates on whatever is in discard at future round-end. See §17.12h. |
| **Emhyr var Emreis, Invader of the North** | The catalog ability `random_medic` is a **whole-match passive Medic mutation** (cCp25). While this leader is the seat's leader, every **non-hero** Medic source controlled by that seat revives a **random eligible non-hero Unit** from that seat's own discard pile (uniform over candidate cards through the engine's seeded RNG; deterministic row fallback `close → ranged → siege` for multi-row targets) instead of opening a player-choice Medic prompt. Spy placement still flips the revived card to the opponent board side and resolves Spy draw; `controller` becomes the acting seat with `owner` preserved. **Hero Medic sources are unaffected** and continue to use the normal Medic prompt. The leader emits no `use_leader` move and never sets `seat.leaderUsed`. The cCp18 §C-3 conflict is settled in favor of the Medic-mutation reading; the older "random Special replay from discard" wording is superseded. See §17.12j. |
| **Francesca Findabair, Daisy of the Valley** | The catalog ability `draw_extra_card` is a **setup-time initial hand-size modifier** (cCp26). While this leader is the seat's leader, the seat draws **11 cards** (not 10) from the top of the already-shuffled deck during `startMatch` initial draw, before mulligan opens. The extra card is the next deterministic card off the seeded-RNG-shuffled deck top — there is no prompt, no card-by-card choice, and no faction/strength/row filtering. The mulligan budget is unchanged at two redraws. The leader emits no `use_leader` legal move, never sets `seat.leaderUsed`, and never emits `leader_used`. See §17.12k. |
| **Emhyr var Emreis, Emperor of Nilfgaard** | The catalog ability `look_three_cards` is an **active one-shot hidden-info disclosure leader** (cCp28). When eligible (the opponent has at least one card in hand), the leader opens a one-time acknowledgement modal that reveals **up to three** random opponent hand cards (`min(3, opponent hand length)`) to the acting seat only. RNG advances only when the opponent has more than three hand cards (length 1-3 is a deterministic full-hand reveal that leaves `state.rng.state` unchanged). The leader is consumed at `UseLeader`; the acknowledgement prompt blocks the turn until the acting seat dismisses it. After dismissal, the reveal snapshot is cleared from `pendingPrompt` and **cannot be reopened** from product UI or hidden-info-safe surfaces. Revealed cards are not moved out of the opponent's hand and do not trigger their abilities. The non-acting seat sees `pendingPrompt: null` in observation/export and never receives the revealed names, source IDs, or instance IDs. See §17.12m. |

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
- **[Derived] Heroes *can* still be chosen by Eredin, Bringer of Death** (catalog ability `restore_discard_to_hand`), whose FAQ text says "Unit Card or Special Card of the player's choice from their discard pile" — with no Hero exclusion. The Golden Rule says the card takes precedence. (See §16 — the printed rulebook originally mis-attributed this row to *Destroyer of Worlds*.)
- **[Derived] Heroes *can* still be drawn from the opponent discard by Emhyr var Emreis: The Relentless** (catalog ability `draw_opponent_discard`) for the same reason.
- **[Derived] A Hero's *own* abilities still function.** A Hero with Muster, Scorch, or Tight Bond printed on it still resolves that ability when played — the Hero rule prevents **external** abilities from affecting the Hero, but it doesn't prevent the Hero from *being* an ability source.
- **Hero-source row effects (Morale Boost, future row-wide Tight Bond / Commander's Horn).** A hero may *emit* its printed row effect to other non-hero units on the row, even though the hero remains immune to *receiving* row effects. Concretely: a hero printed with Morale Boost adds +1 to the other non-hero units on its row; the hero source itself does not receive +1, and other heroes on the row do not receive +1. **Hero Tight Bond is intentionally not implemented as a functional rule** — heroes are immune to Tight Bond as receivers, so a hero with printed Tight Bond is effectively useless and the engine does not invent a new functional rule for it.

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
- **Eredin Breacc Glas: The Treacherous** (`double_spies`) is a passive
  whole-match leader that doubles the effective strength of every battlefield
  non-hero Spy unit on either board side. Hero Spies remain immune. See
  §17.12e for the engine treatment.

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

Multiple Scorch effects exist — don't confuse them:

| Type | Scope | Trigger |
|---|---|---|
| **Scorch (Special Card)** | Whole battlefield (both sides) | Always, when the Special card is played. |
| **Scorch (Close-Combat Unit ability)** | The **opposite row** only | Only if the opponent has **≥10 Strength** on that opposite row. |
| **Scorch - Ranged (Unit ability)** | The **opposite ranged row** only | Only if the opponent has **≥10 Strength** on that opposite ranged row. |
| **Scorch - Siege (Unit ability)** | The **opposite siege row** only | Only if the opponent has **≥10 Strength** on that opposite siege row. |
| **Clan Dimun Pirate (unit)** | Whole battlefield (both sides) including the source itself. | On play. |

- **Heroes are excluded** from all Scorch effects.
- **Row-scoped unit Scorch (`scorch_close`, `scorch_range`, `scorch_siege`)** uses the same template:
  the source plays normally onto its legal board row; after placement, it inspects the
  opponent's matching opposite row (close→close, ranged→ranged, siege→siege); it fires only
  when that row's effective strength is **≥10**; it destroys all tied highest non-hero units
  on that opponent row using post-modifier effective strength.
- **Unit-source whole-board Scorch (Clan Dimun Pirate)** plays normally onto its legal board
  row; after placement, it considers all non-hero units across both seats and all three rows,
  including the source itself; it destroys every non-hero unit tied for the highest
  effective strength. Per the user-confirmed rule patch, the source is *not* protected: if
  Clan Dimun Pirate is the unique highest strength it destroys itself; if it ties for
  highest it destroys itself and the tied cards.
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

- **Trigger:** When the Summon card is **discarded from a board row** — Special
  Scorch, unit row-Scorch (Schirru / Toad / Villentretenmerth), unit-source
  whole-board Scorch (Clan Dimun Pirate), Foltest row-Scorch leaders, and
  end-of-round cleanup.
- **Replacement** comes from the **controlling seat's side deck** (the
  controller of the destroyed Summon source, not the seat whose board side it
  occupied). The replacement source ID is `linkedSourceIds[0]`.
- **Replacement placement:** the replacement lands on the same board side and
  row that the Summon source occupied immediately before being discarded. If
  the source was on the opponent board side (e.g. a Spy), the replacement still
  lands on that opponent board side. The replacement's controller is set to
  the source's controller.
- **[Derived] Decoy does NOT trigger Summon** — Decoy returns the card to hand,
  not to discard. The pure engine resolves Decoy bounce as a non-discard
  movement and does not call the Summon resolver.
- **[Derived] Scorch DOES trigger Summon** — Scorch sends the highest-Strength
  unit(s) to discard, which is exactly the Summon condition.
- **[Derived] Monsters faction "one Unit stays" interaction:** If a Summon unit
  is selected to stay on the battlefield, it isn't discarded, so Summon doesn't
  trigger. Other Summon units that weren't chosen *do* go to discard and
  trigger their Summons.
- **[Derived] Side-deck exhaustion:** If the linked side-deck card is missing,
  the engine emits a structured `ability_resolved` outcome (`missing_link`,
  `missing_replacement`, or `missing_origin_row`) and continues — no replacement
  is summoned and no crash occurs.
- **Engine treatment (cCp17):** Summon is an **armed-for-discard** trigger. On
  play it emits `ability_triggered` + `ability_resolved` with outcome
  `"armed_for_discard"`. The discard trigger fires through the centralised
  `resolveSummonForCard` helper at every implemented discard-from-board path:
  Special Scorch, unit row-Scorch, unit whole-board Scorch, Foltest
  `scorch_range`/`scorch_siege` leader execution, and round cleanup (after the
  row sweep, so replacements persist into the next round). Movement uses
  `card_moved.reason: "summon_replacement"` (distinct from Avenger's
  `"avenger_summon"`); the summon emits `card_summoned` with
  `abilityId: "summon"` and a final `ability_resolved` with outcome
  `"summoned"`.
- **Replacement is summoned, not played:** the engine does not call
  `resolveCardAbilities` on the replacement. Ongoing scoring effects apply
  naturally once the replacement is on the board.
- **Avenger vs Summon:**
  - *Summon* triggers only when the source moves from a board row to a discard
    zone.
  - *Avenger* triggers on broader battlefield removal (round cleanup, Scorch
    discard, and Decoy bounce per current project policy in §17.10b).
  - A source declaring both abilities would fire both at a discard boundary,
    in the order Summon → Avenger; no current catalog source declares both.
- **Medic / Skellige round-three return:** revival from discard is not a
  discard, so Summon does not fire when the source re-enters the battlefield
  through Medic, Muster, or Skellige round-three return. The next time the
  source is discarded from a board row, Summon fires again.

### 17.10b Avenger (Cow / Kambi) Battlefield Removal Replacement

Avenger covers cards like Cow and Kambi that summon a powerful replacement when the
source is **removed from the battlefield**.

Avenger and generic Summon (§17.10) are deliberately distinct in the engine:
Summon triggers only on **discard from a board row**, while Avenger triggers
on broader battlefield removal (currently round cleanup, Scorch discard, and
Decoy bounce per the policy below). Cow and Kambi remain Avenger sources, not
generic Summon sources.

- The Avenger source must declare its replacement through `linkedSourceIds[0]`.
- Existing playable Avenger pairs:
  - `neutral.cow` → `neutral.bovine-defense-force`;
  - `skellige.kambi` → `skellige.hemdall`.
- The replacement is taken from the controlling seat's **side deck**.
- The replacement lands on the same board side and row that the Avenger source occupied.
- The Avenger source still moves according to the original removal operation:
  - round cleanup sends it to its board-side discard pile;
  - Scorch sends it to its board-side discard pile;
  - Decoy returns it to the active player's hand;
  - other movement reasons keep their existing destination unless an effect says otherwise.
- Avenger differs from Berserker/Mardroeme transformation:
  - Berserker is *removed from the game* before the side-deck replacement enters play;
  - Avenger keeps the source's normal movement destination and only summons the replacement.
- Round-cleanup policy: Avenger replacements are summoned **after** the row sweep for the
  departing round so they remain on the board for the next round. Round-end scoring/gem
  loss is based on the board before cleanup; the replacement affects the next round only.
- Active-round removal policy: Avenger summons the replacement immediately after the
  source leaves the battlefield (Scorch, Decoy, etc.), so it can affect subsequent
  scoring within the active round.
- If the linked source ID is missing, or the linked replacement is not present in the
  controlling seat's side deck, the engine emits a structured non-crashing outcome.

### 17.11 Muster Interactions

- **"Find all specified cards in the hand and deck and play them immediately, then shuffle the deck."**
- **Does NOT pull from discard pile** — only hand and deck.
- **Already-played Muster units are not affected** — Muster doesn't move cards that are already on the battlefield.
- **Muster + Weather:** Weather is active on the row when Musters land; they come in at Strength 1 if weather applies.
- **Muster and Monsters faction ability:** Great synergy — a Muster brings multiple Units out, one of which gets preserved between rounds.
- **[Derived] Muster played while opponent has active Scorch threat:** Because Muster places the card(s) *before* Scorch checks, a bunch of small Muster units can be a defensive play even when big units would be scorched.
- **[Derived] Medic revives a Muster unit:** The Muster triggers, pulling all same-name copies from hand and deck — but the revived Muster was already in the discard, so it only pulls remaining copies (not itself again from discard).

#### 17.11a Muster Taxonomy (cCp13)

The catalog distinguishes four Muster categories. The production engine resolves each category through explicit `linkedSourceIds` on the catalog source — runtime name-prefix matching is not used in the pure engine path.

- **Exact-source copy Muster.** A source pulls additional copies of the same `sourceId` from hand and deck. `linkedSourceIds` includes the source's own ID. Members: Arachas (`monsters.arachas`), Nekker (`monsters.nekker`), Ghoul (`monsters.ghoul`), Havekar Smuggler (`scoiatael.havekar-smuggler`), Dwarven Skirmisher (`scoiatael.dwarven-skirmisher`), Elven Skirmisher (`scoiatael.elven-skirmisher`), Light Longship (`skellige.light-longship`).
- **Symmetric family Muster.** Multiple distinct source IDs share a printed family title (e.g. `Crone:` / `Vampire:`) and pull each other from hand and deck. The family is title-like, but the engine must use the explicit `linkedSourceIds` arrays on each catalog source rather than a runtime prefix scan. Members: Crones (`monsters.crone-brewess`, `monsters.crone-weavess`, `monsters.crone-whispess`); Vampires (`monsters.vampire-bruxa`, `monsters.vampire-ekimmara`, `monsters.vampire-fleder`, `monsters.vampire-garkain`, `monsters.vampire-katakan`).
- **One-way linked Muster.** A named source pulls a different group; the targets do not reciprocally summon the source. Members: Cerys → Clan Drummond Shield Maidens; Arachas Behemoth → regular Arachas; Gaunter O'Dimm → Gaunter O'Dimm: Darkness; Geralt of Rivia → Roach; Cirilla Fiona Elen Riannon → Roach.
- **Non-reciprocal exceptions.** The reverse direction of a one-way Muster intentionally does **not** trigger a pull: Darkness does not pull base Gaunter; regular Arachas does not pull Arachas Behemoth; Roach does not pull Geralt or Ciri; Shield Maidens do not pull Cerys.

### 17.12 Weather Interactions

- **Multiple weather cards can be active at once** (FAQ explicit).
- **Skellige Storm** sets both Ranged **and** Siege to Strength 1 — it's effectively Impenetrable Fog + Torrential Rain in one card.
- **Clear Weather** removes all active weather cards (including the opponent's), then is discarded.
- **[Derived] Clear Weather playing onto a board with no weather** — it has no effect but is still discarded after play.
- **Heroes ignore weather** (Hero immunity to special abilities).
- **King Bran (Skellige Leader, Passive):** "Friendly Units only lose **half** their Strength in bad weather conditions. (Rounded down)." This means if a Close Combat unit with Strength 7 is under Biting Frost, it would normally become 1 — but with King Bran, it loses only half of its Strength: 7 − ⌊7÷2⌋ = 7 − 3 = **4**. **[Derived from card text.]** Note King Bran overrides normal weather via the Golden Rule. See §17.12b for the engine treatment.
- **[Derived] Weather + Commander's Horn on Units:** Weather sets to 1 first; Horn then doubles to 2.

### 17.12a Weather-Pulling Leaders (cCp14)

The four weather-pulling leader abilities — `play_frost` (Francesca: Pureblood
Elf), `play_fog` (Foltest: King of Temeria), `play_rain` (Emhyr: His Imperial
Majesty), and `play_any_weather` (Eredin: King of the Wild Hunt) — all share
the same shape:

- The leader pulls a matching weather effect card from the **acting player's
  deck** and plays it directly to the shared weather zone.
- Single-weather leaders require their specific weather card in deck:
  - `play_frost` → `neutral.biting-frost`;
  - `play_fog` → `neutral.impenetrable-fog`;
  - `play_rain` → `neutral.torrential-rain`.
- `play_any_weather` may choose Biting Frost, Impenetrable Fog, Torrential
  Rain, or Skellige Storm from deck. Clear Weather is **not** a weather effect
  source and is excluded.
- Matching weather copies in hand, discard, or already in the weather zone are
  **not** eligible. Only deck instances qualify.
- If no eligible card exists in the acting deck, the leader has no legal
  executable move; the leader is consumed only after a successful pull.
- Pulled weather cards become controlled by the acting seat once they enter
  the weather zone.
- cCp14 intentionally does **not** shuffle the remaining deck after the
  search. The rulebook's Muster shuffle requirement does not apply to leader
  weather pulls. If a future rules audit changes this, it will land in a
  separate phase.

### 17.12b King Bran Weather Half Penalty (cCp15)

King Bran (`skellige.king-bran`, leader ability `weather_half_penalty`) is the
first **passive** implemented leader. He is always on for the seat whose leader
source is `skellige.king-bran` and is **not** an active executable
`UseLeader` command:

- King Bran does not produce a `use_leader` legal move.
- `seat.leaderUsed` is never set by King Bran and no `leader_used` event is
  emitted for the passive.
- His effect is wired into scoring through a derived `WeatherPolicy` of
  `"king_bran"` for the King Bran seat. Other seats keep `"normal"`.

Rule:

- Applies only to the King Bran player's **friendly non-hero Unit cards**.
- Applies only when a unit's row is affected by active bad weather:
  - Frost affects Close;
  - Fog affects Ranged;
  - Rain affects Siege;
  - Skellige Storm affects Ranged and Siege.
- Does **not** affect Heroes (hero immunity is unchanged).
- Does **not** affect the opponent. Opposing rows still use the normal
  "set Strength to 1" rule unless that opponent also somehow has King Bran
  as leader.
- Does not depend on which player controlled or played the weather card.
- Replaces normal weather's "set Strength to 1" effect for the King Bran
  seat's affected units with the half-loss formula.

Formula and examples (`afterWeather = printedStrength - Math.floor(printedStrength / 2)`):

- printed 7 under matching weather → 4;
- printed 4 under matching weather → 2;
- printed 1 under matching weather → 1.

King Bran's weather adjustment happens in the **weather step**, before Tight
Bond, Morale Boost, and Commander's Horn (the standard order of operations
in §15 is preserved). The score modifier marker for affected entries is
`weather:king_bran` instead of `weather`.

Identity gate: King Bran is derived from leader identity, not faction. A
Skellige seat with Crach an Craite continues to use the normal weather rule.

### 17.12c Foltest Row-Scorch Leaders (cCp16)

The two Foltest row-Scorch active leaders destroy the opponent's strongest
non-hero unit(s) on a fixed row when that row's effective strength is at
least 10:

- `Foltest: Son of Medell` (`scorch_range`) targets the opponent's
  **Ranged Combat** row;
- `Foltest: The Steel-Forged` (`scorch_siege`) targets the opponent's
  **Siege Combat** row.

Both leaders share the same row-Scorch semantics as unit-source row Scorch
cards (`scorch_range` / `scorch_siege` on Toad / Schirru / etc., introduced
in cCp11) — the row is fixed by the leader ability rather than by the unit's
printed row:

- effective row total uses the full scoring pipeline (Weather, King Bran,
  Tight Bond, Morale Boost, Commander's Horn);
- the leader fires only when the opponent's matching row's effective
  strength is **≥10**;
- on fire, the engine destroys all tied highest-strength **non-hero** units
  on that opponent row, using post-modifier effective strength;
- Heroes are immune and cannot be targeted;
- destroyed cards go to the discard pile for the **board side they
  occupied** (a Spy on the opponent side goes to the opponent's discard);
- Avenger replacement handling matches existing row-Scorch destruction
  behavior — a destroyed Avenger source pulls its `linkedSourceIds[0]`
  side-deck replacement back onto the same row.

Engine policy for legal-move generation (cCp16):

- the leader produces exactly one legal `use_leader` move (no-target,
  `target.kind === "none"`) only when the engine can actually destroy at
  least one eligible non-hero unit;
- if the opponent row total is below 10, **no** `use_leader` move is
  emitted;
- if the row total is at least 10 but the row contains only Heroes (or
  otherwise has no eligible non-hero target), **no** `use_leader` move is
  emitted;
- the leader is consumed (`seat.leaderUsed = true`, `leader_used` event)
  only after a successful destroy.

Each leader is usable **once per game** like other active leaders, replaces
the player's card play for that turn, and hands off the turn after
resolution.

### 17.12d Row-Wide Horn-Like Leader Passives (cCp19)

Four leader records share a passive **Commander's Horn-equivalent** effect on
a fixed friendly row:

- `Foltest: The Siegemaster` (`double_siege`) — friendly **Siege Combat** row;
- `Eredin: Commander of the Red Riders` (`double_close`) — friendly
  **Close Combat** row;
- `Francesca Findabair: Queen of Dol Blathanna` (`double_close`) — friendly
  **Close Combat** row;
- `Francesca Findabair: The Beautiful` (`double_ranged`) — friendly **Ranged
  Combat** row.

Engine semantics:

- the effect is **passive** and runs every scoring tick — it produces no
  `use_leader` legal move, never sets `seat.leaderUsed`, and never emits a
  `leader_used` event;
- the policy is derived from the seat's leader source identity, not from
  faction, through the helper `getRowHornPolicyBySeat(state, leaders)`
  (mirrors the cCp15 King Bran helper);
- when a seat has a row-horn policy for a row, **non-hero units** on that
  friendly row are doubled at the normal Horn stage, after Weather, Tight
  Bond, and Morale Boost (per §15);
- **Heroes are immune** as receivers (Hero immunity, §17.1);
- a physical Commander's Horn on the row — either a `commanders_horn`
  Special card in the row's horn slot or a unit / hero source with the
  `commanders_horn` ability — **suppresses** the leader horn for that row;
  horn effects do not stack ("unless a Commander's Horn is also present on
  that row");
- when a physical horn applies, the score breakdown's `modifiers` list
  uses the existing `"commanders_horn"` marker; when only the leader
  policy applies, the score breakdown uses a distinct
  `"leader_horn"` marker so inspectors can show provenance;
- the existing `multiple_horn_sources` diagnostic continues to describe
  only physical row horn sources — a suppressed leader policy never
  produces a duplicate-horn diagnostic;
- because every score-dependent path (round resolution, gem loss, Special
  Scorch, unit row-Scorch, unit-source whole-board Scorch) goes through
  the central `calculateScores` pipeline, all of those paths inherit the
  row-horn policy automatically.

Each leader's effect targets a **single fixed row on the leader's own
side**; opponent rows and the opposite-side row of the same kind are
unaffected. Two leaders share `double_close` (Eredin: Commander of the Red
Riders for Monsters and Francesca: Queen of Dol Blathanna for Scoia'tael) —
their behavior is identical and selected by the seat's leader, not the
seat's faction.

Future interactions explicitly out of scope for cCp19:

- `cancel_leader` (Emhyr: The White Flame) will eventually suppress these
  passives for the current round; cCp19 does not implement the cancel
  state, but the row-horn helper is structured so a future `seat.leaderCancelled`
  flag can short-circuit the policy without touching scoring math.

### 17.12e Double Spies Passive Leader (cCp20)

Eredin Breacc Glas: The Treacherous
(`monsters.eredin-breacc-glas-the-treacherous`, leader ability
`double_spies`) is a **passive** implemented leader. He is always on for
whichever seat owns him and is **not** an active executable `UseLeader`
command:

- The Treacherous does not produce a `use_leader` legal move.
- `seat.leaderUsed` is never set by the passive and no `leader_used` event
  is emitted.
- His effect is wired into scoring through a derived
  `DoubleSpiesPolicyBySeat` derived from leader source identity
  (`getDoubleSpiesPolicyBySeat`), not from faction.

Rule:

- The effect is a **whole-match passive**: every battlefield non-hero card
  whose catalog source includes the `spy` ability receives a ×2 multiplier
  on every scoring tick, including Spy units played, moved, revived, or
  summoned after the leader entered play and after the first scoring tick.
- The effect applies to **both board sides** and **all rows** — opponent
  Spies on the leader's side (the standard Spy placement) and the leader's
  own Spies on the opponent's side are both doubled.
- The effect applies regardless of the Spy's owner or controller: only
  the `spy` ability and the non-hero kind matter.
- **Heroes are immune** as receivers (Hero immunity, §17.1). A hero card
  that prints `spy` is **not** doubled.
- The effect **does not stack with itself**. If both seats somehow have
  `double_spies` (a fixture-only scenario; no normal game has two
  Treacherous leaders), every Spy is still multiplied ×2, never ×4.

Modifier order in the scoring pipeline (per §15):

1. Weather (including King Bran's half-loss);
2. **Double Spies** (×2 for non-hero Spy units when at least one seat has
   the policy);
3. Tight Bond multiplier;
4. Morale Boost bonus;
5. Commander's Horn / leader-horn (×2 once if applicable, by §17.12d).

A weathered non-hero Spy under normal weather becomes `1 × 2 = 2` before
later modifiers. Under King Bran's half-loss policy, a printed-7 Spy
becomes `4 × 2 = 8` before later modifiers. A Spy that also benefits from
Tight Bond, Morale, and a Commander's Horn composes through the rest of
the pipeline as usual.

When the multiplier applies, the score breakdown's `modifiers` list
includes the marker `"leader_double_spies"`. The
`CardScoreEntry.spyMultiplier` and `CardScoreEntry.afterSpyMultiplier`
fields record the explicit factor and intermediate strength so inspector
UIs and test fixtures can show provenance.

Because every score-dependent path goes through the central
`calculateScores` pipeline, all of the following inherit the policy
automatically:

- normal score totals and row totals;
- round resolution, round-winner determination, and gem loss;
- Special Scorch target evaluation;
- unit row-Scorch target evaluation (`scorch_close` / `scorch_range` /
  `scorch_siege`);
- unit-source whole-board Scorch (`scorch` on a non-special card);
- Foltest row-Scorch leader target evaluation (`scorch_range` /
  `scorch_siege`).

Future interactions explicitly out of scope for cCp20:

- `cancel_leader` (Emhyr: The White Flame) will eventually suppress this
  passive for the current round; the double-spies helper is structured so
  a future `seat.leaderCancelled` flag can short-circuit the policy
  without touching scoring math.

### 17.12f Optimize Agile Rows Active Leader (cCp21)

Francesca Findabair: Hope of the Aen Seidhe
(`scoiatael.francesca-findabair-hope-of-the-aen-seidhe`, leader ability
`optimize_agile_rows`) is an **active one-shot** implemented leader. She
emits a legal `use_leader` move during play whenever the move would
actually change board state, and consumes the leader (`leaderUsed = true`)
on success.

Eligible cards (acting seat's own board):

- the card occupies the acting seat's **own board side**;
- the catalog source is a non-hero `unit` (heroes are excluded under
  Hero immunity, §17.1);
- the catalog source has the `agile` ability;
- the catalog source has at least two legal board rows;
- the destination row being evaluated is legal for that card.

Cards explicitly NOT affected:

- heroes, even if a future hero source has `agile`;
- opponent-board-side cards;
- Spies sitting on the opponent board side, even if the controller is
  the acting seat (current production catalog has no `spy + agile`
  card; the engine still defines the boundary);
- hand, deck, discard, removed, weather, horn, or side-deck cards.

Destination row selection:

- The leader chooses **one common destination row** and moves every
  eligible Agile unit to that same row. Candidate rows are the
  intersection of the eligible units' legal rows. For the current
  catalog, this is normally `close` and `ranged`.
- Each candidate row is evaluated by simulating the bulk move, calling
  the central `calculateScores` pipeline against the simulated state,
  and reading `breakdown.totalBySeat[actingSeatId]`. Weather, King
  Bran, row-horn passives (cCp19), double spies (cCp20), Tight Bond,
  Morale Boost, and physical Commander's Horn all compose through the
  shared scoring pipeline.
- A candidate row is **executable** only when at least one eligible
  card actually moves to it. Pure no-op rows are not executable, so
  the leader is never consumed without changing board state.
- Candidate rows are scored before the no-op filter is applied. If
  the current no-op row is uniquely best and every row that would move
  cards scores lower, the leader emits no legal move instead of
  offering a worse move.

Auto-place vs row choice:

- If exactly one executable row ties the highest acting-seat score
  across all candidate rows,
  `getLegalMoves` exposes a single `use_leader` move with
  `target.kind === "none"` and `metadata.targetRequirement === "none"`.
  Command execution moves to that unique best row.
- If multiple executable rows tie for the best score across all
  candidate rows, `getLegalMoves`
  exposes one `use_leader` move per tied best row. Each tied move uses
  `target.kind === "board_row"` with `seat === actingSeatId` and the
  tied destination row, plus
  `metadata.targetRequirement === "agile_row_choice"` and a readable
  `metadata.targetLabel` (e.g. `"Close Combat"` or `"Ranged Combat"`).
  Command execution accepts only a tied best row target and rejects
  any non-best or non-acting-seat board-row target.
- If no executable plan exists (no eligible cards, no common row,
  every candidate is a pure no-op, or only worse movable rows exist),
  `getLegalMoves` emits no
  `use_leader` move and a manual `UseLeader` raises an
  `EngineRuleError` without consuming the leader.

Mutation and event contract on success:

- The engine clones state, never mutating the input.
- Emits `ability_triggered` for the leader.
- Moves each affected card in deterministic board order (`close →
  ranged → siege`, preserving unit order within each row), using
  `card_moved.reason === "leader_optimize_agile"`.
- Emits `ability_resolved` with `outcome === "moved"`.
- Sets `seat.leaderUsed = true` and emits `leader_used`.
- Hands off the turn through the existing turn-handoff helper.
- Cards already on the chosen destination row do not produce
  `card_moved` events; only cards whose row actually changes move.

The cEp8 leader-choice menu renders the tied-row options through the
existing `metadata.targetLabel` fallback chain, so no new UI layout is
needed.

### 17.12g Restore Discard To Hand Active Leader (cCp22)

`monsters.eredin-bringer-of-death` (Eredin: Bringer of Death) carries the
`restore_discard_to_hand` leader ability. cCp22 promotes the metadata from
`placeholder` to `implemented` as an **active one-shot** leader resolved
through a single-step `choose_card` prompt over the acting seat's own
discard pile.

Effect contract:

- **Eligible cards:** every card currently in the acting seat's own
  discard pile whose catalog source can be resolved. Card kind does not
  matter — units, heroes, specials, weather, and side-deck-only /
  generated cards that physically reach the acting discard are all
  eligible. Heroes are included because the leader text says "card" and
  does not carry Medic's non-hero unit restriction.
- **Not eligible:** cards in the opponent discard pile, in either hand
  or deck, on the board (units, row horns), in the weather zone, in the
  removed-from-game zone, or with a missing card instance / catalog
  source.
- **Empty discard:** emits no legal `use_leader` move; a manual
  `UseLeader` attempt rejects with `EngineRuleError` and never sets
  `seat.leaderUsed`.
- **Prompt-open transaction:** clones state, emits `ability_triggered`
  for the leader, sets `state.pendingPrompt` (`kind === "choose_card"`,
  `abilityId === "restore_discard_to_hand"`, one option per eligible
  discard card in discard order), emits `prompt_opened`, leaves
  `seat.leaderUsed === false`, emits no `leader_used`, does not move
  any discard card yet, does not emit `card_played`, does not resolve
  any restored card abilities, and keeps `currentTurn` on the acting
  seat while the prompt is pending.
- **Prompt resolution:** `ChoosePromptOption` validates seat ownership
  and option legality, validates the chosen card is still in the acting
  seat's discard pile (rejects with `EngineRuleError` and does not
  consume the leader if not), clones state, moves the chosen card from
  discard to the acting seat's hand with
  `card_moved.reason === "leader_restore_discard_to_hand"`, sets the
  restored card's `controller` to the acting seat (leaving `owner`
  unchanged), emits `prompt_resolved`,
  `ability_resolved.restored_card`, sets `seat.leaderUsed = true`,
  emits `leader_used`, clears `state.pendingPrompt`, and hands off the
  turn through the existing `handoffTurn` helper.
- **Restored cards do not trigger their abilities.** A restored Medic,
  Spy, Muster, Scorch, weather, or hero behaves normally only if the
  player later plays the card from hand. The leader is consumed only
  after a legal prompt option resolves, so cancelling the prompt
  (where supported) leaves the leader unused.

The existing generic `PromptPanel` renders the `choose_card` options as
plain labelled buttons (`"Restore <card name> to hand"`) without any new
modal or card-tile UI. AI-owned restore prompts remain hidden from the
human UI because `getPromptMoves` returns `[]` for any seat that does
not own the prompt and `summarizeEvents` exposes only
`prompt.seatId` / `prompt.abilityId` for `prompt_opened`, never the
option labels or card identities.

### 17.12h Shuffle Discards Into Decks Active Leader (cCp23)

`skellige.crach-an-craite` (Crach an Craite) carries the
`shuffle_discards_into_decks` leader ability. cCp23 promotes the
metadata from `placeholder` to `implemented` as an **active one-shot**
leader resolved without any prompt or UI choice.

Effect contract:

- **Owner:** Crach an Craite owns this effect — Skellige's only active
  executable leader.
- **Active one-shot.** The leader is consumed exactly once per game
  through a single `UseLeader` command. There is no prompt, no choice
  menu, and no UI selection.
- **Empty discards rule.** When **both** seats' discard piles are
  empty, the leader emits no legal `use_leader` move and a manual
  `UseLeader` rejects with `EngineRuleError` without setting
  `seat.leaderUsed`. A **single** non-empty discard pile is enough to
  enable the leader.
- **What moves.** Only cards currently in `state.seats[seat].discard`
  are recycled. Hand, deck, side deck, removed-from-game, board rows,
  row horns, weather zone, and the leader zone are not touched. Stale
  discard entries whose card instance is missing are skipped silently.
- **Where they go.** A card moves to the deck of the seat whose discard
  it currently occupies, **not** necessarily back to its original
  owner's deck. This matters for Spies and other off-owner cards — the
  engine already places row discards on the side they occupied, and
  cCp23 preserves that zone model. After the move, each recycled card's
  `controller` is set to the destination deck seat; `owner` is
  unchanged.
- **Affected-decks-only shuffle.** After moving a non-empty discard
  pile into its deck, that seat's full deck is shuffled with the engine's
  deterministic seeded RNG (`createSeededRngFromState` +
  `shuffleWithRng`). Seats whose discard was empty are not shuffled —
  their hidden deck order is preserved (no hidden no-op mutation).
  Affected seats with a non-empty discard whose resulting deck has
  length 0 or 1 still emit `deck_shuffled`, even though the swap loop
  consumes no random values.
- **RNG.** A single `SeededRng` instance is created from the existing
  `state.rng.seed` / `state.rng.state` and reused across the whole
  command. After all affected shuffles, `state.rng.state` is set to the
  RNG's final `getState()`. Identical pre-command states with the same
  seed produce identical post-command deck orders and RNG state.
- **Stable seat order.** Affected seats are processed in
  `["seat_a", "seat_b"]` order so the event sequence and RNG draws are
  deterministic regardless of which seat acts.
- **Recycled cards do not resolve their abilities.** A recycled Medic,
  Spy, Muster, Scorch, weather, hero, Avenger, Berserker, or Summon
  behaves normally only if it is later drawn and played from hand. The
  engine emits no `card_played` for recycled cards.
- **Event sequence.** `ability_triggered` (Crach's leader card) →
  one `card_moved` per recycled card with
  `reason === "leader_shuffle_into_deck"` (in stable seat / discard
  order, before each seat's shuffle) → one `deck_shuffled` per
  affected seat with `reason === "leader_shuffle_into_deck"` →
  `ability_resolved` with `outcome === "shuffled_discards"` →
  `leader_used` → turn handoff through the existing `handoffTurn`
  helper.
- **Skellige round-three return §17.18 still works.** Crach does not
  create a permanent return pool. Skellige's round-three return reads
  whatever is in the discard pile at future round-end; if Crach has
  already shuffled past round discards back into the deck, the round-
  three return finds whatever has since refilled the discard.
- **Removed-from-game cards are not touched.** Mardroeme-transformed
  Berserkers and any other `removed_from_game` cards stay where they
  are.

Hidden-info safety: discard contents were already public, but post-
shuffle deck order is hidden. The engine does not expose post-shuffle
deck order through legal-move metadata, AI observation, simulation
export rows, or any new event payload. The new `card_moved` and
`deck_shuffled` events do not carry deck order; only the seat ID and
the affected card ID are published.

### 17.12i Draw Opponent Discard Active Leader (cCp24)

`nilfgaard.emhyr-var-emreis-the-relentless` (Emhyr var Emreis: The
Relentless) carries the `draw_opponent_discard` leader ability. cCp24
promotes the metadata from `placeholder` to `implemented` as an
**active one-shot** leader resolved through a single-step `choose_card`
prompt over the **opponent's** discard pile.

The cCp18 §C-2 conflict (catalog vs printed-rulebook tutor wording) is
**settled in favor of the catalog**: The Relentless draws from the
opponent discard pile. The deck-tutor reading is superseded.

Effect contract:

- **Eligible cards:** every card currently in the **opponent's**
  discard pile whose catalog source can be resolved. Card kind does
  not matter — units, heroes, specials, weather, and side-deck-only /
  generated cards that physically reach the opponent discard are all
  eligible.
- **Off-owner cards eligible.** Because the rule targets the physical
  opponent discard pile, an acting-seat-owned card sitting in the
  opponent discard (e.g. a Spy that was discarded after round cleanup
  on the opposite board side) is eligible. The chosen card moves to
  the acting seat's hand; `owner` is preserved (so the acting-seat-
  owned Spy remains owner-acting); `controller` is reset to the acting
  seat.
- **Not eligible:** cards in the acting seat's own discard pile, in
  either hand or deck, on the board (units, row horns), in the weather
  zone, in the removed-from-game zone, or with a missing card instance
  / catalog source.
- **Empty opponent discard:** emits no legal `use_leader` move; a
  manual `UseLeader` attempt rejects with `EngineRuleError` and never
  sets `seat.leaderUsed`. An empty opponent discard with a non-empty
  own discard still emits no legal move — own discard is not a fall-
  back source.
- **Prompt-open transaction:** clones state, emits `ability_triggered`
  for the leader, sets `state.pendingPrompt` (`kind === "choose_card"`,
  `abilityId === "draw_opponent_discard"`, one option per eligible
  opponent discard card in discard order, option IDs keyed
  `draw-opponent-discard:<cardId>`, labels `"Draw <card name> from
  opponent discard"`), emits `prompt_opened`, leaves
  `seat.leaderUsed === false`, emits no `leader_used`, does not move
  any discard card yet, does not emit `card_played`, does not resolve
  any drawn card abilities, and keeps `currentTurn` on the acting seat
  while the prompt is pending.
- **Prompt resolution:** `ChoosePromptOption` validates seat ownership
  and option legality, validates the chosen card is still in the
  opponent's discard pile (rejects with `EngineRuleError` and does not
  consume the leader if not), clones state, moves the chosen card from
  the opponent discard pile to the acting seat's hand with
  `card_moved.reason === "leader_draw_opponent_discard_to_hand"`, sets
  the chosen card's `controller` to the acting seat (leaving `owner`
  unchanged), emits `prompt_resolved`,
  `ability_resolved.drew_opponent_discard`, sets
  `seat.leaderUsed = true`, emits `leader_used`, clears
  `state.pendingPrompt`, and hands off the turn through the existing
  `handoffTurn` helper.
- **Drawn cards do not trigger their abilities.** A drawn Medic, Spy,
  Muster, Scorch, weather, hero, Avenger, Summon, or Berserker behaves
  normally only if the player later plays the card from hand. The
  leader is consumed only after a legal prompt option resolves, so
  cancelling the prompt (where supported) leaves the leader unused.

The legal-move target shape for prompt options points at the **physical
opponent discard card**:

```ts
target: {
  kind: "card_instance",
  side: "opponent",
  seatId: opponentSeat,
  cardId
}
```

This is distinct from cCp22 `restore_discard_to_hand` prompts, whose
options use `side: "own"` because the candidate pile is the acting
seat's own discard. `getPromptMoves` selects the side based on
`prompt.abilityId`. Medic prompts continue to set `target.row`; cCp24
prompts omit `row`.

Hidden-info safety: opponent discard identities were already public,
so exposing them in prompt options does not leak hidden information.
AI-owned prompts remain hidden from the human UI through the existing
prompt-move gate (`getPromptMoves` returns `[]` for any seat that does
not own the prompt). `summarizeEvents` exposes only
`prompt.seatId` / `prompt.abilityId` for `prompt_opened`, never option
labels or card identities. Acting hand identities are public to the
acting seat through `seatObservation` after the draw, just like any
other card-to-hand event.

### 17.12j Random Medic Passive Leader (cCp25)

`nilfgaard.emhyr-var-emreis-invader-of-the-north` (Emhyr var Emreis:
Invader of the North) carries the `random_medic` leader ability. cCp25
promotes the metadata from `placeholder` to `implemented` as a
**whole-match passive Medic mutation**, finishing Tranche 2.

The cCp18 §C-3 conflict (catalog `random_medic` ID vs printed-rulebook
"random Special replay from discard" wording) is **settled in favor of
the Medic-mutation reading**: while this leader is the seat's leader,
the Medic ability changes shape for non-hero sources controlled by
that seat. The older random-Special-replay text is superseded.

Effect contract:

- **Whole-match passive classification.** The leader emits no
  `use_leader` legal move, never sets `seat.leaderUsed`, and never
  emits `leader_used`. The policy is derived from leader source
  identity, mirroring the cCp15 King Bran / cCp19 row-horn / cCp20
  `double_spies` passive pattern. A manual `UseLeader` attempt
  rejects through the existing unsupported-leader path (no state
  mutation, leader untouched).
- **Non-hero Medic source scope.** The mutation applies when a Medic
  ability resolves for a card whose catalog source has
  `kind !== "hero"` (`source.abilities.includes("medic") && source.kind !== "hero"`).
  Hero Medic sources are not affected and keep the normal player-choice
  `medic_revive` prompt (§17.2). The mutation chains: a non-hero
  Medic revived through random Medic also resolves under the same
  random policy and can chain until no eligible non-hero units remain
  in own discard.
- **Own-discard non-hero unit candidate filter.** The candidate set is
  built from the acting seat's own discard pile and includes only
  entries whose catalog source resolves, has `kind === "unit"`,
  has `kind !== "hero"` (units only — heroes excluded), and has at
  least one playable row. Specials, weather, and hero cards are
  excluded even when they reach own discard. Side-deck-only and
  generated non-hero units are eligible if they physically reach own
  discard. Off-owner non-hero units physically sitting in own discard
  are eligible with `owner` preserved on placement and `controller`
  reset to the acting seat. Stale missing-instance / missing-catalog-
  source entries are skipped. The opponent discard, hands, decks,
  side decks, removed-from-game, board rows, row horns, and weather
  zone are not consulted.
- **Random candidate selection.** Selection is uniform over candidate
  **cards** (not over row-expanded prompt options). The engine uses
  `createSeededRngFromState(state.rng.seed, state.rng.state)` and
  writes the new RNG state back **only** when the random pick happens.
  Zero candidates: emit `ability_resolved` for `medic` with
  `outcome === "no_targets"` and do **not** advance RNG. One
  candidate: choose deterministically and do **not** advance RNG.
  Multiple candidates: roll once, advance RNG state. Identical seed
  and pre-command state produce the same chosen card and post-state.
- **Deterministic row fallback for multi-row targets.** After the
  random card is chosen, the engine picks the first playable row from
  the canonical row order `close → ranged → siege` (filtered against
  `source.rows`). Multi-row units appear once as a card candidate, not
  once per row. There is no row prompt and no score-optimization at
  the row stage; future product passes can change this policy
  explicitly.
- **Spy placement / draw behavior.** If the revived source has the
  `spy` ability, placement flips to the opponent board side and Spy
  resolves the standard 2-card draw for the acting seat. Otherwise
  placement is on the acting board side. In both cases `controller`
  becomes the acting seat and `owner` is preserved.
- **Resolution event sequence.** For each non-hero Medic source under
  the policy, the engine emits (in order): `ability_triggered` for
  `medic`; on success, `card_moved` for the revived card with
  `reason === "medic_revive"`, `card_played` for the revived card,
  `ability_resolved` for the Medic source with
  `outcome === "random_revived_card"`; subsequent revived-card
  abilities resolve normally through `resolveCardAbilities`; finally
  `settleMardroemeRow` runs on the placement row. Empty candidate set:
  `ability_triggered` then `ability_resolved` with
  `outcome === "no_targets"`. **No `prompt_opened` and no
  `prompt_resolved` events are emitted for random Medic.**
- **Medic chain behavior.** A revived non-hero Medic recurses through
  the same random policy. The chain is finite because every revived
  card leaves discard before its own Medic resolves; once the
  candidate set goes empty, the final Medic emits `no_targets` and
  the chain ends without leaving a pending prompt.
- **Hero Medic source exception (§17.1).** Hero immunity prevents the
  random policy from rewriting hero Medic effects. A hero source with
  `medic` opens the existing `medic_revive` prompt (or emits
  `no_targets` when discard has no eligible non-hero unit). Random
  selection does not occur and RNG state does not advance.

Hidden-info safety: own discard contents were already public, so
random selection over own discard does not leak hidden information.
Random Medic emits no prompt events, so AI-owned and human-owned
random Medic resolutions look identical from the spectator side.
`summarizeEvents` does not gain new fields.

### 17.12k Draw Extra Card Setup Leader (cCp26)

`scoiatael.francesca-findabair-daisy-of-the-valley` (Francesca
Findabair: Daisy of the Valley) carries the `draw_extra_card` leader
ability. cCp26 promotes the metadata from `placeholder` to
`implemented` as a **setup-time initial hand-size modifier**, opening
Tranche 3 of `docs/leader-ability-matrix.md`.

Effect contract:

- **Setup-time classification.** The leader's effect fires during
  `startMatch` initial draw. It is **not** an active `use_leader`
  command and **not** an ongoing whole-match passive. The leader emits
  no `use_leader` legal move, never sets `seat.leaderUsed`, and never
  emits `leader_used`. Manual `UseLeader` attempts continue to reject
  through the existing unsupported-leader path without state mutation.
  This is a new bucket distinct from the cCp15 King Bran / cCp19
  row-horn / cCp20 `double_spies` / cCp25 `random_medic` passive
  scoring derivations and from the active executable leaders.
- **Initial draw count = 11.** During `startMatch`, the engine
  computes the seat-specific draw count using the new pure helper
  `getInitialHandDrawCountForLeader({ leaderSourceId, catalogLeaders })`
  exported from `src/game/core/leaderSetup.ts`. The helper looks up
  the leader by source ID and returns `BASE_INITIAL_HAND_SIZE + 1`
  (i.e. 11) only when the resolved leader's `ability` is
  `draw_extra_card`; otherwise it returns the base 10. Missing
  catalog entries, other abilities, or any inconsistent setup input
  fall back to the base 10. The helper is faction-agnostic and
  name-agnostic; the catalog ability ID is the only switch.
- **Top-of-shuffled-deck behavior.** The extra card is the next card
  from the top of the already-shuffled deck. The shuffle uses the
  existing seeded RNG flow (`createSeededRng(seed)` then
  `shuffleWithRng(deck, rng)`); `draw_extra_card` does **not**
  re-shuffle, does **not** call `Math.random`, and does **not**
  advance RNG outside the existing shuffle and initial-turn roll.
  There is no prompt, no card-kind / faction / strength / row /
  ability filter — the 11th card is whatever the deterministic
  shuffle put on top after the first 10 were taken.
- **Determinism.** For a given seed and deck list, the Daisy seat's
  setup is byte-for-byte deterministic. When two configs differ only
  in leader identity, Daisy's first 10 hand cards match the
  equivalent non-Daisy seat's first 10 hand cards exactly; Daisy's
  11th hand card matches the next card that would otherwise have
  remained at the top of the non-Daisy seat's deck.
- **Mulligan budget unchanged.** `seat.mulligansUsed` starts at 0.
  The seat can redraw at most two cards total through the existing
  sequential one-card mulligan flow, mirroring every other leader.
  `draw_extra_card` does **not** add a third redraw. Keep-hand still
  completes mulligan normally. The match phase remains `mulligan`
  after `startMatch`. Legal mulligan moves naturally include
  one-card mulligan options for all 11 hand cards (1 keep-hand + 11
  one-card mulligans = 12 legal moves on the first mulligan tick;
  the cap of two total redraws applies as usual).
- **Event contract.** Setup events reuse existing types: `card_moved`
  with `reason === "initial_draw"` for each drawn card and
  `initial_hand_drawn` with `cardIds.length === 11` for the affected
  seat. No new event type is introduced.
- **Robustness on tiny decks.** If a malformed or test deck has
  fewer than 11 cards, the engine does **not** throw solely because
  of `draw_extra_card`; the existing `slice` behavior draws the
  available deck cards (e.g. a 4-card deck under Daisy yields a
  4-card hand and an empty deck). Production decks always have
  enough cards for an 11-card initial draw.

Hidden-info safety: hand-size disclosure is already part of the
public observation surface (every seat's hand count is visible to
the opponent), so the extra card does not create a new disclosure.
Raw engine setup transactions already include internal initial-hand
card IDs for each seat; cCp26 does not introduce a new public
observation, UI label, AI observation, recent-activity summary, or
simulation export field. Seat observations and UI hand rendering
continue to expose own hand identities to the acting seat and
opponent hand count/backs only.

Manifest classification: `draw_extra_card` is **not** in
`implementedPassiveLeaderSourceIds` because it is a setup-time event,
not a whole-match scoring policy. cCp26 introduces a new manifest
bucket `implementedSetupLeaderSourceIds` (currently 1 entry) so
setup-time leaders are accounted for distinctly from passive scoring
derivations and active executable leaders. `implementedLeaderSourceIds`
remains the union of active + passive + setup-time.

### 17.12l Discard Two Draw One Leader (cCp27)

`monsters.eredin-destroyer-of-worlds` (Eredin: Destroyer of Worlds)
carries the `discard_two_draw_one_from_deck` leader ability. cCp27
promotes the metadata from `placeholder` to `implemented` as an
**active one-shot multi-stage prompt** leader. This is the engine's
first true two-stage prompt. cCp27 completes Tranche 3 of
`docs/leader-ability-matrix.md`.

Effect contract:

- **Legal-use gates.** The leader is legal only when the acting seat
  has at least **one** card in hand and at least **one** card in deck.
  Hand size 0 makes the leader unusable. Deck size 0 makes the leader
  unusable. The leader emits no `use_leader` legal move when either
  gate fails. A manual `UseLeader` attempt rejects with
  `EngineRuleError` and never sets `seat.leaderUsed`. Other gates
  (phase/turn/pass/prompt) are inherited from the standard
  `getLeaderMove` flow.
- **Stage 1 — discard selection (1 or 2 cards).** `UseLeader { target:
  { kind: "none" } }` clones state, emits `ability_triggered`, and
  opens a `pendingPrompt` with `kind === "choose_card_set"`,
  `abilityId === "discard_two_draw_one_from_deck"`,
  `stage === "discard_selection"`. The prompt offers every legal
  1-card discard and every legal 2-card combination in deterministic
  acting-seat hand order: 1-card options first in hand order; 2-card
  combinations next in ascending hand-index order, preserving each
  pair's two card IDs in hand order. Option IDs are
  `discard-draw:discard:<cardId>` for single-card and
  `discard-draw:discard:<cardIdA>+<cardIdB>` for pairs. `seat.leaderUsed`
  remains `false`, `leader_used` is **not** emitted, and the turn is
  **not** handed off. `currentTurn` stays on the acting seat while
  the prompt is pending. No card moves yet.
- **Stage 1 resolution.** `ChoosePromptOption` validates seat
  ownership, option ID legality, that exactly 1 or 2 unique cards are
  selected, and that every selected card is still in the acting seat's
  hand. On success, the resolver moves each selected card from hand to
  the acting seat's discard pile with `card_moved.reason ===
  "leader_discard_for_draw"`, sets each discarded card's `controller`
  to the acting seat (its `owner` is preserved), emits
  `prompt_resolved` for the discard prompt, and immediately opens
  stage 2 over the *post-discard* deck. The leader is **not** consumed
  yet — `seat.leaderUsed === false`, no `leader_used`, no turn handoff.
  Discarded hand cards do **not** trigger battlefield discard effects:
  no Summon, Avenger, Medic, Spy, Scorch, weather application, Muster,
  Berserker, Mardroeme, Skellige round-three queueing, or any other
  on-discard-from-board ability fires.
- **Stage 2 — deck draw selection.** The stage 2 prompt has
  `kind === "choose_card"`, `abilityId === "discard_two_draw_one_from_deck"`,
  `stage === "deck_draw_selection"`, with one option per remaining
  acting-seat deck card in deck order. Option IDs are
  `discard-draw:draw:<cardId>`. Eligible kinds are unrestricted: units,
  heroes, specials, weather, side-deck-only / generated cards (if they
  somehow reached the acting seat's deck), and off-owner cards (if
  they physically sit in the acting seat's deck). Missing instances
  and missing catalog sources are skipped defensively. The
  `pendingPrompt.context.discardedCardIds` carries the stage 1
  selection so observers can describe the multi-stage flow without
  re-deriving it.
- **Stage 2 resolution.** `ChoosePromptOption` validates seat
  ownership, option ID legality, and that the selected card is still
  in the acting seat's deck. On success, the resolver moves the
  chosen card from deck to the acting seat's hand with
  `card_moved.reason === "leader_draw_from_deck"`, sets the chosen
  card's `controller` to the acting seat (`owner` is preserved), then
  shuffles the remaining acting deck through the existing seeded RNG
  helpers (`createSeededRngFromState(state.rng.seed, state.rng.state)`
  + `shuffleWithRng(remainingDeck, rng)`). RNG state advances only
  when the remaining deck has ≥ 2 cards; for deck length 0 or 1,
  `shuffleWithRng` is a deterministic no-op and `state.rng.state` is
  preserved. The transaction emits `deck_shuffled` with
  `reason === "leader_discard_draw"` (a distinct reason from cCp23's
  `"leader_shuffle_into_deck"`), `prompt_resolved`,
  `ability_resolved` with `outcome === "discarded_and_drew_card"`,
  sets `seat.leaderUsed = true`, emits `leader_used`, clears
  `state.pendingPrompt`, and hands off the turn through the existing
  `handoffTurn` helper. Drawn cards do **not** trigger their abilities
  — they enter hand and behave normally only if played later (no
  `card_played`, no Medic, Scorch, weather, Spy, Muster, Avenger,
  Summon, or Berserker resolution on draw).
- **Partially resolved leader state.** Between stage 1 and stage 2
  the engine state is partially resolved: stage 1's selected hand
  cards are already in discard, `state.pendingPrompt` points at the
  stage 2 deck-draw prompt, the acting seat still owns the turn,
  `seat.leaderUsed === false`, and no `leader_used` event has fired.
  Tests cover this state explicitly. Any non-prompt command attempted
  during the pending stage 2 prompt rejects through the existing
  `prompt_pending` rule guard.

The legal-move target shape for the two stages:

```ts
// Stage 1 prompt option.
target: {
  kind: "card_instance_set",
  side: "own",
  seatId: actingSeat,
  cardIds: [cardIdA] | [cardIdA, cardIdB],
}

// Stage 2 prompt option.
target: {
  kind: "deck_card_instance",
  side: "own",
  seatId: actingSeat,
  cardId: deckCardId,
}
```

`getPromptMoves` only emits these to the acting seat. Non-acting
seats see an empty `legalMoves` array while either stage is open.

Hidden-info safety:

- The acting seat already sees its own hand and own deck identities
  through the engine; this leader does not introduce a new public
  disclosure. The two prompt stages are gated to the acting seat by
  `getPromptMoves`.
- The non-acting seat must not see prompt options for either stage.
  `getPromptMoves` returns `[]` for any seat that does not own the
  prompt; AI seat observations from `seatObservation.buildSeatObservation`
  return `pendingPrompt: null` to the wrong seat.
- Simulation export observations expose the acting seat's own deck
  card to the acting perspective only, through a prompt-local safe
  ref (`own_deck_option_<index>`) so raw deck instance IDs never
  appear in the safe export. Action encoding falls back to a `none`
  target side for both new target kinds — the prompt option's safe
  ref lives on the observation side, not the action side, preserving
  the existing `card_instance_set` / `deck_card_instance` / raw-id
  redaction guarantees.
- Recent-activity / event summaries continue to expose only
  `prompt.seatId` and `prompt.abilityId` for `prompt_opened`, never
  option labels or card identities.

The §16 Specific Card FAQ row for *Eredin, Destroyer of Worlds* points
at this section.

### 17.12m Look Three Cards Leader (cCp28)

`nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard` (Emhyr var Emreis:
Emperor of Nilfgaard) carries the `look_three_cards` leader ability.
cCp28 promotes the metadata from `placeholder` to `implemented` as an
**active one-shot hidden-info disclosure leader**. This is the engine's
first explicit hidden-info disclosure rule. cCp28 opens Tranche 4 of
`docs/leader-ability-matrix.md` (Pattern 5 IMPLEMENTED).

Effect contract:

- **Legal-use gates.** Standard active-leader gates (phase = `playing`,
  current turn is the acting seat, acting seat has not passed, leader
  is not used, no `pendingPrompt`) plus a new gate: the opponent must
  have at least **one** card in hand. The leader emits no `use_leader`
  legal move when opponent hand length is 0. A manual `UseLeader`
  attempt with empty opponent hand rejects with `EngineRuleError` and
  never sets `seat.leaderUsed`.
- **Reveal count.** `min(3, opponent hand length)`. Hand length 1
  reveals one card. Hand length 2 reveals both cards. Hand length 3
  reveals all three cards. Hand length greater than 3 selects exactly
  three cards uniformly without replacement using the engine's
  deterministic seeded RNG.
- **Randomness and ordering.** The selection uses
  `createSeededRngFromState(state.rng.seed, state.rng.state)` plus
  `shuffleWithRng`, then takes the first three cards of the shuffled
  list as a set. The revealed list returned to display is the
  intersection of the opponent's natural hand order with that set, so
  the visible reveal order is deterministic and matches opponent hand
  order. **RNG advances only when the opponent has more than three
  cards.** For hand length 1, 2, or 3, the full hand is revealed
  without invoking RNG and `state.rng.state` is preserved.
- **One-time disclosure.** `UseLeader` clones state, advances RNG only
  if a real subset selection happened, and emits this event sequence:
  `ability_triggered`, `opponent_hand_revealed`, `ability_resolved`
  (`outcome === "revealed_opponent_hand"`), `leader_used`, and
  `prompt_opened`. The leader is consumed at `UseLeader` —
  `seat.leaderUsed = true` is set at this point, **not** at
  acknowledgement. The transaction also opens a `pendingPrompt` with
  `kind === "choose_option"`,
  `abilityId === "look_three_cards"`,
  `stage === "opponent_hand_reveal"`, exactly one option (`optionId
  === "look-three-cards:acknowledge"`, label `Continue`,
  `target.kind === "none"`), and a `context.revealedCardIds` snapshot
  of the chosen opponent hand card IDs. `currentTurn` stays on the
  acting seat while the prompt is pending.
- **Acknowledgement.** `ChoosePromptOption` validates seat ownership,
  prompt kind/ability/stage, the single acknowledgement option ID, and
  the `none` target shape. On success, the resolver emits
  `prompt_resolved`, clears `state.pendingPrompt`, and the outer
  command path hands off the turn through `handoffTurn`. After
  acknowledgement, **no MatchState field retains the reveal snapshot**
  — the only place the revealed identities ever lived was inside the
  pending prompt's context, and that prompt is now cleared.
- **No card movement.** Revealed cards are not moved out of the
  opponent's hand. They keep their original zone, owner, and
  controller. No `card_moved` event fires for revealed cards.
- **No ability trigger.** Revealing cards does not invoke
  `resolveCardAbilities` on any of them. Specials (e.g. Scorch),
  weather, Medic, Spy, and other on-play abilities do not fire on
  reveal.
- **Card eligibility.** Every card physically in the opponent's hand
  is eligible: units, heroes, specials, weather, side-deck-only /
  generated cards if they somehow reached hand, and off-owner cards
  if they physically sit there. Missing card instances are skipped
  defensively. Missing catalog sources are skipped from the
  `revealedSourceIds` display list (the card is still selectable; the
  display list just omits the unresolvable source).

The legal-move target shape for the acknowledgement prompt:

```ts
target: { kind: "none" }
```

`getPromptMoves` only emits the acknowledgement to the acting seat.
The non-acting seat sees an empty `legalMoves` array while the prompt
is open.

Hidden-info safety:

- The acting seat sees the revealed cards through the
  `pendingPrompt.context.revealedCardIds` snapshot only while the
  acknowledgement prompt is open. After acknowledgement, the snapshot
  is gone.
- The non-acting seat must not see the revealed identities anywhere.
  `getPromptMoves` returns `[]` for the non-acting seat; AI seat
  observations from `seatObservation.buildSeatObservation` return
  `pendingPrompt: null` to the wrong seat. The acting seat's
  observation surfaces the revealed cards via a new
  `PendingPromptSummary.revealedCards` field; the non-acting
  observation never reaches that branch.
- Simulation export observations expose the revealed opponent hand
  cards to the prompt-owner perspective only, through prompt-local
  safe refs `revealed_opponent_hand_<index>` so raw opponent hand
  instance IDs never appear in the safe export. The non-acting
  perspective has `pendingPrompt: null` and exposes no revealed names,
  source IDs, or instance IDs.
- Recent-activity / event summaries render the disclosure as a
  count-only message ("Human looked at 3 opponent hand cards" /
  "AI looked at 3 opponent hand cards") and never the revealed names
  or source IDs, even if the underlying engine event payload carries
  them for the internal event log.
- Product UI shows a one-time modal (`authentic-look-three-cards-dialog`)
  for human-owned reveal prompts only. After acknowledgement, the
  modal disappears and cannot be reopened from any visible control.
  The normal opponent hand strip stays backs/count-only — no card
  becomes persistently face-up after dismissal.

The §16 Specific Card FAQ row for *Emhyr var Emreis, Emperor of
Nilfgaard* points at this section.

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

### 17.21 Clan Dimun Pirate Whole-Board Scorch (Self-Including)

- Clan Dimun Pirate has a Scorch effect that targets the whole battlefield using effective
  (post-modifier) strength. Per the user-confirmed rule patch:
  - if no other card has more strength than Clan Dimun Pirate, it destroys itself;
  - if other cards tie with Clan Dimun Pirate for highest strength, it destroys those cards
    and itself;
  - heroes are still immune.
- This supersedes any prior reading that Clan Dimun Pirate could not discard itself.

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
- Avenger sources (Cow, Kambi) → keep the original removal destination (discard or
  hand). Their linked replacement is pulled from side deck onto the source's old
  board row/side after the source leaves.

### Deck Construction

- **1** Leader Card.
- **≥22** Unit Cards.
- **≤10** Special Cards.
- Single-faction color only.

---

*Compiled from the CD PROJEKT RED physical Gwent rulebook (10th-anniversary edition, © 2025 CD PROJEKT S.A.). Extractions labeled **[Derived]** or **[Rulebook silent]** are inferences from the printed rules rather than direct quotations — use the Golden Rule (card text over rulebook) when printed card text addresses the situation explicitly.*
