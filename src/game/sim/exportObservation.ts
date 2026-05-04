import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import type { CatalogCardSource, CatalogRow } from "@/game/catalog";
import { calculateScores, type CardInstanceId, type MatchState, type SeatId } from "@/game/core";

import {
  SAFE_OBSERVATION_SCHEMA_VERSION,
  type SafeSimulationObservation,
  type SafeVisibleCardRef,
} from "./exportTypes";

const ROWS: readonly CatalogRow[] = ["close", "ranged", "siege"];
const SEATS: readonly SeatId[] = ["seat_a", "seat_b"];

const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

const cardsBySourceId: ReadonlyMap<string, CatalogCardSource> = new Map(currentCatalogCards.map((card) => [card.sourceId, card]));

const toVisibleCardRef = (
  state: MatchState,
  cardId: CardInstanceId | null | undefined,
  cardRef: string,
): SafeVisibleCardRef | null => {
  if (!cardId) return null;
  const instance = state.cardsById[cardId];
  const source = instance?.sourceKind === "card" ? cardsBySourceId.get(instance.sourceId) : undefined;
  if (!instance || !source) return null;

  return {
    cardRef,
    sourceId: source.sourceId,
    name: source.name,
    kind: source.kind,
    printedStrength: source.strength,
    rows: source.rows,
    abilities: source.abilities,
  };
};

export const safeCardRefForId = (
  state: MatchState,
  perspectiveSeatId: SeatId,
  cardId: CardInstanceId,
): SafeVisibleCardRef | null => {
  const instance = state.cardsById[cardId];
  if (!instance) return null;
  const zone = instance.zone;
  if (zone.kind === "hand" && zone.seat === perspectiveSeatId) {
    const index = state.seats[perspectiveSeatId].hand.indexOf(cardId);
    return toVisibleCardRef(state, cardId, `own_hand_${Math.max(0, index)}`);
  }
  if (zone.kind === "discard") {
    const side = zone.seat === perspectiveSeatId ? "own" : "opponent";
    const index = state.seats[zone.seat].discard.indexOf(cardId);
    return toVisibleCardRef(state, cardId, `${side}_discard_${Math.max(0, index)}`);
  }
  if (zone.kind === "board_row") {
    const side = zone.seat === perspectiveSeatId ? "own" : "opponent";
    const index = state.seats[zone.seat].board[zone.row].units.indexOf(cardId);
    return toVisibleCardRef(state, cardId, `${side}_board_${zone.row}_${Math.max(0, index)}`);
  }
  if (zone.kind === "row_horn") {
    const side = zone.seat === perspectiveSeatId ? "own" : "opponent";
    return toVisibleCardRef(state, cardId, `${side}_horn_${zone.row}`);
  }
  if (zone.kind === "weather") {
    const index = state.weather.entries.indexOf(cardId);
    return toVisibleCardRef(state, cardId, `weather_${Math.max(0, index)}`);
  }
  return null;
};

const summarizeCards = (
  state: MatchState,
  cardIds: readonly CardInstanceId[],
  prefix: string,
) =>
  cardIds.flatMap((cardId, index) => {
    const ref = toVisibleCardRef(state, cardId, `${prefix}_${index}`);
    return ref ? [ref] : [];
  });

