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
  leaderUsed: boolean;
  mulliganComplete: boolean;
  mulligansUsed: number;
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
  roundStarter: SeatId;
  roundHistory: RoundResult[];
  lastResolvedRound: number | null;
  currentTurn: SeatId;
  pendingPrompt: PendingPrompt | null;
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

export interface RoundResult {
  round: number;
  scoreBySeat: Record<SeatId, number>;
  outcome: "seat_a_win" | "seat_b_win" | "draw";
  winner: SeatId | "draw";
  loserGemLoss: Partial<Record<SeatId, number>>;
  factionOutcome?: "nilfgaard_draw_win" | "normal";
  nextStarter?: SeatId;
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
  kind: "medic_revive" | "choose_row" | "choose_card" | "choose_option";
  sourceCardId?: CardInstanceId;
  sourceId?: string;
  abilityId: string;
  options: readonly PendingPromptOption[];
}

export interface PendingPromptOption {
  optionId: string;
  label: string;
  target: {
    kind: "card_instance";
    cardId: CardInstanceId;
    sourceId: string;
    row: CatalogRow;
  };
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
  | { type: "ResolveRoundEnd"; seatId?: SeatId }
  | { type: "UseLeader"; seatId: SeatId; target?: unknown }
  | { type: "ChoosePromptOption"; seatId: SeatId; promptId: string; optionId: string };

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
      reason:
        | "instantiate"
        | "shuffle"
        | "initial_draw"
        | "mulligan_return"
        | "mulligan_draw"
        | "play_card"
        | "decoy_return"
        | "ability_draw"
        | "ability_muster"
        | "medic_revive"
        | "weather_cleared"
        | "discard_after_effect"
        | "scorch_destroyed"
        | "scorch_discard"
        | "round_cleanup"
        | "northern_realms_draw"
        | "skellige_return"
        | "mardroeme_transform"
        | "avenger_summon"
        | "summon_replacement"
        | "leader_weather"
        | "leader_optimize_agile";
    }
  | {
      type: "initial_hand_drawn";
      seatId: SeatId;
      cardIds: CardInstanceId[];
    }
  | {
      type: "turn_set";
      seatId: SeatId;
      reason: "initial_roll" | "scoiatael_override" | "round_winner" | "draw_policy" | "turn_handoff";
    }
  | { type: "mulligan_chosen"; seatId: SeatId; cardIds: CardInstanceId[]; drawCount: number }
  | {
      type: "phase_changed";
      from: MatchPhase;
      to: MatchPhase;
      reason: "mulligan_complete" | "both_passed" | "round_resolved" | "game_ended";
    }
  | { type: "card_played"; seatId: SeatId; cardId: CardInstanceId; target?: ZoneRef }
  | { type: "leader_used"; seatId: SeatId; leaderCardId: CardInstanceId; abilityId: string }
  | { type: "player_passed"; seatId: SeatId }
  | { type: "weather_cleared"; seatId: SeatId; cardIds: CardInstanceId[]; source: "card" | "leader" }
  | { type: "ability_triggered"; sourceId: string; cardId: CardInstanceId; abilityId: string }
  | { type: "ability_deferred"; sourceId: string; cardId: CardInstanceId; abilityId: string; reason: string }
  | {
      type: "ability_resolved";
      sourceId: string;
      cardId: CardInstanceId;
      abilityId: string;
      outcome?: string;
    }
  | {
      type: "scorch_resolved";
      sourceId: string;
      cardId: CardInstanceId;
      abilityId: "scorch" | "scorch_close" | "scorch_range" | "scorch_siege";
      targetCardIds: CardInstanceId[];
      outcome: "destroyed" | "no_targets" | "below_threshold";
    }
  | { type: "card_drawn"; seatId: SeatId; cardId: CardInstanceId; sourceId: string }
  | { type: "prompt_opened"; prompt: PendingPrompt }
  | { type: "prompt_resolved"; promptId: string; seatId: SeatId; optionId: string }
  | { type: "deck_shuffled"; seatId: SeatId; reason: "muster" | "mulligan" }
  | {
      type: "round_resolved";
      round: number;
      scoreBySeat: Record<SeatId, number>;
      winner: SeatId | "draw";
      loserGemLoss: Partial<Record<SeatId, number>>;
      factionOutcome: "nilfgaard_draw_win" | "normal";
    }
  | { type: "gems_changed"; seatId: SeatId; before: number; after: number; delta: number; reason: "round_loss" }
  | { type: "board_swept"; round: number; movedCardIds: CardInstanceId[]; keptCardIds: CardInstanceId[] }
  | {
      type: "round_started";
      round: number;
      startingSeat: SeatId;
      reason: "round_winner" | "draw_policy";
    }
  | {
      type: "faction_ability_resolved";
      faction: Exclude<CatalogFaction, "neutral">;
      seatId: SeatId;
      ability:
        | "nilfgaard_draw_win"
        | "monsters_keep_unit"
        | "northern_realms_draw_on_win"
        | "skellige_round_3_return";
      outcome: string;
      cardIds?: CardInstanceId[];
      eligibleCount?: number;
      policy?: string;
    }
  | { type: "round_ended"; round: number; winner: SeatId | "draw" }
  | { type: "game_ended"; winner: SeatId | "draw" }
  | {
      type: "card_transformed";
      triggerCardId: CardInstanceId;
      fromCardId: CardInstanceId;
      fromSourceId: string;
      toCardId: CardInstanceId;
      toSourceId: string;
      seatId: SeatId;
      row: CatalogRow;
      abilityId: "berserker";
    }
  | {
      type: "card_summoned";
      triggerCardId: CardInstanceId;
      fromSourceId: string;
      toCardId: CardInstanceId;
      toSourceId: string;
      seatId: SeatId;
      row: CatalogRow;
      abilityId: "avenger" | "summon";
    };
