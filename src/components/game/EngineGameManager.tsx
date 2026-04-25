import React, { useCallback, useEffect, useMemo } from "react";

import { getEngineSeedFromSearch } from "@/appMode";
import type { CardInstanceId, SeatId } from "@/game/core";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectEngineAiHandCount,
  selectEngineAiSeat,
  selectEngineBoardRows,
  selectEngineCanHumanAct,
  selectEngineDeckCounts,
  selectEngineDiscardCounts,
  selectEngineGameWinner,
  selectEngineHumanHand,
  selectEngineHumanSeat,
  selectEngineLastError,
  selectEngineLeaderStatus,
  selectEngineLegalMovesForHuman,
  selectEngineLock,
  selectEngineMatch,
  selectEnginePrompt,
  selectEngineRoundHistory,
  selectEngineScoreBreakdown,
  selectEngineSeed,
  selectEngineSelectedCardId,
  selectEngineSelectedCardIds,
  selectEngineState,
  selectEngineStatus,
  selectEngineWeatherCards,
  type EngineBoardRowViewModel,
  type EngineCardViewModel,
} from "@/store/selectors/engineSelectors";
import { engineSelectedCardIdsSet, engineSelectedCardSet, engineSelectionCleared } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, resolveEngineRoundEnd, startEngineMatch } from "@/store/thunks/engineThunks";

import {
  buildPromptViewModel,
  describeLeaderMove,
  getPromptOptionMoves,
  getPlayableCardIds,
  getPlayMovesForCard,
  getUseLeaderMoves,
  shouldDisableLeaderAction,
} from "./engine/playMoveHelpers";
import {
  buildMatchStatusBanner,
  ENGINE_AI_POLICY_ID,
  getHandCardState,
  groupTargetActions,
  summarizeCommandHistory,
  summarizeEvents,
  summarizeRoundEnd,
  summarizeRoundHistory,
} from "./engine/engineShellViewModels";
import { getLegalHeuristicAiCommand } from "./engine/legalHeuristicAiController";
import "@/styles/components/engine-game.css";

const ROW_LABELS: Record<EngineBoardRowViewModel["row"], string> = {
  close: "Close",
  ranged: "Ranged",
  siege: "Siege",
};

const SEAT_LABELS: Record<SeatId, string> = {
  seat_a: "Human",
  seat_b: "AI",
};

const cardKindLabel = (card: EngineCardViewModel) =>
  card.kind === "unit" || card.kind === "hero" ? `${card.kind} ${card.printedStrength}` : card.kind;

const abilitySummary = (card: EngineCardViewModel) =>
  card.abilities.length > 0 ? card.abilities.map((ability) => ability.replace(/_/g, " ")).join(", ") : "none";

const EngineCardTile: React.FC<{
  card: EngineCardViewModel;
  selected?: boolean;
  disabled?: boolean;
  playable?: boolean;
  disabledReason?: string | null;
  onClick?: () => void;
}> = ({ card, selected = false, disabled = true, playable = false, disabledReason = null, onClick }) => (
  <button
    type="button"
    className={`engine-card${selected ? " engine-card--selected" : ""}${playable ? " engine-card--playable" : ""}${
      disabledReason ? " engine-card--disabled-reason" : ""
    }`}
    disabled={disabled}
    onClick={onClick}
    title={disabledReason ? `${card.name}: ${disabledReason}` : `${card.name} (${card.sourceId})`}
  >
    <img src={card.image} alt={card.name} className="engine-card__image" />
    <span className="engine-card__name">{card.name}</span>
    <span className="engine-card__meta">{cardKindLabel(card)}</span>
    {disabledReason ? <span className="engine-card__reason">{disabledReason}</span> : null}
  </button>
);

const sameCardSelection = (left: readonly CardInstanceId[], right: readonly CardInstanceId[]) => {
  if (left.length !== right.length) {
    return false;
  }
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((cardId, index) => cardId === rightSorted[index]);
};

const EngineGameManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const engine = useAppSelector(selectEngineState);
  const match = useAppSelector(selectEngineMatch);
  const status = useAppSelector(selectEngineStatus);
  const lock = useAppSelector(selectEngineLock);
  const humanSeat = useAppSelector(selectEngineHumanSeat);
  const aiSeat = useAppSelector(selectEngineAiSeat);
  const canHumanAct = useAppSelector(selectEngineCanHumanAct);
  const seed = useAppSelector(selectEngineSeed);
  const humanHand = useAppSelector(selectEngineHumanHand);
  const selectedCardId = useAppSelector(selectEngineSelectedCardId);
  const selectedCardIds = useAppSelector(selectEngineSelectedCardIds);
  const aiHandCount = useAppSelector(selectEngineAiHandCount);
  const boardRows = useAppSelector(selectEngineBoardRows);
  const weatherCards = useAppSelector(selectEngineWeatherCards);
  const deckCounts = useAppSelector(selectEngineDeckCounts);
  const discardCounts = useAppSelector(selectEngineDiscardCounts);
  const score = useAppSelector(selectEngineScoreBreakdown);
  const leaders = useAppSelector(selectEngineLeaderStatus);
  const prompt = useAppSelector(selectEnginePrompt);
  const roundHistory = useAppSelector(selectEngineRoundHistory);
  const winner = useAppSelector(selectEngineGameWinner);
  const lastError = useAppSelector(selectEngineLastError);
  const humanMoves = useAppSelector(selectEngineLegalMovesForHuman);

  const startSeed = useMemo(() => getEngineSeedFromSearch(window.location.search), []);

  useEffect(() => {
    if (!match) {
      dispatch(startEngineMatch({ seed: startSeed }));
    }
  }, [dispatch, match, startSeed]);

  useEffect(() => {
    const command = getLegalHeuristicAiCommand(engine, aiSeat, humanSeat);
    if (command) {
      dispatch(dispatchEngineCommand(command));
    }
  }, [aiSeat, dispatch, engine, humanSeat]);

  const startNewGame = useCallback(() => {
    dispatch(startEngineMatch({ seed: startSeed }));
  }, [dispatch, startSeed]);

  const toggleMulliganCard = useCallback(
    (cardId: CardInstanceId) => {
      const nextSelection = selectedCardIds.includes(cardId)
        ? selectedCardIds.filter((selectedId) => selectedId !== cardId)
        : selectedCardIds.length < 2
          ? [...selectedCardIds, cardId]
          : selectedCardIds;
      dispatch(engineSelectedCardIdsSet(nextSelection));
    },
    [dispatch, selectedCardIds],
  );

  const playableCardIds = useMemo(() => getPlayableCardIds(humanMoves), [humanMoves]);
  const selectedPlayMoves = useMemo(() => getPlayMovesForCard(humanMoves, selectedCardId), [humanMoves, selectedCardId]);
  const selectedCard = useMemo(
    () => humanHand.find((card) => card.instanceId === selectedCardId) ?? null,
    [humanHand, selectedCardId],
  );
  const leaderMoves = useMemo(() => getUseLeaderMoves(humanMoves), [humanMoves]);
  const leaderMove = leaderMoves[0] ?? null;
  const promptMoves = useMemo(() => getPromptOptionMoves(humanMoves), [humanMoves]);
  const visibleCardsById = useMemo(() => {
    const entries = [
      ...humanHand,
      ...weatherCards,
      ...boardRows.flatMap((row) => [...row.units, ...(row.horn ? [row.horn] : [])]),
    ].map((card) => [card.instanceId, { name: card.name }] as const);
    return new Map(entries);
  }, [boardRows, humanHand, weatherCards]);
  const humanLeaderUsed = leaders?.[humanSeat].used ?? true;
  const humanLeaderStatus = leaders?.[humanSeat] ?? null;
  const leaderActionLabel =
    leaderMove || !humanLeaderStatus
      ? describeLeaderMove(leaderMove)
      : `${humanLeaderStatus.name}: ${humanLeaderStatus.abilityName} (${humanLeaderStatus.used ? "used" : humanLeaderStatus.abilityStatus})`;
  const disableLeaderAction = shouldDisableLeaderAction({
    phase: match?.phase,
    canHumanAct,
    promptOpen: Boolean(prompt),
    leaderUsed: humanLeaderUsed,
    leaderMove,
  });
  const promptView = useMemo(
    () =>
      prompt
        ? buildPromptViewModel({
            promptMoves,
            promptKind: prompt.kind,
            sourceCardId: prompt.sourceCardId,
            cardLookup: visibleCardsById,
          })
        : null,
    [prompt, promptMoves, visibleCardsById],
  );
  const targetGroups = useMemo(
    () => groupTargetActions(selectedPlayMoves, visibleCardsById),
    [selectedPlayMoves, visibleCardsById],
  );
  const statusBanner = useMemo(
    () =>
      buildMatchStatusBanner({
        match,
        status,
        lock,
        humanSeat,
        aiSeat,
        canHumanAct,
        lastError,
        winner,
        seatLabels: SEAT_LABELS,
      }),
    [aiSeat, canHumanAct, humanSeat, lastError, lock, match, status, winner],
  );
  const recentCommands = useMemo(
    () =>
      summarizeCommandHistory({
        records: engine.commandHistory.slice(-6),
        aiSeat,
        seatLabels: SEAT_LABELS,
        publicCardLookup: visibleCardsById,
      }),
    [aiSeat, engine.commandHistory, visibleCardsById],
  );
  const recentEvents = useMemo(
    () => summarizeEvents({ events: engine.lastTransactionEvents.slice(-6), seatLabels: SEAT_LABELS, publicCardLookup: visibleCardsById }),
    [engine.lastTransactionEvents, visibleCardsById],
  );
  const roundEndSummary = useMemo(
    () =>
      score
        ? summarizeRoundEnd({
            scoreBySeat: score.totalBySeat,
            seatLabels: SEAT_LABELS,
          })
        : null,
    [score],
  );
  const roundHistoryView = useMemo(() => summarizeRoundHistory(roundHistory, SEAT_LABELS), [roundHistory]);

  useEffect(() => {
    if (!selectedCardId) {
      return;
    }

    const selectedStillInHand = humanHand.some((card) => card.instanceId === selectedCardId);
    const selectedStillPlayable = selectedPlayMoves.length > 0;
    if (match?.phase !== "mulligan" && (match?.phase !== "playing" || !selectedStillInHand || !selectedStillPlayable)) {
      dispatch(engineSelectionCleared());
    }
  }, [dispatch, humanHand, match?.phase, selectedCardId, selectedPlayMoves.length]);

  const selectHandCard = useCallback(
    (cardId: CardInstanceId) => {
      if (match?.phase === "mulligan" && !match.seats[humanSeat].mulliganComplete) {
        toggleMulliganCard(cardId);
        return;
      }

      if (match?.phase === "playing" && playableCardIds.has(cardId) && canHumanAct && !prompt) {
        dispatch(engineSelectedCardSet(selectedCardId === cardId ? null : cardId));
      }
    },
    [canHumanAct, dispatch, humanSeat, match, playableCardIds, prompt, selectedCardId, toggleMulliganCard],
  );

  const selectedMulliganMove = humanMoves.find(
    (move) => move.kind === "choose_mulligan" && sameCardSelection(move.cardIds, selectedCardIds),
  );
  const canConfirmMulligan = Boolean(match?.phase === "mulligan" && selectedMulliganMove);
  const canPass = humanMoves.some((move) => move.kind === "pass");
  const canResolveRound = humanMoves.some((move) => move.kind === "resolve_round_end");

  const confirmMulligan = useCallback(() => {
    if (selectedMulliganMove?.kind === "choose_mulligan") {
      dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: humanSeat, cardIds: selectedMulliganMove.cardIds }));
    }
  }, [dispatch, humanSeat, selectedMulliganMove]);

  const pass = useCallback(() => {
    dispatch(dispatchEngineCommand({ type: "Pass", seatId: humanSeat }));
  }, [dispatch, humanSeat]);

  const resolveRound = useCallback(() => {
    dispatch(resolveEngineRoundEnd(humanSeat));
  }, [dispatch, humanSeat]);

  const choosePromptOption = useCallback(
    (moveId: string) => {
      const move = promptMoves.find((candidate) => candidate.moveId === moveId);
      if (!move) {
        return;
      }
      dispatch(
        dispatchEngineCommand({
          type: "ChoosePromptOption",
          seatId: move.seatId,
          promptId: move.promptId,
          optionId: move.optionId,
        }),
      );
    },
    [dispatch, promptMoves],
  );

  const useLeader = useCallback(() => {
    if (!leaderMove) {
      return;
    }

    dispatch(
      dispatchEngineCommand({
        type: "UseLeader",
        seatId: humanSeat,
        target: leaderMove.target,
      }),
    );
  }, [dispatch, humanSeat, leaderMove]);

  const playCard = useCallback(
    (moveId: string) => {
      const move = selectedPlayMoves.find((candidate) => candidate.moveId === moveId);
      if (!move) {
        return;
      }

      dispatch(
        dispatchEngineCommand({
          type: "PlayCard",
          seatId: humanSeat,
          cardId: move.sourceCardId,
          target: move.target,
        }),
      );
    },
    [dispatch, humanSeat, selectedPlayMoves],
  );

  const rowsBySeat = useMemo(
    () => ({
      seat_a: boardRows.filter((row) => row.seatId === "seat_a"),
      seat_b: boardRows.filter((row) => row.seatId === "seat_b"),
    }),
    [boardRows],
  );

  return (
    <main className="engine-shell">
      <header className="engine-shell__header">
        <div>
          <h1>Engine Match</h1>
          <p>Seed {String(seed ?? startSeed ?? "default")} · AI {ENGINE_AI_POLICY_ID}</p>
        </div>
        <button type="button" className="engine-action" onClick={startNewGame}>
          New Game
        </button>
      </header>

      <section className="engine-status-banner" aria-label="Match status">
        <div className="engine-status-banner__meta">
          <span>{statusBanner.phaseLabel}</span>
          <span>{statusBanner.roundLabel}</span>
          <span>{statusBanner.actorLabel}</span>
          <span>{statusBanner.adapterLabel}</span>
        </div>
        <strong>{statusBanner.nextAction}</strong>
        {statusBanner.errorLabel ? <p className="engine-error">{statusBanner.errorLabel}</p> : null}
      </section>

      {match && (
        <section className="engine-status-grid" aria-label="Seat status">
          {(["seat_b", "seat_a"] as const).map((seatId) => (
            <article key={seatId} className="engine-seat">
              <img src={leaders?.[seatId].image} alt={leaders?.[seatId].name} className="engine-seat__leader" />
              <div>
                <h2>{SEAT_LABELS[seatId]}</h2>
                <p>
                  {match.seats[seatId].faction} · {leaders?.[seatId].name} · {leaders?.[seatId].used ? "used" : "ready"}
                </p>
                <p>
                  gems {match.seats[seatId].gems} · hand {seatId === aiSeat ? aiHandCount : humanHand.length} · deck{" "}
                  {deckCounts[seatId]} · discard {discardCounts[seatId]} · score {score?.totalBySeat[seatId] ?? 0} ·{" "}
                  {match.seats[seatId].passed ? "passed" : "active"}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="engine-board" aria-label="Engine board">
        <div className="engine-weather">
          <strong>Weather</strong>
          <div className="engine-card-row engine-card-row--compact">
            {weatherCards.length === 0 ? <span className="engine-empty">None</span> : null}
            {weatherCards.map((card) => (
              <EngineCardTile key={card.instanceId} card={card} />
            ))}
          </div>
        </div>
        {(["seat_b", "seat_a"] as const).map((seatId) => (
          <div key={seatId} className="engine-board-side">
            <h2>{SEAT_LABELS[seatId]} Board</h2>
            {rowsBySeat[seatId].map((row) => (
              <div key={`${seatId}-${row.row}`} className="engine-row">
                <div className="engine-row__label">
                  <strong>{ROW_LABELS[row.row]}</strong>
                  <span>{score?.rowTotalsBySeat[seatId][row.row] ?? 0}</span>
                </div>
                <div className="engine-card-row engine-card-row--compact">
                  {row.horn ? <EngineCardTile card={row.horn} /> : null}
                  {row.units.length === 0 && !row.horn ? <span className="engine-empty">Empty</span> : null}
                  {row.units.map((card) => (
                    <EngineCardTile key={card.instanceId} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="engine-controls" aria-label="Engine controls">
        {match?.phase === "mulligan" && !match.seats[humanSeat].mulliganComplete ? (
          <div className="engine-control-panel">
            <h2>Mulligan</h2>
            <p>{selectedCardIds.length}/2 selected</p>
            <button type="button" className="engine-action" disabled={!canConfirmMulligan} onClick={confirmMulligan}>
              Confirm
            </button>
          </div>
        ) : null}
        {match?.phase === "playing" ? (
          <div className="engine-control-panel engine-control-panel--compact">
            <h2>Leader</h2>
            <p>{leaderActionLabel}</p>
            <button type="button" className="engine-action" disabled={disableLeaderAction} onClick={useLeader}>
              Use Leader
            </button>
          </div>
        ) : null}
        {match?.phase === "playing" ? (
          <div className="engine-control-panel engine-control-panel--compact">
            <h2>Turn</h2>
            <button type="button" className="engine-action" disabled={!canPass} onClick={pass}>
              Pass
            </button>
          </div>
        ) : null}
        {match?.phase === "playing" && !prompt ? (
          <div className="engine-control-panel engine-play-panel">
            <h2>Card Play</h2>
            <p>
              {selectedCard
                ? `${selectedCard.name} · ${selectedCard.kind} · ${abilitySummary(selectedCard)}`
                : `${playableCardIds.size} playable card${playableCardIds.size === 1 ? "" : "s"}`}
            </p>
            {!selectedCard ? <p>Select a highlighted hand card to show legal target groups.</p> : null}
            <div className="engine-target-groups">
              {targetGroups.map((group) => (
                <div key={group.key} className="engine-target-group">
                  <h3>{group.label}</h3>
                  <div className="engine-target-actions">
                    {group.actions.map((action) => (
                      <button
                        key={action.moveId}
                        type="button"
                        className="engine-action"
                        onClick={() => playCard(action.moveId)}
                        title={action.title}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {match?.phase === "round_end" ? (
          <div className="engine-control-panel">
            <h2>Round End</h2>
            {roundEndSummary ? <p>{roundEndSummary.label}</p> : null}
            <button type="button" className="engine-action" disabled={!canResolveRound} onClick={resolveRound}>
              {roundEndSummary?.resolveLabel ?? "Resolve Round"}
            </button>
          </div>
        ) : null}
        {match?.phase === "game_end" ? (
          <div className="engine-control-panel">
            <h2>Game End</h2>
            <p>
              Winner: {winner === "draw" ? "Draw" : winner ? SEAT_LABELS[winner] : "Unknown"} · final gems{" "}
              {match.seats.seat_a.gems}-{match.seats.seat_b.gems}
            </p>
          </div>
        ) : null}
        {prompt ? (
          <div className="engine-control-panel">
            <h2>{promptView?.title ?? prompt.kind}</h2>
            <p>Owner: {SEAT_LABELS[prompt.seatId]}</p>
            {promptView?.sourceLabel ? <p>{promptView.sourceLabel}</p> : null}
            {prompt.seatId === aiSeat ? <p>AI resolving prompt from legal moves.</p> : null}
            {prompt.seatId === humanSeat && !promptView?.options.length ? <p>No legal prompt options for the human seat.</p> : null}
            {promptView?.options.map((move) => (
              <button key={move.moveId} type="button" className="engine-action" onClick={() => choosePromptOption(move.moveId)}>
                {move.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="engine-hand" aria-label="Human hand">
        <h2>Human Hand</h2>
        <div className="engine-card-row">
          {humanHand.map((card) => {
            const handState = getHandCardState({
              phase: match?.phase,
              isMulliganComplete: match?.seats[humanSeat].mulliganComplete ?? false,
              canHumanAct,
              promptOpen: Boolean(prompt),
              playableCardIds,
              cardId: card.instanceId,
              humanPassed: match?.seats[humanSeat].passed ?? false,
            });

            return (
              <EngineCardTile
                key={card.instanceId}
                card={card}
                selected={
                  match?.phase === "mulligan"
                    ? selectedCardIds.includes(card.instanceId)
                    : selectedCardId === card.instanceId
                }
                playable={match?.phase === "playing" && playableCardIds.has(card.instanceId) && !handState.disabled}
                disabled={handState.disabled}
                disabledReason={handState.reasonLabel}
                onClick={() => selectHandCard(card.instanceId)}
              />
            );
          })}
        </div>
      </section>

      {roundHistoryView.length > 0 ? (
        <section className="engine-round-history" aria-label="Round history">
          <h2>Round History</h2>
          <div className="engine-round-history__list">
            {roundHistoryView.map((round) => (
              <span key={round.key}>
                {round.label} · {round.scoreLabel} · {round.gemLossLabel}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="engine-events" aria-label="Recent engine commands">
        <h2>Recent Activity</h2>
        {recentCommands.map((record) => (
          <span key={record.key} className={record.isAiAction ? "engine-events__ai" : undefined}>
            {record.label}
          </span>
        ))}
        {recentEvents.map((event) => (
          <span key={event.key}>event: {event.label}</span>
        ))}
      </section>
    </main>
  );
};

export default EngineGameManager;
