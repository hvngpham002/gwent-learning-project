import type {
  CardInstanceId,
  ChoosePromptOptionMove,
  ChooseMulliganMove,
  LegalMove,
  MatchScoreBreakdown,
  MatchPhase,
  PendingPrompt,
  PlayCardMove,
  RoundResult,
  SeatId,
  UseLeaderMove,
} from "@/game/core";
import type { CatalogLeaderAbilityId, CatalogRow } from "@/game/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";
import type { EngineBoardRowViewModel, EngineCardViewModel } from "@/store/selectors/engineSelectors";

import type { AuthenticCardViewModel } from "./cardViewModel";
import {
  getAbilityDisplay,
  getCardKindDisplay,
  getFactionDisplay,
  getLeaderAbilityDisplay,
  getRowDisplay,
  type AbilityDisplay,
  type LeaderAbilityDisplay,
} from "./displayMetadata";

export type MatchSeatRole = "human" | "ai";

export interface AuthenticRuntimeCardViewModel {
  readonly key: CardInstanceId;
  readonly card: AuthenticCardViewModel;
}

export type AuthenticStrengthState = "normal" | "boosted" | "reduced";

export interface AuthenticBoardCardState {
  readonly effectiveStrength: number;
  readonly printedStrength: number;
  readonly strengthState: AuthenticStrengthState;
  readonly modifiers: readonly string[];
  readonly usedScoreFallback: boolean;
}

export interface AuthenticBoardRuntimeCardViewModel extends AuthenticRuntimeCardViewModel {
  readonly boardState: AuthenticBoardCardState;
}

export interface AuthenticSeatSummaryViewModel {
  readonly seatId: SeatId;
  readonly role: MatchSeatRole;
  readonly label: string;
  readonly faction: string;
  readonly factionName: string;
  readonly gems: number;
  readonly passed: boolean;
  readonly handCount: number;
  readonly deckCount: number;
  readonly discardCount: number;
  readonly score: number;
  readonly handCards: readonly AuthenticRuntimeCardViewModel[];
}

export interface AuthenticBoardRowViewModel {
  readonly key: string;
  readonly seatId: SeatId;
  readonly side: "opponent" | "player";
  readonly row: CatalogRow;
  readonly rowName: string;
  readonly rowGlyph: string;
  readonly score: number;
  readonly units: readonly AuthenticBoardRuntimeCardViewModel[];
  readonly horn: AuthenticRuntimeCardViewModel | null;
}

export interface RowTargetViewModel {
  readonly key: string;
  readonly moveId: string;
  readonly seatId: SeatId;
  readonly row: CatalogRow;
}

export interface CardTargetViewModel {
  readonly key: CardInstanceId;
  readonly moveId: string;
}

export interface DiscardGroupViewModel {
  readonly key: string;
  readonly label: string;
  readonly cards: readonly AuthenticRuntimeCardViewModel[];
}

export interface MedicPromptOptionViewModel {
  readonly moveId: string;
  readonly label: string;
  readonly card: AuthenticRuntimeCardViewModel | null;
  readonly meta: string;
}

export interface RoundOverlayViewModel {
  readonly key: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly scoreLabel: string;
  readonly gemLossLabel: string;
  readonly nextStarterLabel: string | null;
  readonly gameEndLabel: string | null;
}

export interface GameEndNavigationActionViewModel {
  readonly key: "setup" | "close" | "rematch";
  readonly label: string;
  readonly kind: "ghost" | "primary";
}

export type LeaderCategoryLabel = "active" | "passive" | "setup" | "unknown/custom";
export type LeaderStateLabel =
  | "ready"
  | "used"
  | "passive active"
  | "setup resolved"
  | "cancelled this round"
  | "unavailable"
  | "no target";

export interface LeaderStatusInput {
  readonly sourceId: string;
  readonly name: string;
  readonly ability: string | null | undefined;
  readonly abilityName?: string | null;
  readonly abilityStatus?: "implemented" | "planned" | "placeholder" | string | null;
  readonly used: boolean;
  readonly cancelledThisRound: boolean;
}

export interface LeaderStatusViewModel {
  readonly sourceId: string;
  readonly leaderName: string;
  readonly ability: LeaderAbilityDisplay;
  readonly abilityName: string;
  readonly abilityStatus: string;
  readonly category: LeaderCategoryLabel;
  readonly categoryLabel: LeaderCategoryLabel;
  readonly stateLabel: LeaderStateLabel;
  readonly reason: string;
  readonly actionEnabled: boolean;
  readonly showSuppressionBadge: boolean;
}

export interface PromptPresentationOptionViewModel {
  readonly moveId: string;
  readonly label: string;
}

export interface PromptPresentationLeaderLookupEntry {
  readonly sourceId: string;
  readonly name: string;
  readonly ability: string | null | undefined;
  readonly abilityName?: string | null;
}

export interface PromptPresentationViewModel {
  readonly title: string;
  readonly body: string | null;
  readonly sourceLabel: string | null;
  readonly options: readonly PromptPresentationOptionViewModel[];
  readonly kind:
    | "cancel_leader"
    | "restore_discard_to_hand"
    | "draw_opponent_discard"
    | "discard_two_draw_one_from_deck"
    | "look_three_cards"
    | "medic_revive"
    | "generic";
}

