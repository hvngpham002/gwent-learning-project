import {
  CATALOG_ABILITY_IDS,
  CATALOG_CARD_KINDS,
  CATALOG_FACTIONS,
  CATALOG_LEADER_ABILITY_IDS,
  CATALOG_ROWS,
} from "./constants";

export type CatalogFaction = (typeof CATALOG_FACTIONS)[number];
export type CatalogRow = (typeof CATALOG_ROWS)[number];
export type CatalogCardKind = (typeof CATALOG_CARD_KINDS)[number];
export type CatalogAbilityId = (typeof CATALOG_ABILITY_IDS)[number];
export type CatalogLeaderAbilityId = (typeof CATALOG_LEADER_ABILITY_IDS)[number];

export type CatalogImplementationStatus = "implemented" | "planned" | "placeholder";

export interface CatalogAbilityMetadata {
  id: CatalogAbilityId;
  name: string;
  status: CatalogImplementationStatus;
  appliesTo: CatalogCardKind[];
  description: string;
}

export interface CatalogLeaderAbilityMetadata {
  id: CatalogLeaderAbilityId;
  name: string;
  status: CatalogImplementationStatus;
  description: string;
}

export interface CatalogCardSource {
  sourceId: string;
  name: string;
  faction: CatalogFaction;
  kind: CatalogCardKind;
  strength: number;
  rows: CatalogRow[];
  abilities: CatalogAbilityId[];
  tags: string[];
  deckLimit: number;
  image: string;
  linkedSourceIds?: string[];
  description?: string;
  status?: CatalogImplementationStatus;
}

export interface CatalogLeaderSource {
  sourceId: string;
  name: string;
  faction: Exclude<CatalogFaction, "neutral">;
  ability: CatalogLeaderAbilityId;
  image: string;
  description?: string;
}

export interface DeckPresetEntry {
  sourceId: string;
  count: number;
}

export interface CatalogDeckPreset {
  presetId: string;
  name: string;
  faction: Exclude<CatalogFaction, "neutral">;
  leaderSourceId: string;
  mainDeck: DeckPresetEntry[];
  sideDeck: DeckPresetEntry[];
}

export interface RuntimeCardIdentity {
  sourceId: string;
  instanceId: string;
}

export type CatalogValidationCode =
  | "missing_required_field"
  | "duplicate_source_id"
  | "duplicate_leader_source_id"
  | "invalid_faction"
  | "invalid_kind"
  | "invalid_rows"
  | "invalid_strength"
  | "unknown_ability"
  | "unknown_leader_ability"
  | "unknown_linked_source_id"
  | "invalid_image"
  | "invalid_deck_limit"
  | "duplicate_preset_id"
  | "unknown_card_reference"
  | "unknown_leader_reference"
  | "invalid_deck_count";

export interface CatalogValidationError {
  path: string;
  code: CatalogValidationCode;
  message: string;
}

export interface CatalogValidationResult {
  valid: boolean;
  errors: CatalogValidationError[];
}
