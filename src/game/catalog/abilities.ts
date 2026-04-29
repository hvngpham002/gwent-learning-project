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
    status: "planned",
    appliesTo: ["unit"],
    description: "Summons a replacement when the source leaves play.",
  },
  scorch_close: {
    id: "scorch_close",
    name: "Scorch Close",
    status: "implemented",
    appliesTo: ["unit"],
    description: "Scorches highest units on the opposing close row when threshold is met.",
  },
  scorch: {
    id: "scorch",
    name: "Scorch",
    status: "implemented",
    appliesTo: ["special"],
    description: "Scorches highest non-hero units across the battlefield.",
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
    status: "planned",
    appliesTo: ["unit"],
    description: "Summons a card from the side deck or linked source.",
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
    status: "placeholder",
    description: "Scorches highest siege units when threshold is met.",
  },
  scorch_range: {
    id: "scorch_range",
    name: "Scorch Ranged",
    status: "placeholder",
    description: "Scorches highest ranged units when threshold is met.",
  },
  double_siege: {
    id: "double_siege",
    name: "Double Siege",
    status: "placeholder",
    description: "Applies a horn-like effect to siege.",
  },
  play_frost: {
    id: "play_frost",
    name: "Play Frost",
    status: "placeholder",
    description: "Plays or creates a Frost weather effect.",
  },
  play_fog: {
    id: "play_fog",
    name: "Play Fog",
    status: "placeholder",
    description: "Plays or creates a Fog weather effect.",
  },
  play_rain: {
    id: "play_rain",
    name: "Play Rain",
    status: "placeholder",
    description: "Plays or creates a Rain weather effect.",
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
    status: "placeholder",
    description: "Draws from the opponent discard pile.",
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
    status: "placeholder",
    description: "Plays a chosen weather card from the deck.",
  },
  double_close: {
    id: "double_close",
    name: "Double Close Combat",
    status: "placeholder",
    description: "Doubles the strength of close combat units.",
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
    status: "placeholder",
    description: "Returns a card from the discard pile to the hand.",
  },
  double_spies: {
    id: "double_spies",
    name: "Double Spies",
    status: "placeholder",
    description: "Doubles the strength of spy units already on the battlefield.",
  },
  weather_half_penalty: {
    id: "weather_half_penalty",
    name: "Weather Half Penalty",
    status: "placeholder",
    description: "Reduces weather strength penalties for affected rows.",
  },
  optimize_agile_rows: {
    id: "optimize_agile_rows",
    name: "Optimize Agile Rows",
    status: "placeholder",
    description: "Moves agile units to their optimal row.",
  },
  double_ranged: {
    id: "double_ranged",
    name: "Double Ranged",
    status: "placeholder",
    description: "Doubles the strength of ranged units.",
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
    status: "placeholder",
    description: "Shuffles both discard piles back into their respective decks.",
  },
};

export const isCatalogAbilityId = (value: unknown): value is CatalogAbilityId =>
  typeof value === "string" && CATALOG_ABILITY_IDS.includes(value as CatalogAbilityId);

export const isCatalogLeaderAbilityId = (value: unknown): value is CatalogLeaderAbilityId =>
  typeof value === "string" &&
  CATALOG_LEADER_ABILITY_IDS.includes(value as CatalogLeaderAbilityId);
