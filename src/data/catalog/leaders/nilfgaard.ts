import type { CatalogLeaderSource } from "@/game/catalog";

export const nilfgaardCatalogLeaders = [
  {
    sourceId: "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard",
    name: "Emhyr var Emreis: Emperor of Nilfgaard",
    faction: "nilfgaard",
    ability: "look_three_cards",
    image: "/images/nilfgaard/leaders/Emhyr_var_Emreis_Emperor_of_Nilfgaard.png",
  },
  {
    sourceId: "nilfgaard.emhyr-var-emreis-the-white-flame",
    name: "Emhyr var Emreis: The White Flame",
    faction: "nilfgaard",
    ability: "cancel_leader",
    image: "/images/nilfgaard/leaders/Emhyr_var_Emreis_the_White_Flame.png",
  },
  {
    sourceId: "nilfgaard.emhyr-var-emreis-the-relentless",
    name: "Emhyr var Emreis: The Relentless",
    faction: "nilfgaard",
    ability: "draw_opponent_discard",
    image: "/images/nilfgaard/leaders/Emhyr_var_Emreis_the_Relentless.png",
    description: "Draw a card from your opponent's discard pile.",
  },
  {
    sourceId: "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
    name: "Emhyr var Emreis: His Imperial Majesty",
    faction: "nilfgaard",
    ability: "play_rain",
    image: "/images/nilfgaard/leaders/Emhyr_var_Emreis_His_Imperial_Majesty.png",
  },
  {
    sourceId: "nilfgaard.emhyr-var-emreis-invader-of-the-north",
    name: "Emhyr var Emreis: Invader of the North",
    faction: "nilfgaard",
    ability: "random_medic",
    image: "/images/nilfgaard/leaders/Emhyr_var_Emreis_Invader_of_the_North.png",
  },
] as const satisfies CatalogLeaderSource[];
