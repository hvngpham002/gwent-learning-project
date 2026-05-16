import type { CatalogAbilityId, CatalogCardKind, CatalogFaction, CatalogRow } from "@/game/catalog";
import type {
  CardInstanceId,
  LegalMove,
  MatchPhase,
  MatchScoreBreakdown,
  SeatId,
} from "@/game/core";

export interface EnginePolicy {
  id: string;
  selectMove(input: EnginePolicyInput): LegalMove | null;
}

export interface EnginePolicyInput {
  seatId: SeatId;
  observation: SeatObservation;
  legalMoves: readonly LegalMove[];
}

export interface SeatCardSummary {
  cardId: CardInstanceId;
  sourceId: string;
  name: string;
  kind: CatalogCardKind;
  printedStrength: number;
  rows: CatalogRow[];
  abilities: CatalogAbilityId[];
  linkedSourceIds?: readonly string[];
  deckLimit?: number;
}

export interface SeatBoardRowSummary {
  seatId: SeatId;
  row: CatalogRow;
  units: SeatCardSummary[];
  horn: SeatCardSummary | null;
}

export interface PromptOptionSummary {
  optionId: string;
  label: string;
  targetCardId?: CardInstanceId;
  targetStrength?: number;
  targetCard?: SeatCardSummary;
  targetCards?: readonly SeatCardSummary[];
}

export interface PendingPromptSummary {
  promptId: string;
  seatId: SeatId;
  kind: string;
  abilityId: string;
  sourceCardId?: CardInstanceId;
  options: PromptOptionSummary[];
  // cCp28 hidden-info disclosure for `look_three_cards`. Present only on the
  // acting seat's prompt summary so the non-acting seat (which receives
  // `pendingPrompt: null`) cannot learn the revealed identities.
  revealedCards?: readonly SeatCardSummary[];
}

export interface SeatObservation {
  seatId: SeatId;
  opponentSeatId: SeatId;
  phase: MatchPhase;
  round: number;
  currentTurn: SeatId;
  // cFp26: public faction info for Nilfgaard tie-win awareness.
  // Safe to expose — faction is public information visible to both players.
  ownFaction: CatalogFaction;
  opponentFaction: CatalogFaction;
  // cCp32.1: public post-mulligan Scoia'tael first-player choice metadata.
  // Safe to expose because it is derived only from public faction identity.
  ownHasPostMulliganFirstPlayerChoice: boolean;
  opponentHasPostMulliganFirstPlayerChoice: boolean;
  ownHand: SeatCardSummary[];
  ownLeader: {
    leaderCardId: CardInstanceId | null;
    sourceId: string;
    used: boolean;
    // cCp29 public suppression status. True when this seat's leader is
    // suppressed for the current round by an opponent `cancel_leader`.
    cancelledThisRound: boolean;
  };
  ownDeckCount: number;
  ownDiscard: SeatCardSummary[];
  ownDiscardCount: number;
  ownPassed: boolean;
  ownGems: number;
  opponentHandCount: number;
  opponentLeader: {
    leaderCardId: CardInstanceId | null;
    sourceId: string;
    used: boolean;
    // cCp29 public suppression status for the opponent's leader.
    cancelledThisRound: boolean;
  };
  opponentDeckCount: number;
  opponentDiscardCount: number;
  opponentPassed: boolean;
  opponentGems: number;
  boardRows: SeatBoardRowSummary[];
  weather: SeatCardSummary[];
  score: MatchScoreBreakdown;
  pendingPrompt: PendingPromptSummary | null;
}