const HUMAN_LABEL = "You";
const AI_LABEL = "AI";

const BOARD_ROW_ORDER: readonly CatalogRow[] = ["siege", "ranged", "close", "close", "ranged", "siege"];
const DISCARD_GROUP_ORDER = ["hero", "close", "ranged", "siege", "special", "other"] as const;
export const MULLIGAN_MAX_SELECTION = 1;

const OFFICIAL_ACTIVE_LEADER_IDS = new Set(officialLeaderPromotionManifest.executableLeaderSourceIds);
const OFFICIAL_PASSIVE_LEADER_IDS = new Set(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds);
const OFFICIAL_SETUP_LEADER_IDS = new Set(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds);

const titleCaseFromIdentifier = (id: string) =>
  id
    .split("_")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

export const classifyLeaderCategory = (sourceId: string): LeaderCategoryLabel => {
  if (OFFICIAL_ACTIVE_LEADER_IDS.has(sourceId)) {
    return "active";
  }
  if (OFFICIAL_PASSIVE_LEADER_IDS.has(sourceId)) {
    return "passive";
  }
  if (OFFICIAL_SETUP_LEADER_IDS.has(sourceId)) {
    return "setup";
  }
  return "unknown/custom";
};

const leaderUnavailableReason = ({
  phase,
  canAct,
  promptOpen,
  passed,
}: {
  readonly phase: MatchPhase | null | undefined;
  readonly canAct: boolean;
  readonly promptOpen: boolean;
  readonly passed: boolean;
}) => {
  if (phase !== "playing") {
    return "available during play";
  }
  if (promptOpen) {
    return "prompt pending";
  }
  if (passed) {
    return "passed this round";
  }
  if (!canAct) {
    return "waiting for turn";
  }
  return "unavailable";
};

export const buildLeaderStatusViewModel = ({
  leader,
  legalLeaderMoveCount,
  phase,
  canAct,
  promptOpen,
  passed,
}: {
  readonly leader: LeaderStatusInput;
  readonly legalLeaderMoveCount: number;
  readonly phase: MatchPhase | null | undefined;
  readonly canAct: boolean;
  readonly promptOpen: boolean;
  readonly passed: boolean;
}): LeaderStatusViewModel => {
  const ability = getLeaderAbilityDisplay(leader.ability);
  const category = classifyLeaderCategory(leader.sourceId);
  const canTryLeader =
    leader.abilityStatus === "implemented" &&
    !leader.used &&
    !leader.cancelledThisRound &&
    phase === "playing" &&
    canAct &&
    !promptOpen &&
    !passed;
  const leaderName = leader.name === leader.sourceId ? "Unknown leader" : leader.name;

  if (leader.cancelledThisRound) {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "cancelled this round",
      reason: "suppressed until the next round",
      actionEnabled: false,
      showSuppressionBadge: true,
    };
  }

  if (category === "passive") {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "passive active",
      reason: "passive leader effect is active",
      actionEnabled: false,
      showSuppressionBadge: false,
    };
  }

  if (category === "setup") {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "setup resolved",
      reason: "resolved during match setup",
      actionEnabled: false,
      showSuppressionBadge: false,
    };
  }

  if (leader.used) {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "used",
      reason: "leader already used",
      actionEnabled: false,
      showSuppressionBadge: false,
    };
  }

  if (leader.abilityStatus !== "implemented") {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "unavailable",
      reason: `${leader.abilityStatus ?? ability.status} leader ability`,
      actionEnabled: false,
      showSuppressionBadge: false,
    };
  }

  if (legalLeaderMoveCount > 0) {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "ready",
      reason: "legal leader move available",
      actionEnabled: canTryLeader,
      showSuppressionBadge: false,
    };
  }

  if (canTryLeader) {
    return {
      sourceId: leader.sourceId,
      leaderName,
      ability,
      abilityName: leader.abilityName ?? ability.name,
      abilityStatus: leader.abilityStatus ?? ability.status,
      category,
      categoryLabel: category,
      stateLabel: "no target",
      reason: "no legal target",
      actionEnabled: false,
      showSuppressionBadge: false,
    };
  }

  return {
    sourceId: leader.sourceId,
    leaderName,
    ability,
    abilityName: leader.abilityName ?? ability.name,
    abilityStatus: leader.abilityStatus ?? ability.status,
    category,
    categoryLabel: category,
    stateLabel: "unavailable",
    reason: leaderUnavailableReason({ phase, canAct, promptOpen, passed }),
    actionEnabled: false,
    showSuppressionBadge: false,
  };
};

export const sameCardSelection = (left: readonly CardInstanceId[], right: readonly CardInstanceId[]) => {
  if (left.length !== right.length) {
    return false;
  }
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((cardId, index) => cardId === rightSorted[index]);
};

export const findLegalMulliganMove = (
  moves: readonly LegalMove[],
  selectedCardIds: readonly CardInstanceId[],
): ChooseMulliganMove | null =>
  moves.find((move): move is ChooseMulliganMove => move.kind === "choose_mulligan" && sameCardSelection(move.cardIds, selectedCardIds)) ?? null;

