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
  // cCp29 current-round leader suppression. Set to `state.round` when this
  // seat's leader is suppressed (active or passive) for the current round
  // by an opponent `cancel_leader`. Cleared to `null` at round transition.
  // The helper `isLeaderSuppressedThisRound` compares this field to the
  // current round so stale prior-round values are ignored defensively.
  leaderCancelledRound: number | null;
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

export type PendingPromptStage =
  | "discard_selection"
  | "deck_draw_selection"
  | "opponent_hand_reveal"
  | "leader_cancel_reaction"
  | "scoiatael_first_player_choice";

// cCp29 reaction-prompt context for `cancel_leader`. The reaction prompt
// is opened on top of an attempted opponent active leader (still legal).
// The cancel option resolves the cancellation; the decline option resolves
// the originally attempted leader exactly once. The context carries the
// attempted leader's identity and original target so the resolver can
// replay it when the prompt owner declines.
export interface LeaderCancelReactionContext {
  readonly mode: "reaction";
  readonly targetSeatId: SeatId;
  readonly targetLeaderCardId: CardInstanceId;
  readonly targetLeaderSourceId: string;
  readonly targetAbilityId: string;
  // Carries the originally attempted `UseLeader.target` so the decline
  // path can replay the leader exactly once. The shape is `unknown` to
  // avoid a type cycle with `LegalMoveTarget`; the resolver validates the
  // shape before replay.
  readonly target?: unknown;
}

export type PendingPromptTarget =
  | {
      kind: "card_instance";
      cardId: CardInstanceId;
      sourceId: string;
      /**
       * Optional board row hint. Required for Medic (`medic_revive`) prompts
       * because the resolver places the revived unit onto a specific row.
       * cCp22 `choose_card` / `restore_discard_to_hand` and cCp24
       * `choose_card` / `draw_opponent_discard` prompts return the chosen
       * card to the acting seat's hand, so they omit this field.
       */
      row?: CatalogRow;
    }
  | {
      // cCp27 stage 1 multi-card hand discard selection. Holds 1 or 2
      // acting-seat hand card IDs in hand order.
      kind: "card_instance_set";
      cardIds: readonly CardInstanceId[];
      sourceIds: readonly string[];
    }
  | {
      // cCp27 stage 2 deck draw selection. Visible only to the acting seat
      // through the prompt-move gate; export/observation surfaces redact.
      kind: "deck_card_instance";
      cardId: CardInstanceId;
      sourceId: string;
    }
  | {
      // cCp28 acknowledgement target. The acknowledgement carries no card
      // identity so it cannot be misused to peek at hidden state. Used for
      // the one-time `look_three_cards` opponent-hand reveal modal.
      kind: "none";
    };

export interface PendingPromptContext {
  // cCp27 stage 2 carries the cards discarded in stage 1 so the resolver
  // and observers can describe the multi-stage flow without re-deriving it.
  discardedCardIds?: readonly CardInstanceId[];
  minDiscardCount?: number;
  maxDiscardCount?: number;
  // cCp28 one-time opponent-hand reveal: the chosen opponent hand card IDs
  // visible to the acting seat for the duration of the acknowledgement
  // prompt. After acknowledgement the prompt (and this snapshot) is cleared
  // and cannot be reopened from product UI or hidden-info-safe surfaces.
  revealedCardIds?: readonly CardInstanceId[];
  // cCp29 reaction prompt context for `cancel_leader`. Present only on the
  // White Flame reaction prompt; carries the attempted leader's identity
  // and original target so the decline path can replay the leader.
  leaderCancel?: LeaderCancelReactionContext;
}

export interface PendingPrompt {
  promptId: string;
  seatId: SeatId;
  kind: "medic_revive" | "choose_row" | "choose_card" | "choose_card_set" | "choose_option";
  sourceCardId?: CardInstanceId;
  sourceId?: string;
  abilityId: string;
  // cCp27 multi-stage prompts and cCp28 one-time reveal prompts use this to
  // disambiguate prompt stages. Single-stage prompts omit it.
  stage?: PendingPromptStage;
  context?: PendingPromptContext;
  options: readonly PendingPromptOption[];
}

export interface PendingPromptOption {
  optionId: string;
  label: string;
  target: PendingPromptTarget;
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
        | "leader_optimize_agile"
        | "leader_restore_discard_to_hand"
        | "leader_shuffle_into_deck"
        | "leader_draw_opponent_discard_to_hand"
        | "leader_discard_for_draw"
        | "leader_draw_from_deck";
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
  | {
      type: "deck_shuffled";
      seatId: SeatId;
      reason: "muster" | "mulligan" | "leader_shuffle_into_deck" | "leader_discard_draw";
    }
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
        | "skellige_round_3_return"
        | "scoiatael_choose_first";
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
    }
  | {
      // cCp28 hidden-info disclosure event for `look_three_cards`.
      // The event log is internal/raw; hidden-info-safe summaries must not
      // render the revealed card names or IDs to the non-acting seat.
      type: "opponent_hand_revealed";
      seatId: SeatId; // seat that used the leader and may see the cards
      opponentSeatId: SeatId; // seat whose hand was sampled
      cardIds: readonly CardInstanceId[];
      sourceIds: readonly string[];
      reason: "look_three_cards";
    }
  | {
      // cCp29 leader cancel/suppression event for `cancel_leader`. Public
      // event covering both the proactive use (on the White Flame seat's
      // own normal turn) and the reaction-prompt cancel resolution. The
      // payload carries the suppressed seat, the suppression round, and
      // the cancelled leader identity so observers can render
      // "<actor> cancelled <target> leader for round N" without exposing
      // hidden info (leader identity is public).
      type: "leader_cancelled";
      mode: "proactive" | "reaction";
      round: number;
      seatId: SeatId; // White Flame acting seat
      targetSeatId: SeatId; // suppressed opponent seat
      targetLeaderCardId: CardInstanceId | null;
      targetLeaderSourceId: string;
      targetAbilityId: string;
    };
