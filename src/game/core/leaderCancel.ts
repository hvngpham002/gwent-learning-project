import type { CatalogLeaderSource } from "@/game/catalog";

import type { MatchState, SeatId } from "./types";

export const CANCEL_LEADER_SOURCE_ID =
  "nilfgaard.emhyr-var-emreis-the-white-flame";

const opponentOf = (seatId: SeatId): SeatId =>
  seatId === "seat_a" ? "seat_b" : "seat_a";

// Set of leader ability IDs that produce an active `use_leader` move from
// `getLeaderMove` when implemented and that can therefore be cancelled
// either proactively (locks them out for the current round) or as a
// reaction (consumes the attempted leader without resolving its effect).
// Setup-time `draw_extra_card` is intentionally excluded — it has no
// runtime engine policy left to suppress (see spec §Cancellable Opponent
// Leaders). Passive abilities are listed separately below.
const ACTIVE_CANCELLABLE_ABILITIES = new Set<CatalogLeaderSource["ability"]>([
  "clear_weather",
  "play_frost",
  "play_fog",
  "play_rain",
  "play_any_weather",
  "scorch_range",
  "scorch_siege",
  "optimize_agile_rows",
  "restore_discard_to_hand",
  "shuffle_discards_into_decks",
  "draw_opponent_discard",
  "discard_two_draw_one_from_deck",
  "look_three_cards",
]);

// Implemented passive leader abilities whose current-round effect can be
// suppressed by `cancel_leader`. `random_medic` is a passive ability with
// no runtime UI footprint, but its mutation of the Medic flow is
// suppressible per the spec.
const PASSIVE_CANCELLABLE_ABILITIES = new Set<CatalogLeaderSource["ability"]>([
  "weather_half_penalty",
  "double_close",
  "double_ranged",
  "double_siege",
  "double_spies",
  "random_medic",
]);

export interface IsLeaderSuppressedThisRoundInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
}

export const isLeaderSuppressedThisRound = ({
  state,
  seatId,
}: IsLeaderSuppressedThisRoundInput): boolean => {
  const seat = state.seats[seatId];
  if (!seat) {
    return false;
  }
  return seat.leaderCancelledRound === state.round;
};

export type LeaderCancelKind = "active" | "passive" | "setup_only" | "none";

export interface LeaderCancelStatus {
  readonly seatId: SeatId;
  readonly leaderSourceId: string;
  readonly abilityId: CatalogLeaderSource["ability"] | null;
  readonly kind: LeaderCancelKind;
  // True when the seat's leader has a current-round effect that can be
  // suppressed by `cancel_leader`. Mirrors the spec rule:
  //   - active leader: cancellable if not yet used and not already
  //     suppressed and the ability is implemented and active.
  //   - passive leader: cancellable if not already suppressed and the
  //     ability is implemented and passive (with current-round footprint).
  //   - setup-only `draw_extra_card`: not cancellable.
  //   - missing/unimplemented/placeholder: not cancellable.
  readonly suppressible: boolean;
  // Diagnostic reason when not suppressible. Useful for tests and report.
  readonly reason:
    | "ok"
    | "missing_leader"
    | "missing_catalog_leader"
    | "ability_not_cancellable"
    | "active_leader_already_used"
    | "already_suppressed_this_round";
}

export interface GetLeaderCancelStatusInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogLeaders: readonly CatalogLeaderSource[];
}

const inferKind = (
  abilityId: CatalogLeaderSource["ability"] | undefined,
): LeaderCancelKind => {
  if (!abilityId) {
    return "none";
  }
  if (ACTIVE_CANCELLABLE_ABILITIES.has(abilityId)) {
    return "active";
  }
  if (PASSIVE_CANCELLABLE_ABILITIES.has(abilityId)) {
    return "passive";
  }
  if (abilityId === "draw_extra_card") {
    return "setup_only";
  }
  return "none";
};

