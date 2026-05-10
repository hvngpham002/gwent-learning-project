import React, { useMemo } from "react";

import type { CardInstanceId, SeatId } from "@/game/core";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectEngineAiHandCount,
  selectEngineAiSeat,
  selectEngineDebugAiHandCards,
  selectEngineDeckCounts,
  selectEngineDiscardCounts,
  selectEngineHumanHand,
  selectEngineHumanSeat,
  selectEngineLastError,
  selectEngineLeaderStatus,
  selectEngineLegalMovesForHuman,
  selectEngineMatch,
  selectEngineRuntimeCatalogCards,
  selectEngineSelectedCardIds,
  type EngineCardViewModel,
} from "@/store/selectors/engineSelectors";
import { engineSelectedCardIdsSet } from "@/store/slices/engineSlice";
import { dispatchEngineCommand } from "@/store/thunks/engineThunks";

import AuthenticCard from "./AuthenticCard";
import AuthenticCardBack from "./AuthenticCardBack";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import { getFactionDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import {
  findLegalMulliganMove,
  MULLIGAN_MAX_SELECTION,
  toRuntimeCard,
  toggleMulliganSelection,
} from "./matchViewModel";
import "./authentic-mulligan.css";

interface AuthenticMulliganScreenProps {
  readonly seedLabel: string;
  readonly aiPolicyId: string;
  readonly statusLabel: string;
  readonly aiMulliganAnimation?: {
    readonly selectedCount: number;
    readonly selectedCardIds: readonly CardInstanceId[];
    readonly drawnCardIds: readonly CardInstanceId[];
    readonly baseHandCardIds: readonly CardInstanceId[];
  };
  readonly aiMulliganBaseHandCardIds?: readonly CardInstanceId[];
  readonly humanMulliganAnimation?: {
    readonly selectedCardIds: readonly CardInstanceId[];
    readonly drawnCardIds: readonly CardInstanceId[];
  };
  readonly debugRevealAiCards?: boolean;
  readonly isAiMulliganChoosing?: boolean;
  readonly isMulliganReviewReady?: boolean;
  readonly onRequestStartMatch?: () => void;
  readonly onRequestSetup?: () => void;
}

const hiddenHandBacks = (count: number) => Array.from({ length: Math.max(0, count) }, (_, index) => index);
const EMPTY_DEBUG_AI_HAND: readonly EngineCardViewModel[] = [];

const leaderCard = (
  leaders: NonNullable<ReturnType<typeof selectEngineLeaderStatus>>,
  seatId: SeatId,
  fallbackFaction: string,
) => {
  const leader = leaders[seatId];
  return {
    sourceId: leader.sourceId,
    name: leader.name,
    faction: fallbackFaction,
    abilityName: getLeaderAbilityDisplay(leader.ability).name,
    image: leader.image,
  };
};

const AuthenticMulliganScreen: React.FC<AuthenticMulliganScreenProps> = ({
  seedLabel,
  aiPolicyId,
  statusLabel,
  aiMulliganAnimation,
  aiMulliganBaseHandCardIds = [],
  humanMulliganAnimation,
  debugRevealAiCards = false,
  isAiMulliganChoosing = false,
  isMulliganReviewReady = false,
  onRequestStartMatch,
  onRequestSetup,
}) => {
  const dispatch = useAppDispatch();
  const match = useAppSelector(selectEngineMatch);
  const runtimeCatalogCards = useAppSelector(selectEngineRuntimeCatalogCards);
  const humanSeat = useAppSelector(selectEngineHumanSeat);
  const aiSeat = useAppSelector(selectEngineAiSeat);
  const humanHand = useAppSelector(selectEngineHumanHand);
  const aiHandCount = useAppSelector(selectEngineAiHandCount);
  const debugAiHand = useAppSelector((state) =>
    debugRevealAiCards ? selectEngineDebugAiHandCards(state) : EMPTY_DEBUG_AI_HAND,
  );
  const deckCounts = useAppSelector(selectEngineDeckCounts);
  const discardCounts = useAppSelector(selectEngineDiscardCounts);
  const leaders = useAppSelector(selectEngineLeaderStatus);
  const legalMoves = useAppSelector(selectEngineLegalMovesForHuman);
  const selectedCardIds = useAppSelector(selectEngineSelectedCardIds);
  const lastError = useAppSelector(selectEngineLastError);
  const catalogCardBySourceId = useMemo(
    () => new Map(runtimeCatalogCards.map((card) => [card.sourceId, card])),
    [runtimeCatalogCards],
  );

  const selectedMulliganMove = useMemo(
    () => findLegalMulliganMove(legalMoves, selectedCardIds),
    [legalMoves, selectedCardIds],
  );
  const maxSelection =
    legalMoves.find((move) => move.kind === "choose_mulligan")?.metadata.maxCards ?? MULLIGAN_MAX_SELECTION;
  const humanMulliganComplete = match?.seats[humanSeat].mulliganComplete ?? false;
  const isAiMulliganAnimating = Boolean(aiMulliganAnimation);
  const isAiSwapAnimating = Boolean(aiMulliganAnimation && !isMulliganReviewReady);
  const isAiKeepAnimating = Boolean(isAiSwapAnimating && aiMulliganAnimation?.selectedCount === 0);
  const isHumanMulliganAnimating = Boolean(humanMulliganAnimation);
  const canRequestStartMatch = Boolean(aiMulliganAnimation && isMulliganReviewReady && onRequestStartMatch);
  const canConfirm = Boolean(match?.phase === "mulligan" && !humanMulliganComplete && selectedMulliganMove);
  const isPresentationLocked = Boolean(
    isAiMulliganChoosing ||
      isHumanMulliganAnimating ||
      (isAiMulliganAnimating && !isMulliganReviewReady),
  );
  const primaryLabel = selectedCardIds.length === 0 ? "keep hand" : "confirm mulligan";
  const humanFaction = match?.seats[humanSeat].faction ?? "northern_realms";
  const aiFaction = match?.seats[aiSeat].faction ?? "nilfgaard";
  const humanFactionDisplay = getFactionDisplay(humanFaction);
  const aiFactionDisplay = getFactionDisplay(aiFaction);
  const humanRuntimeCards = useMemo(() => humanHand.map(toRuntimeCard), [humanHand]);
  const humanAnimationSelectedCards = useMemo(
    () =>
      (humanMulliganAnimation?.selectedCardIds ?? []).flatMap((cardId) => {
        const instance = match?.cardsById[cardId];
        const source = instance ? catalogCardBySourceId.get(instance.sourceId) : null;
        return source
          ? [
              {
                key: cardId,
                card: {
                  sourceId: source.sourceId,
                  name: source.name,
                  faction: source.faction,
                  kind: source.kind,
                  strength: source.strength,
                  rows: source.rows,
                  abilities: source.abilities,
                  tags:
                    source.kind === "special" &&
                    source.abilities.some((ability) => ["frost", "fog", "rain", "clear_weather"].includes(ability))
                      ? ["weather" as const]
                      : [],
                  image: source.image,
                },
              },
            ]
          : [];
      }),
    [catalogCardBySourceId, humanMulliganAnimation?.selectedCardIds, match?.cardsById],
  );
  const debugAiRuntimeCards = useMemo(
    () => (debugRevealAiCards ? debugAiHand.map(toRuntimeCard) : []),
    [debugAiHand, debugRevealAiCards],
  );
  const debugAiBaseRuntimeCards = useMemo(
    () => {
      if (!debugRevealAiCards) {
        return [];
      }
      return (aiMulliganAnimation?.baseHandCardIds ?? aiMulliganBaseHandCardIds).flatMap((cardId) => {
        const instance = match?.cardsById[cardId];
        const source = instance ? catalogCardBySourceId.get(instance.sourceId) : null;
        return source
          ? [
              {
                key: cardId,
                card: {
                  sourceId: source.sourceId,
                  name: source.name,
                  faction: source.faction,
                  kind: source.kind,
                  strength: source.strength,
                  rows: source.rows,
                  abilities: source.abilities,
                  tags:
                    source.kind === "special" &&
                    source.abilities.some((ability) => ["frost", "fog", "rain", "clear_weather"].includes(ability))
                      ? ["weather" as const]
                      : [],
                  image: source.image,
                },
              },
            ]
          : [];
      });
    },
    [aiMulliganAnimation?.baseHandCardIds, aiMulliganBaseHandCardIds, catalogCardBySourceId, debugRevealAiCards, match?.cardsById],
  );
  const debugSelectedAiRuntimeCards = useMemo(
    () => {
      if (!debugRevealAiCards) {
        return [];
      }
      return (aiMulliganAnimation?.selectedCardIds ?? []).flatMap((cardId) => {
        const instance = match?.cardsById[cardId];
        const source = instance ? catalogCardBySourceId.get(instance.sourceId) : null;
        return source
          ? [
              {
                key: cardId,
                card: {
                  sourceId: source.sourceId,
                  name: source.name,
                  faction: source.faction,
                  kind: source.kind,
                  strength: source.strength,
                  rows: source.rows,
                  abilities: source.abilities,
                  tags:
                    source.kind === "special" &&
                    source.abilities.some((ability) => ["frost", "fog", "rain", "clear_weather"].includes(ability))
                      ? ["weather" as const]
                      : [],
                  image: source.image,
                },
              },
            ]
          : [];
      });
    },
    [aiMulliganAnimation?.selectedCardIds, catalogCardBySourceId, debugRevealAiCards, match?.cardsById],
  );
  const debugDrawnAiRuntimeCards = useMemo(
    () => {
      if (!debugRevealAiCards) {
        return [];
      }
      return (aiMulliganAnimation?.drawnCardIds ?? []).flatMap((cardId) => {
        const instance = match?.cardsById[cardId];
        const source = instance ? catalogCardBySourceId.get(instance.sourceId) : null;
        return source
          ? [
              {
                key: cardId,
                card: {
                  sourceId: source.sourceId,
                  name: source.name,
                  faction: source.faction,
                  kind: source.kind,
                  strength: source.strength,
                  rows: source.rows,
                  abilities: source.abilities,
                  tags:
                    source.kind === "special" &&
                    source.abilities.some((ability) => ["frost", "fog", "rain", "clear_weather"].includes(ability))
                      ? ["weather" as const]
                      : [],
                  image: source.image,
                },
              },
            ]
          : [];
      });
    },
    [aiMulliganAnimation?.drawnCardIds, catalogCardBySourceId, debugRevealAiCards, match?.cardsById],
  );
  const debugAiSlotCards =
    (isAiMulliganChoosing || (aiMulliganAnimation && !isMulliganReviewReady)) && debugAiBaseRuntimeCards.length > 0
      ? [
          ...debugAiBaseRuntimeCards.filter(
            (entry) => !(aiMulliganAnimation?.selectedCardIds ?? []).includes(entry.key),
          ),
          ...debugSelectedAiRuntimeCards,
        ]
      : debugAiRuntimeCards;
  const selectedCardNames = selectedCardIds.flatMap((cardId) => {
    const card = humanRuntimeCards.find((entry) => entry.key === cardId);
    return card ? [card.card.name] : [];
  });
  const debugAiDecisionLabel = aiMulliganAnimation
    ? debugSelectedAiRuntimeCards.length > 0
      ? `debug AI mulligan: redraw ${debugSelectedAiRuntimeCards.map((entry) => entry.card.name).join(", ")}`
      : "debug AI mulligan: keep hand"
    : humanMulliganComplete
      ? "debug AI mulligan: waiting for AI decision"
      : "debug AI mulligan: no decision yet";
  const selectedLabel =
    selectedCardNames.length > 0
      ? `${selectedCardIds.length}/${maxSelection} select: ${selectedCardNames.join(", ")}`
      : `${selectedCardIds.length}/${maxSelection} selected.`;
  const compactStatus = lastError
    ? `${lastError.code}: ${lastError.message}`
    : humanMulliganAnimation
      ? `Redrawing ${humanMulliganAnimation.selectedCardIds.length} card${humanMulliganAnimation.selectedCardIds.length === 1 ? "" : "s"}.`
      : isAiMulliganChoosing
        ? "AI is choosing mulligans."
      : aiMulliganAnimation
      ? isMulliganReviewReady
        ? "AI mulligan complete."
        : aiMulliganAnimation.selectedCount > 0
          ? `AI redraws ${aiMulliganAnimation.selectedCount} card${aiMulliganAnimation.selectedCount === 1 ? "" : "s"} one at a time.`
          : "AI keeps hand."
      : humanMulliganComplete
        ? "Waiting for AI mulligan."
        : selectedMulliganMove
          ? selectedLabel
          : "That selection is not legal right now.";

  const toggleCard = (cardId: CardInstanceId) => {
    if (humanMulliganComplete || isHumanMulliganAnimating || isAiMulliganAnimating) {
      return;
    }
    dispatch(engineSelectedCardIdsSet(toggleMulliganSelection({ selectedCardIds, cardId, maxCards: maxSelection })));
  };

  const confirmMulligan = () => {
    if (canRequestStartMatch) {
      onRequestStartMatch?.();
      return;
    }
    if (!selectedMulliganMove) {
      return;
    }
    dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: humanSeat, cardIds: selectedMulliganMove.cardIds }));
  };

  return (
    <main className="gwent-authentic gwent-authentic--mulligan" data-testid="authentic-mulligan-screen">
      <div className="authentic-mulligan">
        <header className="authentic-mulligan__topbar">
          <div className="authentic-mulligan__top-actions">
            {onRequestSetup ? (
              <button
                type="button"
                className="authentic-button authentic-button--ghost authentic-mulligan__ghost"
                data-testid="authentic-mulligan-setup"
                onClick={onRequestSetup}
              >
                ← setup
              </button>
            ) : null}
          </div>
          <div className="authentic-mulligan__title">
            <h1>Mulligan</h1>
            <p>{statusLabel}</p>
          </div>
          <div className="authentic-mulligan__seed">
            <span>{seedLabel}</span>
            <strong>{aiPolicyId}</strong>
          </div>
        </header>

        <section className="authentic-mulligan__opponent" data-testid="authentic-mulligan-ai">
          {leaders ? <AuthenticLeaderCard leader={leaderCard(leaders, aiSeat, aiFaction)} size="match" /> : null}
          <div className="authentic-mulligan__seat-copy">
            <span>Opponent</span>
            <h2>AI · {aiFactionDisplay.name}</h2>
            <p>
              hand {aiHandCount} · deck {deckCounts[aiSeat]} · discard {discardCounts[aiSeat]}
            </p>
          </div>
          <div
            className={`authentic-mulligan__hidden-hand${isAiMulliganAnimating ? " is-ai-mulligan-animating" : ""}${
              isAiKeepAnimating ? " is-ai-keep-animating" : ""
            }`}
            aria-label={`Opponent hand has ${aiHandCount} cards`}
          >
            {hiddenHandBacks(aiHandCount).map((index) => {
              const aiAnimationSelectedCount = aiMulliganAnimation?.selectedCount ?? 0;
              const aiRedrawSlotStart = Math.max(0, aiHandCount - aiAnimationSelectedCount);
              const aiRedrawSlotIndex = index - aiRedrawSlotStart;
              const aiRedrawsThisSlot = Boolean(
                isAiSwapAnimating && aiAnimationSelectedCount > 0 && aiRedrawSlotIndex >= 0,
              );
              const debugHeldCard = debugRevealAiCards ? debugAiSlotCards[index] : null;
              const debugRedrawnCard = debugRevealAiCards ? debugSelectedAiRuntimeCards[aiRedrawSlotIndex] : null;
              const debugDrawnCard = debugRevealAiCards ? debugDrawnAiRuntimeCards[aiRedrawSlotIndex] : null;
              return (
                <span
                  key={index}
                  className={`authentic-mulligan__hidden-card-slot${aiRedrawsThisSlot ? " is-ai-redrawn" : ""}`}
                  data-testid="authentic-ai-mulligan-back"
                  data-ai-mulligan-state={aiRedrawsThisSlot ? "redrawn" : "held"}
                  data-ai-redraw-order={aiRedrawsThisSlot ? aiRedrawSlotIndex : undefined}
                  style={{ "--authentic-ai-wave-index": index } as React.CSSProperties}
                >
                  {aiRedrawsThisSlot ? (
                    <>
                      <span className="authentic-mulligan__hidden-back authentic-mulligan__hidden-back--out">
                        {debugRedrawnCard ? (
                          <AuthenticCard card={debugRedrawnCard.card} size="md" testId="authentic-ai-debug-card" />
                        ) : (
                          <AuthenticCardBack size="md" faction={aiFaction} label="Opponent hidden hand card" />
                        )}
                      </span>
                      <span
                        className="authentic-mulligan__hidden-back authentic-mulligan__hidden-back--in"
                        aria-hidden="true"
                      >
                        {debugDrawnCard ? (
                          <AuthenticCard card={debugDrawnCard.card} size="md" testId="authentic-ai-debug-card" />
                        ) : (
                          <AuthenticCardBack size="md" faction={aiFaction} label="Opponent replacement hidden hand card" />
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="authentic-mulligan__hidden-back authentic-mulligan__hidden-back--held">
                      {debugHeldCard ? (
                        <AuthenticCard card={debugHeldCard.card} size="md" testId="authentic-ai-debug-card" />
                      ) : (
                        <AuthenticCardBack size="md" faction={aiFaction} label="Opponent hidden hand card" />
                      )}
                    </span>
                  )}
                </span>
              );
            })}
            <strong>{aiHandCount}</strong>
          </div>
          {debugRevealAiCards ? (
            <div className="authentic-mulligan__debug" data-testid="authentic-ai-mulligan-debug">
              <span>debug</span>
              <p>{debugAiDecisionLabel}</p>
              <p>AI hand: {debugAiSlotCards.map((entry) => entry.card.name).join(", ") || "empty"}</p>
            </div>
          ) : null}
          {isAiMulliganChoosing ? (
            <div className="authentic-mulligan__thinking" data-testid="authentic-ai-mulligan-thinking" aria-live="polite">
              <span>AI choosing mulligans</span>
              <i aria-hidden="true" />
              <i aria-hidden="true" />
              <i aria-hidden="true" />
            </div>
          ) : null}
        </section>

        <section className="authentic-mulligan__hand-panel">
          <div className="authentic-mulligan__human-context" data-testid="authentic-mulligan-human-context">
            {leaders ? <AuthenticLeaderCard leader={leaderCard(leaders, humanSeat, humanFaction)} size="match" /> : null}
            <div>
              <span>Your opening hand</span>
              <h2>{humanFactionDisplay.name}</h2>
              <p>
                choose {maxSelection} at a time · redraws left {Math.max(0, 2 - (match?.seats[humanSeat].mulligansUsed ?? 0))} · deck{" "}
                {deckCounts[humanSeat]} · discard {discardCounts[humanSeat]}
              </p>
            </div>
          </div>

          <div className="authentic-mulligan__cards" data-testid="authentic-mulligan-hand">
            {humanRuntimeCards.map((entry) => {
              const selected = selectedCardIds.includes(entry.key);
              const replacementIndex = humanMulliganAnimation?.drawnCardIds.indexOf(entry.key) ?? -1;
              const redrawnCard = replacementIndex >= 0 ? humanAnimationSelectedCards[replacementIndex] : null;
              return (
                <div
                  key={entry.key}
                  className={`authentic-mulligan__card${selected ? " is-selected" : ""}${redrawnCard ? " is-human-redrawn" : ""}`}
                  title={entry.card.name}
                  data-human-mulligan-state={redrawnCard ? "redrawn" : "held"}
                >
                  {redrawnCard ? (
                    <span className="authentic-mulligan__human-swap">
                      <span className="authentic-mulligan__human-swap-card authentic-mulligan__human-swap-card--out">
                        <AuthenticCard card={redrawnCard.card} size="md" testId="authentic-mulligan-card" />
                      </span>
                      <span className="authentic-mulligan__human-swap-card authentic-mulligan__human-swap-card--in">
                        <AuthenticCard
                          card={entry.card}
                          size="md"
                          selected={selected}
                          testId="authentic-mulligan-card"
                          onClick={() => toggleCard(entry.key)}
                        />
                      </span>
                    </span>
                  ) : (
                    <AuthenticCard
                      card={entry.card}
                      size="md"
                      selected={selected}
                      testId="authentic-mulligan-card"
                      onClick={() => toggleCard(entry.key)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="authentic-mulligan__actionbar">
          <p data-testid="authentic-mulligan-status">{compactStatus}</p>
          <button
            type="button"
            className="authentic-button authentic-button--primary authentic-button--flow"
            data-testid="authentic-confirm-mulligan"
            data-presentation-locked={isPresentationLocked ? "true" : undefined}
            disabled={!canRequestStartMatch && (!canConfirm || isPresentationLocked)}
            onClick={confirmMulligan}
          >
            {canRequestStartMatch
              ? "start match"
              : isHumanMulliganAnimating
              ? "redrawing"
              : isAiMulliganChoosing
                ? "ai choosing"
                : isAiMulliganAnimating
                  ? isMulliganReviewReady
                    ? "ready"
                    : "revealing"
                  : humanMulliganComplete
                    ? "waiting"
                    : primaryLabel}
          </button>
        </footer>
      </div>
    </main>
  );
};

export default AuthenticMulliganScreen;
