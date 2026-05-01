import {
  CATALOG_LEADER_ABILITY_METADATA,
  type CatalogAbilityId,
  type CatalogCardSource,
  type CatalogLeaderSource,
  type CatalogRow,
} from "@/game/catalog";

import {
  isEligibleWeatherSourceForLeader,
  isWeatherLeaderAbility,
  sortedWeatherSourceIds,
} from "./leaderWeather";
import type { CardInstance, CardInstanceId, MatchState, PendingPrompt, SeatId } from "./types";

export type LegalMoveKind =
  | "choose_mulligan"
  | "play_card"
  | "pass"
  | "resolve_round_end"
  | "use_leader"
  | "choose_prompt_option";

export type LegalMoveTarget =
  | { kind: "board_row"; side: "own" | "opponent"; seatId: SeatId; row: CatalogRow }
  | { kind: "row_horn"; side: "own"; seatId: SeatId; row: CatalogRow }
  | { kind: "weather" }
  | { kind: "card_instance"; side: "own" | "opponent"; seatId: SeatId; cardId: CardInstanceId; row?: CatalogRow }
  | { kind: "deck_card_source"; seatId: SeatId; sourceId: string }
  | { kind: "none" };

export interface LegalMoveBase {
  moveId: string;
  seatId: SeatId;
  kind: LegalMoveKind;
  label: string;
  diagnostics?: string[];
}

export interface ChooseMulliganMove extends LegalMoveBase {
  kind: "choose_mulligan";
  cardIds: CardInstanceId[];
  metadata: {
    cardCount: number;
    maxCards: number;
  };
}

export interface PlayCardMove extends LegalMoveBase {
  kind: "play_card";
  sourceCardId: CardInstanceId;
  sourceId: string;
  target: LegalMoveTarget;
  metadata: {
    cardName: string;
    cardKind: CatalogCardSource["kind"];
    abilities: CatalogAbilityId[];
    targetLabel: string;
  };
}

export interface PassMove extends LegalMoveBase {
  kind: "pass";
  target: { kind: "none" };
}

export interface ResolveRoundEndMove extends LegalMoveBase {
  kind: "resolve_round_end";
  target: { kind: "none" };
}

export interface UseLeaderMove extends LegalMoveBase {
  kind: "use_leader";
  leaderCardId: CardInstanceId;
  sourceId: string;
  target: LegalMoveTarget;
  metadata: {
    leaderName: string;
    ability: CatalogLeaderSource["ability"];
    abilityStatus: "implemented" | "planned" | "placeholder";
    targetRequirement: "none" | "future_prompt" | "deck_weather_source";
    targetSourceId?: string;
    targetCardName?: string;
    targetLabel?: string;
  };
}

export interface ChoosePromptOptionMove extends LegalMoveBase {
  kind: "choose_prompt_option";
  promptId: string;
  optionId: string;
  target: LegalMoveTarget;
  metadata: {
    promptKind: PendingPrompt["kind"];
    abilityId: string;
    sourceCardId?: CardInstanceId;
  };
}

export type LegalMove =
  | ChooseMulliganMove
  | PlayCardMove
  | PassMove
  | ResolveRoundEndMove
  | UseLeaderMove
  | ChoosePromptOptionMove;

export interface LegalMoveCatalogInput {
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders: readonly CatalogLeaderSource[];
}

export interface GetLegalMovesInput extends LegalMoveCatalogInput {
  state: MatchState;
  seatId: SeatId;
}

export interface CatalogLookups {
  cardsBySourceId: ReadonlyMap<string, CatalogCardSource>;
  leadersBySourceId: ReadonlyMap<string, CatalogLeaderSource>;
}

const ROWS: readonly CatalogRow[] = ["close", "ranged", "siege"];
const WEATHER_ABILITIES = new Set<CatalogAbilityId>(["frost", "fog", "rain", "skellige_storm", "clear_weather"]);

