import { legalHeuristicPolicyV0 } from "@/game/ai";
import type {
  CardInstanceId,
  EngineCommand,
  GameEvent,
  LegalMoveTarget,
  MatchState,
  PlayCardMove,
  RoundResult,
  SeatId,
} from "@/game/core";
import type { EngineAdapterError, EngineAdapterStatus, EngineCommandRecord, EngineActionLock } from "@/store/slices/engineSlice";

import type { PlayCardLookupEntry } from "./playMoveHelpers";
import { describePlayTarget } from "./playMoveHelpers";

export const ENGINE_AI_POLICY_ID = legalHeuristicPolicyV0.id;

export interface SeatLabels {
  seat_a: string;
  seat_b: string;
}

export interface MatchStatusBannerViewModel {
  phaseLabel: string;
  roundLabel: string;
  actorLabel: string;
  adapterLabel: string;
  nextAction: string;
  errorLabel: string | null;
}

export type HandCardDisabledReason =
  | "not_your_turn"
  | "prompt_pending"
  | "card_has_no_legal_move"
  | "already_passed"
  | "not_in_playing_phase"
  | "mulligan_already_complete";

export interface HandCardStateViewModel {
  disabled: boolean;
  reason: HandCardDisabledReason | null;
  reasonLabel: string | null;
}

export interface TargetActionViewModel {
  moveId: string;
  label: string;
  title: string;
}

export interface TargetActionGroupViewModel {
  key: PlayCardMove["target"]["kind"];
  label: string;
  actions: TargetActionViewModel[];
}

export interface CommandSummaryViewModel {
  key: string;
  label: string;
  isAiAction: boolean;
}

export interface EventSummaryViewModel {
  key: string;
  label: string;
}

export interface RoundHistoryViewModel {
  key: string;
  label: string;
  scoreLabel: string;
  gemLossLabel: string;
}

export interface RoundEndSummaryViewModel {
  label: string;
  resolveLabel: string;
}

const PHASE_LABELS: Record<MatchState["phase"], string> = {
  setup: "Setup",
  mulligan: "Mulligan",
  playing: "Playing",
  round_end: "Round End",
  game_end: "Game End",
};

const TARGET_GROUP_LABELS: Record<LegalMoveTarget["kind"], string> = {
  board_row: "Rows",
  row_horn: "Horn Slots",
  weather: "Weather",
  card_instance: "Cards",
  none: "Global",
};

const DISABLED_REASON_LABELS: Record<HandCardDisabledReason, string> = {
  not_your_turn: "Not your turn",
  prompt_pending: "Prompt pending",
  card_has_no_legal_move: "No legal move",
  already_passed: "Already passed",
  not_in_playing_phase: "Not in playing phase",
  mulligan_already_complete: "Mulligan complete",
};

const seatLabel = (seatId: SeatId | "draw" | null | undefined, seatLabels: SeatLabels) => {
  if (!seatId) return "Unknown";
  return seatId === "draw" ? "Draw" : seatLabels[seatId];
};

const formatKind = (value: string) =>
  value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const adapterLabel = (status: EngineAdapterStatus, lock: EngineActionLock | null, seatLabels: SeatLabels) => {
  if (!lock) {
    return formatKind(status);
  }

  const owner = lock.owner ? `: ${seatLabels[lock.owner]}` : "";
  return `${formatKind(status)} (${formatKind(lock.kind)}${owner})`;
};

