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
  // Active executable leaders: produce a legal `use_leader` move during play.
  readonly executableLeaderSourceIds: readonly string[];
  // Passive implemented leaders: rule-effect is on for the whole match through
  // the engine but does not produce a `use_leader` legal move.
  readonly implementedPassiveLeaderSourceIds: readonly string[];
  // Union of active + passive implemented leaders. Convenience set for code or
  // tests that need to know "is this leader's ability implemented at all?".
  readonly implementedLeaderSourceIds: readonly string[];
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

// Active executable leaders: leaders whose ability emits a legal `use_leader`
// move during play. cCp14 added the four weather-pulling leaders to the
// original clear-weather Foltest leader. cCp16 adds the two Foltest
// row-Scorch leaders (`scorch_range`, `scorch_siege`) to bring the active
// executable set to seven. cCp21 adds Francesca: Hope of the Aen Seidhe
// (`optimize_agile_rows`) bringing the active executable set to eight.
// cCp22 adds Eredin: Bringer of Death (`restore_discard_to_hand`) bringing
// the active executable set to nine. cCp23 adds Crach an Craite
// (`shuffle_discards_into_decks`) bringing the active executable set to
// ten. cCp24 adds Emhyr var Emreis: The Relentless (`draw_opponent_discard`)
// bringing the active executable set to eleven. King Bran (cCp15) is
// implemented passive and does NOT belong here.
const executableLeaderSourceIds: readonly string[] = [
  "monsters.eredin-bringer-of-death",
  "monsters.eredin-king-of-the-wild-hunt",
  "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
  "nilfgaard.emhyr-var-emreis-the-relentless",
  "northern-realms.foltest-king-of-temeria",
  "northern-realms.foltest-lord-commander-of-the-north",
  "northern-realms.foltest-son-of-medell",
  "northern-realms.foltest-the-steel-forged",
  "scoiatael.francesca-findabair-hope-of-the-aen-seidhe",
  "scoiatael.francesca-findabair-pureblood-elf",
  "skellige.crach-an-craite",
];

// Passive implemented leaders: leaders whose ability metadata is `implemented`
// but is a passive engine rule rather than an active `use_leader` command.
// cCp15 added King Bran (`weather_half_penalty`) here. cCp19 adds the four
// row-wide horn-like passive leaders (`double_siege`, `double_close` ×2,
// `double_ranged`). cCp20 adds Eredin Breacc Glas: The Treacherous
// (`double_spies`). cCp25 adds Emhyr var Emreis: Invader of the North
// (`random_medic`) as a passive Medic mutation, completing Tranche 2.
const implementedPassiveLeaderSourceIds: readonly string[] = [
  "monsters.eredin-breacc-glas-the-treacherous",
  "monsters.eredin-commander-of-the-red-riders",
  "nilfgaard.emhyr-var-emreis-invader-of-the-north",
  "northern-realms.foltest-the-siegemaster",
  "scoiatael.francesca-findabair-queen-of-dol-blathanna",
  "scoiatael.francesca-findabair-the-beautiful",
  "skellige.king-bran",
];

// Union of active executable + passive implemented leaders. Use this set when
// asking "is this leader's ability implemented in the engine at all?".
const implementedLeaderSourceIds: readonly string[] = [
  ...executableLeaderSourceIds,
  ...implementedPassiveLeaderSourceIds,
].slice().sort();

// Leader ability IDs whose `CATALOG_LEADER_ABILITY_METADATA.status` is still
// `placeholder` after cCp25. cCp14 promoted `play_any_weather` to implemented;
// cCp15 promoted `weather_half_penalty` (passive); cCp16 promoted `scorch_range`
// and `scorch_siege`; cCp19 promotes `double_siege`, `double_close`, and
// `double_ranged`; cCp20 promotes `double_spies` (passive); cCp21 promotes
// `optimize_agile_rows` (active executable); cCp22 promotes
// `restore_discard_to_hand` (active executable, prompt-based); cCp23 promotes
// `shuffle_discards_into_decks` (active executable, no prompt); cCp24 promotes
// `draw_opponent_discard` (active executable, prompt-based over opponent
// discard, settling the cCp18 §C-2 conflict in favor of the catalog); cCp25
// promotes `random_medic` (passive Medic mutation, settling the cCp18 §C-3
// conflict in favor of the Medic-mutation reading) and completes Tranche 2.
// The cCp18 audit (§C-7) flagged that this array previously listed only the
// cBp5-introduced placeholders; cCp19 backfilled the pre-cBp5 placeholders
// so the manifest now exhaustively reflects every placeholder leader ability
// ID, and cCp20/cCp21/cCp22/cCp23/cCp24/cCp25 keep it exhaustive after
// removing `double_spies`, `optimize_agile_rows`, `restore_discard_to_hand`,
// `shuffle_discards_into_decks`, `draw_opponent_discard`, and `random_medic`.
const placeholderLeaderAbilityIds: readonly string[] = [
  "cancel_leader",
  "discard_two_draw_one_from_deck",
  "draw_extra_card",
  "look_three_cards",
];

export const officialLeaderPromotionManifest: OfficialLeaderPromotionManifest = {
  officialLeaderCandidateCount: 22,
  promotedLeaderSourceCount: promotedLeaderSourceIds.length,
  preservedCurrentLeaderSourceIds,
  addedLeaderSourceIds,
  promotedLeaderSourceIds,
  countsByFaction,
  executableLeaderSourceIds,
  implementedPassiveLeaderSourceIds,
  implementedLeaderSourceIds,
  placeholderLeaderAbilityIds,
};
