// src/data/cards/nilfgaardian-empire.ts
import { CardType, Faction, RowPosition, CardAbility, LeaderAbility } from '../../types/card';

export const nilfgaardianEmpireLeaders = [
    {
        id: 'nilfgaard_leader_01',
        name: 'Emhyr var Emreis: Emperor of Nilfgaard',
        faction: Faction.NILFGAARD,
        type: CardType.LEADER,
        ability: LeaderAbility.LOOK_THREE_CARDS,
        imageUrl: '/images/nilfgaard/leaders/Emhyr_var_Emreis_Emperor_of_Nilfgaard.png'
    },
    {
        id: 'nilfgaard_leader_02',
        name: 'Emhyr var Emreis: The White Flame',
        faction: Faction.NILFGAARD,
        type: CardType.LEADER,
        ability: LeaderAbility.CANCEL_LEADER,
        imageUrl: '/images/nilfgaard/leaders/Emhyr_var_Emreis_the_White_Flame.png'
    },
    {
        id: 'nilfgaard_leader_03',
        name: 'Emhyr var Emreis: The Relentless',
        faction: Faction.NILFGAARD,
        type: CardType.LEADER,
        ability: LeaderAbility.DRAW_OPPONENT_DISCARD,
        imageUrl: '/images/nilfgaard/leaders/Emhyr_var_Emreis_the_Relentless.png',
        description: 'Draw a card from your opponent\'s discard pile.'
    },
    {
        id: 'nilfgaard_leader_04',
        name: 'Emhyr var Emreis: His Imperial Majesty',
        faction: Faction.NILFGAARD,
        type: CardType.LEADER,
        ability: LeaderAbility.PLAY_RAIN,
        imageUrl: '/images/nilfgaard/leaders/Emhyr_var_Emreis_His_Imperial_Majesty.png'
    },
    {
        id: 'nilfgaard_leader_05',
        name: 'Emhyr var Emreis: Invader of the North',
        faction: Faction.NILFGAARD,
        type: CardType.LEADER,
        ability: LeaderAbility.RANDOM_MEDIC,
        imageUrl: '/images/nilfgaard/leaders/Emhyr_var_Emreis_Invader_of_the_North.png'
    }
];

export const nilfgaardianEmpireHeroes = [
    {
        id: 'nilfgaard_hero_01',
        name: 'Letho of Gulet',
        faction: Faction.NILFGAARD,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/heroes/Letho_of_Gulet.png',
        description: 'Hero: Not affected by any Special Cards or abilities.'
    },
    {
        id: 'nilfgaard_hero_02',
        name: 'Menno Coehoorn',
        faction: Faction.NILFGAARD,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.MEDIC,
        imageUrl: '/images/nilfgaard/heroes/Menno_Coehoorn.png',
        description: 'Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).'
    },
    {
        id: 'nilfgaard_hero_03',
        name: 'Morvran Voorhis',
        faction: Faction.NILFGAARD,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/heroes/Morvran_Voorhis.png',
        description: 'Hero: Not affected by any Special Cards or abilities.'
    },
    {
        id: 'nilfgaard_hero_04',
        name: 'Tibor Eggebracht',
        faction: Faction.NILFGAARD,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/heroes/Tibor_Eggebracht.png',
        description: 'Hero: Not affected by any Special Cards or abilities.'
    }
];

