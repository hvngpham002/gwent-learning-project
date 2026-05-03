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
    status: "planned",
    appliesTo: ["unit"],
    description: "Summons Roach from deck when an eligible hero is played.",
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
    status: "placeholder",
    description: "Cancels the opponent leader ability.",
  },
  look_three_cards: {
    id: "look_three_cards",
    name: "Look Three Cards",
    status: "placeholder",
    description: "Looks at random cards in the opponent hand.",
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
    status: "placeholder",
    description: "Plays a random medic effect.",
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
    status: "placeholder",
    description: "Discards two cards and draws one from the deck.",
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
    status: "placeholder",
    description: "Draws an additional card from the deck.",
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
