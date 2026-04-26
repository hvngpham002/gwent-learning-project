import type {
  CatalogAbilityId,
  CatalogCardKind,
  CatalogFaction,
  CatalogRow,
} from "@/game/catalog";

export type AuthenticCardSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AuthenticCardDimensions {
  readonly width: number;
  readonly height: number;
}

export const AUTHENTIC_CARD_DIMENSIONS: Record<AuthenticCardSize, AuthenticCardDimensions> = {
  xs: { width: 44, height: 62 },
  sm: { width: 60, height: 86 },
  md: { width: 80, height: 112 },
  lg: { width: 110, height: 154 },
  xl: { width: 180, height: 252 },
};

export interface AuthenticCardViewModel {
  readonly sourceId: string;
  readonly name: string;
  readonly faction: CatalogFaction | string;
  readonly kind: CatalogCardKind | string;
  readonly strength: number;
  readonly rows: readonly (CatalogRow | string)[];
  readonly abilities: readonly (CatalogAbilityId | string)[];
  readonly tags: readonly string[];
  readonly image?: string | null;
  readonly description?: string;
}

export interface CatalogCardLike {
  readonly sourceId: string;
  readonly name: string;
  readonly faction: string;
  readonly kind: string;
  readonly strength: number;
  readonly rows: readonly string[];
  readonly abilities: readonly string[];
  readonly tags: readonly string[];
  readonly image: string;
  readonly description?: string;
}

export const fromCatalogCard = (card: CatalogCardLike): AuthenticCardViewModel => ({
  sourceId: card.sourceId,
  name: card.name,
  faction: card.faction,
  kind: card.kind,
  strength: card.strength,
  rows: card.rows,
  abilities: card.abilities,
  tags: card.tags,
  image: card.image,
  description: card.description,
});

export const isUnitOrHero = (card: AuthenticCardViewModel): boolean =>
  card.kind === "unit" || card.kind === "hero";

export const shouldRenderStrength = (card: AuthenticCardViewModel): boolean => isUnitOrHero(card);

export const dimensionsForSize = (size: AuthenticCardSize): AuthenticCardDimensions =>
  AUTHENTIC_CARD_DIMENSIONS[size] ?? AUTHENTIC_CARD_DIMENSIONS.md;
