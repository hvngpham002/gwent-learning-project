import { CATALOG_ABILITY_IDS, CATALOG_LEADER_ABILITY_IDS } from "./constants";
import {
  CatalogAbilityId,
  CatalogAbilityMetadata,
  CatalogLeaderAbilityId,
  CatalogLeaderAbilityMetadata,
} from "./types";

export const CATALOG_ABILITY_METADATA: Record<CatalogAbilityId, CatalogAbilityMetadata> = {
  tight_bond: {
    id: "tight_bond",
    name: "Tight Bond",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Multiplies same-name allied unit strength.",
  },
  medic: {
    id: "medic",
    name: "Medic",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Revives a non-hero unit from discard.",
  },
  morale_boost: {
    id: "morale_boost",
    name: "Morale Boost",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Adds strength to other non-hero units on the row.",
  },
  spy: {
    id: "spy",
    name: "Spy",
    status: "implemented",
    appliesTo: ["unit", "hero"],
    description: "Plays to the opposing side and draws cards.",
  },
  muster: {
    id: "muster",
    name: "Muster",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Finds linked or grouped cards from legal zones.",
  },
  muster_roach: {
    id: "muster_roach",
    name: "Muster Roach",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Summons linked Roach copies from hand and deck when an eligible hero is played.",
  },
  agile: {
    id: "agile",
    name: "Agile",
    status: "implemented",
    appliesTo: ["unit", "hero"],
    description: "Allows placement on more than one row.",
  },
  avenger: {
    id: "avenger",
    name: "Avenger",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Summons a linked side-deck replacement when the source is removed from the battlefield (round cleanup, Scorch, Decoy bounce).",
  },
  scorch_close: {
    id: "scorch_close",
    name: "Scorch Close",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Scorches highest units on the opposing close row when threshold is met.",
  },
  scorch_range: {
    id: "scorch_range",
    name: "Scorch Ranged",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Scorches highest units on the opposing ranged row when threshold is met.",
  },
  scorch_siege: {
    id: "scorch_siege",
    name: "Scorch Siege",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Scorches highest units on the opposing siege row when threshold is met.",
  },
  scorch: {
    id: "scorch",
    name: "Scorch",
    status: "implemented",
    appliesTo: ["unit", "special"],
    description: "Scorches highest non-hero units across the battlefield. Special form discards itself; unit form remains on board and is included as a target.",
  },
  skellige_storm: {
    id: "skellige_storm",
    name: "Skellige Storm",
    status: "implemented",
    appliesTo: ["special"],
    description: "Weather for ranged and siege rows.",
  },
  commanders_horn: {
    id: "commanders_horn",
    name: "Commander's Horn",
    status: "implemented",
    appliesTo: ["unit", "special"],
    description: "Doubles non-hero unit strength on a row.",
  },
  decoy: {
    id: "decoy",
    name: "Decoy",
    status: "implemented",
    appliesTo: ["special"],
    description: "Replaces a non-hero unit and returns that unit to hand.",
  },
  frost: {
    id: "frost",
    name: "Biting Frost",
    status: "implemented",
    appliesTo: ["special"],
    description: "Weather for close rows.",
  },
  fog: {
    id: "fog",
    name: "Impenetrable Fog",
    status: "implemented",
    appliesTo: ["special"],
    description: "Weather for ranged rows.",
  },
  rain: {
    id: "rain",
    name: "Torrential Rain",
    status: "implemented",
    appliesTo: ["special"],
    description: "Weather for siege rows.",
  },
  clear_weather: {
    id: "clear_weather",
    name: "Clear Weather",
    status: "implemented",
    appliesTo: ["special"],
    description: "Clears active weather cards.",
  },
  mardroeme: {
    id: "mardroeme",
    name: "Mardroeme",
    status: "implemented",
    appliesTo: ["unit", "hero", "special"],
    description: "Transforms berserker cards on a row.",
  },
  berserker: {
    id: "berserker",
    name: "Berserker",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Transforms when Mardroeme resolves.",
  },
  summon: {
    id: "summon",
    name: "Summon",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Summons a linked side-deck replacement only when the source is discarded from a board row (Scorch, round cleanup, Foltest row-Scorch leaders). Decoy returns to hand and does not trigger Summon.",
  },
  none: {
    id: "none",
    name: "None",
    status: "implemented",
    appliesTo: ["unit", "hero", "special"],
    description: "No declared ability.",
  },
};

export const CATALOG_LEADER_ABILITY_METADATA: Record<
  CatalogLeaderAbilityId,
  CatalogLeaderAbilityMetadata
