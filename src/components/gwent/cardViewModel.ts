import type {
  CatalogAbilityId,
  CatalogCardKind,
  CatalogFaction,
  CatalogRow,
} from "@/game/catalog";

export type AuthenticCardSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AuthenticCardBackVariant = "deck" | "discard";

export interface AuthenticCardDimensions {
  readonly width: number;
  readonly height: number;
}

export const AUTHENTIC_CARD_DIMENSIONS: Record<AuthenticCardSize, AuthenticCardDimensions> = {
  xs: { width: 44, height: 83 },
  sm: { width: 60, height: 113 },
  md: { width: 80, height: 151 },
  lg: { width: 110, height: 207 },
  xl: { width: 180, height: 339 },
};

export const AUTHENTIC_CARD_SOURCE_FACE_BOTTOM_CROP_PX = 15;

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

const normalizeFactionSlug = (faction: string) => faction.replace(/[^a-z0-9_-]/gi, "_");

export const cardBackImageCandidates = (
  faction: string,
  variant: AuthenticCardBackVariant = "deck",
): readonly string[] => {
  if (variant === "discard") {
    return [
      "/images/card-backs/discard.png",
      "/images/card-backs/discard.jpg",
      "/images/card-backs/discard.jpeg",
      "/images/other-graveyard.png",
    ];
  }

  const slug = normalizeFactionSlug(faction || "neutral");
  const kebab = slug.replace(/_/g, "-");

  return [
    `/images/card-backs/${slug}.png`,
    `/images/card-backs/${slug}.jpg`,
    `/images/card-backs/${slug}.jpeg`,
    `/images/card-backs/${slug}.webp`,
    `/images/card-backs/${kebab}.png`,
    `/images/card-backs/${kebab}.jpg`,
    `/images/card-backs/${kebab}.jpeg`,
    `/images/card-backs/${kebab}.webp`,
    `/images/card-backs/${slug}_back.png`,
    `/images/card-backs/${slug}_back.jpg`,
    `/images/card-backs/${kebab}-back.png`,
    `/images/card-backs/${kebab}-back.jpg`,
    `/images/card-backs/back_${slug}.png`,
    `/images/card-backs/back_${slug}.jpg`,
    `/images/${slug}/card_back.png`,
    `/images/${slug}/card-back.png`,
    `/images/${slug}/deck_back.png`,
    `/images/${slug}/deck-back.png`,
    `/images/${slug}/${slug}_back.png`,
    `/images/${slug}/${kebab}-back.png`,
    `/images/${slug}/back.png`,
  ];
};
