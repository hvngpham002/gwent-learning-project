// Manifest of official Game8 leader catalog promotion (cBp5).
// Records which official leader candidates are now present in the permanent
// leader catalog packs, which preserved current source IDs were authority,
// and which leader abilities remain placeholder metadata.
//
// This module is data-only. It does not import the Game8 scrape JSON or the
// cBp3 staging candidate arrays at runtime. Tests cross-check the manifest
// against the staging exports.

export interface OfficialLeaderPromotionManifest {
  readonly officialLeaderCandidateCount: number;
  readonly promotedLeaderSourceCount: number;
  readonly preservedCurrentLeaderSourceIds: readonly string[];
  readonly addedLeaderSourceIds: readonly string[];
  readonly promotedLeaderSourceIds: readonly string[];
  readonly countsByFaction: Readonly<Record<string, number>>;
  readonly executableLeaderSourceIds: readonly string[];
  readonly placeholderLeaderAbilityIds: readonly string[];
}

const preservedCurrentLeaderSourceIds: readonly string[] = [
  "northern-realms.foltest-king-of-temeria",
  "northern-realms.foltest-lord-commander-of-the-north",
  "northern-realms.foltest-son-of-medell",
  "northern-realms.foltest-the-siegemaster",
  "northern-realms.foltest-the-steel-forged",
  "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard",
  "nilfgaard.emhyr-var-emreis-the-white-flame",
  "nilfgaard.emhyr-var-emreis-the-relentless",
  "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
  "nilfgaard.emhyr-var-emreis-invader-of-the-north",
];

const addedLeaderSourceIds: readonly string[] = [
  "monsters.eredin-king-of-the-wild-hunt",
  "monsters.eredin-commander-of-the-red-riders",
  "monsters.eredin-destroyer-of-worlds",
  "monsters.eredin-bringer-of-death",
  "monsters.eredin-breacc-glas-the-treacherous",
  "scoiatael.francesca-findabair-hope-of-the-aen-seidhe",
  "scoiatael.francesca-findabair-queen-of-dol-blathanna",
  "scoiatael.francesca-findabair-the-beautiful",
  "scoiatael.francesca-findabair-daisy-of-the-valley",
  "scoiatael.francesca-findabair-pureblood-elf",
  "skellige.king-bran",
  "skellige.crach-an-craite",
];

const promotedLeaderSourceIds: readonly string[] = [
  ...preservedCurrentLeaderSourceIds,
  ...addedLeaderSourceIds,
].slice().sort();

const countsByFaction: Readonly<Record<string, number>> = {
  northern_realms: 5,
  nilfgaard: 5,
  monsters: 5,
  scoiatael: 5,
  skellige: 2,
};

// Only leaders whose ability metadata is `implemented` are considered executable.
// The clear-weather Foltest leader is the only such record at present.
const executableLeaderSourceIds: readonly string[] = [
  "northern-realms.foltest-lord-commander-of-the-north",
];

// Leader abilities introduced by this manifest that remain placeholder metadata.
// They validate as known catalog leader abilities but do not produce executable
// engine commands.
const placeholderLeaderAbilityIds: readonly string[] = [
  "play_any_weather",
  "double_close",
  "discard_two_draw_one_from_deck",
  "restore_discard_to_hand",
  "double_spies",
  "weather_half_penalty",
  "optimize_agile_rows",
  "double_ranged",
  "draw_extra_card",
  "shuffle_discards_into_decks",
];

export const officialLeaderPromotionManifest: OfficialLeaderPromotionManifest = {
  officialLeaderCandidateCount: 22,
  promotedLeaderSourceCount: promotedLeaderSourceIds.length,
  preservedCurrentLeaderSourceIds,
  addedLeaderSourceIds,
  promotedLeaderSourceIds,
  countsByFaction,
  executableLeaderSourceIds,
  placeholderLeaderAbilityIds,
};