export const chooseDebugAiMulliganMove = ({
  moves,
  mulligansUsed,
  desiredRedrawCount,
}: {
  readonly moves: readonly LegalMove[];
  readonly mulligansUsed: number;
  readonly desiredRedrawCount: number;
}): ChooseMulliganMove | null => {
  const mulliganMoves = moves.filter((move): move is ChooseMulliganMove => move.kind === "choose_mulligan");
  const shouldRedraw = mulligansUsed < desiredRedrawCount;

  if (shouldRedraw) {
    return mulliganMoves.find((move) => move.cardIds.length === 1) ?? null;
  }

  return mulliganMoves.find((move) => move.cardIds.length === 0) ?? mulliganMoves[0] ?? null;
};

export const toggleMulliganSelection = ({
  selectedCardIds,
  cardId,
  maxCards = MULLIGAN_MAX_SELECTION,
}: {
  readonly selectedCardIds: readonly CardInstanceId[];
  readonly cardId: CardInstanceId;
  readonly maxCards?: number;
}): CardInstanceId[] => {
  if (selectedCardIds.includes(cardId)) {
    return selectedCardIds.filter((selectedId) => selectedId !== cardId);
  }

  if (selectedCardIds.length >= maxCards) {
    return [...selectedCardIds];
  }

  return [...selectedCardIds, cardId];
};

export const engineCardToAuthenticCard = (card: EngineCardViewModel): AuthenticCardViewModel => ({
  sourceId: card.sourceId,
  name: card.name,
  faction: card.faction,
  kind: card.kind,
  strength: card.printedStrength,
  rows: card.rows,
  abilities: card.abilities,
  tags: card.kind === "special" && card.abilities.some((ability) => ["frost", "fog", "rain", "clear_weather"].includes(ability))
    ? ["weather"]
    : [],
  image: card.image,
});

export const toRuntimeCard = (card: EngineCardViewModel): AuthenticRuntimeCardViewModel => ({
  key: card.instanceId,
  card: engineCardToAuthenticCard(card),
});

export const getBoardCardState = (
  card: EngineCardViewModel,
  scoreByCardId: ReadonlyMap<CardInstanceId, MatchScoreBreakdown["cards"][number]>,
): AuthenticBoardCardState => {
  const score = scoreByCardId.get(card.instanceId);
  const effectiveStrength = score?.finalStrength ?? card.printedStrength;
  const strengthState =
    effectiveStrength > card.printedStrength ? "boosted" : effectiveStrength < card.printedStrength ? "reduced" : "normal";

  return {
    effectiveStrength,
    printedStrength: card.printedStrength,
    strengthState,
    modifiers: score?.modifiers ?? [],
    usedScoreFallback: !score,
  };
};

export const toBoardRuntimeCard = (
  card: EngineCardViewModel,
  scoreByCardId: ReadonlyMap<CardInstanceId, MatchScoreBreakdown["cards"][number]>,
): AuthenticBoardRuntimeCardViewModel => {
  const boardState = getBoardCardState(card, scoreByCardId);
  return {
    key: card.instanceId,
    card: {
      ...engineCardToAuthenticCard(card),
      strength: boardState.effectiveStrength,
    },
    boardState,
  };
};

export const buildAuthenticSeatSummary = ({
  seatId,
  role,
  faction,
  gems,
  passed,
  handCards,
  hiddenHandCount,
  deckCount,
  discardCount,
  score,
}: {
  seatId: SeatId;
  role: MatchSeatRole;
  faction: string;
  gems: number;
  passed: boolean;
  handCards: readonly EngineCardViewModel[];
  hiddenHandCount?: number;
  deckCount: number;
  discardCount: number;
  score: number;
}): AuthenticSeatSummaryViewModel => {
  const factionDisplay = getFactionDisplay(faction);
  const visibleHandCards = role === "human" ? handCards.map(toRuntimeCard) : [];
  return {
    seatId,
    role,
    label: role === "human" ? HUMAN_LABEL : AI_LABEL,
    faction,
    factionName: factionDisplay.name,
    gems,
    passed,
    handCount: role === "human" ? handCards.length : hiddenHandCount ?? 0,
    deckCount,
    discardCount,
    score,
    handCards: visibleHandCards,
  };
};

export const orderBoardRowsForAuthenticTable = ({
  rows,
  humanSeat,
  rowScores,
  scoreBreakdown,
}: {
  rows: readonly EngineBoardRowViewModel[];
  humanSeat: SeatId;
  rowScores: Record<SeatId, Record<CatalogRow, number>>;
  scoreBreakdown?: MatchScoreBreakdown | null;
}): AuthenticBoardRowViewModel[] => {
  const opponentSeat: SeatId = humanSeat === "seat_a" ? "seat_b" : "seat_a";
  const orderedSeats: readonly SeatId[] = [opponentSeat, opponentSeat, opponentSeat, humanSeat, humanSeat, humanSeat];
  const scoreByCardId = new Map((scoreBreakdown?.cards ?? []).map((entry) => [entry.cardId, entry]));

  return orderedSeats.map((seatId, index) => {
    const row = BOARD_ROW_ORDER[index];
    const source = rows.find((candidate) => candidate.seatId === seatId && candidate.row === row);
    const display = getRowDisplay(row);
    return {
      key: `${seatId}:${row}`,
      seatId,
      side: seatId === humanSeat ? "player" : "opponent",
      row,
      rowName: display.name,
      rowGlyph: display.glyph,
      score: rowScores[seatId]?.[row] ?? 0,
      units: source?.units.map((card) => toBoardRuntimeCard(card, scoreByCardId)) ?? [],
      horn: source?.horn ? toRuntimeCard(source.horn) : null,
    };
  });
};