export const createCatalogLookups = ({ catalogCards, catalogLeaders }: LegalMoveCatalogInput): CatalogLookups => ({
  cardsBySourceId: new Map(catalogCards.map((card) => [card.sourceId, card])),
  leadersBySourceId: new Map(catalogLeaders.map((leader) => [leader.sourceId, leader])),
});

const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

const hasAbility = (card: CatalogCardSource, ability: CatalogAbilityId) => card.abilities.includes(ability);

const sortedCardIds = (cardIds: readonly CardInstanceId[]) => [...cardIds].sort((a, b) => a.localeCompare(b));

const getCardSource = (lookups: CatalogLookups, instance: CardInstance) => lookups.cardsBySourceId.get(instance.sourceId);

const getMulliganMoves = (state: MatchState, seatId: SeatId): LegalMove[] => {
  if (state.seats[seatId].mulliganComplete) {
    return [];
  }

  const hand = state.seats[seatId].hand;
  const sortedHand = sortedCardIds(hand);
  const remainingMulligans = Math.max(0, 2 - state.seats[seatId].mulligansUsed);
  const moves: LegalMove[] = [
    {
      kind: "choose_mulligan",
      moveId: `mulligan:${seatId}:none`,
      seatId,
      label: "Keep hand",
      cardIds: [],
      metadata: { cardCount: 0, maxCards: 1 },
    },
  ];

  if (remainingMulligans <= 0) {
    return moves;
  }

  sortedHand.forEach((firstCardId) => {
    moves.push({
      kind: "choose_mulligan",
      moveId: `mulligan:${seatId}:${firstCardId}`,
      seatId,
      label: "Mulligan 1 card",
      cardIds: [firstCardId],
      metadata: { cardCount: 1, maxCards: 1 },
    });
  });

  return moves;
};

const createBoardRowMove = (
  seatId: SeatId,
  instance: CardInstance,
  source: CatalogCardSource,
  targetSeatId: SeatId,
  side: "own" | "opponent",
  row: CatalogRow,
): PlayCardMove => ({
  kind: "play_card",
  moveId: `play:${seatId}:${instance.instanceId}:board_row:${targetSeatId}:${row}`,
  seatId,
  sourceCardId: instance.instanceId,
  sourceId: instance.sourceId,
  target: { kind: "board_row", side, seatId: targetSeatId, row },
  label: `Play ${source.name} to ${side} ${row}`,
  metadata: {
    cardName: source.name,
    cardKind: source.kind,
    abilities: source.abilities,
    targetLabel: `${side} ${row}`,
  },
});

const getUnitOrHeroMoves = (
  seatId: SeatId,
  instance: CardInstance,
  source: CatalogCardSource,
): PlayCardMove[] => {
  const isSpy = hasAbility(source, "spy");
  const targetSeatId = isSpy ? opponentOf(seatId) : seatId;
  const side = isSpy ? "opponent" : "own";

  return source.rows.map((row) => createBoardRowMove(seatId, instance, source, targetSeatId, side, row));
};

const getHornMoves = (
  state: MatchState,
  seatId: SeatId,
  instance: CardInstance,
  source: CatalogCardSource,
): PlayCardMove[] =>
  ROWS.flatMap((row) => {
    if (state.seats[seatId].board[row].horn) {
      return [];
    }

    return [
      {
        kind: "play_card",
        moveId: `play:${seatId}:${instance.instanceId}:row_horn:${seatId}:${row}`,
        seatId,
        sourceCardId: instance.instanceId,
        sourceId: instance.sourceId,
        target: { kind: "row_horn", side: "own", seatId, row },
        label: `Play ${source.name} to ${row} horn`,
        metadata: {
          cardName: source.name,
          cardKind: source.kind,
          abilities: source.abilities,
          targetLabel: `own ${row} horn`,
        },
      },
    ];
  });