> = {
  clear_weather: {
    id: "clear_weather",
    name: "Clear Weather",
    status: "implemented",
    description: "Clears active weather effects.",
  },
  scorch_siege: {
    id: "scorch_siege",
    name: "Scorch Siege",
    status: "implemented",
    description: "Active leader: destroys all tied highest non-hero units on the opponent Siege Combat row when that row's effective strength is at least 10.",
  },
  scorch_range: {
    id: "scorch_range",
    name: "Scorch Ranged",
    status: "implemented",
    description: "Active leader: destroys all tied highest non-hero units on the opponent Ranged Combat row when that row's effective strength is at least 10.",
  },
  double_siege: {
    id: "double_siege",
    name: "Double Siege",
    status: "implemented",
    description: "Passive: applies a Commander's Horn-equivalent ×2 to non-hero units on the friendly Siege Combat row. Suppressed if a Commander's Horn is already on that row; horn effects do not stack. Heroes are unaffected.",
  },
  play_frost: {
    id: "play_frost",
    name: "Play Frost",
    status: "implemented",
    description: "Pulls a Biting Frost card from the acting deck and plays it to the shared weather zone.",
  },
  play_fog: {
    id: "play_fog",
    name: "Play Fog",
    status: "implemented",
    description: "Pulls an Impenetrable Fog card from the acting deck and plays it to the shared weather zone.",
  },
  play_rain: {
    id: "play_rain",
    name: "Play Rain",
    status: "implemented",
    description: "Pulls a Torrential Rain card from the acting deck and plays it to the shared weather zone.",
  },
  cancel_leader: {
    id: "cancel_leader",
    name: "Cancel Leader",
    status: "implemented",
    description: "Active one-shot reaction/current-round suppression. The acting seat owns Emhyr var Emreis: The White Flame and may either (1) use it proactively on its own normal turn to lock out an opponent leader (active or passive) for the current round, or (2) react before an opponent active leader resolves to consume that leader without effect (no-refund). Suppression is current-round-scoped via `seat.leaderCancelledRound = state.round` and clears at round transition. Suppressed seats emit no `use_leader` legal move; passive scoring/ability policies (`weather_half_penalty`, `double_close`, `double_ranged`, `double_siege`, `double_spies`, `random_medic`) recalculate immediately for the current round when suppressed. Setup-time `draw_extra_card` already happened and is not retroactively undone. The reaction prompt is `kind === \"choose_option\"`, `stage === \"leader_cancel_reaction\"`; `cancel_leader` cannot be used to cancel another `cancel_leader` (no recursive reaction window). The acting seat's leader is consumed in both modes; in proactive mode the opponent leader is *not* consumed, just locked out for the current round.",
  },
  look_three_cards: {
    id: "look_three_cards",
    name: "Look Three Cards",
    status: "implemented",
    description: "Active one-shot hidden-info disclosure leader. When eligible (opponent hand has at least one card), opens a one-time acknowledgement prompt (`choose_option`, `opponent_hand_reveal`) that reveals up to three random opponent hand cards (`min(3, opponent hand length)`) to the acting seat through the prompt context. RNG advances only when the opponent hand has more than three cards (length 1-3 is a deterministic full-hand reveal that leaves `state.rng.state` unchanged). The leader is consumed at `UseLeader`; the acknowledgement prompt blocks the turn until the acting seat dismisses it. After dismissal, the reveal snapshot is cleared from `pendingPrompt` and cannot be reopened from product UI or hidden-info-safe surfaces. Revealed identities are visible only to the prompt owner; the non-acting seat sees `pendingPrompt: null` in observation/export and never receives the revealed names, source IDs, or instance IDs.",
  },
  draw_opponent_discard: {
    id: "draw_opponent_discard",
    name: "Draw Opponent Discard",
    status: "implemented",
    description: "Active one-shot: opens a single-step `choose_card` prompt over the **opponent's** discard pile and moves the chosen card to the acting seat's hand. Any card kind physically in the opponent discard is eligible (units, heroes, specials, weather, generated / side-deck-only cards, and off-owner cards that ended up there). Empty opponent discard emits no legal `use_leader` move. The leader is consumed only after a legal prompt option resolves; drawn cards do not trigger their abilities — they enter hand and behave normally only if played later. The chosen card's `controller` becomes the acting seat; immutable `owner` is preserved. Settles the cCp18 §C-2 conflict in favor of the catalog (catalog wins; the older deck-tutor rulebook wording is superseded).",
  },
  random_medic: {
    id: "random_medic",
    name: "Random Medic",
    status: "implemented",
    description: "Passive whole-match Medic mutation. While this leader is the seat's leader, every non-hero Medic source controlled by that seat revives a random eligible non-hero Unit from that seat's own discard pile (uniform over candidate cards through the engine's seeded RNG; deterministic row fallback `close → ranged → siege` for multi-row targets) instead of opening a Medic prompt. Spy placement still flips to the opponent board side and resolves Spy draw. Hero Medic sources are unaffected and continue to use the normal player-choice Medic prompt. Emits no legal `use_leader` move and never sets `seat.leaderUsed`. Settles the cCp18 §C-3 conflict in favor of the Medic-mutation reading; the older random Special replay text is superseded.",
  },
  play_any_weather: {
    id: "play_any_weather",
    name: "Play Any Weather",
    status: "implemented",
    description: "Pulls one chosen weather effect card (Frost, Fog, Rain, or Skellige Storm) from the acting deck and plays it to the shared weather zone. Cannot pull Clear Weather.",
  },
  double_close: {
    id: "double_close",
    name: "Double Close Combat",
    status: "implemented",
    description: "Passive: applies a Commander's Horn-equivalent ×2 to non-hero units on the friendly Close Combat row. Suppressed if a Commander's Horn is already on that row; horn effects do not stack. Heroes are unaffected.",
  },
  discard_two_draw_one_from_deck: {
    id: "discard_two_draw_one_from_deck",
    name: "Discard Two, Draw One",
    status: "implemented",
    description: "Active one-shot multi-stage prompt leader. Stage 1 opens a `choose_card_set` prompt over the acting seat's hand and the player discards one or two hand cards. Stage 2 opens a `choose_card` prompt over every remaining card in the acting seat's deck (visible only to the acting seat); the player chooses any card to draw into hand. After the draw, the remaining acting deck is shuffled deterministically through the engine's seeded RNG. Drawn cards do **not** trigger their abilities, and discarded hand cards do **not** trigger battlefield discard effects (Summon, Avenger, Medic, Spy, Scorch, weather, Muster, Berserker, Mardroeme). The leader requires at least one hand card and one deck card to use; the leader is consumed only after stage 2 resolves successfully.",
  },
  restore_discard_to_hand: {
    id: "restore_discard_to_hand",
    name: "Restore Discard To Hand",
    status: "implemented",
    description: "Active one-shot: opens a single-step prompt over the acting seat's own discard pile and returns the chosen card to hand. Any card kind in the own discard is eligible (units, heroes, specials, weather, generated / side-deck-only cards that physically reached discard); heroes are included because the leader text says \"card\" without Medic's non-hero restriction. Empty own discard emits no legal `use_leader` move. The leader is consumed only after a legal prompt option resolves; restored cards do not trigger their abilities — they return to hand and behave normally only if played later.",
  },
  double_spies: {
    id: "double_spies",
    name: "Double Spies",
    status: "implemented",
    description: "Passive: applies a ×2 multiplier to every non-hero Spy unit on the battlefield, regardless of owner or row, for the entire match. Heroes are unaffected. The multiplier does not stack if both seats somehow have the same passive.",
  },
  weather_half_penalty: {
    id: "weather_half_penalty",
    name: "Weather Half Penalty",
    status: "implemented",
    description: "Passive: friendly non-hero units lose only half their printed strength (rounded down) on rows under matching weather, instead of being set to 1.",
  },
  optimize_agile_rows: {
    id: "optimize_agile_rows",
    name: "Optimize Agile Rows",
    status: "implemented",
    description: "Active one-shot: moves every friendly own-board non-hero Agile unit to the same destination row that yields the highest acting-seat score (heroes are excluded). When multiple destination rows tie for the best score, the player chooses among the tied best rows. Pure no-op rows are not executable, so the leader is never consumed without changing board state.",
  },
  double_ranged: {
    id: "double_ranged",
    name: "Double Ranged",
    status: "implemented",
    description: "Passive: applies a Commander's Horn-equivalent ×2 to non-hero units on the friendly Ranged Combat row. Suppressed if a Commander's Horn is already on that row; horn effects do not stack. Heroes are unaffected.",
  },
  draw_extra_card: {
    id: "draw_extra_card",
    name: "Draw Extra Card",
    status: "implemented",
    description: "Setup-time initial hand-size modifier. While this leader is the seat's leader, the seat draws 11 cards from the top of the already-shuffled deck during `startMatch` instead of the base 10 before mulligan opens. The mulligan budget is unchanged at two redraws. The leader emits no `use_leader` legal move, never sets `seat.leaderUsed`, and never emits `leader_used`. There is no prompt and no card-by-card target choice; the extra card is the next deterministic card off the seeded-RNG-shuffled deck top.",
  },
  shuffle_discards_into_decks: {
    id: "shuffle_discards_into_decks",
    name: "Shuffle Discards Into Decks",
    status: "implemented",
    description: "Active one-shot: each non-empty discard pile is moved into the same seat's deck and that seat's deck is shuffled with the engine's deterministic seeded RNG. A card moves to the deck belonging to the discard pile it currently occupies, not necessarily to its original owner. Empty discard piles are not touched and their decks are not shuffled (no hidden-order no-op mutation). Hand, deck, side deck, removed-from-game, board rows, row horns, weather zone, and leader zone are untouched. Recycled cards do not resolve their abilities; they behave normally only if drawn and played later. Emits no legal `use_leader` move when both discard piles are empty.",
  },
};

export const isCatalogAbilityId = (value: unknown): value is CatalogAbilityId =>
  typeof value === "string" && CATALOG_ABILITY_IDS.includes(value as CatalogAbilityId);

export const isCatalogLeaderAbilityId = (value: unknown): value is CatalogLeaderAbilityId =>
  typeof value === "string" &&
  CATALOG_LEADER_ABILITY_IDS.includes(value as CatalogLeaderAbilityId);
