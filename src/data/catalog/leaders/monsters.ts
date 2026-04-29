import type { CatalogLeaderSource } from "@/game/catalog";

export const monstersCatalogLeaders = [
  {
    sourceId: "monsters.eredin-king-of-the-wild-hunt",
    name: "Eredin: King of the Wild Hunt",
    faction: "monsters",
    ability: "play_any_weather",
    image: "/images/monsters/leaders/Eredin_King_of_the_Wild_Hunt.png",
    description: "Pick any weather card from your deck and play it instantly.",
  },
  {
    sourceId: "monsters.eredin-commander-of-the-red-riders",
    name: "Eredin: Commander of the Red Riders",
    faction: "monsters",
    ability: "double_close",
    image: "/images/monsters/leaders/Eredin_Commander_of_the_Red_Riders.png",
    description: "Doubles the strength of all your Close Combat units (unless a Commander's Horn is also present on that row).",
  },
  {
    sourceId: "monsters.eredin-destroyer-of-worlds",
    name: "Eredin: Destroyer of Worlds",
    faction: "monsters",
    ability: "discard_two_draw_one_from_deck",
    image: "/images/monsters/leaders/Eredin_Destroyer_of_Worlds.png",
    description: "Discard 2 cards, then draw 1 card from your deck.",
  },
  {
    sourceId: "monsters.eredin-bringer-of-death",
    name: "Eredin: Bringer of Death",
    faction: "monsters",
    ability: "restore_discard_to_hand",
    image: "/images/monsters/leaders/Eredin_Bringer_of_Death.png",
    description: "Restore a card from your discard pile to your hand.",
  },
  {
    sourceId: "monsters.eredin-breacc-glas-the-treacherous",
    name: "Eredin Breacc Glas: The Treacherous",
    faction: "monsters",
    ability: "double_spies",
    image: "/images/monsters/leaders/Eredin_Breacc_Glas_The_Treacherous.png",
    description: "Doubles the strength of all spy cards already on the battlefield.",
  },
] as const satisfies CatalogLeaderSource[];
