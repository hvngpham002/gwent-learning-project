import React, { useCallback, useEffect, useMemo } from "react";

import { getEngineSeedFromSearch } from "@/appMode";
import type { CardInstanceId, EngineCommand, SeatId } from "@/game/core";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectEngineAiHandCount,
  selectEngineAiSeat,
  selectEngineBoardRows,
  selectEngineCanHumanAct,
  selectEngineCurrentSeat,
  selectEngineDeckCounts,
  selectEngineDiscardCounts,
  selectEngineGameWinner,
  selectEngineHumanHand,
  selectEngineHumanSeat,
  selectEngineLastError,
  selectEngineLeaderStatus,
  selectEngineLegalMovesForHuman,
  selectEngineMatch,
  selectEnginePrompt,
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
  describePlayTarget,
  getPromptOptionMoves,
  getPlayableCardIds,
  getPlayMovesForCard,
  getUseLeaderMoves,
  shouldDisableLeaderAction,
  shouldDisableHandCard,
} from "./engine/playMoveHelpers";
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

const EngineCardTile: React.FC<{
  card: EngineCardViewModel;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ card, selected = false, disabled = true, onClick }) => (
  <button
    type="button"
    className={`engine-card${selected ? " engine-card--selected" : ""}`}
    disabled={disabled}
    onClick={onClick}
    title={`${card.name} (${card.sourceId})`}
  >
    <img src={card.image} alt={card.name} className="engine-card__image" />
    <span className="engine-card__name">{card.name}</span>
    <span className="engine-card__meta">{cardKindLabel(card)}</span>
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

const commandLabel = (command: Exclude<EngineCommand, { type: "StartMatch" }>) => {
  if (command.type === "ChooseMulligan") return "ChooseMulligan";
  if (command.type === "PlayCard") return "PlayCard";
  if (command.type === "Pass") return "Pass";
  if (command.type === "ResolveRoundEnd") return "ResolveRoundEnd";
  if (command.type === "ChoosePromptOption") return "ChoosePromptOption";
  return command.type;
};

const eventLabel = (eventType: string) => eventType.replace(/_/g, " ");

const EngineGameManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const engine = useAppSelector(selectEngineState);
  const match = useAppSelector(selectEngineMatch);
  const status = useAppSelector(selectEngineStatus);
  const humanSeat = useAppSelector(selectEngineHumanSeat);
  const aiSeat = useAppSelector(selectEngineAiSeat);
  const currentSeat = useAppSelector(selectEngineCurrentSeat);
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
          <p>
            Seed {String(seed ?? startSeed ?? "default")} · phase {match?.phase ?? "idle"} · round {match?.round ?? "-"} ·
            turn {currentSeat ? SEAT_LABELS[currentSeat] : "-"} · status {status}
          </p>
        </div>
        <button type="button" className="engine-action" onClick={startNewGame}>
          New Game
        </button>
      </header>

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
              {selectedCardId
                ? `${selectedPlayMoves.length} legal target${selectedPlayMoves.length === 1 ? "" : "s"}`
                : `${playableCardIds.size} playable card${playableCardIds.size === 1 ? "" : "s"}`}
            </p>
            <div className="engine-target-actions">
              {selectedPlayMoves.map((move) => (
                <button
                  key={move.moveId}
                  type="button"
                  className="engine-action"
                  onClick={() => playCard(move.moveId)}
                  title={move.label}
                >
                  {move.metadata.cardName}: {describePlayTarget(move, visibleCardsById)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {match?.phase === "round_end" ? (
          <button type="button" className="engine-action" disabled={!canResolveRound} onClick={resolveRound}>
            Resolve Round
          </button>
        ) : null}
        {match?.phase === "game_end" ? (
          <div className="engine-control-panel">
            <h2>Game End</h2>
            <p>Winner: {winner === "draw" ? "Draw" : winner ? SEAT_LABELS[winner] : "Unknown"}</p>
          </div>
        ) : null}
        {prompt ? (
          <div className="engine-control-panel">
            <h2>{promptView?.title ?? prompt.kind}</h2>
            {promptView?.sourceLabel ? <p>{promptView.sourceLabel}</p> : null}
            {promptView?.options.length ? null : <p>No legal prompt options for the human seat.</p>}
            {promptView?.options.map((move) => (
              <button key={move.moveId} type="button" className="engine-action" onClick={() => choosePromptOption(move.moveId)}>
                {move.label}
              </button>
            ))}
          </div>
        ) : null}
        {lastError ? <p className="engine-error">{lastError.code}: {lastError.message}</p> : null}
      </section>

      <section className="engine-hand" aria-label="Human hand">
        <h2>Human Hand</h2>
        <div className="engine-card-row">
          {humanHand.map((card) => (
            <EngineCardTile
              key={card.instanceId}
              card={card}
              selected={
                match?.phase === "mulligan"
                  ? selectedCardIds.includes(card.instanceId)
                  : selectedCardId === card.instanceId
              }
              disabled={
                match?.phase === "mulligan"
                  ? match.seats[humanSeat].mulliganComplete
                  : shouldDisableHandCard({
                      phase: match?.phase,
                      canHumanAct,
                      promptOpen: Boolean(prompt),
                      playableCardIds,
                      cardId: card.instanceId,
                    })
              }
              onClick={() => selectHandCard(card.instanceId)}
            />
          ))}
        </div>
      </section>

      <section className="engine-events" aria-label="Recent engine commands">
        <h2>Recent Commands</h2>
        {engine.commandHistory.slice(-5).map((record) => (
          <span key={record.sequence}>
            #{record.sequence} {commandLabel(record.command)} {record.status}
          </span>
        ))}
        {engine.lastTransactionEvents.slice(-4).map((event, index) => (
          <span key={`${event.type}-${index}`}>event: {eventLabel(event.type)}</span>
        ))}
      </section>
    </main>
  );
};

export default EngineGameManager;