export const getLeaderCancelStatus = ({
  state,
  seatId,
  catalogLeaders,
}: GetLeaderCancelStatusInput): LeaderCancelStatus => {
  const seat = state.seats[seatId];
  if (!seat) {
    return {
      seatId,
      leaderSourceId: "",
      abilityId: null,
      kind: "none",
      suppressible: false,
      reason: "missing_leader",
    };
  }
  if (!seat.leader) {
    return {
      seatId,
      leaderSourceId: seat.leaderSourceId,
      abilityId: null,
      kind: "none",
      suppressible: false,
      reason: "missing_leader",
    };
  }
  const leader = catalogLeaders.find(
    (entry) => entry.sourceId === seat.leaderSourceId,
  );
  if (!leader) {
    return {
      seatId,
      leaderSourceId: seat.leaderSourceId,
      abilityId: null,
      kind: "none",
      suppressible: false,
      reason: "missing_catalog_leader",
    };
  }
  const kind = inferKind(leader.ability);
  if (isLeaderSuppressedThisRound({ state, seatId })) {
    return {
      seatId,
      leaderSourceId: seat.leaderSourceId,
      abilityId: leader.ability,
      kind,
      suppressible: false,
      reason: "already_suppressed_this_round",
    };
  }
  if (kind === "none" || kind === "setup_only") {
    return {
      seatId,
      leaderSourceId: seat.leaderSourceId,
      abilityId: leader.ability,
      kind,
      suppressible: false,
      reason: "ability_not_cancellable",
    };
  }
  if (kind === "active" && seat.leaderUsed) {
    return {
      seatId,
      leaderSourceId: seat.leaderSourceId,
      abilityId: leader.ability,
      kind,
      suppressible: false,
      reason: "active_leader_already_used",
    };
  }
  return {
    seatId,
    leaderSourceId: seat.leaderSourceId,
    abilityId: leader.ability,
    kind,
    suppressible: true,
    reason: "ok",
  };
};

export interface CanUseCancelLeaderProactivelyInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogLeaders: readonly CatalogLeaderSource[];
}

// A seat can use `cancel_leader` proactively on its own turn when:
// - phase is `playing`;
// - currentTurn is the seat;
// - no pending prompt;
// - the seat has not passed;
// - the seat owns the `cancel_leader` leader (not used, not suppressed);
// - the opposing seat has a cancellable current-round leader effect.
export const canUseCancelLeaderProactively = ({
  state,
  seatId,
  catalogLeaders,
}: CanUseCancelLeaderProactivelyInput): boolean => {
  if (state.phase !== "playing") {
    return false;
  }
  if (state.currentTurn !== seatId) {
    return false;
  }
  if (state.pendingPrompt) {
    return false;
  }
  const seat = state.seats[seatId];
  if (!seat || seat.passed) {
    return false;
  }
  if (!seat.leader || seat.leaderUsed) {
    return false;
  }
  const leader = catalogLeaders.find(
    (entry) => entry.sourceId === seat.leaderSourceId,
  );
  if (!leader || leader.ability !== "cancel_leader") {
    return false;
  }
  if (isLeaderSuppressedThisRound({ state, seatId })) {
    return false;
  }
  const opponentSeatId = opponentOf(seatId);
  const opponentStatus = getLeaderCancelStatus({
    state,
    seatId: opponentSeatId,
    catalogLeaders,
  });
  return opponentStatus.suppressible;
};

export interface CanOpenCancelLeaderReactionInput {
  readonly state: MatchState;
  readonly attemptedSeatId: SeatId;
  readonly attemptedAbilityId: CatalogLeaderSource["ability"];
  readonly catalogLeaders: readonly CatalogLeaderSource[];
}

// The reaction-prompt window opens when:
// - phase is `playing`;
// - no pending prompt;
// - the attempted ability is **not** itself `cancel_leader` (no recursive
//   cancel of cancel);
// - the opposing seat owns an unused, unsuppressed `cancel_leader` leader
//   and has not passed;
// - the acting seat's leader is not already suppressed this round.
export const canOpenCancelLeaderReaction = ({
  state,
  attemptedSeatId,
  attemptedAbilityId,
  catalogLeaders,
}: CanOpenCancelLeaderReactionInput): boolean => {
  if (state.phase !== "playing") {
    return false;
  }
  if (state.pendingPrompt) {
    return false;
  }
  if (attemptedAbilityId === "cancel_leader") {
    return false;
  }
  if (isLeaderSuppressedThisRound({ state, seatId: attemptedSeatId })) {
    return false;
  }
  const opposingSeatId = opponentOf(attemptedSeatId);
  const opposing = state.seats[opposingSeatId];
  if (!opposing || opposing.passed) {
    return false;
  }
  if (!opposing.leader || opposing.leaderUsed) {
    return false;
  }
  const opposingLeader = catalogLeaders.find(
    (entry) => entry.sourceId === opposing.leaderSourceId,
  );
  if (!opposingLeader || opposingLeader.ability !== "cancel_leader") {
    return false;
  }
  if (isLeaderSuppressedThisRound({ state, seatId: opposingSeatId })) {
    return false;
  }
  return true;
};