export const buildMatchStatusBanner = ({
  match,
  status,
  lock,
  humanSeat,
  aiSeat,
  canHumanAct,
  lastError,
  winner,
  seatLabels,
}: {
  match: MatchState | null;
  status: EngineAdapterStatus;
  lock: EngineActionLock | null;
  humanSeat: SeatId;
  aiSeat: SeatId;
  canHumanAct: boolean;
  lastError: EngineAdapterError | null;
  winner: SeatId | "draw" | null;
  seatLabels: SeatLabels;
}): MatchStatusBannerViewModel => {
  if (!match) {
    return {
      phaseLabel: "Idle",
      roundLabel: "Round -",
      actorLabel: "Startup",
      adapterLabel: adapterLabel(status, lock, seatLabels),
      nextAction: "Starting engine match.",
      errorLabel: lastError ? `${lastError.code}: ${lastError.message}` : null,
    };
  }

  const prompt = match.pendingPrompt;
  let actor = match.currentTurn ? seatLabels[match.currentTurn] : "None";
  let nextAction = "Review the engine state.";

  if (lastError) {
    nextAction = "Adapter error: inspect the last rejected command.";
  } else if (prompt?.seatId === humanSeat) {
    actor = `${seatLabels[humanSeat]} prompt`;
    nextAction = `Prompt: choose one legal ${formatKind(prompt.abilityId)} option.`;
  } else if (prompt?.seatId === aiSeat) {
    actor = `${seatLabels[aiSeat]} prompt`;
    nextAction = "AI resolving prompt from legal moves.";
  } else if (match.phase === "mulligan" && !match.seats[humanSeat].mulliganComplete) {
    actor = seatLabels[humanSeat];
    nextAction = "Mulligan: select up to 2 cards, then confirm.";
  } else if (match.phase === "mulligan" && !match.seats[aiSeat].mulliganComplete) {
    actor = seatLabels[aiSeat];
    nextAction = "Waiting for AI mulligan.";
  } else if (match.phase === "playing" && match.currentTurn === humanSeat && canHumanAct) {
    nextAction = "Your turn: choose a playable card, use leader, or pass.";
  } else if (match.phase === "playing" && match.currentTurn === aiSeat) {
    nextAction = `${seatLabels[aiSeat]} turn: ${ENGINE_AI_POLICY_ID} will act from legal moves.`;
  } else if (match.phase === "round_end") {
    actor = "Both players passed";
    nextAction = "Round end: both players passed. Resolve the round.";
  } else if (match.phase === "game_end") {
    actor = "Finished";
    nextAction = `Game end: ${winner === "draw" ? "draw" : `${seatLabel(winner, seatLabels)} wins`}.`;
  }

  return {
    phaseLabel: PHASE_LABELS[match.phase],
    roundLabel: `Round ${match.round}`,
    actorLabel: actor,
    adapterLabel: adapterLabel(status, lock, seatLabels),
    nextAction,
    errorLabel: lastError ? `${lastError.code}: ${lastError.message}` : null,
  };
};

export const getHandCardState = ({
  phase,
  isMulliganComplete,
  canHumanAct,
  promptOpen,
  playableCardIds,
  cardId,
  humanPassed,
}: {
  phase: MatchState["phase"] | null | undefined;
  isMulliganComplete: boolean;
  canHumanAct: boolean;
  promptOpen: boolean;
  playableCardIds: ReadonlySet<CardInstanceId>;
  cardId: CardInstanceId;
  humanPassed: boolean;
}): HandCardStateViewModel => {
  let reason: HandCardDisabledReason | null = null;

  if (phase === "mulligan") {
    reason = isMulliganComplete ? "mulligan_already_complete" : null;
  } else if (phase !== "playing") {
    reason = "not_in_playing_phase";
  } else if (promptOpen) {
    reason = "prompt_pending";
  } else if (humanPassed) {
    reason = "already_passed";
  } else if (!canHumanAct) {
    reason = "not_your_turn";
  } else if (!playableCardIds.has(cardId)) {
    reason = "card_has_no_legal_move";
  }

  return {
    disabled: Boolean(reason),
    reason,
    reasonLabel: reason ? DISABLED_REASON_LABELS[reason] : null,
  };
};

export const groupTargetActions = (
  moves: readonly PlayCardMove[],
  cardLookup: ReadonlyMap<CardInstanceId, PlayCardLookupEntry> = new Map(),
): TargetActionGroupViewModel[] => {
  const groups = new Map<PlayCardMove["target"]["kind"], TargetActionViewModel[]>();

  moves.forEach((move) => {
    const action = {
      moveId: move.moveId,
      label: describePlayTarget(move, cardLookup),
      title: move.label,
    };
    groups.set(move.target.kind, [...(groups.get(move.target.kind) ?? []), action]);
  });
  return [...groups.entries()].map(([key, actions]) => ({
    key,
    label: TARGET_GROUP_LABELS[key],
    actions,
  }));
};

const commandSeat = (command: Exclude<EngineCommand, { type: "StartMatch" }>): SeatId | undefined =>
  "seatId" in command ? command.seatId : undefined;

