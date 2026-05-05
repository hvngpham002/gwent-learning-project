import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getEngineSeedFromSearch } from "@/appMode";
import type { CardInstanceId, GameEvent, PlayCardMove, SeatId } from "@/game/core";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectEngineAiHandCount,
  selectEngineAiSeat,
  selectEngineBoardRows,
  selectEngineCanAiAct,
  selectEngineCanHumanAct,
  selectEngineDeckCounts,
  selectEngineDiscardCards,
  selectEngineDiscardCounts,
  selectEngineGameWinner,
  selectEngineHumanHand,
  selectEngineHumanSeat,
  selectEngineLastError,
  selectEngineLeaderStatus,
  selectEngineLegalMovesForAi,
  selectEngineLegalMovesForHuman,
  selectEngineLookThreeCardsReveal,
  selectEngineLock,
  selectEngineMatch,
  selectEnginePrompt,
  selectEngineRoundHistory,
  selectEngineScoreBreakdown,
  selectEngineSeed,
  selectEngineSelectedCardId,
  selectEngineState,
  selectEngineStatus,
  selectEngineWeatherCards,
} from "@/store/selectors/engineSelectors";
import { engineMatchCleared, engineSelectedCardSet, engineSelectionCleared, type EngineCommandRecord } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, resolveEngineRoundEnd, startEngineMatch } from "@/store/thunks/engineThunks";

import {
  getPlayableCardIds,
  getPlayMovesForCard,
  getPromptOptionMoves,
  getUseLeaderMoves,
} from "../game/engine/playMoveHelpers";
import {
  buildMatchStatusBanner,
  ENGINE_AI_POLICY_ID,
  getHandCardState,
  summarizeCommandHistory,
  summarizeEvents,
  summarizeRoundEnd,
  summarizeRoundHistory,
} from "../game/engine/engineShellViewModels";
import { getLegalHeuristicAiCommand } from "../game/engine/legalHeuristicAiController";
import AuthenticCard from "./AuthenticCard";
import AuthenticCardBack from "./AuthenticCardBack";
import AuthenticLeaderCard from "./AuthenticLeaderCard";
import AuthenticMulliganScreen from "./AuthenticMulliganScreen";
import { Alert } from "./alert";
import { ReturnToSetupModal } from "./modal/ReturnToSetupModal";
import { StartMatchModal } from "./modal/StartMatchModal";
import {
  buildAuthenticSeatSummary,
  buildLeaderActionViewModel,
  buildLeaderStatusViewModel,
  buildLookThreeCardsRevealViewModel,
  buildMatchCardInspection,
  buildMatchLeaderInspection,
  buildMatchLedgerViewModel,
  buildMedicPromptOptions,
  buildPromptPresentationViewModel,
  buildResolveRoundActionViewModel,
  buildSelectedCardDragTargetViewModel,
  buildSelectedCardTargetViewModel,
  buildWeatherRowOverlayViewModel,
  buildVisibleCardLookup,
  chooseDebugAiMulliganMove,
  getBoardCardState,
  groupDiscardCards,
  orderBoardRowsForAuthenticTable,
  toRuntimeCard,
  type AuthenticBoardRuntimeCardViewModel,
  type AuthenticBoardRowViewModel,
  type AuthenticRuntimeCardViewModel,
  type AuthenticSeatSummaryViewModel,
  type LeaderActionViewModel,
  type LeaderStatusViewModel,
  type LookThreeCardsRevealViewModel,
  type MatchCardInspectionOrigin,
  type MatchLedgerViewModel,
  type PromptPresentationViewModel,
  type ResolveRoundActionViewModel,
  type SelectedCardCardTargetViewModel,
  type SelectedCardRowHornTargetViewModel,
  type SelectedCardRowTargetViewModel,
  type SelectedCardTargetViewModel,
  type SelectedCardWeatherTargetViewModel,
  type WeatherRowOverlayViewModel,
} from "./matchViewModel";
import { setupConfigToStartEngineOptions, type AuthenticMatchSetupConfig } from "./preGameViewModel";
import { getAbilityDisplay, getLeaderAbilityDisplay } from "./displayMetadata";
import { dimensionsForSize } from "./cardViewModel";
import "./authentic-match.css";

const MATCH_CONTEXT_MENU_WIDTH = 200;
const MATCH_CONTEXT_MENU_HEIGHT = 92;
const HAND_DRAG_THRESHOLD_PX = 7;
const CARD_FLIGHT_CLEANUP_MS = 950;
const BOARD_CARD_SIZE = "xs" as const;
const BOARD_CARD_DIMENSIONS = dimensionsForSize(BOARD_CARD_SIZE);
const BOARD_HORN_SLOT_CARD_INSET_PX = 8;
const BOARD_HORN_SLOT_DIMENSIONS = {
  width: BOARD_CARD_DIMENSIONS.width + BOARD_HORN_SLOT_CARD_INSET_PX,
  height: BOARD_CARD_DIMENSIONS.height + BOARD_HORN_SLOT_CARD_INSET_PX,
};

const clampMatchMenuPosition = (x: number, y: number) => {
  if (typeof window === "undefined") {
    return { x, y };
  }
  const maxX = Math.max(8, window.innerWidth - MATCH_CONTEXT_MENU_WIDTH - 8);
  const maxY = Math.max(8, window.innerHeight - MATCH_CONTEXT_MENU_HEIGHT - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
};

interface MatchCardContextTarget {
  readonly cardInstanceId: CardInstanceId;
  readonly origin: MatchCardInspectionOrigin;
  readonly ownerLabel?: string;
  readonly row?: import("@/game/catalog").CatalogRow | null;
  readonly seatId?: SeatId;
}

interface MatchCardContextMenuState extends MatchCardContextTarget {
  readonly x: number;
  readonly y: number;
}

type MatchInspectTarget = MatchCardContextTarget;

interface MatchLeaderContextTarget {
  readonly seatId: SeatId;
}

interface MatchLeaderContextMenuState extends MatchLeaderContextTarget {
  readonly x: number;
  readonly y: number;
}

const SEAT_LABELS: Record<SeatId, string> = {
  seat_a: "Human",
  seat_b: "AI",
};

const SEAT_IDS = ["seat_a", "seat_b"] as const;

type CardMotion = "played" | "discarded" | "prompt-revived" | "scorched";

interface MatchRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

type HandDragState =
  | {
      readonly kind: "pending";
      readonly pointerId: number;
      readonly cardId: CardInstanceId;
      readonly card: AuthenticRuntimeCardViewModel;
      readonly startX: number;
      readonly startY: number;
      readonly currentX: number;
      readonly currentY: number;
      readonly offsetX: number;
      readonly offsetY: number;
      readonly sourceRect: MatchRect;
    }
  | {
      readonly kind: "dragging";
      readonly pointerId: number;
      readonly cardId: CardInstanceId;
      readonly card: AuthenticRuntimeCardViewModel;
      readonly startX: number;
      readonly startY: number;
      readonly currentX: number;
      readonly currentY: number;
      readonly offsetX: number;
      readonly offsetY: number;
      readonly sourceRect: MatchRect;
      readonly activeDropMoveId: string | null;
    };

interface CardFlightPresentation {
  readonly key: string;
  readonly moveId: string;
  readonly card: AuthenticRuntimeCardViewModel["card"];
  readonly from: MatchRect;
  readonly to: MatchRect;
}

interface PlayCardPresentationOptions {
  readonly sourceRect?: MatchRect | null;
  readonly targetRect?: MatchRect | null;
  readonly targetElement?: Element | null;
}

const rectFromDomRect = (rect: DOMRect): MatchRect => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildInsertionRect = (
  strip: HTMLElement,
  sourceRect: MatchRect,
  itemSelector: string,
): MatchRect => {
  const stripRect = strip.getBoundingClientRect();
  const targetWidth = Math.min(sourceRect.width * 0.72, 64);
  const targetHeight = Math.min(sourceRect.height * 0.72, Math.max(48, stripRect.height - 6));
  const itemRects = [...strip.querySelectorAll<HTMLElement>(itemSelector)]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  const lastRect = itemRects.at(-1);
  const leftBound = stripRect.left + targetWidth / 2 + 2;
  const rightBound = stripRect.right - targetWidth / 2 - 2;
  const defaultCenterX = stripRect.left + targetWidth / 2 + 4;
  const nextCenterX = lastRect
    ? lastRect.right + 6 + targetWidth / 2
    : defaultCenterX;
  const centerX = clampNumber(nextCenterX, leftBound, Math.max(leftBound, rightBound));
  const centerY = stripRect.top + stripRect.height / 2;
  return {
    left: centerX - targetWidth / 2,
    top: centerY - targetHeight / 2,
    width: targetWidth,
    height: targetHeight,
  };
};

const getPlayCardFlightTargetRect = (
  move: PlayCardMove,
  sourceRect: MatchRect,
  targetElement?: Element | null,
): MatchRect | null => {
  if (!targetElement) {
    return null;
  }
  if (move.target.kind === "board_row") {
    const rowElement =
      targetElement.closest<HTMLElement>('[data-testid="authentic-board-row"]') ??
      (targetElement instanceof HTMLElement ? targetElement : null);
    const cardStrip = rowElement?.querySelector<HTMLElement>(".authentic-board-row__cards");
    return cardStrip
      ? buildInsertionRect(
          cardStrip,
          sourceRect,
          '.authentic-board-row__horn-slot, [data-testid="authentic-effective-strength"], [data-testid="authentic-board-card-target"]',
        )
      : rectFromDomRect(targetElement.getBoundingClientRect());
  }
  if (move.target.kind === "weather") {
    const weatherElement =
      targetElement.closest<HTMLElement>(".authentic-weather") ??
      (targetElement instanceof HTMLElement ? targetElement : null);
    const weatherStrip = weatherElement?.querySelector<HTMLElement>(".authentic-weather__cards");
    return weatherStrip
      ? buildInsertionRect(weatherStrip, sourceRect, ".authentic-weather__card")
      : rectFromDomRect(targetElement.getBoundingClientRect());
  }
  return rectFromDomRect(targetElement.getBoundingClientRect());
};

const getDropMoveIdAtPoint = (x: number, y: number, allowedMoveIds: ReadonlySet<string>): string | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.elementFromPoint(x, y);
  const target = element?.closest<HTMLElement>("[data-drop-move-id]");
  const moveId = target?.dataset.dropMoveId ?? null;
  return moveId && allowedMoveIds.has(moveId) ? moveId : null;
};

const getDropElementForMoveId = (moveId: string | null): HTMLElement | null => {
  if (!moveId || typeof document === "undefined") {
    return null;
  }
  return document.querySelector<HTMLElement>(`[data-drop-move-id="${CSS.escape(moveId)}"]`);
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
  onReturnToPreGame?: () => void;
}> = ({ seedLabel, roundLabel, actorLabel, phaseLabel, nextAction, onNewGame, onReturnToPreGame }) => (
  <header className="authentic-match__topbar">
    <div className="authentic-match__top-actions">
      <button type="button" className="authentic-button authentic-button--ghost authentic-match__ghost-button" onClick={onNewGame}>
        rematch
      </button>
      {onReturnToPreGame ? (
        <button type="button" className="authentic-button authentic-button--ghost authentic-match__ghost-button" onClick={onReturnToPreGame}>
          setup
        </button>
      ) : null}
    </div>
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
  leaderStatus: LeaderStatusViewModel;
  leaderImage: string;
  active: boolean;
  onLeaderContextMenu: (event: React.MouseEvent) => void;
}> = ({
  seat,
  leaderStatus,
  leaderImage,
  active,
  onLeaderContextMenu,
}) => {
  const visibleGems = Math.max(0, Math.min(2, seat.gems));

  return (
    <article
      className={`authentic-score-card${active ? " is-active" : ""}`}
      data-testid={`authentic-seat-${seat.role}`}
      data-leader-cancelled-this-round={leaderStatus.showSuppressionBadge ? "true" : undefined}
      data-leader-state={leaderStatus.stateLabel}
    >
      <div
        className="authentic-score-card__leader"
        data-seat={seat.seatId}
        onContextMenu={onLeaderContextMenu}
      >
        <AuthenticLeaderCard
          leader={{
            sourceId: leaderStatus.sourceId,
            name: leaderStatus.leaderName,
            faction: seat.faction,
            abilityName: leaderStatus.abilityName,
            image: leaderImage,
          }}
          size="match"
        />
      </div>
      <div className="authentic-score-card__body">
        <div className="authentic-score-card__identity">
          <h2>{seat.label}</h2>
          <p>{seat.factionName}</p>
          <div className="authentic-score-card__resource-stack">
            <div
              className="authentic-score-card__life"
              data-testid={`authentic-life-gems-${seat.role}`}
              aria-label={`${visibleGems} of 2 gems remaining`}
            >
              {[0, 1].map((gemIndex) => {
                const intact = gemIndex < visibleGems;
                return (
                  <img
                    key={gemIndex}
                    className="authentic-score-card__life-gem"
                    src={intact ? "/images/ui/life-gem.png" : "/images/ui/life-gem-broken.png"}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    data-gem-state={intact ? "intact" : "broken"}
                  />
                );
              })}
            </div>
            <div
              className="authentic-score-card__resources"
              data-testid={`authentic-seat-resources-${seat.role}`}
              aria-label={`hand ${seat.handCount}, deck ${seat.deckCount}`}
            >
              <span className="authentic-score-card__resource" aria-label={`${seat.handCount} cards in hand`}>
                <span
                  className="authentic-score-card__resource-icon authentic-score-card__resource-icon--hand"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </span>
                <span className="authentic-score-card__resource-count">{seat.handCount}</span>
              </span>
              <span className="authentic-score-card__resource" aria-label={`${seat.deckCount} cards in deck`}>
                <span
                  className="authentic-score-card__resource-icon authentic-score-card__resource-icon--deck"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </span>
                <span className="authentic-score-card__resource-count">{seat.deckCount}</span>
              </span>
            </div>
          </div>
        </div>
        <strong>{seat.score}</strong>
      </div>
      <p className="authentic-score-card__leader-text">
        {leaderStatus.leaderName} · {leaderStatus.abilityName}
      </p>
      <div
        className="authentic-score-card__leader-status"
        data-testid={`authentic-leader-status-${seat.role}`}
      >
        <span className="authentic-score-card__leader-chip">{leaderStatus.stateLabel}</span>
        <span> · {leaderStatus.categoryLabel} · {leaderStatus.reason}</span>
        <span> · {seat.passed ? "passed" : "active"}</span>
      </div>
    </article>
  );
};