export const buildVisibleCardLookup = (
  cards: readonly EngineCardViewModel[],
): ReadonlyMap<CardInstanceId, { name: string }> => new Map(cards.map((card) => [card.instanceId, { name: card.name }]));

export const getBoardRowTargetsByKey = (moves: readonly PlayCardMove[]): ReadonlyMap<string, RowTargetViewModel> =>
  new Map(
    moves.flatMap((move) => {
      if (move.target.kind !== "board_row") {
        return [];
      }
      const key = `${move.target.seatId}:${move.target.row}`;
      return [
        [
          key,
          {
            key,
            moveId: move.moveId,
            seatId: move.target.seatId,
            row: move.target.row,
          },
        ],
      ] as const;
    }),
  );

export const getBoardCardTargetsById = (moves: readonly PlayCardMove[]): ReadonlyMap<CardInstanceId, CardTargetViewModel> =>
  new Map(
    moves.flatMap((move) => {
      if (move.target.kind !== "card_instance") {
        return [];
      }
      return [[move.target.cardId, { key: move.target.cardId, moveId: move.moveId }]] as const;
    }),
  );

const discardGroupKey = (card: EngineCardViewModel): (typeof DISCARD_GROUP_ORDER)[number] => {
  if (card.kind === "hero") {
    return "hero";
  }
  if (card.kind === "special") {
    return "special";
  }
  const firstRow = card.rows[0];
  if (firstRow === "close" || firstRow === "ranged" || firstRow === "siege") {
    return firstRow;
  }
  return "other";
};

const DISCARD_GROUP_LABELS: Record<(typeof DISCARD_GROUP_ORDER)[number], string> = {
  hero: "Heroes",
  close: "Close Combat",
  ranged: "Ranged",
  siege: "Siege",
  special: "Specials",
  other: "Other",
};

export const groupDiscardCards = (cards: readonly EngineCardViewModel[]): DiscardGroupViewModel[] => {
  const grouped = new Map<(typeof DISCARD_GROUP_ORDER)[number], AuthenticRuntimeCardViewModel[]>();
  cards.forEach((card) => {
    const key = discardGroupKey(card);
    grouped.set(key, [...(grouped.get(key) ?? []), toRuntimeCard(card)]);
  });

  return DISCARD_GROUP_ORDER.flatMap((key) => {
    const groupCards = grouped.get(key) ?? [];
    return groupCards.length > 0 ? [{ key, label: DISCARD_GROUP_LABELS[key], cards: groupCards }] : [];
  });
};

export interface LookThreeCardsRevealCardViewModel {
  readonly key: string;
  readonly card: AuthenticRuntimeCardViewModel | null;
  readonly placeholderLabel: string | null;
}

export interface LookThreeCardsRevealViewModel {
  readonly promptId: string;
  readonly leaderName: string | null;
  readonly opponentLabel: string;
  readonly cards: readonly LookThreeCardsRevealCardViewModel[];
  readonly acknowledgeMoveId: string;
  readonly acknowledgeLabel: string;
}

export const buildLookThreeCardsRevealViewModel = ({
  prompt,
  promptMoves,
  cardLookup,
  leaderName,
  opponentLabel,
}: {
  readonly prompt: {
    readonly promptId: string;
    readonly seatId: SeatId;
    readonly kind: string;
    readonly abilityId: string;
    readonly stage?: string;
    readonly context?: { readonly revealedCardIds?: readonly CardInstanceId[] };
  } | null;
  readonly promptMoves: readonly {
    readonly moveId: string;
    readonly optionId: string;
    readonly label: string;
  }[];
  readonly cardLookup: ReadonlyMap<CardInstanceId, EngineCardViewModel>;
  readonly leaderName?: string | null;
  readonly opponentLabel: string;
}): LookThreeCardsRevealViewModel | null => {
  if (
    !prompt ||
    prompt.kind !== "choose_option" ||
    prompt.abilityId !== "look_three_cards" ||
    prompt.stage !== "opponent_hand_reveal"
  ) {
    return null;
  }

  const ackMove = promptMoves.find(
    (move) => move.optionId === "look-three-cards:acknowledge",
  );
  if (!ackMove) {
    return null;
  }

  const revealedCardIds = prompt.context?.revealedCardIds ?? [];
  const cards = revealedCardIds.map((cardId, index): LookThreeCardsRevealCardViewModel => {
    const engineCard = cardLookup.get(cardId);
    if (engineCard) {
      return {
        key: `${cardId}:${index}`,
        card: toRuntimeCard(engineCard),
        placeholderLabel: null,
      };
    }
    return {
      key: `revealed-placeholder:${index}`,
      card: null,
      placeholderLabel: "Revealed card",
    };
  });

  return {
    promptId: prompt.promptId,
    leaderName: leaderName ?? null,
    opponentLabel,
    cards,
    acknowledgeMoveId: ackMove.moveId,
    acknowledgeLabel: ackMove.label,
  };
};