const getDecoyMoves = (
  state: MatchState,
  seatId: SeatId,
  lookups: CatalogLookups,
  instance: CardInstance,
  source: CatalogCardSource,
): PlayCardMove[] =>
  ROWS.flatMap((row) =>
    state.seats[seatId].board[row].units.flatMap((targetCardId) => {
      const targetInstance = state.cardsById[targetCardId];
      const targetSource = targetInstance ? getCardSource(lookups, targetInstance) : undefined;

      if (!targetSource || targetSource.kind !== "unit") {
        return [];
      }

      return [
        {
          kind: "play_card",
          moveId: `play:${seatId}:${instance.instanceId}:card_instance:${targetCardId}`,
          seatId,
          sourceCardId: instance.instanceId,
          sourceId: instance.sourceId,
          target: { kind: "card_instance", side: "own", seatId, cardId: targetCardId, row },
          label: `Play ${source.name} on ${targetSource.name}`,
          metadata: {
            cardName: source.name,
            cardKind: source.kind,
            abilities: source.abilities,
            targetLabel: targetSource.name,
          },
        },
      ];
    }),
  );

const createSpecialMove = (seatId: SeatId, instance: CardInstance, source: CatalogCardSource): PlayCardMove[] | null => {
  if (source.abilities.some((ability) => WEATHER_ABILITIES.has(ability))) {
    return [
      {
        kind: "play_card",
        moveId: `play:${seatId}:${instance.instanceId}:weather`,
        seatId,
        sourceCardId: instance.instanceId,
        sourceId: instance.sourceId,
        target: { kind: "weather" },
        label: `Play ${source.name} to weather`,
        metadata: {
          cardName: source.name,
          cardKind: source.kind,
          abilities: source.abilities,
          targetLabel: "weather",
        },
      },
    ];
  }

  if (hasAbility(source, "scorch")) {
    return [
      {
        kind: "play_card",
        moveId: `play:${seatId}:${instance.instanceId}:none`,
        seatId,
        sourceCardId: instance.instanceId,
        sourceId: instance.sourceId,
        target: { kind: "none" },
        label: `Play ${source.name}`,
        metadata: {
          cardName: source.name,
          cardKind: source.kind,
          abilities: source.abilities,
          targetLabel: "global",
        },
      },
    ];
  }

  if (hasAbility(source, "mardroeme")) {
    return ROWS.map((row) => createBoardRowMove(seatId, instance, source, seatId, "own", row));
  }

  return null;
};

const getCardMoves = (
  state: MatchState,
  seatId: SeatId,
  lookups: CatalogLookups,
  instance: CardInstance,
): PlayCardMove[] => {
  const source = getCardSource(lookups, instance);

  if (!source) {
    return [];
  }

  if (source.kind === "unit" || source.kind === "hero") {
    return getUnitOrHeroMoves(seatId, instance, source);
  }

  if (hasAbility(source, "commanders_horn")) {
    return getHornMoves(state, seatId, instance, source);
  }

  if (hasAbility(source, "decoy")) {
    return getDecoyMoves(state, seatId, lookups, instance, source);
  }

  const specialMoves = createSpecialMove(seatId, instance, source);
  return specialMoves ?? [];
};

