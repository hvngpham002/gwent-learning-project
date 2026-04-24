import type { CatalogCardSource, CatalogDeckPreset, CatalogLeaderSource } from "@/game/catalog";

import {
  monstersCatalogCards,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  northernRealmsCatalogCards,
  scoiataelCatalogCards,
  skelligeCatalogCards,
} from "./cards";
import { currentNilfgaardDeckPreset, currentNorthernRealmsDeckPreset } from "./deck-presets";
import {
  monstersCatalogLeaders,
  nilfgaardCatalogLeaders,
  northernRealmsCatalogLeaders,
  scoiataelCatalogLeaders,
  skelligeCatalogLeaders,
} from "./leaders";

export {
  monstersCatalogCards,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  northernRealmsCatalogCards,
  scoiataelCatalogCards,
  skelligeCatalogCards,
} from "./cards";
export { currentNilfgaardDeckPreset, currentNorthernRealmsDeckPreset } from "./deck-presets";
export {
  monstersCatalogLeaders,
  nilfgaardCatalogLeaders,
  northernRealmsCatalogLeaders,
  scoiataelCatalogLeaders,
  skelligeCatalogLeaders,
} from "./leaders";

export const currentCatalogCards = [
  ...neutralCatalogCards,
  ...northernRealmsCatalogCards,
  ...nilfgaardCatalogCards,
  ...monstersCatalogCards,
  ...scoiataelCatalogCards,
  ...skelligeCatalogCards,
] as const satisfies CatalogCardSource[];

export const currentCatalogLeaders = [
  ...northernRealmsCatalogLeaders,
  ...nilfgaardCatalogLeaders,
  ...monstersCatalogLeaders,
  ...scoiataelCatalogLeaders,
  ...skelligeCatalogLeaders,
] as const satisfies CatalogLeaderSource[];

export const currentDeckPresets = [
  currentNorthernRealmsDeckPreset,
  currentNilfgaardDeckPreset,
] as const satisfies CatalogDeckPreset[];

export interface ResolvedCatalogDeckPreset {
  leader: CatalogLeaderSource;
  mainDeck: Array<{ card: CatalogCardSource; count: number }>;
  sideDeck: Array<{ card: CatalogCardSource; count: number }>;
}

export const resolveCatalogDeckPreset = (
  preset: CatalogDeckPreset,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): ResolvedCatalogDeckPreset => {
  const cardById = new Map(cards.map((card) => [card.sourceId, card]));
  const leader = leaders.find((candidate) => candidate.sourceId === preset.leaderSourceId);

  if (!leader) {
    throw new Error(`Catalog deck preset references missing leader: ${preset.leaderSourceId}`);
  }

  const resolveEntry = (entry: { sourceId: string; count: number }) => {
    const card = cardById.get(entry.sourceId);
    if (!card) {
      throw new Error(`Catalog deck preset references missing card: ${entry.sourceId}`);
    }
    return { card, count: entry.count };
  };

  return {
    leader,
    mainDeck: preset.mainDeck.map(resolveEntry),
    sideDeck: preset.sideDeck.map(resolveEntry),
  };
};
