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
  selectEngineDiscardCards,
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
} from "@/store/selectors/engineSelectors";
import { engineSelectedCardIdsSet, engineSelectedCardSet, engineSelectionCleared } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, resolveEngineRoundEnd, startEngineMatch } from "@/store/thunks/engineThunks";

import {
  buildPromptViewModel,
  describeLeaderMove,
  getPlayableCardIds,
  getPlayMovesForCard,
  getPromptOptionMoves,
  getUseLeaderMoves,
  shouldDisableLeaderAction,
} from "../game/engine/playMoveHelpers";
import {
  buildMatchStatusBanner,
  ENGINE_AI_POLICY_ID,
  getHandCardState,
  groupTargetActions,
  summarizeCommandHistory,
  summarizeEvents,
  summarizeRoundEnd,
  summarizeRoundHistory,
} from "../game/engine/engineShellViewModels";
import { getLegalHeuristicAiCommand } from "../game/engine/legalHeuristicAiController";
import AuthenticCard from "./AuthenticCard";
import AuthenticCardBack from "./AuthenticCardBack";
import {
  buildAuthenticSeatSummary,
  buildVisibleCardLookup,
  getBoardRowTargetsByKey,
  orderBoardRowsForAuthenticTable,
  toRuntimeCard,
  type AuthenticBoardRowViewModel,
  type AuthenticRuntimeCardViewModel,
  type AuthenticSeatSummaryViewModel,
} from "./matchViewModel";
import { getAbilityDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import "./authentic-match.css";

const SEAT_LABELS: Record<SeatId, string> = {
  seat_a: "Human",
  seat_b: "AI",
};

const sameCardSelection = (left: readonly CardInstanceId[], right: readonly CardInstanceId[]) => {
  if (left.length !== right.length) {
    return false;
  }
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((cardId, index) => cardId === rightSorted[index]);
};

const abilitySummary = (card: AuthenticRuntimeCardViewModel | null) => {
  const primaryAbility = card?.card.abilities.find((ability) => ability !== "none");
  return primaryAbility ? getAbilityDisplay(primaryAbility).name : "No ability";
};

const TopBar: React.FC<{
  seedLabel: string;
  roundLabel: string;
  actorLabel: string;
  phaseLabel: string;
  nextAction: string;
  onNewGame: () => void;
}> = ({ seedLabel, roundLabel, actorLabel, phaseLabel, nextAction, onNewGame }) => (
  <header className="authentic-match__topbar">
    <button type="button" className="authentic-match__ghost-button" onClick={onNewGame}>
      New game
    </button>
    <div className="authentic-match__title-block">
      <h1>Gwent</h1>
      <p>
        {roundLabel} · {actorLabel} · {phaseLabel}
      </p>
    </div>
    <div className="authentic-match__seed">
      <span>{seedLabel}</span>
      <strong>{ENGINE_AI_POLICY_ID}</strong>
    </div>
    <p className="authentic-match__next-action">{nextAction}</p>
  </header>
);

const ScoreCard: React.FC<{
  seat: AuthenticSeatSummaryViewModel;
  leaderName: string;
  leaderImage: string;
  leaderAbility: string;
  leaderUsed: boolean;
  active: boolean;
}> = ({ seat, leaderName, leaderImage, leaderAbility, leaderUsed, active }) => (
  <article className={`authentic-score-card${active ? " is-active" : ""}`} data-testid={`authentic-seat-${seat.role}`}>
    <img src={leaderImage} alt="" className="authentic-score-card__leader" />
    <div className="authentic-score-card__body">
      <div>
        <h2>{seat.label}</h2>
        <p>{seat.factionName}</p>
      </div>
      <strong>{seat.score}</strong>
    </div>
    <p className="authentic-score-card__leader-text">
      {leaderName} · {leaderAbility} · {leaderUsed ? "used" : "ready"}
    </p>
    <p className="authentic-score-card__meta">
      gems {seat.gems} · hand {seat.handCount} · deck {seat.deckCount} · discard {seat.discardCount} ·{" "}
      {seat.passed ? "passed" : "active"}
    </p>
  </article>
);

const PilePair: React.FC<{
  seat: AuthenticSeatSummaryViewModel;
  topDiscard: AuthenticRuntimeCardViewModel | null;
}> = ({ seat, topDiscard }) => (
  <div className="authentic-piles">
    <div className="authentic-pile">
      <AuthenticCardBack size="xs" faction={seat.faction} label={`${seat.label} deck`} />
      <span>{seat.deckCount}</span>
      <strong>Deck</strong>
    </div>
    <div className="authentic-pile">
      {topDiscard ? <AuthenticCard card={topDiscard.card} size="xs" /> : <AuthenticCardBack size="xs" variant="discard" label={`${seat.label} discard`} />}
      <span>{seat.discardCount}</span>
      <strong>Discard</strong>
    </div>
  </div>
);

const WeatherSummary: React.FC<{ cards: readonly AuthenticRuntimeCardViewModel[] }> = ({ cards }) => (
  <section className="authentic-panel authentic-weather">
    <h2>Weather</h2>
    <div className="authentic-weather__cards">
      {cards.length === 0 ? <span>Clear skies</span> : null}
      {cards.map((card) => (
        <AuthenticCard key={card.key} card={card.card} size="xs" />
      ))}
    </div>
  </section>
);

const BoardRow: React.FC<{
  row: AuthenticBoardRowViewModel;
  legalTargetMoveId?: string;
  onTargetClick: (moveId: string) => void;
}> = ({ row, legalTargetMoveId, onTargetClick }) => {
  const content = (
    <>
      <div className="authentic-board-row__label">
        <span>{row.rowGlyph}</span>
        <strong>{row.rowName}</strong>
      </div>
      <div className="authentic-board-row__cards">
        {row.horn ? <AuthenticCard key={row.horn.key} card={row.horn.card} size="xs" /> : null}
        {row.units.length === 0 && !row.horn ? <span className="authentic-board-row__empty">empty</span> : null}
        {row.units.map((unit) => (
          <AuthenticCard key={unit.key} card={unit.card} size="xs" />
        ))}
      </div>
      <div className="authentic-board-row__score">{row.score}</div>
    </>
  );

  if (legalTargetMoveId) {
    return (
      <button
        type="button"
        className={`authentic-board-row authentic-board-row--${row.side} is-legal-target`}
        data-testid="authentic-board-row-target"
        onClick={() => onTargetClick(legalTargetMoveId)}
      >
        {content}
      </button>
    );
  }

  return <div className={`authentic-board-row authentic-board-row--${row.side}`}>{content}</div>;
};

const BoardTable: React.FC<{
  rows: readonly AuthenticBoardRowViewModel[];
  legalTargets: ReadonlyMap<string, { moveId: string }>;
  onTargetClick: (moveId: string) => void;
}> = ({ rows, legalTargets, onTargetClick }) => (
  <section className="authentic-board-table" aria-label="Authentic board">
    {rows.map((row, index) => (
      <React.Fragment key={row.key}>
        {index === 3 ? <div className="authentic-board-table__divider" aria-hidden="true" /> : null}
        <BoardRow row={row} legalTargetMoveId={legalTargets.get(row.key)?.moveId} onTargetClick={onTargetClick} />
      </React.Fragment>
    ))}
  </section>
);

const HandStrip: React.FC<{
  cards: readonly AuthenticRuntimeCardViewModel[];
  selectedCardId: CardInstanceId | null;
  selectedCardIds: readonly CardInstanceId[];
  phase: string | undefined;
  playableCardIds: ReadonlySet<CardInstanceId>;
  disabledByCardId: ReadonlyMap<CardInstanceId, string | null>;
  onCardClick: (cardId: CardInstanceId) => void;
}> = ({ cards, selectedCardId, selectedCardIds, phase, playableCardIds, disabledByCardId, onCardClick }) => (
  <section className="authentic-hand" data-testid="authentic-human-hand">
    <div className="authentic-hand__label">hand · {cards.length}</div>
    <div className="authentic-hand__cards">
      {cards.map((entry) => {
        const selected = phase === "mulligan" ? selectedCardIds.includes(entry.key) : selectedCardId === entry.key;
        const disabledReason = disabledByCardId.get(entry.key);
        return (
          <div
            key={entry.key}
            className={`authentic-hand__card${playableCardIds.has(entry.key) && !disabledReason ? " is-playable" : ""}${
              disabledReason ? " is-disabled" : ""
            }`}
            title={disabledReason ?? entry.card.name}
          >
            <AuthenticCard
              card={entry.card}
              size="sm"
              selected={selected}
              dimmed={Boolean(disabledReason)}
              testId="authentic-hand-card"
              onClick={() => onCardClick(entry.key)}
            />
          </div>
        );
      })}
    </div>
  </section>
);

const InspectorPanel: React.FC<{ selected: AuthenticRuntimeCardViewModel | null }> = ({ selected }) => (
  <section className="authentic-panel authentic-inspector">
    <h2>Inspector</h2>
    {selected ? (
      <>
        <AuthenticCard card={selected.card} size="md" />
        <h3>{selected.card.name}</h3>
        <p>
          {selected.card.kind} · strength {selected.card.strength} · {abilitySummary(selected)}
        </p>
        {selected.card.description ? <p>{selected.card.description}</p> : null}
      </>
    ) : (
      <p>Select a playable card to inspect legal actions.</p>
    )}
  </section>
);

const ActionPanel: React.FC<{
  targetGroups: ReturnType<typeof groupTargetActions>;
  onPlayMove: (moveId: string) => void;
  canPass: boolean;
  onPass: () => void;
  leaderLabel: string;
  leaderDisabled: boolean;
  onUseLeader: () => void;
  mulliganLabel: string | null;
  canConfirmMulligan: boolean;
  onConfirmMulligan: () => void;
  roundEndLabel: string | null;
  canResolveRound: boolean;
  onResolveRound: () => void;
}> = ({
  targetGroups,
  onPlayMove,
  canPass,
  onPass,
  leaderLabel,
  leaderDisabled,
  onUseLeader,
  mulliganLabel,
  canConfirmMulligan,
  onConfirmMulligan,
  roundEndLabel,
  canResolveRound,
  onResolveRound,
}) => (
  <section className="authentic-panel authentic-actions">
    <h2>Actions</h2>
    {mulliganLabel ? (
      <div className="authentic-actions__block">
        <p>{mulliganLabel}</p>
        <button type="button" data-testid="authentic-confirm-mulligan" disabled={!canConfirmMulligan} onClick={onConfirmMulligan}>
          Confirm
        </button>
      </div>
    ) : null}
    <div className="authentic-actions__block">
      <p>{leaderLabel}</p>
      <button type="button" disabled={leaderDisabled} onClick={onUseLeader}>
        Use Leader
      </button>
    </div>
    <button type="button" data-testid="authentic-pass" disabled={!canPass} onClick={onPass}>
      Pass Round
    </button>
    {roundEndLabel ? (
      <button type="button" data-testid="authentic-resolve-round" disabled={!canResolveRound} onClick={onResolveRound}>
        {roundEndLabel}
      </button>
    ) : null}
    <div className="authentic-target-groups" data-testid="authentic-target-groups">
      {targetGroups.length === 0 ? <p>No selected-card target actions.</p> : null}
      {targetGroups.map((group) => (
        <div key={group.key} className="authentic-target-group">
          <h3>{group.label}</h3>
          {group.actions.map((action) => (
            <button
              key={action.moveId}
              type="button"
              data-testid="authentic-target-action"
              title={action.title}
              onClick={() => onPlayMove(action.moveId)}
            >
              {action.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  </section>
);

const PromptPanel: React.FC<{
  promptTitle: string | null;
  ownerLabel: string | null;
  sourceLabel: string | null;
  isAiPrompt: boolean;
  options: readonly { moveId: string; label: string }[];
  onChoose: (moveId: string) => void;
}> = ({ promptTitle, ownerLabel, sourceLabel, isAiPrompt, options, onChoose }) => (
  <section className="authentic-panel authentic-prompt" data-testid="authentic-prompt">
    <h2>{promptTitle ?? "Prompt"}</h2>
    {ownerLabel ? <p>Owner: {ownerLabel}</p> : null}
    {sourceLabel ? <p>{sourceLabel}</p> : null}
    {isAiPrompt ? <p>AI resolving prompt from legal moves.</p> : null}
    {!isAiPrompt && options.length === 0 ? <p>No legal prompt options for your seat.</p> : null}
    {options.map((option) => (
      <button key={option.moveId} type="button" onClick={() => onChoose(option.moveId)}>
        {option.label}
      </button>
    ))}
  </section>
);

const BattleLog: React.FC<{ lines: readonly string[] }> = ({ lines }) => (
  <section className="authentic-panel authentic-log" data-testid="authentic-recent-activity">
    <h2>Battle Log</h2>
    {lines.length === 0 ? <p>No commands yet.</p> : null}
    {lines.map((line, index) => (
      <span key={`${line}-${index}`} data-testid="authentic-activity-line">
        {line}
      </span>
    ))}
  </section>
);

const AuthenticMatchScreen: React.FC = () => {
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
  const discardCards = useAppSelector(selectEngineDiscardCards);
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
  const selectedCard = useMemo(() => humanHand.find((card) => card.instanceId === selectedCardId) ?? null, [humanHand, selectedCardId]);
  const selectedAuthenticCard = useMemo(() => (selectedCard ? toRuntimeCard(selectedCard) : null), [selectedCard]);
  const leaderMoves = useMemo(() => getUseLeaderMoves(humanMoves), [humanMoves]);
  const leaderMove = leaderMoves[0] ?? null;
  const promptMoves = useMemo(() => getPromptOptionMoves(humanMoves), [humanMoves]);

  const publicCards = useMemo(
    () => [
      ...humanHand,
      ...weatherCards,
      ...discardCards.seat_a,
      ...discardCards.seat_b,
      ...boardRows.flatMap((row) => [...row.units, ...(row.horn ? [row.horn] : [])]),
    ],
    [boardRows, discardCards, humanHand, weatherCards],
  );
  const visibleCardsById = useMemo(() => buildVisibleCardLookup(publicCards), [publicCards]);
  const targetGroups = useMemo(() => groupTargetActions(selectedPlayMoves, visibleCardsById), [selectedPlayMoves, visibleCardsById]);
  const rowTargets = useMemo(() => getBoardRowTargetsByKey(selectedPlayMoves), [selectedPlayMoves]);
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
    () => summarizeEvents({ events: engine.lastTransactionEvents.slice(-4), seatLabels: SEAT_LABELS, publicCardLookup: visibleCardsById }),
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
  const humanLeaderUsed = leaders?.[humanSeat].used ?? true;
  const humanLeaderStatus = leaders?.[humanSeat] ?? null;
  const leaderAbilityDisplay = getLeaderAbilityDisplay(humanLeaderStatus?.ability);
  const leaderActionLabel =
    leaderMove || !humanLeaderStatus
      ? describeLeaderMove(leaderMove)
      : `${humanLeaderStatus.name}: ${leaderAbilityDisplay.name} (${humanLeaderStatus.used ? "used" : humanLeaderStatus.abilityStatus})`;
  const disableLeaderAction = shouldDisableLeaderAction({
    phase: match?.phase,
    canHumanAct,
    promptOpen: Boolean(prompt),
    leaderUsed: humanLeaderUsed,
    leaderMove,
  });

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
    dispatch(dispatchEngineCommand({ type: "UseLeader", seatId: humanSeat, target: leaderMove.target }));
  }, [dispatch, humanSeat, leaderMove]);

  const playCard = useCallback(
    (moveId: string) => {
      const move = selectedPlayMoves.find((candidate) => candidate.moveId === moveId);
      if (!move) {
        return;
      }
      dispatch(dispatchEngineCommand({ type: "PlayCard", seatId: humanSeat, cardId: move.sourceCardId, target: move.target }));
    },
    [dispatch, humanSeat, selectedPlayMoves],
  );

  const handCards = useMemo(() => humanHand.map(toRuntimeCard), [humanHand]);
  const disabledByCardId = useMemo(
    () =>
      new Map(
        humanHand.map((card) => {
          const state = getHandCardState({
            phase: match?.phase,
            isMulliganComplete: match?.seats[humanSeat].mulliganComplete ?? false,
            canHumanAct,
            promptOpen: Boolean(prompt),
            playableCardIds,
            cardId: card.instanceId,
            humanPassed: match?.seats[humanSeat].passed ?? false,
          });
          return [card.instanceId, state.reasonLabel] as const;
        }),
      ),
    [canHumanAct, humanHand, humanSeat, match, playableCardIds, prompt],
  );

  const seatSummaries = useMemo(() => {
    if (!match || !score) {
      return null;
    }
    return {
      human: buildAuthenticSeatSummary({
        seatId: humanSeat,
        role: "human",
        faction: match.seats[humanSeat].faction,
        gems: match.seats[humanSeat].gems,
        passed: match.seats[humanSeat].passed,
        handCards: humanHand,
        deckCount: deckCounts[humanSeat],
        discardCount: discardCounts[humanSeat],
        score: score.totalBySeat[humanSeat],
      }),
      ai: buildAuthenticSeatSummary({
        seatId: aiSeat,
        role: "ai",
        faction: match.seats[aiSeat].faction,
        gems: match.seats[aiSeat].gems,
        passed: match.seats[aiSeat].passed,
        handCards: [],
        hiddenHandCount: aiHandCount,
        deckCount: deckCounts[aiSeat],
        discardCount: discardCounts[aiSeat],
        score: score.totalBySeat[aiSeat],
      }),
    };
  }, [aiHandCount, aiSeat, deckCounts, discardCounts, humanHand, humanSeat, match, score]);

  const orderedRows = useMemo(
    () =>
      score
        ? orderBoardRowsForAuthenticTable({
            rows: boardRows,
            humanSeat,
            rowScores: score.rowTotalsBySeat,
          })
        : [],
    [boardRows, humanSeat, score],
  );
  const weatherRuntimeCards = useMemo(() => weatherCards.map(toRuntimeCard), [weatherCards]);
  const topHumanDiscard = useMemo(() => discardCards[humanSeat].at(-1) ?? null, [discardCards, humanSeat]);
  const topAiDiscard = useMemo(() => discardCards[aiSeat].at(-1) ?? null, [aiSeat, discardCards]);
  const logLines = useMemo(
    () => [...recentCommands.map((record) => record.label), ...recentEvents.map((event) => `event: ${event.label}`)],
    [recentCommands, recentEvents],
  );
  const winnerLabel =
    match?.phase === "game_end" ? (winner === "draw" ? "Draw" : winner ? `${SEAT_LABELS[winner]} wins` : "Finished") : null;

  return (
    <main className="gwent-authentic gwent-authentic--match" data-testid="authentic-match-screen">
      <div className="authentic-match">
        <TopBar
          seedLabel={`Seed ${String(seed ?? startSeed ?? "default")}`}
          roundLabel={statusBanner.roundLabel}
          actorLabel={statusBanner.actorLabel}
          phaseLabel={statusBanner.phaseLabel}
          nextAction={statusBanner.errorLabel ?? statusBanner.nextAction}
          onNewGame={startNewGame}
        />

        <div className="authentic-match__layout">
          <aside className="authentic-match__left-rail">
            {seatSummaries && leaders ? (
              <>
                <ScoreCard
                  seat={seatSummaries.ai}
                  leaderName={leaders[aiSeat].name}
                  leaderImage={leaders[aiSeat].image}
                  leaderAbility={getLeaderAbilityDisplay(leaders[aiSeat].ability).name}
                  leaderUsed={leaders[aiSeat].used}
                  active={match?.currentTurn === aiSeat}
                />
                <PilePair seat={seatSummaries.ai} topDiscard={topAiDiscard ? toRuntimeCard(topAiDiscard) : null} />
                <WeatherSummary cards={weatherRuntimeCards} />
                <PilePair seat={seatSummaries.human} topDiscard={topHumanDiscard ? toRuntimeCard(topHumanDiscard) : null} />
                <ScoreCard
                  seat={seatSummaries.human}
                  leaderName={leaders[humanSeat].name}
                  leaderImage={leaders[humanSeat].image}
                  leaderAbility={getLeaderAbilityDisplay(leaders[humanSeat].ability).name}
                  leaderUsed={leaders[humanSeat].used}
                  active={match?.currentTurn === humanSeat}
                />
              </>
            ) : null}
          </aside>

          <section className="authentic-match__center">
            <BoardTable rows={orderedRows} legalTargets={rowTargets} onTargetClick={playCard} />
            <HandStrip
              cards={handCards}
              selectedCardId={selectedCardId}
              selectedCardIds={selectedCardIds}
              phase={match?.phase}
              playableCardIds={playableCardIds}
              disabledByCardId={disabledByCardId}
              onCardClick={selectHandCard}
            />
          </section>

          <aside className="authentic-match__right-rail">
            <InspectorPanel selected={selectedAuthenticCard} />
            <ActionPanel
              targetGroups={targetGroups}
              onPlayMove={playCard}
              canPass={canPass}
              onPass={pass}
              leaderLabel={leaderActionLabel}
              leaderDisabled={disableLeaderAction}
              onUseLeader={useLeader}
              mulliganLabel={match?.phase === "mulligan" ? `${selectedCardIds.length}/2 selected for mulligan` : null}
              canConfirmMulligan={canConfirmMulligan}
              onConfirmMulligan={confirmMulligan}
              roundEndLabel={match?.phase === "round_end" ? roundEndSummary?.resolveLabel ?? "Resolve Round" : null}
              canResolveRound={canResolveRound}
              onResolveRound={resolveRound}
            />
            {prompt ? (
              <PromptPanel
                promptTitle={promptView?.title ?? prompt.kind}
                ownerLabel={SEAT_LABELS[prompt.seatId]}
                sourceLabel={promptView?.sourceLabel ?? null}
                isAiPrompt={prompt.seatId === aiSeat}
                options={prompt.seatId === humanSeat ? (promptView?.options ?? []) : []}
                onChoose={choosePromptOption}
              />
            ) : null}
            {roundEndSummary && match?.phase === "round_end" ? (
              <section className="authentic-panel authentic-round-end">
                <h2>Round End</h2>
                <p>{roundEndSummary.label}</p>
              </section>
            ) : null}
            {winnerLabel ? (
              <section className="authentic-panel authentic-round-end">
                <h2>Game End</h2>
                <p>
                  {winnerLabel} · final gems {match?.seats.seat_a.gems}-{match?.seats.seat_b.gems}
                </p>
              </section>
            ) : null}
            {roundHistoryView.length > 0 ? (
              <section className="authentic-panel authentic-round-history">
                <h2>Rounds</h2>
                {roundHistoryView.map((round) => (
                  <span key={round.key}>
                    {round.label} · {round.scoreLabel} · {round.gemLossLabel}
                  </span>
                ))}
              </section>
            ) : null}
            <BattleLog lines={logLines} />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default AuthenticMatchScreen;
