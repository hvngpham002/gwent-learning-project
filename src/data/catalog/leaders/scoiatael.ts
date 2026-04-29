import type { CatalogLeaderSource } from "@/game/catalog";

export const scoiataelCatalogLeaders = [
  {
    sourceId: "scoiatael.francesca-findabair-hope-of-the-aen-seidhe",
    name: "Francesca Findabair: Hope of the Aen Seidhe",
    faction: "scoiatael",
    ability: "optimize_agile_rows",
    image: "/images/scoiatael/leaders/Francesca_Findabair_Hope_of_the_Aen_Seidhe.png",
    description: "Move all your Agile units to the row that yields the most strength.",
  },
  {
    sourceId: "scoiatael.francesca-findabair-queen-of-dol-blathanna",
    name: "Francesca Findabair: Queen of Dol Blathanna",
    faction: "scoiatael",
    ability: "double_close",
    image: "/images/scoiatael/leaders/Francesca_Findabair_Queen_of_Dol_Blathanna.png",
    description: "Doubles the strength of all your Close Combat units (unless a Commander's Horn is also present on that row).",
  },
  {
    sourceId: "scoiatael.francesca-findabair-the-beautiful",
    name: "Francesca Findabair: The Beautiful",
    faction: "scoiatael",
    ability: "double_ranged",
    image: "/images/scoiatael/leaders/Francesca_Findabair_the_Beautiful.png",
    description: "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row).",
  },
  {
    sourceId: "scoiatael.francesca-findabair-daisy-of-the-valley",
    name: "Francesca Findabair: Daisy of the Valley",
    faction: "scoiatael",
    ability: "draw_extra_card",
    image: "/images/scoiatael/leaders/Francesca_Findabair_Daisy_of_The_Valley.png",
    description: "Draw 1 extra card at the start of the battle.",
  },
  {
    sourceId: "scoiatael.francesca-findabair-pureblood-elf",
    name: "Francesca Findabair: Pureblood Elf",
    faction: "scoiatael",
    ability: "play_frost",
    image: "/images/scoiatael/leaders/Francesca_Findabair_Pureblood_Elf.png",
    description: "Pick a Biting Frost card from your deck and play it instantly.",
  },
] as const satisfies CatalogLeaderSource[];