export const summarizeCommandHistory = ({
  records,
  aiSeat,
  seatLabels,
  publicCardLookup = new Map(),
}: {
  records: readonly EngineCommandRecord[];
  aiSeat: SeatId;
  seatLabels: SeatLabels;
  publicCardLookup?: ReadonlyMap<CardInstanceId, PlayCardLookupEntry>;
}): CommandSummaryViewModel[] =>
  records.map((record) => {
    const command = record.command;
    const commandOwner = commandSeat(command);
    const ownerLabel = commandOwner ? seatLabels[commandOwner] : "Engine";
    const isAiAction = commandOwner === aiSeat;
    let actionLabel = formatKind(command.type);

    if (command.type === "ChooseMulligan") {
      actionLabel = `completed mulligan (${command.cardIds.length} card${command.cardIds.length === 1 ? "" : "s"})`;
    } else if (command.type === "PlayCard") {
      const publicCard = publicCardLookup.get(command.cardId);
      actionLabel = publicCard ? `played ${publicCard.name}` : isAiAction ? "played a card" : "played selected card";
    } else if (command.type === "Pass") {
      actionLabel = "passed";
    } else if (command.type === "ResolveRoundEnd") {
      actionLabel = "resolved round";
    } else if (command.type === "ChoosePromptOption") {
      actionLabel = "resolved prompt option";
    } else if (command.type === "UseLeader") {
      actionLabel = "used leader";
    }

    return {
      key: String(record.sequence),
      label: `#${record.sequence} ${ownerLabel} ${actionLabel} (${record.status})`,
      isAiAction,
    };
  });

export const summarizeEvents = ({
  events,
  seatLabels,
  publicCardLookup = new Map(),
}: {
  events: readonly GameEvent[];
  seatLabels: SeatLabels;
  publicCardLookup?: ReadonlyMap<CardInstanceId, PlayCardLookupEntry>;
}): EventSummaryViewModel[] =>
  events.map((event, index) => {
    let label = formatKind(event.type);

    if (event.type === "card_played") {
      const cardName = publicCardLookup.get(event.cardId)?.name ?? "card";
      label = `${seatLabels[event.seatId]} played ${cardName}`;
    } else if (event.type === "leader_used") {
      label = `${seatLabels[event.seatId]} used leader`;
    } else if (event.type === "weather_cleared") {
      label = `${seatLabels[event.seatId]} cleared weather`;
    } else if (event.type === "player_passed") {
      label = `${seatLabels[event.seatId]} passed`;
    } else if (event.type === "prompt_opened") {
      label = `${seatLabels[event.prompt.seatId]} prompt opened (${formatKind(event.prompt.abilityId)})`;
    } else if (event.type === "prompt_resolved") {
      label = `${seatLabels[event.seatId]} prompt resolved`;
    } else if (event.type === "round_resolved") {
      label = `Round ${event.round} resolved: ${seatLabel(event.winner, seatLabels)}`;
    } else if (event.type === "game_ended") {
      label = `Game ended: ${seatLabel(event.winner, seatLabels)}`;
    }

    return {
      key: `${event.type}-${index}`,
      label,
    };
  });

export const summarizeRoundEnd = ({
  scoreBySeat,
  seatLabels,
}: {
  scoreBySeat: Record<SeatId, number>;
  seatLabels: SeatLabels;
}): RoundEndSummaryViewModel => {
  const scoreLabel = `${seatLabels.seat_a} ${scoreBySeat.seat_a} - ${scoreBySeat.seat_b} ${seatLabels.seat_b}`;
  const leader =
    scoreBySeat.seat_a === scoreBySeat.seat_b
      ? "Round is tied"
      : `${scoreBySeat.seat_a > scoreBySeat.seat_b ? seatLabels.seat_a : seatLabels.seat_b} is winning`;

  return {
    label: `${leader}. ${scoreLabel}.`,
    resolveLabel: `Resolve Round (${scoreLabel})`,
  };
};

export const summarizeRoundHistory = (
  rounds: readonly RoundResult[],
  seatLabels: SeatLabels,
): RoundHistoryViewModel[] =>
  rounds.map((round) => {
    const gemLoss = (["seat_a", "seat_b"] as const)
      .flatMap((seatId) => {
        const loss = round.loserGemLoss[seatId] ?? 0;
        return loss > 0 ? [`${seatLabels[seatId]} -${loss}`] : [];
      })
      .join(", ");

    return {
      key: `round-${round.round}`,
      label: `Round ${round.round}: ${seatLabel(round.winner, seatLabels)}`,
      scoreLabel: `${round.scoreBySeat.seat_a} - ${round.scoreBySeat.seat_b}`,
      gemLossLabel: gemLoss || "No gem loss",
    };
  });
