import type { CatalogCardSource, CatalogDeckPreset, CatalogFaction, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

export type SeatId = "seat_a" | "seat_b";
export type PlayerId = string;
export type CardInstanceId = string;

export type MatchPhase = "setup" | "mulligan" | "playing" | "round_end" | "game_end";
export type ControllerKind = "human" | "ai" | "scripted";

export type ZoneRef =
  | { kind: "deck"; seat: SeatId }
  | { kind: "hand"; seat: SeatId }
  | { kind: "discard"; seat: SeatId }
  | { kind: "leader"; seat: SeatId }
  | { kind: "side_deck"; seat: SeatId }
  | { kind: "removed_from_game"; seat: SeatId }
  | { kind: "board_row"; seat: SeatId; row: CatalogRow }
  | { kind: "row_horn"; seat: SeatId; row: CatalogRow }
  | { kind: "weather" };

export interface CardInstance {
  instanceId: CardInstanceId;
  sourceId: string;
  sourceKind: "card" | "leader";
  owner: SeatId;
  controller: SeatId;
  zone: ZoneRef;
}

export interface RowState {
  units: CardInstanceId[];
  horn: CardInstanceId | null;
}

export interface BoardSide {
  close: RowState;
  ranged: RowState;
  siege: RowState;
}

export interface WeatherState {
  entries: CardInstanceId[];
}

export interface SeatState {
  seatId: SeatId;
  playerId?: PlayerId;
  controllerKind: ControllerKind;
  faction: Exclude<CatalogFaction, "neutral">;
  deck: CardInstanceId[];
  hand: CardInstanceId[];
  discard: CardInstanceId[];
  leader: CardInstanceId | null;
  leaderSourceId: string;
  sideDeck: CardInstanceId[];
  removedFromGame: CardInstanceId[];
  board: BoardSide;
  gems: number;
  passed: boolean;
}

export interface RngState {
  seed: string | number;
  algorithm: "xmur3-mulberry32";
  state: number;
}

export interface MatchState {
  matchId: string;
  phase: MatchPhase;
  round: number;
  currentTurn: SeatId;
  seats: Record<SeatId, SeatState>;
  cardsById: Record<CardInstanceId, CardInstance>;
  weather: WeatherState;
  rng: RngState;
  catalog: {
    cardSourceIds: string[];
    leaderSourceIds: string[];
    deckPresetIds: string[];
  };
}

export interface MatchSeatConfig {
  seatId: SeatId;
  playerId?: PlayerId;
  controllerKind?: ControllerKind;
  faction: Exclude<CatalogFaction, "neutral">;
  deckPreset: CatalogDeckPreset;
}

export interface MatchConfig {
  matchId?: string;
  seed: string | number;
  seats: readonly [MatchSeatConfig, MatchSeatConfig];
  catalog: {
    cards: readonly CatalogCardSource[];
    leaders: readonly CatalogLeaderSource[];
  };
}

export interface PendingPrompt {
  promptId: string;
  seatId: SeatId;
  kind: "mulligan" | "choose_row" | "choose_card" | "choose_option";
  options: readonly string[];
}

export interface EngineTransaction {
  state: MatchState;
  events: GameEvent[];
  prompt?: PendingPrompt;
}

export type EngineCommand =
  | { type: "StartMatch"; config: MatchConfig }
  | { type: "ChooseMulligan"; seatId: SeatId; cardIds: CardInstanceId[] }
  | { type: "PlayCard"; seatId: SeatId; cardId: CardInstanceId; target?: unknown }
  | { type: "Pass"; seatId: SeatId }
  | { type: "UseLeader"; seatId: SeatId; target?: unknown }
  | { type: "ChoosePromptOption"; promptId: string; optionId: string };

export type GameEvent =
  | {
      type: "match_started";
      matchId: string;
      seed: string | number;
      seats: SeatId[];
    }
  | {
      type: "deck_instantiated";
      seatId: SeatId;
      faction: Exclude<CatalogFaction, "neutral">;
      presetId: string;
      deckCount: number;
      leaderInstanceId: CardInstanceId;
      sideDeckCount: number;
    }
  | {
      type: "card_moved";
      cardId: CardInstanceId;
      sourceId: string;
      from: ZoneRef | null;
      to: ZoneRef;
      reason: "instantiate" | "shuffle" | "initial_draw";
    }
  | {
      type: "initial_hand_drawn";
      seatId: SeatId;
      cardIds: CardInstanceId[];
    }
  | {
      type: "turn_set";
      seatId: SeatId;
      reason: "initial_roll" | "scoiatael_override" | "round_winner" | "draw_policy";
    }
  | { type: "card_played"; seatId: SeatId; cardId: CardInstanceId }
  | { type: "ability_resolved"; sourceId: CardInstanceId; abilityId: string }
  | { type: "prompt_opened"; prompt: PendingPrompt }
  | { type: "round_ended"; round: number; winner: SeatId | "draw" }
  | { type: "game_ended"; winner: SeatId | "draw" };
