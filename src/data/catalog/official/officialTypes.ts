import type {
  CatalogCardSource,
  CatalogFaction,
  CatalogLeaderAbilityId,
  CatalogLeaderSource,
} from "@/game/catalog";

export type OfficialPortingStatus =
  | "ready_for_catalog"
  | "needs_image"
  | "needs_rule"
  | "needs_leader_rule"
  | "needs_review";

export interface OfficialAcquisitionRow {
  readonly method: string;
  readonly location: string;
  readonly region: string;
  readonly availability: string;
  readonly quest: string;
  readonly questUrl: string;
}

export interface OfficialCardCandidate {
  readonly source: CatalogCardSource;
  readonly copyCount: number;
  readonly game8CopyIds: readonly string[];
  readonly game8Urls: readonly string[];
  readonly game8ImageUrl?: string;
  readonly acquisitionRows: readonly OfficialAcquisitionRow[];
  readonly portingStatus: OfficialPortingStatus;
  readonly portingIssues: readonly string[];
  readonly matchedCurrentSourceId?: string;
}

export interface OfficialLeaderCandidate {
  readonly sourceId: string;
  readonly name: string;
  readonly faction: Exclude<CatalogFaction, "neutral">;
  readonly mappedAbilityId?: CatalogLeaderAbilityId;
  readonly pendingAbilityId?: string;
  readonly game8Urls: readonly string[];
  readonly game8ImageUrl?: string;
  readonly leaderEffectText?: string;
  readonly portingStatus: OfficialPortingStatus;
  readonly portingIssues: readonly string[];
  readonly image: string;
  readonly matchedCurrentSourceId?: string;
}

export interface OfficialImageCrop {
  readonly fit: "contain" | "cover";
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly cropBottomPx: number;
}

export interface OfficialImageCandidate {
  readonly sourceId: string;
  readonly preferredImagePath: string;
  readonly game8ImageUrl?: string;
  readonly existsInPublicImages: boolean;
  readonly crop: OfficialImageCrop;
  readonly approved: boolean;
  readonly browserLocalPreview?: boolean;
}

export interface OfficialScrapeCountSummary {
  readonly totalInstances: number;
  readonly uniqueCards: number;
  readonly byFaction: Readonly<Record<string, number>>;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byUnitType: Readonly<Record<string, number>>;
  readonly byAbility: Readonly<Record<string, number>>;
  readonly byLeaderAbilityStatus: Readonly<Record<string, number>>;
}

export interface OfficialPortingSummary {
  readonly schemaVersion: "game8-gwent-card-port-v1";
  readonly retrievedAt?: string;
  readonly source?: Readonly<Record<string, string | number>>;
  readonly counts: OfficialScrapeCountSummary;
  readonly cardCandidateCount: number;
  readonly leaderCandidateCount: number;
  readonly totalCandidateCount: number;
  readonly totalPhysicalCopies: number;
  readonly missingImageCount: number;
  readonly readyForCatalogCount: number;
  readonly ruleGapCount: number;
  readonly leaderRuleGapCount: number;
  readonly needsReviewCount: number;
  readonly preservedCurrentSourceIds: readonly string[];
  readonly sourceIdConflicts: readonly string[];
  readonly unsupportedAbilityCounts: Readonly<Record<string, number>>;
  readonly unsupportedLeaderAbilityCounts: Readonly<Record<string, number>>;
}

export interface OfficialCandidateBuildResult {
  readonly cards: readonly OfficialCardCandidate[];
  readonly leaders: readonly OfficialLeaderCandidate[];
  readonly images: readonly OfficialImageCandidate[];
  readonly summary: OfficialPortingSummary;
}

export type OfficialSourceCandidate = OfficialCardCandidate | OfficialLeaderCandidate;

export const officialLeaderToCatalogSource = (
  leader: OfficialLeaderCandidate,
): CatalogLeaderSource | null => {
  if (!leader.mappedAbilityId) {
    return null;
  }
  return {
    sourceId: leader.sourceId,
    name: leader.name,
    faction: leader.faction,
    ability: leader.mappedAbilityId,
    image: leader.image,
    description: leader.leaderEffectText,
  };
};