export const nilfgaardianEmpireUnits = [
    {
        id: 'nilfgaard_unit_01',
        name: 'Albrich',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/albrich.png'
    },
    {
        id: 'nilfgaard_unit_02',
        name: 'Assire var Anahid',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/assire_var_anahid.png'
    },
    {
        id: 'nilfgaard_unit_03',
        name: 'Black Infantry Archer',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 10,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/black_infantry_archer.png'
    },
    {
        id: 'nilfgaard_unit_04',
        name: 'Cahir Mawr Dyffryn Aep Ceallach',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/cahir_mawr_dyffryn_aep_ceallach.png'
    },
    {
        id: 'nilfgaard_unit_05',
        name: 'Cynthia',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/cynthia.png'
    },
    {
        id: 'nilfgaard_unit_06',
        name: 'Etolian Auxiliary Archers',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 1,
        row: RowPosition.RANGED,
        ability: CardAbility.MEDIC,
        imageUrl: '/images/nilfgaard/etolian_auxiliary_archers.png',
        description: 'Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).'
    },
    {
        id: 'nilfgaard_unit_07',
        name: 'Fringilla Vigo',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/fringilla_vigo.png'
    },
    {
        id: 'nilfgaard_unit_08',
        name: 'Heavy Fire Zerrikanian Scorpion',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 10,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/heavy_fire_zerrikanian_scorpion.png'
    },
    {
        id: 'nilfgaard_unit_09',
        name: 'Impera Brigade Guard',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 3,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/images/nilfgaard/impera_brigade_guard.png',
        description: 'Tight Bond: Place next to a card with the same name to double the strength of both cards.'
    },
    {
        id: 'nilfgaard_unit_10',
        name: 'Morteisen',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 3,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/morteisen.png'
    },
    {
        id: 'nilfgaard_unit_11',
        name: 'Nausicaa Cavalry Rider',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/images/nilfgaard/nausicaa_cavalry_rider.png',
        description: 'Tight Bond: Place next to a card with the same name to double the strength of both cards.'
    },
    {
        id: 'nilfgaard_unit_12',
        name: 'Puttkammer',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 3,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/puttkammer.png'
    },
    {
        id: 'nilfgaard_unit_13',
        name: 'Rainfarn',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/rainfarn.png'
    },
    {
        id: 'nilfgaard_unit_14',
        name: 'Renuald aep Matsen',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/renuald_aep_matsen.png'
    },
    {
        id: 'nilfgaard_unit_15',
        name: 'Rotten Mangonel',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 3,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/rotten_mangonel.png'
    },
    {
        id: 'nilfgaard_unit_16',
        name: 'Shilard Fitz-Oesterlen',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 7,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: '/images/nilfgaard/shilard_fitz-oesterlen.png',
        description: 'Spy: Place on your opponent\'s battlefield and draw 2 cards from your deck.'
    },
    {
        id: 'nilfgaard_unit_17',
        name: 'Siege Engineer',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/siege_engineer.png'
    },
    {
        id: 'nilfgaard_unit_18',
        name: 'Siege Technician',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 0,
        row: RowPosition.SIEGE,
        ability: CardAbility.MEDIC,
        imageUrl: '/images/nilfgaard/siege_technician.png',
        description: 'Medic: Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).'
    },
    {
        id: 'nilfgaard_unit_19',
        name: 'Stefan Skellen',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 9,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: '/images/nilfgaard/stefan_skellen.png',
        description: 'Spy: Place on your opponent\'s battlefield and draw 2 cards from your deck.'
    },
    {
        id: 'nilfgaard_unit_20',
        name: 'Sweers',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/sweers.png'
    },
    {
        id: 'nilfgaard_unit_21',
        name: 'Vanhemar',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/vanhemar.png'
    },
    {
        id: 'nilfgaard_unit_22',
        name: 'Vattier de Rideaux',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: '/images/nilfgaard/vattier_de_rideaux.png',
        description: 'Spy: Place on your opponent\'s battlefield and draw 2 cards from your deck.'
    },
    {
        id: 'nilfgaard_unit_23',
        name: 'Vreemde',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/images/nilfgaard/vreemde.png'
    },
    {
        id: 'nilfgaard_unit_24',
        name: 'Young Emissary',
        faction: Faction.NILFGAARD,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/images/nilfgaard/young_emmisary.png',
        description: 'Tight Bond: Place next to a card with the same name to double the strength of both cards.'
    }
];

export const nilfgaardianEmpireDeck = {
    leaders: nilfgaardianEmpireLeaders,
    heroes: nilfgaardianEmpireHeroes,
    units: nilfgaardianEmpireUnits
};