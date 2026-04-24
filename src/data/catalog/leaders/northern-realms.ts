import type { CatalogLeaderSource } from "@/game/catalog";

export const northernRealmsCatalogLeaders = [
  {
    sourceId: "northern-realms.foltest-king-of-temeria",
    name: "Foltest: King of Temeria",
    faction: "northern_realms",
    ability: "play_fog",
    image: "/images/northern_realms/leaders/Foltest_King_of_Temeria.png",
    description: "Pick an Impenetrable Fog card from your deck and play it instantly.",
  },
  {
    sourceId: "northern-realms.foltest-lord-commander-of-the-north",
    name: "Foltest: Lord Commander of The North",
    faction: "northern_realms",
    ability: "clear_weather",
    image: "/images/northern_realms/leaders/Foltest_Lord_Commander_of_the_North.png",
    description: "Clear any weather effects in play.",
  },
  {
    sourceId: "northern-realms.foltest-son-of-medell",
    name: "Foltest: Son of Medell",
    faction: "northern_realms",
    ability: "scorch_range",
    image: "/images/northern_realms/leaders/Foltest_Son_of_Medell.png",
    description: "Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more.",
  },
  {
    sourceId: "northern-realms.foltest-the-siegemaster",
    name: "Foltest: The Siegemaster",
    faction: "northern_realms",
    ability: "double_siege",
    image: "/images/northern_realms/leaders/Foltest_the_Siegemaster.png",
    description: "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row).",
  },
  {
    sourceId: "northern-realms.foltest-the-steel-forged",
    name: "Foltest: The Steel-Forged",
    faction: "northern_realms",
    ability: "scorch_siege",
    image: "/images/northern_realms/leaders/Foltest_the_Steel-Forged.png",
    description: "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.",
  },
] as const satisfies CatalogLeaderSource[];