const PilePair: React.FC<{
  seat: AuthenticSeatSummaryViewModel;
  topDiscard: AuthenticRuntimeCardViewModel | null;
  onDiscardOpen: () => void;
}> = ({ seat, topDiscard, onDiscardOpen }) => (
  <div className="authentic-piles">
    <div className="authentic-pile">
      <AuthenticCardBack size="xs" faction={seat.faction} label={`${seat.label} deck`} />
      <span>{seat.deckCount}</span>
      <strong>Deck</strong>
    </div>
    <button
      type="button"
      className="authentic-pile authentic-pile--discard"
      data-testid={seat.role === "human" ? "authentic-discard-trigger-human" : "authentic-discard-trigger-ai"}
      onClick={onDiscardOpen}
      aria-label={`Open ${seat.label} discard pile`}
    >
      {topDiscard ? <AuthenticCard card={topDiscard.card} size="xs" /> : <AuthenticCardBack size="xs" variant="discard" label={`${seat.label} discard`} />}
      <span>{seat.discardCount}</span>
      <strong>Discard</strong>
    </button>
  </div>
);

const WeatherSummary: React.FC<{
  cards: readonly AuthenticRuntimeCardViewModel[];
  weatherTarget: SelectedCardWeatherTargetViewModel | null;
  activeDropMoveId: string | null;
  onTargetClick: (moveId: string, options?: PlayCardPresentationOptions) => void;
  onCardContextMenu: (event: React.MouseEvent, cardId: CardInstanceId) => void;
}> = ({ cards, weatherTarget, activeDropMoveId, onTargetClick, onCardContextMenu }) => (
  <section
    className={`authentic-panel authentic-weather${weatherTarget ? " is-legal-target" : ""}${
      weatherTarget && activeDropMoveId === weatherTarget.moveId ? " is-drop-active" : ""
    }`}
    data-testid={weatherTarget ? "authentic-weather-target" : undefined}
    data-weather-target={weatherTarget ? "true" : undefined}
    data-drop-move-id={weatherTarget?.moveId}
    data-drop-state={weatherTarget && activeDropMoveId === weatherTarget.moveId ? "active" : weatherTarget ? "idle" : undefined}
    aria-label={weatherTarget?.ariaLabel}
    onClick={(event) => {
      if (weatherTarget) {
        onTargetClick(weatherTarget.moveId, { targetElement: event.currentTarget });
      }
    }}
  >
    <h2>Weather</h2>
    <div className="authentic-weather__cards">
      {cards.length === 0 ? <span>Clear skies</span> : null}
      {cards.map((card) => (
        <div
          key={card.key}
          className="authentic-weather__card"
          data-source-id={card.card.sourceId}
          data-instance-id={card.key}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => onCardContextMenu(event, card.key)}
        >
          <AuthenticCard card={card.card} size="xs" />
        </div>
      ))}
    </div>
  </section>
);

const BoardRow: React.FC<{
  row: AuthenticBoardRowViewModel;
  weatherOverlay: WeatherRowOverlayViewModel;
  rowTarget: SelectedCardRowTargetViewModel | undefined;
  hornTarget: SelectedCardRowHornTargetViewModel | undefined;
  legalCardTargets: ReadonlyMap<CardInstanceId, SelectedCardCardTargetViewModel>;
  motionByCardId: ReadonlyMap<CardInstanceId, string>;
  activeDropMoveId: string | null;
  onTargetClick: (moveId: string, options?: PlayCardPresentationOptions) => void;
  onCardContextMenu: (event: React.MouseEvent, target: { cardId: CardInstanceId; origin: MatchCardInspectionOrigin; seatId: SeatId; row: import("@/game/catalog").CatalogRow }) => void;
}> = ({ row, weatherOverlay, rowTarget, hornTarget, legalCardTargets, motionByCardId, activeDropMoveId, onTargetClick, onCardContextMenu }) => {
  const renderBoardCard = (unit: AuthenticBoardRuntimeCardViewModel) => {
    const cardTarget = legalCardTargets.get(unit.key);
    const motion = motionByCardId.get(unit.key);
    const className = `authentic-board-card authentic-board-card--${unit.boardState.strengthState}${
      cardTarget ? " is-card-target" : ""
    }${
      cardTarget && activeDropMoveId === cardTarget.moveId ? " is-drop-active" : ""
    }`;
    const strengthTitle = unit.boardState.modifiers.join(", ") || "No active modifier";
    const content = <AuthenticCard card={unit.card} size="xs" />;

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onCardContextMenu(event, { cardId: unit.key, origin: "board", seatId: row.seatId, row: row.row });
    };

    if (!cardTarget) {
      return (
        <div
          key={unit.key}
          className={className}
          data-testid="authentic-effective-strength"
          data-strength-state={unit.boardState.strengthState}
          data-weather-affected={unit.boardState.weatherAffected ? "true" : undefined}
          data-card-motion={motion}
          data-source-id={unit.card.sourceId}
          data-instance-id={unit.key}
          title={strengthTitle}
          onContextMenu={handleContextMenu}
        >
          {content}
        </div>
      );
    }

    return (
      <button
        key={unit.key}
        type="button"
        className={className}
        data-testid="authentic-board-card-target"
        data-strength-state={unit.boardState.strengthState}
        data-weather-affected={unit.boardState.weatherAffected ? "true" : undefined}
        data-card-motion={motion}
        data-source-id={unit.card.sourceId}
        data-instance-id={unit.key}
        data-drop-move-id={cardTarget.moveId}
        data-drop-state={activeDropMoveId === cardTarget.moveId ? "active" : "idle"}
        title={strengthTitle}
        aria-label={cardTarget.ariaLabel}
        onClick={(event) => {
          event.stopPropagation();
          onTargetClick(cardTarget.moveId, { targetElement: event.currentTarget });
        }}
        onContextMenu={handleContextMenu}
      >
        {content}
      </button>
    );
  };

  const horn = row.horn;
  const handleHornContextMenu = horn
    ? (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onCardContextMenu(event, { cardId: horn.key, origin: "board", seatId: row.seatId, row: row.row });
      }
    : undefined;
  const handleHornSlotClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hornTarget) {
      return;
    }
    event.stopPropagation();
    onTargetClick(hornTarget.moveId, { targetElement: event.currentTarget });
  };

  const rowDropActive = Boolean(rowTarget && activeDropMoveId === rowTarget.moveId);
  const hornDropActive = Boolean(hornTarget && activeDropMoveId === hornTarget.moveId);
  const hasWeatherOverlay = weatherOverlay.effects.length > 0;
  const rowClassName = `authentic-board-row authentic-board-row--${row.side}${hasWeatherOverlay ? " has-weather-overlay" : ""}${rowTarget ? " is-legal-target" : ""}${
    rowDropActive || hornDropActive ? " is-drop-active" : ""
  }`;
  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rowTarget) {
      return;
    }
    onTargetClick(rowTarget.moveId, { targetElement: event.currentTarget });
  };

  return (
    <div
      className={rowClassName}
      data-testid="authentic-board-row"
      data-row-target={rowTarget ? "true" : undefined}
      data-row-key={row.key}
      data-weather-overlay={hasWeatherOverlay ? weatherOverlay.effects.join(" ") : undefined}
      data-drop-move-id={rowTarget?.moveId}
      data-drop-state={rowDropActive || hornDropActive ? "active" : rowTarget || hornTarget ? "idle" : undefined}
      aria-label={rowTarget?.ariaLabel}
      onClick={handleRowClick}
    >
      {hasWeatherOverlay ? (
        <div
          className="authentic-board-row__weather-overlays"
          aria-hidden="true"
          title={weatherOverlay.ariaLabel ?? undefined}
        >
          {weatherOverlay.effects.map((effect) => (
            <span
              key={effect}
              className={`authentic-board-row__weather-overlay authentic-board-row__weather-overlay--${effect}`}
              data-testid="authentic-row-weather-overlay"
              data-weather-effect={effect}
            />
          ))}
        </div>
      ) : null}
      <div className="authentic-board-row__label">
        <span>{row.rowGlyph}</span>
        <strong>{row.rowName}</strong>
      </div>
      <div className="authentic-board-row__cards">
        <div
          className={`authentic-board-row__horn-slot${horn ? " has-card" : ""}${hornTarget ? " is-legal-target" : ""}${
            hornDropActive ? " is-drop-active" : ""
          }`}
          data-testid={hornTarget ? "authentic-board-row-horn-target" : "authentic-board-row-horn-slot"}
          data-row-key={row.key}
          data-drop-move-id={hornTarget?.moveId}
          data-drop-state={hornDropActive ? "active" : hornTarget ? "idle" : undefined}
          aria-label={hornTarget?.ariaLabel ?? `${row.rowName} horn slot`}
          style={{
            "--authentic-board-row-horn-slot-width": `${BOARD_HORN_SLOT_DIMENSIONS.width}px`,
            "--authentic-board-row-horn-slot-height": `${BOARD_HORN_SLOT_DIMENSIONS.height}px`,
          } as React.CSSProperties}
          onClick={handleHornSlotClick}
          onContextMenu={handleHornContextMenu}
        >
          {horn ? (
            <div
              key={horn.key}
              className="authentic-board-row__horn"
              data-source-id={horn.card.sourceId}
              data-instance-id={horn.key}
            >
              <AuthenticCard card={horn.card} size={BOARD_CARD_SIZE} />
            </div>
          ) : (
            <img
              className="authentic-board-row__horn-slot-icon"
              src="/images/avatars/horn.png"
              alt=""
              draggable={false}
              aria-hidden="true"
            />
          )}
        </div>
        {row.units.length === 0 && !horn ? <span className="authentic-board-row__empty">empty</span> : null}
        {row.units.map(renderBoardCard)}
      </div>
      <div className="authentic-board-row__score">{row.score}</div>
    </div>
  );
};

const BoardTable: React.FC<{
  rows: readonly AuthenticBoardRowViewModel[];
  weatherCards: readonly AuthenticRuntimeCardViewModel[];
  rowTargets: ReadonlyMap<string, SelectedCardRowTargetViewModel>;
  rowHornTargets: ReadonlyMap<string, SelectedCardRowHornTargetViewModel>;
  legalCardTargets: ReadonlyMap<CardInstanceId, SelectedCardCardTargetViewModel>;
  motionByCardId: ReadonlyMap<CardInstanceId, string>;
  activeDropMoveId: string | null;
  onTargetClick: (moveId: string, options?: PlayCardPresentationOptions) => void;
  onCardContextMenu: (
    event: React.MouseEvent,
    target: { cardId: CardInstanceId; origin: MatchCardInspectionOrigin; seatId: SeatId; row: import("@/game/catalog").CatalogRow },
  ) => void;
}> = ({ rows, weatherCards, rowTargets, rowHornTargets, legalCardTargets, motionByCardId, activeDropMoveId, onTargetClick, onCardContextMenu }) => (
  <section className="authentic-board-table" aria-label="Authentic board">
    {rows.map((row, index) => {
      const weatherOverlay = buildWeatherRowOverlayViewModel({ row: row.row, weatherCards });
      return (
        <React.Fragment key={row.key}>
          {index === 3 ? <div className="authentic-board-table__divider" aria-hidden="true" /> : null}
          <BoardRow
            row={row}
            weatherOverlay={weatherOverlay}
            rowTarget={rowTargets.get(row.key)}
            hornTarget={rowHornTargets.get(row.key)}
            legalCardTargets={legalCardTargets}
            motionByCardId={motionByCardId}
            activeDropMoveId={activeDropMoveId}
            onTargetClick={onTargetClick}
            onCardContextMenu={onCardContextMenu}
          />
        </React.Fragment>
      );
    })}
  </section>
);