const getLeaderMove = (state: MatchState, seatId: SeatId, lookups: CatalogLookups): UseLeaderMove[] => {
  const seat = state.seats[seatId];
  const leaderCardId = seat.leader;

  if (!leaderCardId || seat.leaderUsed) {
    return [];
  }

  const leader = lookups.leadersBySourceId.get(seat.leaderSourceId);
  const abilityMetadata = leader ? CATALOG_LEADER_ABILITY_METADATA[leader.ability] : undefined;

  if (!leader || !abilityMetadata) {
    return [];
  }

  if (abilityMetadata.status !== "implemented") {
    return [];
  }

  if (leader.ability === "clear_weather") {
    return [
      {
        kind: "use_leader",
        moveId: `leader:${seatId}:${leaderCardId}:${leader.ability}`,
        seatId,
        leaderCardId,
        sourceId: leader.sourceId,
        target: { kind: "none" },
        label: `Use ${leader.name}`,
        metadata: {
          leaderName: leader.name,
          ability: leader.ability,
          abilityStatus: abilityMetadata.status,
          targetRequirement: "none",
        },
      },
    ];
  }

  if (isWeatherLeaderAbility(leader.ability)) {
    const eligibleSourceIds = new Set<string>();
    seat.deck.forEach((cardId) => {
      const instance = state.cardsById[cardId];
      const source = instance ? lookups.cardsBySourceId.get(instance.sourceId) : undefined;
      if (source && isEligibleWeatherSourceForLeader(leader.ability, source)) {
        eligibleSourceIds.add(source.sourceId);
      }
    });

    return sortedWeatherSourceIds([...eligibleSourceIds]).map((sourceId) => {
      const targetSource = lookups.cardsBySourceId.get(sourceId);
      const targetName = targetSource?.name ?? sourceId;
      return {
        kind: "use_leader" as const,
        moveId: `leader:${seatId}:${leaderCardId}:${leader.ability}:${sourceId}`,
        seatId,
        leaderCardId,
        sourceId: leader.sourceId,
        target: { kind: "deck_card_source" as const, seatId, sourceId },
        label: `Use ${leader.name}: ${targetName}`,
        metadata: {
          leaderName: leader.name,
          ability: leader.ability,
          abilityStatus: abilityMetadata.status,
          targetRequirement: "deck_weather_source" as const,
          targetSourceId: sourceId,
          targetCardName: targetName,
          targetLabel: `deck ${targetName}`,
        },
      };
    });
  }

  return [];
};

const getPlayingMoves = (state: MatchState, seatId: SeatId, lookups: CatalogLookups): LegalMove[] => {
  const seat = state.seats[seatId];

  if (state.currentTurn !== seatId || seat.passed) {
    return [];
  }

  return [
    {
      kind: "pass",
      moveId: `pass:${seatId}`,
      seatId,
      target: { kind: "none" },
      label: "Pass",
    },
    ...getLeaderMove(state, seatId, lookups),
    ...seat.hand.flatMap((cardId) => {
      const instance = state.cardsById[cardId];
      return instance ? getCardMoves(state, seatId, lookups, instance) : [];
    }),
  ];
};

const getPromptMoves = (state: MatchState, seatId: SeatId): LegalMove[] => {
  const prompt = state.pendingPrompt;
  if (!prompt || prompt.seatId !== seatId) {
    return [];
  }

  return prompt.options.map((option) => ({
    kind: "choose_prompt_option",
    moveId: `prompt:${prompt.promptId}:${option.optionId}`,
    seatId,
    promptId: prompt.promptId,
    optionId: option.optionId,
    target: { kind: "card_instance", side: "own", seatId, cardId: option.target.cardId, row: option.target.row },
    label: option.label,
    metadata: {
      promptKind: prompt.kind,
      abilityId: prompt.abilityId,
      sourceCardId: prompt.sourceCardId,
    },
  }));
};

const getRoundEndMoves = (state: MatchState, seatId: SeatId): LegalMove[] => {
  if (!state.seats.seat_a.passed || !state.seats.seat_b.passed) {
    return [];
  }

  return [
    {
      kind: "resolve_round_end",
      moveId: `resolve-round-end:${state.round}`,
      seatId,
      target: { kind: "none" },
      label: "Resolve round end",
    },
  ];
};

export const getLegalMoves = ({ state, seatId, catalogCards, catalogLeaders }: GetLegalMovesInput): LegalMove[] => {
  const lookups = createCatalogLookups({ catalogCards, catalogLeaders });

  if (state.pendingPrompt) {
    return getPromptMoves(state, seatId);
  }

  if (state.phase === "mulligan") {
    return getMulliganMoves(state, seatId);
  }

  if (state.phase === "playing") {
    return getPlayingMoves(state, seatId, lookups);
  }

  if (state.phase === "round_end") {
    return getRoundEndMoves(state, seatId);
  }

  return [];
};
