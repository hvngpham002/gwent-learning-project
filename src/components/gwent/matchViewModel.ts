import type {
  CardInstanceId,
  ChooseMulliganMove,
  LegalMove,
  MatchScoreBreakdown,
  PlayCardMove,
  RoundResult,
  SeatId,
  UseLeaderMove,
} from "@/game/core";
import type { CatalogLeaderAbilityId, CatalogRow } from "@/game/catalog";
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

const HUMAN_LABEL = "You";
const AI_LABEL = "AI";

const BOARD_ROW_ORDER: readonly CatalogRow[] = ["siege", "ranged", "close", "close", "ranged", "siege"];
const DISCARD_GROUP_ORDER = ["hero", "close", "ranged", "siege", "special", "other"] as const;
export const MULLIGAN_MAX_SELECTION = 1;

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
  readonly sourceId?: string;
  readonly targetCardName?: string;
  readonly ability: CatalogLeaderAbilityId;
  readonly affectedRows: readonly CatalogRow[];
  readonly affectedRowsLabel: string | null;
}

export type LeaderActionViewModel =
  | { readonly kind: "none" }
  | { readonly kind: "single"; readonly option: LeaderActionChoiceOption }
  | { readonly kind: "choice"; readonly options: readonly LeaderActionChoiceOption[] };

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
    return { kind: "none" };
  }
  if (moves.length === 1) {
    return { kind: "single", option: buildLeaderActionOption(moves[0]) };
  }
  return {
    kind: "choice",
    options: moves.map(buildLeaderActionOption),
  };
};
