import type { CatalogDeckPreset } from "@/game/catalog";

export const officialSkelligeStarterDeckPreset = {
  presetId: "official-skellige-starter",
  name: "Official Skellige Starter",
  faction: "skellige",
  leaderSourceId: "skellige.king-bran",
  mainDeck: [
    { sourceId: "skellige.cerys", count: 1 },
    { sourceId: "skellige.hjalmar", count: 1 },
    { sourceId: "skellige.ermion", count: 1 },
    { sourceId: "skellige.olaf", count: 1 },
    { sourceId: "skellige.clan-an-craite-warrior", count: 3 },
    { sourceId: "skellige.clan-drummond-shield-maiden", count: 3 },
    { sourceId: "skellige.clan-brokvar-archer", count: 3 },
    { sourceId: "skellige.light-longship", count: 3 },
    { sourceId: "skellige.war-longship", count: 3 },
    { sourceId: "skellige.young-berserker", count: 3 },
    { sourceId: "skellige.berserker", count: 1 },
    { sourceId: "skellige.birna-bran", count: 1 },
    { sourceId: "skellige.draig-bon-dhu", count: 1 },
    { sourceId: "skellige.mardroeme", count: 2 },
    { sourceId: "neutral.triss-merigold", count: 1 },
    { sourceId: "neutral.decoy", count: 2 },
    { sourceId: "neutral.commanders-horn", count: 2 },
    { sourceId: "neutral.scorch", count: 2 },
    { sourceId: "neutral.skellige-storm", count: 1 },
  ],
  sideDeck: [
    { sourceId: "skellige.young-vildkaarl", count: 3 },
    { sourceId: "skellige.vildkaarl", count: 1 },
  ],
} as const satisfies CatalogDeckPreset;