export const buildSafeSimulationObservation = (
  state: MatchState,
  perspectiveSeatId: SeatId,
): SafeSimulationObservation => {
  const opponentSeatId = opponentOf(perspectiveSeatId);
  const own = state.seats[perspectiveSeatId];
  const opponent = state.seats[opponentSeatId];
  const score = calculateScores({ state, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });

  const pendingPrompt = (() => {
    const promptState = state.pendingPrompt;
    if (!promptState || promptState.seatId !== perspectiveSeatId) {
      return null;
    }
    // cCp28 prompt-local opponent-hand reveal refs. The opponent hand zone
    // has no public card index for the perspective seat, so we mint a
    // `revealed_opponent_hand_<index>` ref keyed by reveal order. Only the
    // prompt owner sees these; non-acting perspectives receive
    // `pendingPrompt: null` above.
    const revealedCardIds = promptState.context?.revealedCardIds ?? null;
    const revealedCards =
      revealedCardIds && revealedCardIds.length > 0
        ? revealedCardIds.flatMap((cardId, index) => {
            const ref = toVisibleCardRef(state, cardId, `revealed_opponent_hand_${index}`);
            return ref ? [ref] : [];
          })
        : undefined;
    const base = {
      promptRef: "pending_prompt",
      kind: promptState.kind,
      abilityId: promptState.abilityId,
      source: promptState.sourceCardId
        ? safeCardRefForId(state, perspectiveSeatId, promptState.sourceCardId) ?? undefined
        : undefined,
      options: promptState.options.map((option, index) => {
        const target = option.target;
        if (target.kind === "none") {
          // cCp28 acknowledgement option carries no card identity.
          return {
            optionRef: `prompt_option_${index}`,
            label: option.label,
          };
        }
        if (target.kind === "card_instance_set") {
          // cCp27 stage 1: hand-card combination, acting seat only.
          // Expose the combined option label and aggregate strength so
          // policy ranking still works without disclosing raw card IDs.
          const targetStrength = target.sourceIds.reduce(
            (sum, sourceId) => sum + (cardsBySourceId.get(sourceId)?.strength ?? 0),
            0,
          );
          return {
            optionRef: `prompt_option_${index}`,
            label: option.label,
            targetStrength,
          };
        }
        if (target.kind === "deck_card_instance") {
          // cCp27 stage 2: deck-card disclosure to the acting seat only.
          // The deck zone has no public card index, so we mint a
          // prompt-local own-deck ref keyed by option index.
          const visibleDeckCard = safeCardRefForId(state, perspectiveSeatId, target.cardId);
          const ownDeckCard = visibleDeckCard
            ? { ...visibleDeckCard, cardRef: `own_deck_option_${index}` }
            : null;
          return {
            optionRef: `prompt_option_${index}`,
            label: option.label,
            target: ownDeckCard
              ? { kind: "card" as const, side: "own" as const, card: ownDeckCard }
              : undefined,
            targetStrength: cardsBySourceId.get(target.sourceId)?.strength,
          };
        }
        const targetCard = safeCardRefForId(state, perspectiveSeatId, target.cardId);
        return {
          optionRef: `prompt_option_${index}`,
          label: option.label,
          target: targetCard
            ? {
                kind: "card" as const,
                side: "own" as const,
                row: target.row,
                card: targetCard,
              }
            : undefined,
          targetStrength: targetCard ? cardsBySourceId.get(target.sourceId)?.strength : undefined,
        };
      }),
    };
    return revealedCards ? { ...base, revealedCards } : base;
  })();

  return {
    schemaVersion: SAFE_OBSERVATION_SCHEMA_VERSION,
    perspectiveSeatId,
    opponentSeatId,
    phase: state.phase,
    round: state.round,
    currentTurn: state.currentTurn,
    own: {
      cardsInHand: summarizeCards(state, own.hand, "own_hand"),
      leader: {
        sourceId: own.leaderSourceId,
        used: own.leaderUsed,
      },
      deckCount: own.deck.length,
      discardCount: own.discard.length,
      discard: summarizeCards(state, own.discard, "own_discard"),
      passed: own.passed,
      gems: own.gems,
    },
    opponent: {
      cardCountInHand: opponent.hand.length,
      leader: {
        sourceId: opponent.leaderSourceId,
        used: opponent.leaderUsed,
      },
      deckCount: opponent.deck.length,
      discardCount: opponent.discard.length,
      discard: summarizeCards(state, opponent.discard, "opponent_discard"),
      passed: opponent.passed,
      gems: opponent.gems,
    },
    board: {
      rows: SEATS.flatMap((seatId) =>
        ROWS.map((row) => ({
          side: seatId === perspectiveSeatId ? "own" : "opponent",
          seatId,
          row,
          units: summarizeCards(
            state,
            state.seats[seatId].board[row].units,
            `${seatId === perspectiveSeatId ? "own" : "opponent"}_board_${row}`,
          ),
          horn: toVisibleCardRef(
            state,
            state.seats[seatId].board[row].horn,
            `${seatId === perspectiveSeatId ? "own" : "opponent"}_horn_${row}`,
          ),
        })),
      ),
    },
    weather: summarizeCards(state, state.weather.entries, "weather"),
    score: {
      totalBySeat: score.totalBySeat,
      rowTotalsBySeat: score.rowTotalsBySeat,
    },
    pendingPrompt,
  };
};

export const lookupCatalogCard = (sourceId: string): CatalogCardSource | undefined => cardsBySourceId.get(sourceId);