export const buildMedicPromptOptions = ({
  promptMoves,
  cardLookup,
}: {
  promptMoves: readonly { moveId: string; label: string; target: { kind: string; cardId?: CardInstanceId; row?: CatalogRow } }[];
  cardLookup: ReadonlyMap<CardInstanceId, EngineCardViewModel>;
}): MedicPromptOptionViewModel[] =>
  promptMoves.map((move) => {
    const targetCard = move.target.cardId ? cardLookup.get(move.target.cardId) ?? null : null;
    const ability = targetCard?.abilities[0];
    const rowLabel = move.target.row ? getRowDisplay(move.target.row).name : targetCard?.rows.map((row) => getRowDisplay(row).name).join(" / ");
    const meta = targetCard
      ? [
          `strength ${targetCard.printedStrength}`,
          rowLabel,
          getFactionDisplay(targetCard.faction).name,
          ability ? ability.replace(/_/g, " ") : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Card details unavailable";

    return {
      moveId: move.moveId,
      label: move.label,
      card: targetCard ? toRuntimeCard(targetCard) : null,
      meta,
    };
  });

const redactRuntimeCardIds = (label: string): string =>
  label.replace(/seat_[ab]:\d{3}:[A-Za-z0-9_.:-]+/g, "card");

const labelForPromptOption = (move: ChoosePromptOptionMove): string => {
  if (move.metadata.abilityId === "cancel_leader") {
    if (move.optionId === "cancel-leader:cancel") {
      return "cancel";
    }
    if (move.optionId === "cancel-leader:decline") {
      return "let it resolve";
    }
  }
  if (move.metadata.abilityId === "look_three_cards" && move.optionId === "look-three-cards:acknowledge") {
    return "continue";
  }
  return redactRuntimeCardIds(move.label);
};

const sourceLabelForPrompt = ({
  prompt,
  cardLookup,
  leaderLookupBySourceId,
}: {
  readonly prompt: PendingPrompt;
  readonly cardLookup: ReadonlyMap<CardInstanceId, { name: string }>;
  readonly leaderLookupBySourceId: ReadonlyMap<string, PromptPresentationLeaderLookupEntry>;
}): string | null => {
  const cardName = prompt.sourceCardId ? cardLookup.get(prompt.sourceCardId)?.name : undefined;
  if (cardName) {
    return `source: ${cardName}`;
  }

  const leaderName = prompt.sourceId ? leaderLookupBySourceId.get(prompt.sourceId)?.name : undefined;
  return leaderName ? `source: ${leaderName}` : null;
};

const promptAbilityName = (abilityId: string): string => {
  const cardAbility = getAbilityDisplay(abilityId);
  if (cardAbility.id === abilityId && cardAbility.name !== "No ability") {
    return cardAbility.name;
  }
  const leaderAbility = getLeaderAbilityDisplay(abilityId);
  if (leaderAbility.id === abilityId) {
    return leaderAbility.name;
  }
  return titleCaseFromIdentifier(abilityId);
};

export const buildPromptPresentationViewModel = ({
  prompt,
  promptMoves,
  cardLookup,
  leaderLookupBySourceId = new Map(),
  seatLabels,
  isPromptOwner,
}: {
  readonly prompt: PendingPrompt;
  readonly promptMoves: readonly ChoosePromptOptionMove[];
  readonly cardLookup?: ReadonlyMap<CardInstanceId, { name: string }>;
  readonly leaderLookupBySourceId?: ReadonlyMap<string, PromptPresentationLeaderLookupEntry>;
  readonly seatLabels: Record<SeatId, string>;
  readonly isPromptOwner: boolean;
}): PromptPresentationViewModel => {
  const safeCardLookup = cardLookup ?? new Map();
  const sourceLabel = sourceLabelForPrompt({
    prompt,
    cardLookup: safeCardLookup,
    leaderLookupBySourceId,
  });
  const options = isPromptOwner
    ? promptMoves.map((move) => ({
        moveId: move.moveId,
        label: labelForPromptOption(move),
      }))
    : [];

  const ownerOnlyHiddenPrompt =
    (prompt.abilityId === "discard_two_draw_one_from_deck" && prompt.stage === "deck_draw_selection") ||
    prompt.abilityId === "look_three_cards";
  if (!isPromptOwner && ownerOnlyHiddenPrompt) {
    return {
      title: "Prompt pending",
      body: null,
      sourceLabel: null,
      options,
      kind: "generic",
    };
  }

  if (prompt.abilityId === "cancel_leader") {
    const context = prompt.context?.leaderCancel;
    const attemptedLeader = context ? leaderLookupBySourceId.get(context.targetLeaderSourceId) : null;
    const attemptedLeaderName = attemptedLeader?.name ?? null;
    const attemptedAbilityName =
      attemptedLeader?.abilityName ??
      (context ? getLeaderAbilityDisplay(context.targetAbilityId).name : null);
    const attemptedSeatLabel = context ? seatLabels[context.targetSeatId] : null;
    const attemptedText = [attemptedSeatLabel, attemptedLeaderName, attemptedAbilityName]
      .filter(Boolean)
      .join(" · ");

    return {
      title: "Cancel leader ability?",
      body: attemptedText ? `react to ${attemptedText}` : "choose whether to cancel the attempted leader ability.",
      sourceLabel,
      options,
      kind: "cancel_leader",
    };
  }

  if (prompt.abilityId === "restore_discard_to_hand") {
    return {
      title: "Restore from your discard",
      body: "choose a card from your discard pile to return to your hand.",
      sourceLabel,
      options,
      kind: "restore_discard_to_hand",
    };
  }

  if (prompt.abilityId === "draw_opponent_discard") {
    return {
      title: "Draw from opponent discard",
      body: "choose a card from the opponent discard pile to add to your hand.",
      sourceLabel,
      options,
      kind: "draw_opponent_discard",
    };
  }

  if (prompt.abilityId === "discard_two_draw_one_from_deck") {
    if (prompt.stage === "deck_draw_selection") {
      return {
        title: "Draw from your deck",
        body: "choose one card from your deck, then shuffle.",
        sourceLabel,
        options,
        kind: "discard_two_draw_one_from_deck",
      };
    }
    return {
      title: "Discard for leader",
      body: "select one or two cards from your hand to discard.",
      sourceLabel,
      options,
      kind: "discard_two_draw_one_from_deck",
    };
  }

  if (prompt.abilityId === "look_three_cards") {
    return {
      title: "Look at hand",
      body: "revealed cards are shown once in the modal; continuing closes that view.",
      sourceLabel,
      options,
      kind: "look_three_cards",
    };
  }

  if (prompt.kind === "medic_revive" || prompt.abilityId === "medic") {
    return {
      title: "Medic revive",
      body: "choose a unit from your discard pile to revive.",
      sourceLabel,
      options,
      kind: "medic_revive",
    };
  }

  return {
    title: `${prompt.kind.replace(/_/g, " ")} · ${promptAbilityName(prompt.abilityId)}`,
    body: null,
    sourceLabel,
    options,
    kind: "generic",
  };
};

const seatLabel = (seatId: SeatId | "draw" | undefined, seatLabels: Record<SeatId, string>) => {
  if (!seatId) return "None";
  return seatId === "draw" ? "Draw" : seatLabels[seatId];
};

export const buildRoundOverlayViewModel = ({
  round,
  seatLabels,
  gameWinner,
}: {
  round: RoundResult | null | undefined;
  seatLabels: Record<SeatId, string>;
  gameWinner?: SeatId | "draw" | null;
}): RoundOverlayViewModel | null => {
  if (!round) {
    return null;
  }

  const gemLoss = (["seat_a", "seat_b"] as const)
    .flatMap((seatId) => {
      const loss = round.loserGemLoss[seatId] ?? 0;
      return loss > 0 ? [`${seatLabels[seatId]} lost ${loss}`] : [];
    })
    .join(", ");

  return {
    key: `round-${round.round}`,
    eyebrow: `Round ${round.round} complete`,
    title: round.winner === "draw" ? "Draw" : `${seatLabel(round.winner, seatLabels)} wins the round`,
    scoreLabel: `${seatLabels.seat_a} ${round.scoreBySeat.seat_a} - ${round.scoreBySeat.seat_b} ${seatLabels.seat_b}`,
    gemLossLabel: gemLoss || "No gem loss",
    nextStarterLabel: round.nextStarter ? `Next starter: ${seatLabels[round.nextStarter]}` : null,
    gameEndLabel: gameWinner ? `Game end: ${seatLabel(gameWinner, seatLabels)}` : null,
  };
};

export const buildGameEndNavigationActions = (canReturnToSetup: boolean): GameEndNavigationActionViewModel[] => [
  canReturnToSetup
    ? { key: "setup", label: "setup", kind: "ghost" }
    : { key: "close", label: "close", kind: "ghost" },
  { key: "rematch", label: "rematch", kind: "primary" },
];

export type MatchCardInspectionOrigin =
  | "hand"
  | "board"
  | "weather"
  | "discard"
  | "prompt";

export interface MatchCardInspectionFact {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}

export type MatchCardInspectionAbility = AbilityDisplay;

export interface MatchCardInspectionViewModel {
  readonly card: AuthenticCardViewModel;
  readonly engineCard: EngineCardViewModel;
  readonly origin: MatchCardInspectionOrigin;
  readonly title: string;
  readonly sourceId: string;
  readonly instanceId: CardInstanceId;
  readonly factionLabel: string;
  readonly kindLabel: string;
  readonly rowLabels: readonly string[];
  readonly abilities: readonly MatchCardInspectionAbility[];
  readonly tags: readonly string[];
  readonly imagePath: string;
  readonly hasStrength: boolean;
  readonly printedStrength: number | null;
  readonly effectiveStrength: number | null;
  readonly strengthState: AuthenticStrengthState | null;
  readonly modifiers: readonly string[];
  readonly usedScoreFallback: boolean;
  readonly originLabel: string;
  readonly ownerLabel: string | null;
  readonly rowContextLabel: string | null;
  readonly facts: readonly MatchCardInspectionFact[];
}

const ORIGIN_LABELS: Record<MatchCardInspectionOrigin, string> = {
  hand: "Hand",
  board: "Board",
  weather: "Weather",
  discard: "Discard",
  prompt: "Prompt option",
};

const isUnitOrHeroEngine = (card: EngineCardViewModel): boolean =>
  card.kind === "unit" || card.kind === "hero";

export const buildMatchCardInspection = ({
  card,
  origin,
  ownerLabel,
  row,
  boardState,
}: {
  readonly card: EngineCardViewModel;
  readonly origin: MatchCardInspectionOrigin;
  readonly ownerLabel?: string | null;
  readonly row?: CatalogRow | null;
  readonly boardState?: AuthenticBoardCardState | null;
}): MatchCardInspectionViewModel => {
  const factionDisplay = getFactionDisplay(card.faction);
  const kindDisplay = getCardKindDisplay(card.kind === "leader" ? "unit" : card.kind);
  const rowDisplays = (card.rows ?? []).map((entry) => getRowDisplay(entry));
  const abilities = (card.abilities ?? [])
    .filter((entry) => entry !== "none")
    .map((entry) => getAbilityDisplay(entry));
  const authenticCard = engineCardToAuthenticCard(card);
  const hasStrength = isUnitOrHeroEngine(card);
  const printedStrength = hasStrength ? card.printedStrength : null;
  const effectiveStrength =
    origin === "board" && boardState ? boardState.effectiveStrength : null;
  const strengthState = origin === "board" && boardState ? boardState.strengthState : null;
  const modifiers = origin === "board" && boardState ? boardState.modifiers : [];
  const usedScoreFallback = origin === "board" && boardState ? boardState.usedScoreFallback : false;
  const rowContextDisplay = row ? getRowDisplay(row) : null;
  const ownerLabelText = ownerLabel ?? null;

  const facts: MatchCardInspectionFact[] = [
    { key: "source-id", label: "Source ID", value: card.sourceId },
    { key: "instance-id", label: "Instance ID", value: card.instanceId },
    { key: "faction", label: "Faction", value: factionDisplay.name },
    { key: "kind", label: "Kind", value: kindDisplay.name },
  ];
  if (rowDisplays.length > 0) {
    facts.push({
      key: "rows",
      label: "Rows",
      value: rowDisplays.map((entry) => entry.name).join(", "),
    });
  }
  if (hasStrength && printedStrength !== null) {
    facts.push({ key: "printed-strength", label: "Printed strength", value: String(printedStrength) });
  }
  if (origin === "board" && effectiveStrength !== null && hasStrength) {
    const stateLabel =
      strengthState === "boosted"
        ? "boosted"
        : strengthState === "reduced"
          ? "reduced"
          : "normal";
    facts.push({
      key: "effective-strength",
      label: "Effective strength",
      value: `${effectiveStrength} (${stateLabel})`,
    });
  }
  if (origin === "board" && modifiers.length > 0) {
    facts.push({ key: "modifiers", label: "Modifiers", value: modifiers.join(", ") });
  }
  if (rowContextDisplay) {
    facts.push({ key: "row-context", label: "Board row", value: rowContextDisplay.name });
  }
  facts.push({ key: "origin", label: "Where", value: ORIGIN_LABELS[origin] });
  if (ownerLabelText) {
    facts.push({ key: "owner", label: "Side", value: ownerLabelText });
  }
  if (authenticCard.tags.length > 0) {
    facts.push({ key: "tags", label: "Tags", value: authenticCard.tags.join(", ") });
  }
  if (authenticCard.image) {
    facts.push({ key: "image", label: "Image path", value: authenticCard.image });
  }

  return {
    card: authenticCard,
    engineCard: card,
    origin,
    title: card.name,
    sourceId: card.sourceId,
    instanceId: card.instanceId,
    factionLabel: factionDisplay.name,
    kindLabel: kindDisplay.name,
    rowLabels: rowDisplays.map((entry) => entry.name),
    abilities,
    tags: authenticCard.tags,
    imagePath: authenticCard.image ?? "",
    hasStrength,
    printedStrength,
    effectiveStrength,
    strengthState,
    modifiers,
    usedScoreFallback,
    originLabel: ORIGIN_LABELS[origin],
    ownerLabel: ownerLabelText,
    rowContextLabel: rowContextDisplay?.name ?? null,
    facts,
  };
};

export interface MatchLeaderInspectionViewModel {
  readonly title: string;
  readonly sourceId: string;
  readonly factionLabel: string;
  readonly imagePath: string;
  readonly ability: LeaderAbilityDisplay;
  readonly used: boolean;
  readonly statusLabel: string;
  readonly ownerLabel: string;
  readonly facts: readonly MatchCardInspectionFact[];
}

export const buildMatchLeaderInspection = ({
  sourceId,
  name,
  faction,
  abilityId,
  image,
  used,
  ownerLabel,
}: {
  readonly sourceId: string;
  readonly name: string;
  readonly faction: string;
  readonly abilityId: string | null | undefined;
  readonly image: string | null | undefined;
  readonly used: boolean;
  readonly ownerLabel: string;
}): MatchLeaderInspectionViewModel => {
  const factionDisplay = getFactionDisplay(faction);
  const ability = getLeaderAbilityDisplay(abilityId);
  const statusLabel = used ? "used" : ability.status;
  const facts: MatchCardInspectionFact[] = [
    { key: "source-id", label: "Source ID", value: sourceId },
    { key: "faction", label: "Faction", value: factionDisplay.name },
    { key: "ability", label: "Ability", value: ability.name },
    { key: "ability-status", label: "Status", value: statusLabel },
    { key: "owner", label: "Side", value: ownerLabel },
  ];
  if (ability.description) {
    facts.push({ key: "ability-description", label: "Description", value: ability.description });
  }
  if (image) {
    facts.push({ key: "image", label: "Image path", value: image });
  }
  return {
    title: name,
    sourceId,
    factionLabel: factionDisplay.name,
    imagePath: image ?? "",
    ability,
    used,
    statusLabel,
    ownerLabel,
    facts,
  };
};

export interface LeaderActionChoiceOption {
  readonly moveId: string;
  readonly move: UseLeaderMove;
  readonly label: string;
  readonly actionLabel: string;
  readonly sourceId?: string;
  readonly targetCardName?: string;
  readonly ability: CatalogLeaderAbilityId;
  readonly affectedRows: readonly CatalogRow[];
  readonly affectedRowsLabel: string | null;
}

export type LeaderActionViewModel =
  | { readonly kind: "none"; readonly triggerLabel: string }
  | { readonly kind: "single"; readonly option: LeaderActionChoiceOption; readonly triggerLabel: string }
  | { readonly kind: "choice"; readonly options: readonly LeaderActionChoiceOption[]; readonly triggerLabel: string; readonly menuLabel: string };

const WEATHER_SOURCE_TO_ROWS: Record<string, readonly CatalogRow[]> = {
  "neutral.biting-frost": ["close"],
  "neutral.impenetrable-fog": ["ranged"],
  "neutral.torrential-rain": ["siege"],
  "neutral.skellige-storm": ["ranged", "siege"],
};

const formatAffectedRowsLabel = (rows: readonly CatalogRow[]): string | null => {
  if (rows.length === 0) {
    return null;
  }
  return rows.map((row) => getRowDisplay(row).name).join(" + ");
};

const leaderActionLabelForMove = (move: UseLeaderMove): string => {
  switch (move.metadata.ability) {
    case "clear_weather":
      return "clear weather";
    case "play_frost":
    case "play_fog":
    case "play_rain":
    case "play_any_weather":
      return "choose weather";
    case "scorch_range":
      return "scorch ranged";
    case "scorch_siege":
      return "scorch siege";
    case "restore_discard_to_hand":
      return "restore card";
    case "draw_opponent_discard":
      return "draw from opponent discard";
    case "discard_two_draw_one_from_deck":
      return "discard and draw";
    case "look_three_cards":
      return "look at hand";
    case "cancel_leader":
      return "cancel leader";
    case "shuffle_discards_into_decks":
      return "shuffle discards";
    case "optimize_agile_rows":
      return move.target.kind === "board_row" ? `move agile to ${getRowDisplay(move.target.row).name.toLocaleLowerCase()}` : "optimize agile";
    default:
      return "use leader";
  }
};

const buildLeaderActionOption = (move: UseLeaderMove): LeaderActionChoiceOption => {
  const sourceId =
    move.target.kind === "deck_card_source" ? move.target.sourceId : move.metadata.targetSourceId;
  const targetCardName = move.metadata.targetCardName;
  const fallbackLabel =
    targetCardName ??
    move.metadata.targetLabel ??
    sourceId ??
    move.label;
  const affectedRows: readonly CatalogRow[] = sourceId ? WEATHER_SOURCE_TO_ROWS[sourceId] ?? [] : [];
  return {
    moveId: move.moveId,
    move,
    label: fallbackLabel,
    actionLabel: leaderActionLabelForMove(move),
    sourceId,
    targetCardName,
    ability: move.metadata.ability,
    affectedRows,
    affectedRowsLabel: formatAffectedRowsLabel(affectedRows),
  };
};

export const buildLeaderActionViewModel = (
  moves: readonly UseLeaderMove[],
): LeaderActionViewModel => {
  if (moves.length === 0) {
    return { kind: "none", triggerLabel: "use leader" };
  }
  if (moves.length === 1) {
    const option = buildLeaderActionOption(moves[0]);
    return { kind: "single", option, triggerLabel: option.actionLabel };
  }
  const options = moves.map(buildLeaderActionOption);
  const firstAbility = options[0]?.ability;
  return {
    kind: "choice",
    options,
    triggerLabel: firstAbility === "play_any_weather" ? "choose weather" : "choose leader option",
    menuLabel: firstAbility === "play_any_weather" ? "Choose a weather card" : "Choose a leader option",
  };
};
