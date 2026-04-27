import type {
  CatalogCardSource,
  CatalogDeckPreset,
  CatalogFaction,
  CatalogLeaderSource,
  CatalogRow,
} from "@/game/catalog";

export type DeckBuilderFilter = "all" | "heroes" | "units" | "specials";

export interface DeckBuilderValidationIssue {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly message: string;
  readonly sourceId?: string;
}

export interface DeckBuilderStats {
  readonly totalCards: number;
  readonly battlefieldCards: number;
  readonly unitCards: number;
  readonly heroCards: number;
  readonly specialCards: number;
  readonly totalStrength: number;
  readonly rowCounts: Record<CatalogRow, number>;
  readonly issues: readonly DeckBuilderValidationIssue[];
  readonly playable: boolean;
}

export interface DeckBuilderCardPoolItem {
  readonly card: CatalogCardSource;
  readonly count: number;
  readonly atLimit: boolean;
  readonly addState: DeckBuilderAddState;
}

export interface DeckBuilderDeckCardItem {
  readonly card: CatalogCardSource;
  readonly count: number;
}

export interface DeckBuilderImportResult {
  readonly ok: boolean;
  readonly preset?: CatalogDeckPreset;
  readonly errors: readonly string[];
  readonly notices?: readonly string[];
}

export interface DeckBuilderStoreV1 {
  readonly schemaVersion: "authentic-decks-v1";
  readonly decks: readonly CatalogDeckPreset[];
  readonly activePresetId?: string;
}

export interface DeckBuilderSourceSets {
  readonly cards: readonly CatalogCardSource[];
  readonly leaders: readonly CatalogLeaderSource[];
}

export type EditableDeckFaction = Exclude<CatalogFaction, "neutral">;

export interface DeckBuilderAddState {
  readonly canAdd: boolean;
  readonly reasonCode?: "deck_limit" | "special_cap" | "wrong_faction" | "unknown_card";
  readonly reason?: string;
}

export interface DeckBuilderFactionOption {
  readonly faction: EditableDeckFaction;
  readonly name: string;
  readonly available: boolean;
  readonly leaderCount: number;
  readonly cardCount: number;
  readonly disabledReason?: string;
}

export interface DeckBuilderFactionChangeResult {
  readonly deck: CatalogDeckPreset;
  readonly removedCards: number;
}