const HandStrip: React.FC<{
  cards: readonly AuthenticRuntimeCardViewModel[];
  selectedCardId: CardInstanceId | null;
  playableCardIds: ReadonlySet<CardInstanceId>;
  disabledByCardId: ReadonlyMap<CardInstanceId, string | null>;
  draggingCardId: CardInstanceId | null;
  onCardPointerDown: (event: React.PointerEvent<HTMLDivElement>, card: AuthenticRuntimeCardViewModel, draggable: boolean) => void;
  onCardPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onCardPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onCardPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  onCardClick: (cardId: CardInstanceId) => void;
  onCardContextMenu: (event: React.MouseEvent, cardId: CardInstanceId) => void;
  setCardElement: (cardId: CardInstanceId, element: HTMLDivElement | null) => void;
}> = ({
  cards,
  selectedCardId,
  playableCardIds,
  disabledByCardId,
  draggingCardId,
  onCardPointerDown,
  onCardPointerMove,
  onCardPointerUp,
  onCardPointerCancel,
  onCardClick,
  onCardContextMenu,
  setCardElement,
}) => (
  <section className="authentic-hand" data-testid="authentic-human-hand">
    <div className="authentic-hand__label">hand · {cards.length}</div>
    <div className="authentic-hand__cards">
      {cards.map((entry) => {
        const selected = selectedCardId === entry.key;
        const disabledReason = disabledByCardId.get(entry.key);
        const draggable = playableCardIds.has(entry.key) && !disabledReason;
        const dragging = draggingCardId === entry.key;
        return (
          <div
            key={entry.key}
            ref={(element) => setCardElement(entry.key, element)}
            className={`authentic-hand__card${draggable ? " is-playable" : ""}${
              disabledReason ? " is-disabled" : ""
            }${dragging ? " is-dragging" : ""}`}
            data-drag-state={dragging ? "dragging" : draggable ? "ready" : disabledReason ? "disabled" : "idle"}
            data-draggable-card={draggable ? "true" : undefined}
            title={disabledReason ?? entry.card.name}
            data-source-id={entry.card.sourceId}
            data-instance-id={entry.key}
            onPointerDown={(event) => onCardPointerDown(event, entry, draggable)}
            onPointerMove={onCardPointerMove}
            onPointerUp={onCardPointerUp}
            onPointerCancel={onCardPointerCancel}
            onContextMenu={(event) => onCardContextMenu(event, entry.key)}
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

const InspectorPanel: React.FC<{
  selected: AuthenticRuntimeCardViewModel | null;
  onInspectSelected?: () => void;
}> = ({ selected, onInspectSelected }) => (
  <section className="authentic-panel authentic-inspector" data-testid="authentic-selected-card-inspector">
    <h2>Inspector</h2>
    {selected ? (
      <>
        <AuthenticCard card={selected.card} size="md" />
        <h3>{selected.card.name}</h3>
        <p>
          {selected.card.kind} · strength {selected.card.strength} · {abilitySummary(selected)}
        </p>
        {selected.card.description ? <p>{selected.card.description}</p> : null}
        {onInspectSelected ? (
          <button
            type="button"
            className="authentic-button authentic-button--ghost authentic-button--compact"
            data-testid="authentic-inspector-inspect"
            onClick={onInspectSelected}
          >
            inspect details
          </button>
        ) : null}
      </>
    ) : (
      <p>Select a playable card to inspect legal actions.</p>
    )}
  </section>
);

const LEADER_CHOICE_MENU_ID = "authentic-leader-choice-menu";

interface ActionPanelLeaderProps {
  readonly status: LeaderStatusViewModel | null;
  readonly disabled: boolean;
  readonly action: LeaderActionViewModel;
  readonly choiceMenuOpen: boolean;
  readonly onActivate: () => void;
  readonly onChooseOption: (moveId: string) => void;
  readonly containerRef?: React.Ref<HTMLDivElement>;
}

const ActionPanel: React.FC<{
  selectedTargets: SelectedCardTargetViewModel;
  dragHintLabel: string | null;
  onPlayMove: (moveId: string) => void;
  canPass: boolean;
  onPass: () => void;
  leader: ActionPanelLeaderProps;
  resolveRoundAction: ResolveRoundActionViewModel;
  onResolveRound: () => void;
}> = ({
  selectedTargets,
  dragHintLabel,
  onPlayMove,
  canPass,
  onPass,
  leader,
  resolveRoundAction,
  onResolveRound,
}) => {
  const isChoice = leader.action.kind === "choice";
  const triggerLabel = leader.action.triggerLabel;
  const ariaExpanded = isChoice ? leader.choiceMenuOpen : undefined;
  const ariaControls = isChoice ? LEADER_CHOICE_MENU_ID : undefined;
  const statusLabel = leader.status
    ? `${leader.status.leaderName} · ${leader.status.reason}`
    : "leader unavailable";
  return (
    <section className="authentic-panel authentic-actions">
      <h2>Actions</h2>
      <div className="authentic-actions__block authentic-leader-action" ref={leader.containerRef}>
        <p>
          <span>{statusLabel}</span>
          {leader.status ? <em>{leader.status.categoryLabel} · {leader.status.stateLabel}</em> : null}
        </p>
        <button
          type="button"
          className="authentic-button authentic-button--secondary"
          data-testid="authentic-leader-action"
          disabled={leader.disabled}
          aria-haspopup={isChoice ? "menu" : undefined}
          aria-expanded={ariaExpanded}
          aria-controls={leader.choiceMenuOpen ? ariaControls : undefined}
          onClick={leader.onActivate}
        >
          {triggerLabel}
        </button>
        {isChoice && leader.choiceMenuOpen ? (
          <div
            id={LEADER_CHOICE_MENU_ID}
            className="authentic-leader-choice-menu"
            role="menu"
            aria-label={leader.action.menuLabel}
            data-testid="authentic-leader-choice-menu"
          >
            {leader.action.options.map((option) => (
              <button
                key={option.moveId}
                type="button"
                role="menuitem"
                className="authentic-button authentic-button--secondary authentic-leader-choice-option"
                data-testid="authentic-leader-choice-option"
                data-source-id={option.sourceId}
                onClick={() => leader.onChooseOption(option.moveId)}
              >
                <span className="authentic-leader-choice-option__name">{option.label.toLocaleLowerCase()}</span>
                {option.affectedRowsLabel ? (
                  <span className="authentic-leader-choice-option__rows">
                    {" · "}
                    {option.affectedRowsLabel.toLocaleLowerCase()}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button type="button" className="authentic-button authentic-button--secondary" data-testid="authentic-pass" disabled={!canPass} onClick={onPass}>
        pass round
      </button>
      {resolveRoundAction.visible ? (
        <div
          className="authentic-actions__block authentic-resolve-round-action"
          data-testid="authentic-resolve-round-block"
        >
          <button
            type="button"
            className="authentic-button authentic-button--primary"
            data-testid="authentic-resolve-round"
            disabled={!resolveRoundAction.enabled}
            onClick={onResolveRound}
            aria-describedby={
              !resolveRoundAction.enabled && resolveRoundAction.disabledReason
                ? "authentic-resolve-round-reason"
                : undefined
            }
          >
            {resolveRoundAction.label.toLocaleLowerCase()}
          </button>
          {!resolveRoundAction.enabled && resolveRoundAction.disabledReason ? (
            <p
              id="authentic-resolve-round-reason"
              className="authentic-resolve-round-action__reason"
              data-testid="authentic-resolve-round-reason"
            >
              {resolveRoundAction.disabledReason}
            </p>
          ) : null}
        </div>
      ) : null}
      <div
        className="authentic-target-groups"
        data-testid="authentic-target-groups"
        data-target-state={selectedTargets.state}
      >
        <p
          className="authentic-target-groups__hint"
          data-testid="authentic-target-hint"
          aria-live="polite"
        >
          {dragHintLabel ?? selectedTargets.rightRailLabel}
        </p>
        {selectedTargets.fallbackActions.length > 0 ? (
          <div className="authentic-target-group" data-testid="authentic-target-fallback">
            {selectedTargets.fallbackActions.map((action) => (
              <button
                key={action.moveId}
                type="button"
                className="authentic-button authentic-button--secondary authentic-button--compact"
                data-testid="authentic-target-action"
                title={action.title}
                aria-label={action.ariaLabel}
                onClick={() => onPlayMove(action.moveId)}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

const LookThreeCardsRevealDialog: React.FC<{
  view: LookThreeCardsRevealViewModel;
  onAcknowledge: (moveId: string) => void;
}> = ({ view, onAcknowledge }) => {
  const cardCount = view.cards.length;
  const titleId = "authentic-look-three-cards-dialog-title";
  return (
    <div
      className="authentic-modal authentic-look-three-cards-dialog"
      data-testid="authentic-look-three-cards-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <section className="authentic-look-three-cards-dialog__panel">
        <header className="authentic-look-three-cards-dialog__header">
          <h2 id={titleId}>
            {view.leaderName ? `${view.leaderName.toLocaleLowerCase()} · ` : ""}
            looking at {view.opponentLabel.toLocaleLowerCase()} hand
          </h2>
          <p>
            you may see {cardCount === 1 ? "1 card" : `${cardCount} cards`} once. dismissing closes the
            view permanently.
          </p>
        </header>
        <div className="authentic-look-three-cards-dialog__cards">
          {view.cards.map((entry) => (
            <div
              key={entry.key}
              className="authentic-look-three-cards-dialog__card"
              data-testid="authentic-look-three-cards-card"
              data-source-id={entry.card?.card.sourceId}
              data-instance-id={entry.card?.key}
            >
              {entry.card ? (
                <AuthenticCard card={entry.card.card} size="md" />
              ) : (
                <div className="authentic-look-three-cards-dialog__placeholder">
                  {entry.placeholderLabel ?? "Unknown card"}
                </div>
              )}
            </div>
          ))}
        </div>
        <footer className="authentic-look-three-cards-dialog__footer">
          <button
            type="button"
            className="authentic-button authentic-button--primary"
            data-testid="authentic-look-three-cards-ack"
            onClick={() => onAcknowledge(view.acknowledgeMoveId)}
          >
            {view.acknowledgeLabel.toLocaleLowerCase()}
          </button>
        </footer>
      </section>
    </div>
  );
};

const PromptPanel: React.FC<{
  prompt: PromptPresentationViewModel;
  ownerLabel: string | null;
  isAiPrompt: boolean;
  medicOptions: readonly ReturnType<typeof buildMedicPromptOptions>[number][];
  onChoose: (moveId: string) => void;
  onCardContextMenu: (event: React.MouseEvent, cardId: CardInstanceId) => void;
}> = ({ prompt, ownerLabel, isAiPrompt, medicOptions, onChoose, onCardContextMenu }) => (
  <section
    className={`authentic-panel authentic-prompt${medicOptions.length > 0 ? " authentic-prompt--medic" : ""}`}
    data-testid="authentic-prompt"
    data-prompt-kind={isAiPrompt ? "ai" : prompt.kind}
  >
    <h2>{prompt.title}</h2>
    {ownerLabel ? <p>Owner: {ownerLabel}</p> : null}
    {prompt.sourceLabel ? <p>{prompt.sourceLabel}</p> : null}
    {prompt.body ? <p>{prompt.body}</p> : null}
    {isAiPrompt ? <p data-testid="authentic-ai-prompt-pending">AI resolving prompt from legal moves.</p> : null}
    {!isAiPrompt && prompt.options.length === 0 ? <p>No legal prompt options for your seat.</p> : null}
    {medicOptions.length > 0
      ? (
          <div className="authentic-medic-options" data-testid="authentic-medic-prompt">
            {medicOptions.map((option) => (
              <button
                key={option.moveId}
                type="button"
                className="authentic-button authentic-button--tile authentic-medic-option"
                data-testid="authentic-medic-option"
                data-source-id={option.card?.card.sourceId}
                data-instance-id={option.card?.key}
                onClick={() => onChoose(option.moveId)}
                onContextMenu={(event) => {
                  if (!option.card) return;
                  onCardContextMenu(event, option.card.key);
                }}
              >
                {option.card ? <AuthenticCard card={option.card.card} size="xs" /> : null}
                <span>
                  <strong>{option.label.toLocaleLowerCase()}</strong>
                  <em>{option.meta.toLocaleLowerCase()}</em>
                </span>
              </button>
            ))}
          </div>
        )
      : prompt.options.map((option) => (
          <button
            key={option.moveId}
            type="button"
            className="authentic-button authentic-button--secondary"
            data-testid="authentic-prompt-option"
            onClick={() => onChoose(option.moveId)}
          >
            {option.label.toLocaleLowerCase()}
          </button>
        ))}
  </section>
);

const DiscardBrowser: React.FC<{
  ownerLabel: string;
  count: number;
  groups: ReturnType<typeof groupDiscardCards>;
  onClose: () => void;
  onCardContextMenu: (event: React.MouseEvent, cardId: CardInstanceId) => void;
}> = ({ ownerLabel, count, groups, onClose, onCardContextMenu }) => (
  <div className="authentic-modal" data-testid="authentic-discard-browser" role="dialog" aria-modal="true" aria-label={`${ownerLabel} discard pile`}>
    <section className="authentic-discard-browser">
      <header>
        <div>
          <span>Discard</span>
          <h2>
            {ownerLabel} · {count}
          </h2>
        </div>
        <button
          type="button"
          className="authentic-button authentic-button--ghost authentic-button--compact"
          data-testid="authentic-discard-close"
          onClick={onClose}
        >
          close
        </button>
      </header>
      {groups.length === 0 ? <p data-testid="authentic-discard-empty">The pile is empty.</p> : null}
      {groups.map((group) => (
        <section key={group.key} className="authentic-discard-group">
          <h3>{group.label}</h3>
          <div>
            {group.cards.map((entry) => (
              <div
                key={entry.key}
                className="authentic-discard-card"
                data-source-id={entry.card.sourceId}
                data-instance-id={entry.key}
                onContextMenu={(event) => onCardContextMenu(event, entry.key)}
              >
                <AuthenticCard card={entry.card} size="md" testId="authentic-discard-card" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </section>
  </div>
);

const RoundOverlay: React.FC<{
  ledger: MatchLedgerViewModel;
  onDismiss: () => void;
  onRematch: () => void;
  onChangeDeck?: () => void;
}> = ({ ledger, onDismiss, onRematch, onChangeDeck }) => {
  const isGameEnd = ledger.kind === "match_end";
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ledger.escapeDismisses) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ledger.escapeDismisses, onDismiss]);

  const handleAction = useCallback(
    (key: "next-round" | "rematch" | "setup" | "close") => {
      if (key === "rematch") {
        onRematch();
        return;
      }
      if (key === "setup" && onChangeDeck) {
        onChangeDeck();
        return;
      }
      onDismiss();
    },
    [onChangeDeck, onDismiss, onRematch],
  );

  return (
    <div
      ref={dialogRef}
      className="authentic-modal authentic-modal--round"
      data-testid="authentic-round-overlay"
      data-ledger-kind={ledger.kind}
      role="dialog"
      aria-modal="true"
      aria-labelledby="authentic-round-overlay-alert-title"
    >
      <Alert
        severity={isGameEnd ? "crown" : "info"}
        variant="ledger"
        className={`authentic-round-ledger${isGameEnd ? " authentic-round-ledger--game-end" : ""}`}
        eyebrow={ledger.eyebrow}
        title={ledger.title}
        body={
          isGameEnd ? (
            <div className="authentic-round-ledger__end-grid">
              <div>
                <div className="authentic-round-ledger__section-label">round history</div>
                <table
                  className="authentic-round-ledger__history-table"
                  data-testid="authentic-round-ledger-history"
                >
                  <thead>
                    <tr>
                      <th>rd</th>
                      <th>you</th>
                      <th>opp</th>
                      <th>·</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.historyRows.map((row) => (
                      <tr key={row.key} data-testid="authentic-round-ledger-history-row">
                        <td>{row.round}</td>
                        <td className={row.humanWon ? "authentic-round-ledger__winner" : undefined}>{row.humanScore}</td>
                        <td className={row.aiWon ? "authentic-round-ledger__winner" : undefined}>{row.aiScore}</td>
                        <td className={row.humanWon ? "authentic-round-ledger__winner" : undefined}>{row.resultMarker}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="authentic-round-ledger__section-label">standing</div>
                <div
                  className="authentic-round-ledger__standing"
                  data-testid="authentic-round-ledger-standing"
                >
                  {ledger.standingRows.map((row) => (
                    <div
                      key={row.key}
                      className="authentic-round-ledger__standing-row"
                      data-testid={`authentic-round-ledger-standing-${row.key}`}
                    >
                      <span>{row.label}</span>
                      <b>{row.value}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <table
                className="authentic-round-ledger__summary"
                data-testid="authentic-round-ledger-summary"
              >
                <tbody>
                  {ledger.summaryRows.map((row) => (
                    <tr key={row.key} data-testid={`authentic-round-ledger-summary-${row.key}`}>
                      <td>{row.label}</td>
                      <td className={row.emphasis === "win" ? "authentic-round-ledger__winner" : undefined}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ledger.nextStarterLabel ? (
                <p data-testid="authentic-round-ledger-next-starter">{ledger.nextStarterLabel}</p>
              ) : null}
            </>
          )
        }
        actions={ledger.actions.map((action) => ({
          label: action.label,
          onClick: () => handleAction(action.key),
          kind: action.kind,
          testId: action.testId,
        }))}
        testId="authentic-round-overlay-alert"
      />
    </div>
  );
};

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

const CardFlightLayer: React.FC<{
  flights: readonly CardFlightPresentation[];
  onFlightDone: (key: string) => void;
}> = ({ flights, onFlightDone }) => {
  if (flights.length === 0) {
    return null;
  }

  return (
    <div className="authentic-card-flight-layer" aria-hidden="true">
      {flights.map((flight) => {
        const fromCenterX = flight.from.left + flight.from.width / 2;
        const fromCenterY = flight.from.top + flight.from.height / 2;
        const toCenterX = flight.to.left + flight.to.width / 2;
        const toCenterY = flight.to.top + flight.to.height / 2;
        return (
          <div
            key={flight.key}
            className="authentic-card-flight"
            data-testid="authentic-card-flight"
            data-move-id={flight.moveId}
            style={{
              left: flight.from.left,
              top: flight.from.top,
              width: flight.from.width,
              height: flight.from.height,
              "--flight-x": `${toCenterX - fromCenterX}px`,
              "--flight-y": `${toCenterY - fromCenterY}px`,
              "--flight-mid-x": `${(toCenterX - fromCenterX) * 0.52}px`,
              "--flight-mid-y": `${(toCenterY - fromCenterY) * 0.52 - 34}px`,
            } as React.CSSProperties}
            onAnimationEnd={() => onFlightDone(flight.key)}
          >
            <AuthenticCard card={flight.card} size="sm" />
          </div>
        );
      })}
    </div>
  );
};

interface AuthenticMatchScreenProps {
  readonly setupConfig?: AuthenticMatchSetupConfig;
  readonly onReturnToPreGame?: () => void;
}

const setupKey = (config: AuthenticMatchSetupConfig | undefined, fallbackSeed: string | undefined) =>
  config
    ? `${config.humanDeckPresetId}|${config.opponentDeckPresetId}|${String(config.seed)}|${config.aiPolicyId}`
    : `direct|${String(fallbackSeed ?? "default")}`;

const HUMAN_MULLIGAN_ANIMATION_MS = 1450;
const AI_MULLIGAN_CARD_ANIMATION_MS = 1700;
const AI_MULLIGAN_CARD_STAGGER_MS = 1700;
const AI_MULLIGAN_KEEP_ANIMATION_MS = 1450;
const AI_MULLIGAN_THINKING_MS = 650;
const MULLIGAN_TOTAL_REDRAWS = 2;

const aiMulliganReviewDelay = (selectedCount: number) =>
  selectedCount > 0
    ? AI_MULLIGAN_CARD_ANIMATION_MS + Math.max(0, selectedCount - 1) * AI_MULLIGAN_CARD_STAGGER_MS
    : AI_MULLIGAN_KEEP_ANIMATION_MS;

interface MulliganExitAnimation {
  readonly key: string;
  readonly selectedCount: number;
  readonly selectedCardIds: readonly CardInstanceId[];
  readonly drawnCardIds: readonly CardInstanceId[];
  readonly baseHandCardIds: readonly CardInstanceId[];
}

interface HumanMulliganAnimation {
  readonly key: string;
  readonly selectedCardIds: readonly CardInstanceId[];
  readonly drawnCardIds: readonly CardInstanceId[];
}

interface AiMulliganBaseHand {
  readonly key: string;
  readonly cardIds: readonly CardInstanceId[];
}

type AppliedMulliganRecord = Omit<EngineCommandRecord, "command" | "status"> & {
  readonly status: "applied";
  readonly command: Extract<EngineCommandRecord["command"], { type: "ChooseMulligan" }>;
};

const latestAppliedMulligan = (
  records: readonly EngineCommandRecord[],
  seatId: SeatId,
  options: { preferRedraw?: boolean } = {},
): AppliedMulliganRecord | null => {
  let latest: AppliedMulliganRecord | null = null;
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (
      record.status === "applied" &&
      record.command.type === "ChooseMulligan" &&
      record.command.seatId === seatId
    ) {
      const mulliganRecord = record as AppliedMulliganRecord;
      if (!latest) {
        latest = mulliganRecord;
      }
      if (!options.preferRedraw || mulliganRecord.command.cardIds.length > 0) {
        return mulliganRecord;
      }
    }
  }
  return latest;
};

const latestAppliedMulliganRedrawBatch = (
  records: readonly EngineCommandRecord[],
  seatId: SeatId,
): AppliedMulliganRecord[] => {
  const batch: AppliedMulliganRecord[] = [];
  let foundLatestMulligan = false;

  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (
      record.status === "applied" &&
      record.command.type === "ChooseMulligan" &&
      record.command.seatId === seatId
    ) {
      foundLatestMulligan = true;
      const mulliganRecord = record as AppliedMulliganRecord;
      if (mulliganRecord.command.cardIds.length > 0) {
        batch.unshift(mulliganRecord);
      }
      continue;
    }

    if (foundLatestMulligan) {
      break;
    }
  }

  return batch;
};

const eventSlicesByCommandSequence = (
  records: readonly EngineCommandRecord[],
  eventLog: readonly GameEvent[],
) => {
  const totalCommandEventCount = records.reduce((total, record) => total + record.eventCount, 0);
  let eventOffset = Math.max(0, eventLog.length - totalCommandEventCount);
  const eventsBySequence = new Map<number, readonly GameEvent[]>();

  records.forEach((record) => {
    const eventSlice = eventLog.slice(eventOffset, eventOffset + record.eventCount);
    eventsBySequence.set(record.sequence, eventSlice);
    eventOffset += record.eventCount;
  });

  return eventsBySequence;
};

const isDebugAiMulliganEnabled = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("debugAiMulligan") === "1" || params.get("debugAiMulligan") === "true";
};

const getDebugAiMulliganCount = () => {
  const raw = new URLSearchParams(window.location.search).get("debugAiMulliganCount");
  if (raw === null) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, MULLIGAN_TOTAL_REDRAWS) : null;
};

const AuthenticMatchScreen: React.FC<AuthenticMatchScreenProps> = ({ setupConfig, onReturnToPreGame }) => {
  const dispatch = useAppDispatch();
  const [discardOpenSeat, setDiscardOpenSeat] = useState<SeatId | null>(null);
  const [dismissedRoundOverlayKey, setDismissedRoundOverlayKey] = useState<string | null>(null);
  const [pendingSetupConfirmation, setPendingSetupConfirmation] = useState(false);
  const [cardContextMenu, setCardContextMenu] = useState<MatchCardContextMenuState | null>(null);
  const [cardInspectTarget, setCardInspectTarget] = useState<MatchInspectTarget | null>(null);
  const [leaderContextMenu, setLeaderContextMenu] = useState<MatchLeaderContextMenuState | null>(null);
  const [leaderInspectSeat, setLeaderInspectSeat] = useState<SeatId | null>(null);
  const [leaderChoiceMenuOpen, setLeaderChoiceMenuOpen] = useState(false);
  const leaderActionRef = useRef<HTMLDivElement | null>(null);
  const handCardElementsRef = useRef(new Map<CardInstanceId, HTMLDivElement>());
  const suppressNextHandClickRef = useRef<CardInstanceId | null>(null);
  const dragStateRef = useRef<HandDragState | null>(null);
  const dragLegalMoveSignatureRef = useRef<string | null>(null);
  const updateHandDragFromPointerRef = useRef<(event: PointerEvent) => void>(() => undefined);
  const completeHandDragFromPointerRef = useRef<(event: PointerEvent) => void>(() => undefined);
  const cancelHandDragFromPointerRef = useRef<(event: PointerEvent) => void>(() => undefined);
  const [handDragState, setHandDragState] = useState<HandDragState | null>(null);
  const [cardFlights, setCardFlights] = useState<CardFlightPresentation[]>([]);
  const [mulliganExitAnimation, setMulliganExitAnimation] = useState<MulliganExitAnimation | null>(null);
  const [completedMulliganAnimationKey, setCompletedMulliganAnimationKey] = useState<string | null>(null);
  const [readyMulliganAnimationKey, setReadyMulliganAnimationKey] = useState<string | null>(null);
  const [humanMulliganAnimation, setHumanMulliganAnimation] = useState<HumanMulliganAnimation | null>(null);
  const [completedHumanMulliganAnimationKey, setCompletedHumanMulliganAnimationKey] = useState<string | null>(null);
  const [readyAiMulliganDecisionKey, setReadyAiMulliganDecisionKey] = useState<string | null>(null);
  const [aiMulliganBaseHand, setAiMulliganBaseHand] = useState<AiMulliganBaseHand | null>(null);
  const [isStartMatchModalDismissed, setStartMatchModalDismissed] = useState(false);
  const [matchPresentationRun, setMatchPresentationRun] = useState(0);
  const engine = useAppSelector(selectEngineState);
  const match = useAppSelector(selectEngineMatch);
  const status = useAppSelector(selectEngineStatus);
  const lock = useAppSelector(selectEngineLock);
  const humanSeat = useAppSelector(selectEngineHumanSeat);
  const aiSeat = useAppSelector(selectEngineAiSeat);
  const canHumanAct = useAppSelector(selectEngineCanHumanAct);
  const canAiAct = useAppSelector(selectEngineCanAiAct);
  const seed = useAppSelector(selectEngineSeed);
  const humanHand = useAppSelector(selectEngineHumanHand);
  const selectedCardId = useAppSelector(selectEngineSelectedCardId);
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
  const aiMoves = useAppSelector(selectEngineLegalMovesForAi);
  const lookThreeCardsRevealCards = useAppSelector(selectEngineLookThreeCardsReveal);

  const startSeed = useMemo(() => getEngineSeedFromSearch(window.location.search), []);
  const debugRevealAiMulligan = useMemo(() => isDebugAiMulliganEnabled(), []);
  const debugAiMulliganCount = useMemo(() => getDebugAiMulliganCount(), []);
  const activeSetupKey = setupKey(setupConfig, startSeed);
  const activeMatchKey = `${activeSetupKey}|run:${matchPresentationRun}`;
  const setSyncedHandDragState = useCallback((next: HandDragState | null) => {
    dragStateRef.current = next;
    if (!next) {
      dragLegalMoveSignatureRef.current = null;
    }
    setHandDragState(next);
  }, []);
  const cancelHandDrag = useCallback(() => {
    setSyncedHandDragState(null);
  }, [setSyncedHandDragState]);
  const setHandCardElement = useCallback((cardId: CardInstanceId, element: HTMLDivElement | null) => {
    if (element) {
      handCardElementsRef.current.set(cardId, element);
      return;
    }
    handCardElementsRef.current.delete(cardId);
  }, []);
  const finishCardFlight = useCallback((key: string) => {
    setCardFlights((current) => current.filter((flight) => flight.key !== key));
  }, []);

  useEffect(() => {
    setMulliganExitAnimation(null);
    setCompletedMulliganAnimationKey(null);
    setReadyMulliganAnimationKey(null);
    setHumanMulliganAnimation(null);
    setCompletedHumanMulliganAnimationKey(null);
    setReadyAiMulliganDecisionKey(null);
    setAiMulliganBaseHand(null);
    setStartMatchModalDismissed(false);
    setDismissedRoundOverlayKey(null);
    setSyncedHandDragState(null);
    setCardFlights([]);
    setMatchPresentationRun((current) => current + 1);
    if (setupConfig) {
      dispatch(startEngineMatch(setupConfigToStartEngineOptions(setupConfig)));
      return;
    }
    if (!match) {
      dispatch(startEngineMatch({ seed: startSeed }));
    }
    // activeSetupKey is included so local pre-game transitions always start the chosen setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeSetupKey, setSyncedHandDragState]);

  const latestAiMulliganRecord = useMemo(
    () => latestAppliedMulligan(engine.commandHistory, aiSeat, { preferRedraw: true }),
    [aiSeat, engine.commandHistory],
  );
  const latestAiMulliganRedrawBatch = useMemo(
    () => latestAppliedMulliganRedrawBatch(engine.commandHistory, aiSeat),
    [aiSeat, engine.commandHistory],
  );
  const commandEventsBySequence = useMemo(
    () => eventSlicesByCommandSequence(engine.commandHistory, engine.eventLog),
    [engine.commandHistory, engine.eventLog],
  );
  const latestHumanMulliganRecord = useMemo(
    () => latestAppliedMulligan(engine.commandHistory, humanSeat),
    [engine.commandHistory, humanSeat],
  );
  const pendingHumanMulliganAnimation = useMemo<HumanMulliganAnimation | null>(() => {
    if (!latestHumanMulliganRecord || latestHumanMulliganRecord.command.cardIds.length === 0) {
      return null;
    }
    const animationKey = `${activeMatchKey}|human|${latestHumanMulliganRecord.sequence}`;
    if (animationKey === completedHumanMulliganAnimationKey) {
      return null;
    }
    const mulliganChosen = engine.lastTransactionEvents.find(
      (event) => event.type === "mulligan_chosen" && event.seatId === humanSeat,
    );
    if (!mulliganChosen) {
      return null;
    }
    const drawnCardIds = engine.lastTransactionEvents.flatMap((event) =>
      event.type === "card_moved" &&
      event.reason === "mulligan_draw" &&
      event.to.kind === "hand" &&
      event.to.seat === humanSeat
        ? [event.cardId]
        : [],
    );
    if (drawnCardIds.length === 0) {
      return null;
    }
    return {
      key: animationKey,
      selectedCardIds: latestHumanMulliganRecord.command.cardIds,
      drawnCardIds,
    };
  }, [activeMatchKey, completedHumanMulliganAnimationKey, engine.lastTransactionEvents, humanSeat, latestHumanMulliganRecord]);
  const pendingMulliganExitAnimation = useMemo<MulliganExitAnimation | null>(() => {
    if (!latestAiMulliganRecord || match?.phase !== "playing") {
      return null;
    }
    const firstRedrawRecord = latestAiMulliganRedrawBatch[0] ?? null;
    const lastRedrawRecord = latestAiMulliganRedrawBatch[latestAiMulliganRedrawBatch.length - 1] ?? null;
    const animationKey = `${activeMatchKey}|${firstRedrawRecord?.sequence ?? latestAiMulliganRecord.sequence}-${
      lastRedrawRecord?.sequence ?? latestAiMulliganRecord.sequence
    }`;
    const selectedCardIds = latestAiMulliganRedrawBatch.flatMap((record) => record.command.cardIds);
    const drawnCardIds = latestAiMulliganRedrawBatch.flatMap((record) =>
      (commandEventsBySequence.get(record.sequence) ?? []).flatMap((event) =>
        event.type === "card_moved" &&
        event.reason === "mulligan_draw" &&
        event.to.kind === "hand" &&
        event.to.seat === aiSeat
          ? [event.cardId]
          : [],
      ),
    );
    if (animationKey === completedMulliganAnimationKey) {
      return null;
    }
    return {
      key: animationKey,
      selectedCount: selectedCardIds.length,
      selectedCardIds,
      drawnCardIds,
      baseHandCardIds: aiMulliganBaseHand?.key === `${activeMatchKey}|ai-mulligan-base` ? aiMulliganBaseHand.cardIds : [],
    };
  }, [
    activeMatchKey,
    aiMulliganBaseHand?.key,
    aiMulliganBaseHand?.cardIds,
    aiSeat,
    commandEventsBySequence,
    completedMulliganAnimationKey,
    latestAiMulliganRecord,
    latestAiMulliganRedrawBatch,
    match?.phase,
  ]);
  const visibleMulliganExitAnimation = mulliganExitAnimation ?? pendingMulliganExitAnimation;
  const visibleMulliganExitAnimationKey = visibleMulliganExitAnimation?.key ?? null;
  const isMulliganReviewReady = Boolean(
    visibleMulliganExitAnimationKey && readyMulliganAnimationKey === visibleMulliganExitAnimationKey,
  );
  const isStartMatchModalOpen = Boolean(
    visibleMulliganExitAnimation &&
      isMulliganReviewReady &&
      !isStartMatchModalDismissed,
  );
  const visibleHumanMulliganAnimation = humanMulliganAnimation ?? pendingHumanMulliganAnimation;
  const visibleHumanMulliganAnimationKey = visibleHumanMulliganAnimation?.key ?? null;
  const aiMulliganDecisionKey =
    match?.phase === "mulligan" &&
    match.seats[humanSeat].mulliganComplete &&
    !match.seats[aiSeat].mulliganComplete &&
    !visibleHumanMulliganAnimation &&
    !visibleMulliganExitAnimation &&
    !pendingSetupConfirmation
      ? `${activeMatchKey}|ai-thinking|${match.seats[aiSeat].mulligansUsed}`
      : null;
  const isAiMulliganChoosing = Boolean(
    aiMulliganDecisionKey && readyAiMulliganDecisionKey !== aiMulliganDecisionKey,
  );

  useEffect(() => {
    if (!aiMulliganDecisionKey || !match) {
      return;
    }
    const baseKey = `${activeMatchKey}|ai-mulligan-base`;
    setAiMulliganBaseHand((current) =>
      current?.key === baseKey ? current : { key: baseKey, cardIds: [...match.seats[aiSeat].hand] },
    );
  }, [activeMatchKey, aiMulliganDecisionKey, aiSeat, match]);

  useEffect(() => {
    if (!pendingHumanMulliganAnimation) {
      return;
    }
    setHumanMulliganAnimation((current) =>
      current?.key === pendingHumanMulliganAnimation.key ? current : pendingHumanMulliganAnimation,
    );
  }, [pendingHumanMulliganAnimation]);

  useEffect(() => {
    if (!visibleHumanMulliganAnimationKey || pendingSetupConfirmation) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setCompletedHumanMulliganAnimationKey(visibleHumanMulliganAnimationKey);
      setHumanMulliganAnimation((current) =>
        current?.key === visibleHumanMulliganAnimationKey ? null : current,
      );
    }, HUMAN_MULLIGAN_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pendingSetupConfirmation, visibleHumanMulliganAnimationKey]);

  useEffect(() => {
    if (!pendingMulliganExitAnimation) {
      return;
    }
    setMulliganExitAnimation((current) =>
      current?.key === pendingMulliganExitAnimation.key ? current : pendingMulliganExitAnimation,
    );
    setReadyMulliganAnimationKey((current) =>
      current === pendingMulliganExitAnimation.key ? current : null,
    );
  }, [pendingMulliganExitAnimation]);

  useEffect(() => {
    setStartMatchModalDismissed(false);
  }, [visibleMulliganExitAnimationKey]);

  useEffect(() => {
    if (!visibleMulliganExitAnimation || !visibleMulliganExitAnimationKey || pendingSetupConfirmation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setReadyMulliganAnimationKey(visibleMulliganExitAnimationKey);
    }, aiMulliganReviewDelay(visibleMulliganExitAnimation.selectedCount));

    return () => window.clearTimeout(timeoutId);
  }, [pendingSetupConfirmation, visibleMulliganExitAnimation, visibleMulliganExitAnimationKey]);

  useEffect(() => {
    if (!aiMulliganDecisionKey || readyAiMulliganDecisionKey === aiMulliganDecisionKey || pendingSetupConfirmation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setReadyAiMulliganDecisionKey(aiMulliganDecisionKey);
    }, AI_MULLIGAN_THINKING_MS);

    return () => window.clearTimeout(timeoutId);
  }, [aiMulliganDecisionKey, pendingSetupConfirmation, readyAiMulliganDecisionKey]);

  useEffect(() => {
    if (pendingSetupConfirmation) {
      return;
    }
    if (visibleMulliganExitAnimation || visibleHumanMulliganAnimation) {
      return;
    }
    if (aiMulliganDecisionKey && readyAiMulliganDecisionKey !== aiMulliganDecisionKey) {
      return;
    }
    const command = getLegalHeuristicAiCommand(engine, aiSeat, humanSeat);
    if (!command) {
      return;
    }

    if (debugRevealAiMulligan && debugAiMulliganCount !== null && command.type === "ChooseMulligan") {
      const usedRedraws = engine.match?.seats[aiSeat].mulligansUsed ?? 0;
      const debugMulliganMove = chooseDebugAiMulliganMove({
        moves: aiMoves,
        mulligansUsed: usedRedraws,
        desiredRedrawCount: debugAiMulliganCount,
      });
      if (debugMulliganMove) {
        dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: aiSeat, cardIds: debugMulliganMove.cardIds }));
        return;
      }
    }

    dispatch(dispatchEngineCommand(command));
  }, [
    aiMoves,
    aiSeat,
    debugAiMulliganCount,
    debugRevealAiMulligan,
    dispatch,
    engine,
    humanSeat,
    aiMulliganDecisionKey,
    pendingSetupConfirmation,
    readyAiMulliganDecisionKey,
    visibleHumanMulliganAnimation,
    visibleMulliganExitAnimation,
  ]);

  const startNewGame = useCallback(() => {
    setDiscardOpenSeat(null);
    setDismissedRoundOverlayKey(null);
    setPendingSetupConfirmation(false);
    setMulliganExitAnimation(null);
    setCompletedMulliganAnimationKey(null);
    setReadyMulliganAnimationKey(null);
    setHumanMulliganAnimation(null);
    setCompletedHumanMulliganAnimationKey(null);
    setReadyAiMulliganDecisionKey(null);
    setAiMulliganBaseHand(null);
    setStartMatchModalDismissed(false);
    setCardContextMenu(null);
    setLeaderContextMenu(null);
    setCardInspectTarget(null);
    setLeaderInspectSeat(null);
    setSyncedHandDragState(null);
    setCardFlights([]);
    setMatchPresentationRun((current) => current + 1);
    dispatch(startEngineMatch(setupConfig ? setupConfigToStartEngineOptions(setupConfig) : { seed: startSeed }));
  }, [dispatch, setupConfig, setSyncedHandDragState, startSeed]);

  const confirmMulliganReview = useCallback(() => {
    if (!visibleMulliganExitAnimationKey || !isMulliganReviewReady) {
      return;
    }
    setCompletedMulliganAnimationKey(visibleMulliganExitAnimationKey);
    setMulliganExitAnimation((current) =>
      current?.key === visibleMulliganExitAnimationKey ? null : current,
    );
    setReadyMulliganAnimationKey((current) => (current === visibleMulliganExitAnimationKey ? null : current));
    setAiMulliganBaseHand(null);
    setStartMatchModalDismissed(false);
  }, [isMulliganReviewReady, visibleMulliganExitAnimationKey]);

  const reviewMulliganHand = useCallback(() => {
    setStartMatchModalDismissed(true);
  }, []);

  const requestStartMatchModal = useCallback(() => {
    setStartMatchModalDismissed(false);
  }, []);

  const closeCardContextMenu = useCallback(() => setCardContextMenu(null), []);
  const closeLeaderContextMenu = useCallback(() => setLeaderContextMenu(null), []);
  const closeCardInspect = useCallback(() => setCardInspectTarget(null), []);
  const closeLeaderInspect = useCallback(() => setLeaderInspectSeat(null), []);

  useEffect(() => {
    if (cardFlights.length === 0) {
      return;
    }
    const timeoutIds = cardFlights.map((flight) =>
      window.setTimeout(() => finishCardFlight(flight.key), CARD_FLIGHT_CLEANUP_MS),
    );
    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [cardFlights, finishCardFlight]);

  const openCardContextMenuAt = useCallback(
    (event: React.MouseEvent, target: MatchCardContextTarget) => {
      event.preventDefault();
      event.stopPropagation();
      const { x, y } = clampMatchMenuPosition(event.clientX, event.clientY);
      setLeaderContextMenu(null);
      setCardContextMenu({ ...target, x, y });
    },
    [],
  );

  const openLeaderContextMenuAt = useCallback(
    (event: React.MouseEvent, seatId: SeatId) => {
      event.preventDefault();
      event.stopPropagation();
      const { x, y } = clampMatchMenuPosition(event.clientX, event.clientY);
      setCardContextMenu(null);
      setLeaderContextMenu({ seatId, x, y });
    },
    [],
  );

  const inspectCardTarget = useCallback((target: MatchCardContextTarget) => {
    setCardInspectTarget(target);
    setCardContextMenu(null);
    setLeaderContextMenu(null);
  }, []);

  const inspectLeaderForSeat = useCallback((seatId: SeatId) => {
    setLeaderInspectSeat(seatId);
    setLeaderContextMenu(null);
    setCardContextMenu(null);
  }, []);

  useEffect(() => {
    if (
      !cardContextMenu &&
      !leaderContextMenu &&
      !cardInspectTarget &&
      leaderInspectSeat === null &&
      !leaderChoiceMenuOpen
    ) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (cardInspectTarget) {
        setCardInspectTarget(null);
        return;
      }
      if (leaderInspectSeat !== null) {
        setLeaderInspectSeat(null);
        return;
      }
      if (cardContextMenu) {
        setCardContextMenu(null);
        return;
      }
      if (leaderContextMenu) {
        setLeaderContextMenu(null);
        return;
      }
      if (leaderChoiceMenuOpen) {
        setLeaderChoiceMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cardContextMenu, cardInspectTarget, leaderChoiceMenuOpen, leaderContextMenu, leaderInspectSeat]);

  const returnToPreGame = useCallback(() => {
    if (!onReturnToPreGame) {
      return;
    }
    setDiscardOpenSeat(null);
    setDismissedRoundOverlayKey(null);
    setPendingSetupConfirmation(false);
    setMulliganExitAnimation(null);
    setCompletedMulliganAnimationKey(null);
    setReadyMulliganAnimationKey(null);
    setHumanMulliganAnimation(null);
    setCompletedHumanMulliganAnimationKey(null);
    setReadyAiMulliganDecisionKey(null);
    setAiMulliganBaseHand(null);
    setStartMatchModalDismissed(false);
    setCardContextMenu(null);
    setLeaderContextMenu(null);
    setCardInspectTarget(null);
    setLeaderInspectSeat(null);
    setSyncedHandDragState(null);
    setCardFlights([]);
    dispatch(engineMatchCleared());
    onReturnToPreGame();
  }, [dispatch, onReturnToPreGame, setSyncedHandDragState]);

  const requestReturnToPreGame = useCallback(() => {
    if (!onReturnToPreGame) {
      return;
    }
    if (match && match.phase !== "game_end") {
      setPendingSetupConfirmation(true);
      return;
    }
    returnToPreGame();
  }, [match, onReturnToPreGame, returnToPreGame]);

  const playableCardIds = useMemo(() => getPlayableCardIds(humanMoves), [humanMoves]);
  const selectedPlayMoves = useMemo(() => getPlayMovesForCard(humanMoves, selectedCardId), [humanMoves, selectedCardId]);
  const selectedCard = useMemo(() => humanHand.find((card) => card.instanceId === selectedCardId) ?? null, [humanHand, selectedCardId]);
  const selectedAuthenticCard = useMemo(() => (selectedCard ? toRuntimeCard(selectedCard) : null), [selectedCard]);
  const leaderMoves = useMemo(() => getUseLeaderMoves(humanMoves), [humanMoves]);
  const aiLeaderMoves = useMemo(() => getUseLeaderMoves(aiMoves), [aiMoves]);
  const leaderActionViewModel = useMemo<LeaderActionViewModel>(
    () => buildLeaderActionViewModel(leaderMoves),
    [leaderMoves],
  );
  const humanLeaderStatusView = useMemo(
    () =>
      leaders
        ? buildLeaderStatusViewModel({
            leader: leaders[humanSeat],
            legalLeaderMoveCount: leaderMoves.length,
            phase: match?.phase,
            canAct: canHumanAct,
            promptOpen: Boolean(prompt),
            passed: match?.seats[humanSeat].passed ?? false,
          })
        : null,
    [canHumanAct, humanSeat, leaderMoves.length, leaders, match?.phase, match?.seats, prompt],
  );
  const aiLeaderStatusView = useMemo(
    () =>
      leaders
        ? buildLeaderStatusViewModel({
            leader: leaders[aiSeat],
            legalLeaderMoveCount: aiLeaderMoves.length,
            phase: match?.phase,
            canAct: canAiAct,
            promptOpen: Boolean(prompt),
            passed: match?.seats[aiSeat].passed ?? false,
          })
        : null,
    [aiLeaderMoves.length, aiSeat, canAiAct, leaders, match?.phase, match?.seats, prompt],
  );
  const promptMoves = useMemo(() => getPromptOptionMoves(humanMoves), [humanMoves]);

  useEffect(() => {
    if (!leaderChoiceMenuOpen) {
      return;
    }
    if (leaderActionViewModel.kind !== "choice") {
      setLeaderChoiceMenuOpen(false);
    }
  }, [leaderActionViewModel, leaderChoiceMenuOpen]);

  useEffect(() => {
    if (!leaderChoiceMenuOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const container = leaderActionRef.current;
      if (!container) {
        return;
      }
      const target = event.target as Node | null;
      if (target && container.contains(target)) {
        return;
      }
      setLeaderChoiceMenuOpen(false);
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [leaderChoiceMenuOpen]);

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
  const engineCardsById = useMemo(() => new Map(publicCards.map((card) => [card.instanceId, card])), [publicCards]);
  const leaderLookupBySourceId = useMemo(
    () =>
      new Map(
        leaders
          ? (SEAT_IDS.map((seatId) => {
              const leader = leaders[seatId];
              return [
                leader.sourceId,
                {
                  sourceId: leader.sourceId,
                  name: leader.name,
                  ability: leader.ability,
                  abilityName: getLeaderAbilityDisplay(leader.ability).name,
                },
              ] as const;
            }))
          : [],
      ),
    [leaders],
  );
  const selectedTargetView = useMemo(
    () =>
      buildSelectedCardTargetViewModel({
        selectedCard: selectedCard
          ? { instanceId: selectedCard.instanceId, name: selectedCard.name }
          : null,
        selectedPlayMoves,
        cardLookup: visibleCardsById,
      }),
    [selectedCard, selectedPlayMoves, visibleCardsById],
  );
  const selectedDragTargetView = useMemo(
    () => buildSelectedCardDragTargetViewModel(selectedTargetView),
    [selectedTargetView],
  );
  const selectedDropMoveIdsSignature = useMemo(
    () => [...selectedDragTargetView.moveIds].sort().join("|"),
    [selectedDragTargetView],
  );
  const promptPresentation = useMemo(
    () =>
      prompt
        ? buildPromptPresentationViewModel({
            prompt,
            promptMoves,
            cardLookup: visibleCardsById,
            leaderLookupBySourceId,
            seatLabels: SEAT_LABELS,
            isPromptOwner: prompt.seatId === humanSeat,
          })
        : null,
    [humanSeat, leaderLookupBySourceId, prompt, promptMoves, visibleCardsById],
  );
  const medicOptions = useMemo(
    () =>
      prompt?.kind === "medic_revive" && prompt.seatId === humanSeat
        ? buildMedicPromptOptions({ promptMoves, cardLookup: engineCardsById })
        : [],
    [engineCardsById, humanSeat, prompt?.kind, prompt?.seatId, promptMoves],
  );
  const lookThreeCardsRevealCardLookup = useMemo(
    () => new Map(lookThreeCardsRevealCards.map((card) => [card.instanceId, card])),
    [lookThreeCardsRevealCards],
  );
  const lookThreeCardsRevealView = useMemo<LookThreeCardsRevealViewModel | null>(
    () =>
      prompt && prompt.seatId === humanSeat
        ? buildLookThreeCardsRevealViewModel({
            prompt,
            promptMoves,
            cardLookup: lookThreeCardsRevealCardLookup,
            leaderName: leaders ? leaders[humanSeat]?.name ?? null : null,
            opponentLabel: SEAT_LABELS[aiSeat],
          })
        : null,
    [aiSeat, humanSeat, leaders, lookThreeCardsRevealCardLookup, prompt, promptMoves],
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
  const motionByCardId = useMemo(() => {
    const entries: [CardInstanceId, CardMotion][] = [];
    engine.lastTransactionEvents.forEach((event) => {
      if (event.type !== "card_moved") {
        return;
      }
      if (event.reason === "medic_revive") {
        entries.push([event.cardId, "prompt-revived"]);
        return;
      }
      if (event.reason === "scorch_destroyed" || event.reason === "scorch_discard") {
        entries.push([event.cardId, "scorched"]);
        return;
      }
      if (event.reason === "play_card") {
        entries.push([event.cardId, "played"]);
        return;
      }
      if (event.to.kind === "discard") {
        entries.push([event.cardId, "discarded"]);
      }
    });
    return new Map(entries);
  }, [engine.lastTransactionEvents]);
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

    if (match?.phase === "mulligan") {
      return;
    }

    const selectedStillInHand = humanHand.some((card) => card.instanceId === selectedCardId);
    const selectedStillPlayable = selectedPlayMoves.length > 0;
    if (match?.phase !== "playing" || !selectedStillInHand || !selectedStillPlayable) {
      dispatch(engineSelectionCleared());
    }
  }, [dispatch, humanHand, match?.phase, selectedCardId, selectedPlayMoves.length]);

  const selectHandCard = useCallback(
    (cardId: CardInstanceId) => {
      if (suppressNextHandClickRef.current === cardId) {
        suppressNextHandClickRef.current = null;
        return;
      }
      if (match?.phase === "playing" && playableCardIds.has(cardId) && canHumanAct && !prompt) {
        dispatch(engineSelectedCardSet(selectedCardId === cardId ? null : cardId));
      }
    },
    [canHumanAct, dispatch, match?.phase, playableCardIds, prompt, selectedCardId],
  );

  const handleHandContextMenu = useCallback(
    (event: React.MouseEvent, cardId: CardInstanceId) => {
      openCardContextMenuAt(event, {
        cardInstanceId: cardId,
        origin: "hand",
        ownerLabel: SEAT_LABELS[humanSeat],
        seatId: humanSeat,
      });
    },
    [humanSeat, openCardContextMenuAt],
  );

  const handleBoardContextMenu = useCallback(
    (
      event: React.MouseEvent,
      target: { cardId: CardInstanceId; origin: MatchCardInspectionOrigin; seatId: SeatId; row: import("@/game/catalog").CatalogRow },
    ) => {
      openCardContextMenuAt(event, {
        cardInstanceId: target.cardId,
        origin: target.origin,
        ownerLabel: SEAT_LABELS[target.seatId],
        seatId: target.seatId,
        row: target.row,
      });
    },
    [openCardContextMenuAt],
  );

  const handleWeatherContextMenu = useCallback(
    (event: React.MouseEvent, cardId: CardInstanceId) => {
      openCardContextMenuAt(event, {
        cardInstanceId: cardId,
        origin: "weather",
      });
    },
    [openCardContextMenuAt],
  );

  const handleDiscardContextMenu = useCallback(
    (event: React.MouseEvent, cardId: CardInstanceId) => {
      const ownerSeat = discardOpenSeat;
      openCardContextMenuAt(event, {
        cardInstanceId: cardId,
        origin: "discard",
        ownerLabel: ownerSeat ? SEAT_LABELS[ownerSeat] : undefined,
        seatId: ownerSeat ?? undefined,
      });
    },
    [discardOpenSeat, openCardContextMenuAt],
  );

  const handlePromptContextMenu = useCallback(
    (event: React.MouseEvent, cardId: CardInstanceId) => {
      openCardContextMenuAt(event, {
        cardInstanceId: cardId,
        origin: "prompt",
        ownerLabel: SEAT_LABELS[humanSeat],
        seatId: humanSeat,
      });
    },
    [humanSeat, openCardContextMenuAt],
  );

  const handleLeaderContextMenu = useCallback(
    (event: React.MouseEvent, seatId: SeatId) => {
      openLeaderContextMenuAt(event, seatId);
    },
    [openLeaderContextMenuAt],
  );

  const inspectSelectedHandCard = useCallback(() => {
    if (!selectedCardId) return;
    inspectCardTarget({
      cardInstanceId: selectedCardId,
      origin: "hand",
      ownerLabel: SEAT_LABELS[humanSeat],
      seatId: humanSeat,
    });
  }, [humanSeat, inspectCardTarget, selectedCardId]);

  const canPass = humanMoves.some((move) => move.kind === "pass");
  const canResolveRound = humanMoves.some((move) => move.kind === "resolve_round_end");
  const disableLeaderAction = !(humanLeaderStatusView?.actionEnabled ?? false);

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

  const dispatchLeaderMove = useCallback(
    (move: { seatId: SeatId; target: typeof leaderMoves[number]["target"] }) => {
      dispatch(dispatchEngineCommand({ type: "UseLeader", seatId: move.seatId, target: move.target }));
    },
    [dispatch],
  );

  const activateLeaderAction = useCallback(() => {
    if (leaderActionViewModel.kind === "none") {
      return;
    }
    if (leaderActionViewModel.kind === "single") {
      dispatchLeaderMove(leaderActionViewModel.option.move);
      return;
    }
    setLeaderChoiceMenuOpen((current) => !current);
  }, [dispatchLeaderMove, leaderActionViewModel]);

  const chooseLeaderOption = useCallback(
    (moveId: string) => {
      if (leaderActionViewModel.kind !== "choice") {
        return;
      }
      const option = leaderActionViewModel.options.find((entry) => entry.moveId === moveId);
      if (!option) {
        return;
      }
      dispatchLeaderMove(option.move);
      setLeaderChoiceMenuOpen(false);
    },
    [dispatchLeaderMove, leaderActionViewModel],
  );

  const playCard = useCallback(
    (moveId: string, presentation: PlayCardPresentationOptions = {}) => {
      const move = selectedPlayMoves.find((candidate) => candidate.moveId === moveId);
      if (!move) {
        return;
      }
      const sourceCard = humanHand.find((card) => card.instanceId === move.sourceCardId);
      const sourceElement = handCardElementsRef.current.get(move.sourceCardId);
      const sourceRect =
        presentation.sourceRect ??
        (sourceElement ? rectFromDomRect(sourceElement.getBoundingClientRect()) : null);
      const targetRect =
        presentation.targetRect ??
        (sourceRect ? getPlayCardFlightTargetRect(move, sourceRect, presentation.targetElement) : null);
      if (sourceCard && sourceRect && targetRect) {
        setCardFlights((current) => [
          ...current,
          {
            key: `${move.moveId}|${sourceCard.instanceId}|${Date.now()}|${current.length}`,
            moveId: move.moveId,
            card: toRuntimeCard(sourceCard).card,
            from: sourceRect,
            to: targetRect,
          },
        ]);
      }
      dispatch(dispatchEngineCommand({ type: "PlayCard", seatId: humanSeat, cardId: move.sourceCardId, target: move.target }));
    },
    [dispatch, humanHand, humanSeat, selectedPlayMoves],
  );

  const handleHandPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, card: AuthenticRuntimeCardViewModel, draggable: boolean) => {
      if (!draggable || event.button !== 0 || event.pointerType === "touch") {
        return;
      }
      const rect = rectFromDomRect(event.currentTarget.getBoundingClientRect());
      setSyncedHandDragState({
        kind: "pending",
        pointerId: event.pointerId,
        cardId: card.key,
        card,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        sourceRect: rect,
      });
      let cleanup = () => undefined;
      const handlePointerMove = (nativeEvent: PointerEvent) => updateHandDragFromPointerRef.current(nativeEvent);
      const handlePointerUp = (nativeEvent: PointerEvent) => {
        completeHandDragFromPointerRef.current(nativeEvent);
        cleanup();
      };
      const handlePointerCancel = (nativeEvent: PointerEvent) => {
        cancelHandDragFromPointerRef.current(nativeEvent);
        cleanup();
      };
      cleanup = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);
      };
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp, { passive: false });
      window.addEventListener("pointercancel", handlePointerCancel);
    },
    [setSyncedHandDragState],
  );

  const updateHandDragFromPointer = useCallback(
    (event: { pointerId: number; clientX: number; clientY: number; preventDefault: () => void }) => {
      const current = dragStateRef.current;
      if (!current || event.pointerId !== current.pointerId) {
        return;
      }
      const nextBase = {
        ...current,
        currentX: event.clientX,
        currentY: event.clientY,
      };
      if (current.kind === "pending") {
        const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
        if (distance < HAND_DRAG_THRESHOLD_PX) {
          setSyncedHandDragState(nextBase);
          return;
        }

        event.preventDefault();
        try {
          handCardElementsRef.current.get(current.cardId)?.setPointerCapture(current.pointerId);
        } catch {
          // Pointer capture is best-effort; window listeners still handle cleanup.
        }
        if (selectedCardId !== current.cardId) {
          dispatch(engineSelectedCardSet(current.cardId));
        }
        setCardContextMenu(null);
        setLeaderContextMenu(null);
        setLeaderChoiceMenuOpen(false);
        setSyncedHandDragState({
          ...nextBase,
          kind: "dragging",
          activeDropMoveId: getDropMoveIdAtPoint(event.clientX, event.clientY, selectedDragTargetView.moveIds),
        });
        return;
      }

      event.preventDefault();
      setSyncedHandDragState({
        ...nextBase,
        kind: "dragging",
        activeDropMoveId: getDropMoveIdAtPoint(event.clientX, event.clientY, selectedDragTargetView.moveIds),
      });
    },
    [dispatch, selectedCardId, selectedDragTargetView.moveIds, setSyncedHandDragState],
  );

  const completeHandDragFromPointer = useCallback(
    (event: { pointerId: number; clientX: number; clientY: number; preventDefault: () => void }) => {
      const current = dragStateRef.current;
      if (!current || event.pointerId !== current.pointerId) {
        return;
      }
      if (current.kind === "dragging") {
        event.preventDefault();
        suppressNextHandClickRef.current = current.cardId;
        const moveId =
          getDropMoveIdAtPoint(event.clientX, event.clientY, selectedDragTargetView.moveIds) ??
          current.activeDropMoveId;
        const targetElement = getDropElementForMoveId(moveId);
        setSyncedHandDragState(null);
        if (moveId && targetElement) {
          playCard(moveId, {
            sourceRect: current.sourceRect,
            targetElement,
          });
        }
        return;
      }
      setSyncedHandDragState(null);
    },
    [playCard, selectedDragTargetView.moveIds, setSyncedHandDragState],
  );

  const cancelHandDragFromPointer = useCallback(
    (event: { pointerId: number }) => {
      const current = dragStateRef.current;
      if (!current || event.pointerId !== current.pointerId) {
        return;
      }
      setSyncedHandDragState(null);
    },
    [setSyncedHandDragState],
  );

  useEffect(() => {
    updateHandDragFromPointerRef.current = updateHandDragFromPointer;
    completeHandDragFromPointerRef.current = completeHandDragFromPointer;
    cancelHandDragFromPointerRef.current = cancelHandDragFromPointer;
  }, [cancelHandDragFromPointer, completeHandDragFromPointer, updateHandDragFromPointer]);

  useEffect(() => {
    if (!handDragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => updateHandDragFromPointer(event);
    const handlePointerUp = (event: PointerEvent) => completeHandDragFromPointer(event);
    const handlePointerCancel = (event: PointerEvent) => cancelHandDragFromPointer(event);

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [
    cancelHandDragFromPointer,
    completeHandDragFromPointer,
    handDragState,
    updateHandDragFromPointer,
  ]);

  useEffect(() => {
    if (!handDragState) {
      return;
    }
    const selectedChanged =
      handDragState.kind === "dragging" && selectedCardId !== null && selectedCardId !== handDragState.cardId;
    const staleLegality =
      handDragState.kind === "dragging" &&
      selectedCardId === handDragState.cardId &&
      dragLegalMoveSignatureRef.current !== null &&
      dragLegalMoveSignatureRef.current !== selectedDropMoveIdsSignature;

    if (
      match?.phase !== "playing" ||
      prompt ||
      !canHumanAct ||
      !playableCardIds.has(handDragState.cardId) ||
      selectedChanged ||
      staleLegality
    ) {
      cancelHandDrag();
      return;
    }

    if (
      handDragState.kind === "dragging" &&
      selectedCardId === handDragState.cardId &&
      dragLegalMoveSignatureRef.current === null
    ) {
      dragLegalMoveSignatureRef.current = selectedDropMoveIdsSignature;
    }
  }, [
    canHumanAct,
    cancelHandDrag,
    handDragState,
    match?.phase,
    playableCardIds,
    prompt,
    selectedCardId,
    selectedDropMoveIdsSignature,
  ]);

  useEffect(() => {
    if (!handDragState) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelHandDrag();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cancelHandDrag, handDragState]);

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
            scoreBreakdown: score,
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
  const discardBrowserSeat = discardOpenSeat && seatSummaries ? (discardOpenSeat === humanSeat ? seatSummaries.human : seatSummaries.ai) : null;
  const discardGroups = useMemo(() => groupDiscardCards(discardOpenSeat ? discardCards[discardOpenSeat] : []), [discardCards, discardOpenSeat]);
  const gemsBySeat = useMemo(
    () => (match ? { seat_a: match.seats.seat_a.gems, seat_b: match.seats.seat_b.gems } : null),
    [match],
  );
  const matchLedger = useMemo(
    () =>
      buildMatchLedgerViewModel({
        rounds: roundHistory,
        humanSeat,
        aiSeat,
        seatLabels: SEAT_LABELS,
        winner,
        gemsBySeat,
        canReturnToSetup: Boolean(onReturnToPreGame),
        matchRunKey: activeMatchKey,
      }),
    [activeMatchKey, aiSeat, gemsBySeat, humanSeat, onReturnToPreGame, roundHistory, winner],
  );
  const showRoundOverlay = Boolean(matchLedger && matchLedger.key !== dismissedRoundOverlayKey);
  const resolveRoundActionView = useMemo(
    () =>
      buildResolveRoundActionViewModel({
        phase: match?.phase,
        canResolveRound,
        promptOpen: Boolean(prompt),
        canHumanAct,
      }),
    [canHumanAct, canResolveRound, match?.phase, prompt],
  );
  const seedLabel = `Seed ${String(seed ?? startSeed ?? "default")}`;
  const activeDropMoveId = handDragState?.kind === "dragging" ? handDragState.activeDropMoveId : null;
  const draggingCardId = handDragState?.kind === "dragging" ? handDragState.cardId : null;
  const dragHintLabel = handDragState?.kind === "dragging" ? selectedDragTargetView.rightRailLabel : null;

  if (match?.phase === "mulligan" || visibleMulliganExitAnimation) {
    return (
      <>
        <AuthenticMulliganScreen
          seedLabel={seedLabel}
          statusLabel={
            visibleMulliganExitAnimation
              ? isMulliganReviewReady
                ? "Opponent mulligan complete."
                : "Opponent mulligan in progress."
              : statusBanner.errorLabel ?? statusBanner.nextAction
          }
          aiMulliganAnimation={
            visibleMulliganExitAnimation
              ? {
                  selectedCount: visibleMulliganExitAnimation.selectedCount,
                  selectedCardIds: visibleMulliganExitAnimation.selectedCardIds,
                  drawnCardIds: visibleMulliganExitAnimation.drawnCardIds,
                  baseHandCardIds: visibleMulliganExitAnimation.baseHandCardIds,
                }
              : undefined
          }
          aiMulliganBaseHandCardIds={aiMulliganBaseHand?.cardIds}
          humanMulliganAnimation={
            visibleHumanMulliganAnimation
              ? {
                  selectedCardIds: visibleHumanMulliganAnimation.selectedCardIds,
                  drawnCardIds: visibleHumanMulliganAnimation.drawnCardIds,
                }
              : undefined
          }
          debugRevealAiCards={debugRevealAiMulligan}
          isAiMulliganChoosing={isAiMulliganChoosing}
          isMulliganReviewReady={isMulliganReviewReady}
          onRequestStartMatch={requestStartMatchModal}
          onRequestSetup={onReturnToPreGame ? requestReturnToPreGame : undefined}
        />
        {isStartMatchModalOpen ? (
          <StartMatchModal open onReviewHand={reviewMulliganHand} onStart={confirmMulliganReview} />
        ) : null}
        {pendingSetupConfirmation ? (
          <ReturnToSetupModal
            open
            onStay={() => setPendingSetupConfirmation(false)}
            onLeave={returnToPreGame}
          />
        ) : null}
      </>
    );
  }

  return (
    <main className="gwent-authentic gwent-authentic--match" data-testid="authentic-match-screen">
      <div className="authentic-match">
        <TopBar
          seedLabel={seedLabel}
          roundLabel={statusBanner.roundLabel}
          actorLabel={statusBanner.actorLabel}
          phaseLabel={statusBanner.phaseLabel}
          nextAction={statusBanner.errorLabel ?? statusBanner.nextAction}
          onNewGame={startNewGame}
          onReturnToPreGame={onReturnToPreGame ? requestReturnToPreGame : undefined}
        />

        <div className="authentic-match__layout">
          <aside className="authentic-match__left-rail">
            {seatSummaries && leaders && humanLeaderStatusView && aiLeaderStatusView ? (
              <>
                <ScoreCard
                  seat={seatSummaries.ai}
                  leaderStatus={aiLeaderStatusView}
                  leaderImage={leaders[aiSeat].image}
                  active={match?.currentTurn === aiSeat}
                  onLeaderContextMenu={(event) => handleLeaderContextMenu(event, aiSeat)}
                />
                <PilePair
                  seat={seatSummaries.ai}
                  topDiscard={topAiDiscard ? toRuntimeCard(topAiDiscard) : null}
                  onDiscardOpen={() => setDiscardOpenSeat(aiSeat)}
                />
                <WeatherSummary
                  cards={weatherRuntimeCards}
                  weatherTarget={selectedTargetView.weatherTarget}
                  activeDropMoveId={activeDropMoveId}
                  onTargetClick={playCard}
                  onCardContextMenu={handleWeatherContextMenu}
                />
                <PilePair
                  seat={seatSummaries.human}
                  topDiscard={topHumanDiscard ? toRuntimeCard(topHumanDiscard) : null}
                  onDiscardOpen={() => setDiscardOpenSeat(humanSeat)}
                />
                <ScoreCard
                  seat={seatSummaries.human}
                  leaderStatus={humanLeaderStatusView}
                  leaderImage={leaders[humanSeat].image}
                  active={match?.currentTurn === humanSeat}
                  onLeaderContextMenu={(event) => handleLeaderContextMenu(event, humanSeat)}
                />
              </>
            ) : null}
          </aside>

          <section className="authentic-match__center">
            <BoardTable
              rows={orderedRows}
              weatherCards={weatherRuntimeCards}
              rowTargets={selectedTargetView.rowTargets}
              rowHornTargets={selectedTargetView.rowHornTargets}
              legalCardTargets={selectedTargetView.cardTargets}
              motionByCardId={motionByCardId}
              activeDropMoveId={activeDropMoveId}
              onTargetClick={playCard}
              onCardContextMenu={handleBoardContextMenu}
            />
            <HandStrip
              cards={handCards}
              selectedCardId={selectedCardId}
              playableCardIds={playableCardIds}
              disabledByCardId={disabledByCardId}
              draggingCardId={draggingCardId}
              onCardPointerDown={handleHandPointerDown}
              onCardPointerMove={updateHandDragFromPointer}
              onCardPointerUp={completeHandDragFromPointer}
              onCardPointerCancel={cancelHandDragFromPointer}
              onCardClick={selectHandCard}
              onCardContextMenu={handleHandContextMenu}
              setCardElement={setHandCardElement}
            />
          </section>

          <aside className="authentic-match__right-rail">
            <InspectorPanel
              selected={selectedAuthenticCard}
              onInspectSelected={selectedAuthenticCard ? inspectSelectedHandCard : undefined}
            />
            <ActionPanel
              selectedTargets={selectedTargetView}
              dragHintLabel={dragHintLabel}
              onPlayMove={playCard}
              canPass={canPass}
              onPass={pass}
              leader={{
                status: humanLeaderStatusView,
                disabled: disableLeaderAction,
                action: leaderActionViewModel,
                choiceMenuOpen: leaderChoiceMenuOpen && !disableLeaderAction,
                onActivate: activateLeaderAction,
                onChooseOption: chooseLeaderOption,
                containerRef: leaderActionRef,
              }}
              resolveRoundAction={resolveRoundActionView}
              onResolveRound={resolveRound}
            />
            {prompt ? (
              promptPresentation ? (
                <PromptPanel
                  prompt={promptPresentation}
                  ownerLabel={SEAT_LABELS[prompt.seatId]}
                  isAiPrompt={prompt.seatId === aiSeat}
                  medicOptions={medicOptions}
                  onChoose={choosePromptOption}
                  onCardContextMenu={handlePromptContextMenu}
                />
              ) : null
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
        <CardFlightLayer flights={cardFlights} onFlightDone={finishCardFlight} />
        {handDragState?.kind === "dragging" ? (
          <div
            className="authentic-drag-preview"
            data-testid="authentic-drag-preview"
            data-drag-state="dragging"
            aria-hidden="true"
            style={{
              left: handDragState.currentX - handDragState.offsetX,
              top: handDragState.currentY - handDragState.offsetY,
              width: handDragState.sourceRect.width,
              height: handDragState.sourceRect.height,
            }}
          >
            <AuthenticCard card={handDragState.card.card} size="sm" selected />
          </div>
        ) : null}
        {discardBrowserSeat ? (
          <DiscardBrowser
            ownerLabel={discardBrowserSeat.label}
            count={discardBrowserSeat.discardCount}
            groups={discardGroups}
            onClose={() => setDiscardOpenSeat(null)}
            onCardContextMenu={handleDiscardContextMenu}
          />
        ) : null}
        {cardContextMenu
          ? (() => {
              const card = engineCardsById.get(cardContextMenu.cardInstanceId);
              if (!card) {
                return null;
              }
              return (
                <>
                  <div
                    className="authentic-match__context-overlay"
                    onClick={closeCardContextMenu}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      closeCardContextMenu();
                    }}
                  />
                  <div
                    className="authentic-match__context-menu"
                    role="menu"
                    aria-label={`Actions for ${card.name}`}
                    data-testid="authentic-match-card-context-menu"
                    style={{ left: cardContextMenu.x, top: cardContextMenu.y, width: MATCH_CONTEXT_MENU_WIDTH }}
                  >
                    <div className="authentic-match__context-title">{card.name}</div>
                    <button
                      type="button"
                      role="menuitem"
                      className="authentic-button authentic-button--ghost authentic-match__context-action"
                      data-testid="authentic-match-context-inspect"
                      onClick={() => {
                        inspectCardTarget({
                          cardInstanceId: cardContextMenu.cardInstanceId,
                          origin: cardContextMenu.origin,
                          ownerLabel: cardContextMenu.ownerLabel,
                          row: cardContextMenu.row ?? null,
                          seatId: cardContextMenu.seatId,
                        });
                      }}
                    >
                      inspect
                    </button>
                  </div>
                </>
              );
            })()
          : null}
        {leaderContextMenu && leaders
          ? (() => {
              const leaderStatus = leaders[leaderContextMenu.seatId];
              if (!leaderStatus) {
                return null;
              }
              return (
                <>
                  <div
                    className="authentic-match__context-overlay"
                    onClick={closeLeaderContextMenu}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      closeLeaderContextMenu();
                    }}
                  />
                  <div
                    className="authentic-match__context-menu"
                    role="menu"
                    aria-label={`Actions for ${leaderStatus.name}`}
                    data-testid="authentic-match-leader-context-menu"
                    style={{ left: leaderContextMenu.x, top: leaderContextMenu.y, width: MATCH_CONTEXT_MENU_WIDTH }}
                  >
                    <div className="authentic-match__context-title">{leaderStatus.name}</div>
                    <button
                      type="button"
                      role="menuitem"
                      className="authentic-button authentic-button--ghost authentic-match__context-action"
                      data-testid="authentic-match-leader-context-inspect"
                      onClick={() => inspectLeaderForSeat(leaderContextMenu.seatId)}
                    >
                      inspect
                    </button>
                  </div>
                </>
              );
            })()
          : null}
        {cardInspectTarget
          ? (() => {
              const card = engineCardsById.get(cardInspectTarget.cardInstanceId);
              if (!card) {
                return null;
              }
              const scoreByCardId = new Map((score?.cards ?? []).map((entry) => [entry.cardId, entry]));
              const boardState =
                cardInspectTarget.origin === "board" ? getBoardCardState(card, scoreByCardId) : null;
              const inspection = buildMatchCardInspection({
                card,
                origin: cardInspectTarget.origin,
                ownerLabel: cardInspectTarget.ownerLabel ?? null,
                row: cardInspectTarget.row ?? null,
                boardState,
              });
              return (
                <div
                  className="authentic-modal authentic-match__inspect-modal"
                  data-testid="authentic-match-card-inspect"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="authentic-match-inspect-title"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      closeCardInspect();
                    }
                  }}
                >
                  <div className="authentic-match__inspect-box">
                    <div className="authentic-match__inspect-header">
                      <h2 id="authentic-match-inspect-title">{inspection.title}</h2>
                      <button
                        type="button"
                        className="authentic-button authentic-button--ghost authentic-button--compact"
                        onClick={closeCardInspect}
                        data-testid="authentic-match-inspect-close"
                        aria-label="Close"
                      >
                        close
                      </button>
                    </div>
                    <div className="authentic-match__inspect-body">
                      <div className="authentic-match__inspect-art">
                        <AuthenticCard card={inspection.card} size="lg" />
                      </div>
                      <dl className="authentic-match__inspect-facts">
                        <dt>Source ID</dt>
                        <dd data-testid="authentic-match-inspect-source-id">{inspection.sourceId}</dd>
                        <dt>Instance ID</dt>
                        <dd data-testid="authentic-match-inspect-instance-id">{inspection.instanceId}</dd>
                        <dt>Faction</dt>
                        <dd>{inspection.factionLabel}</dd>
                        <dt>Kind</dt>
                        <dd>{inspection.kindLabel}</dd>
                        {inspection.rowLabels.length > 0 ? (
                          <>
                            <dt>Rows</dt>
                            <dd>{inspection.rowLabels.join(", ")}</dd>
                          </>
                        ) : null}
                        {inspection.hasStrength && inspection.printedStrength !== null ? (
                          <>
                            <dt>Printed strength</dt>
                            <dd>{inspection.printedStrength}</dd>
                          </>
                        ) : null}
                        {inspection.origin === "board" && inspection.effectiveStrength !== null ? (
                          <>
                            <dt>Effective strength</dt>
                            <dd
                              data-testid="authentic-match-inspect-effective-strength"
                              data-strength-state={inspection.strengthState ?? "normal"}
                            >
                              {inspection.effectiveStrength} ({inspection.strengthState ?? "normal"})
                            </dd>
                          </>
                        ) : null}
                        {inspection.origin === "board" && inspection.modifiers.length > 0 ? (
                          <>
                            <dt>Modifiers</dt>
                            <dd data-testid="authentic-match-inspect-modifiers">
                              {inspection.modifiers.join(", ")}
                            </dd>
                          </>
                        ) : null}
                        <dt>Where</dt>
                        <dd>{inspection.originLabel}</dd>
                        {inspection.ownerLabel ? (
                          <>
                            <dt>Side</dt>
                            <dd>{inspection.ownerLabel}</dd>
                          </>
                        ) : null}
                        {inspection.rowContextLabel ? (
                          <>
                            <dt>Board row</dt>
                            <dd>{inspection.rowContextLabel}</dd>
                          </>
                        ) : null}
                        {inspection.tags.length > 0 ? (
                          <>
                            <dt>Tags</dt>
                            <dd>{inspection.tags.join(", ")}</dd>
                          </>
                        ) : null}
                        {inspection.imagePath ? (
                          <>
                            <dt>Image path</dt>
                            <dd>{inspection.imagePath}</dd>
                          </>
                        ) : null}
                      </dl>
                      <section className="authentic-match__inspect-section">
                        <div className="authentic-match__inspect-label">Abilities</div>
                        {inspection.abilities.length === 0 ? (
                          <p>None.</p>
                        ) : (
                          <ul className="authentic-match__inspect-abilities">
                            {inspection.abilities.map((ability) => (
                              <li key={ability.id}>
                                <strong>{ability.name}</strong>
                                {ability.glyph ? <span aria-hidden="true"> {ability.glyph}</span> : null}
                                <em> · {ability.status}</em>
                                {ability.description ? <p>{ability.description}</p> : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    </div>
                  </div>
                </div>
              );
            })()
          : null}
        {leaderInspectSeat !== null && leaders
          ? (() => {
              const seatId = leaderInspectSeat;
              const leaderStatus = leaders[seatId];
              if (!leaderStatus) {
                return null;
              }
              const seatFaction = match?.seats[seatId].faction ?? "neutral";
              const ownerLabel = SEAT_LABELS[seatId];
              const inspection = buildMatchLeaderInspection({
                sourceId: leaderStatus.sourceId,
                name: leaderStatus.name,
                faction: seatFaction,
                abilityId: leaderStatus.ability,
                image: leaderStatus.image,
                used: leaderStatus.used,
                ownerLabel,
              });
              return (
                <div
                  className="authentic-modal authentic-match__inspect-modal authentic-match__inspect-modal--leader"
                  data-testid="authentic-match-leader-inspect"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="authentic-match-leader-inspect-title"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      closeLeaderInspect();
                    }
                  }}
                >
                  <div className="authentic-match__inspect-box">
                    <div className="authentic-match__inspect-header">
                      <h2 id="authentic-match-leader-inspect-title">{inspection.title}</h2>
                      <button
                        type="button"
                        className="authentic-button authentic-button--ghost authentic-button--compact"
                        onClick={closeLeaderInspect}
                        data-testid="authentic-match-leader-inspect-close"
                        aria-label="Close"
                      >
                        close
                      </button>
                    </div>
                    <div className="authentic-match__inspect-body authentic-match__inspect-body--leader">
                      <div className="authentic-match__inspect-art">
                        <AuthenticLeaderCard
                          leader={{
                            sourceId: inspection.sourceId,
                            name: inspection.title,
                            faction: seatFaction,
                            abilityName: inspection.ability.name,
                            image: inspection.imagePath,
                          }}
                          size="match"
                        />
                      </div>
                      <dl className="authentic-match__inspect-facts">
                        <dt>Source ID</dt>
                        <dd data-testid="authentic-match-leader-inspect-source-id">{inspection.sourceId}</dd>
                        <dt>Faction</dt>
                        <dd>{inspection.factionLabel}</dd>
                        <dt>Ability</dt>
                        <dd>{inspection.ability.name}</dd>
                        <dt>Status</dt>
                        <dd>{inspection.statusLabel}</dd>
                        <dt>Side</dt>
                        <dd>{inspection.ownerLabel}</dd>
                        {inspection.ability.description ? (
                          <>
                            <dt>Description</dt>
                            <dd>{inspection.ability.description}</dd>
                          </>
                        ) : null}
                        {inspection.imagePath ? (
                          <>
                            <dt>Image path</dt>
                            <dd>{inspection.imagePath}</dd>
                          </>
                        ) : null}
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })()
          : null}
        {lookThreeCardsRevealView ? (
          <LookThreeCardsRevealDialog
            view={lookThreeCardsRevealView}
            onAcknowledge={choosePromptOption}
          />
        ) : null}
        {showRoundOverlay && matchLedger ? (
          <RoundOverlay
            ledger={matchLedger}
            onDismiss={() => setDismissedRoundOverlayKey(matchLedger.key)}
            onRematch={startNewGame}
            onChangeDeck={onReturnToPreGame ? returnToPreGame : undefined}
          />
        ) : null}
        {pendingSetupConfirmation ? (
          <ReturnToSetupModal
            open
            onStay={() => setPendingSetupConfirmation(false)}
            onLeave={returnToPreGame}
          />
        ) : null}
      </div>
    </main>
  );
};

export default AuthenticMatchScreen;
