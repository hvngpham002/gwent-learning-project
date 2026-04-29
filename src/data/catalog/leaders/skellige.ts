import type { CatalogLeaderSource } from "@/game/catalog";

export const skelligeCatalogLeaders = [
  {
    sourceId: "skellige.king-bran",
    name: "King Bran",
    faction: "skellige",
    ability: "weather_half_penalty",
    image: "/images/skellige/leaders/King_Bran.png",
    description: "Halves the strength penalty from weather effects on your rows.",
  },
  {
    sourceId: "skellige.crach-an-craite",
    name: "Crach an Craite",
    faction: "skellige",
    ability: "shuffle_discards_into_decks",
    image: "/images/skellige/leaders/Crach_an_Craite.png",
    description: "Shuffles both discard piles back into their respective decks.",
  },
] as const satisfies CatalogLeaderSource[];
