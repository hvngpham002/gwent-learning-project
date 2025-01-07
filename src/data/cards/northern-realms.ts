// src/data/cards/northern-realms.ts
import { CardType, Faction, RowPosition, CardAbility, LeaderAbility } from '../../types/card';

export const northernRealmsLeaders = [
    {
        id: 'nr_leader_01',
        name: 'Foltest: King of Temeria',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.LEADER,
        strength: 0,
        ability: LeaderAbility.PLAY_FOG,
        imageUrl: 'src/assets/images/northern_realms/leaders/Foltest_King_of_Temeria.png',
        description: 'Pick an Impenetrable Fog card from your deck and play it instantly.',
        used: false
    },
    {
        id: 'nr_leader_02',
        name: 'Foltest: Lord Commander of The North',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.LEADER,
        strength: 0,
        ability: LeaderAbility.CLEAR_WEATHER,
        imageUrl: 'src/assets/images/northern_realms/leaders/Foltest_Lord_Commander_of_the_North.png',
        description: 'Clear any weather effects in play.',
        used: false
    },
    {
        id: 'nr_leader_03',
        name: 'Foltest: Son of Medell',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.LEADER,
        strength: 0,
        ability: LeaderAbility.SCORCH_RANGED,
        imageUrl: 'src/assets/images/northern_realms/leaders/Foltest_Son_of_Medell.png',
        description: 'Destroy your enemy\'s strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more.',
        used: false
    },
    {
        id: 'nr_leader_04',
        name: 'Foltest: The Siegemaster',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.LEADER,
        strength: 0,
        ability: LeaderAbility.DOUBLE_SIEGE,
        imageUrl: 'src/assets/images/northern_realms/leaders/Foltest_the_Siegemaster.png',
        description: 'Doubles the strength of all your Siege units (unless a Commander\'s Horn is also present on that row).',
        used: false
    },
    {
        id: 'nr_leader_05',
        name: 'Foltest: The Steel-Forged',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.LEADER,
        strength: 0,
        ability: LeaderAbility.SCORCH_SIEGE,
        imageUrl: 'src/assets/images/northern_realms/leaders/Foltest_the_Steel-Forged.png',
        description: 'Destroy your enemy\'s strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.',
        used: false
    }
];

export const northernRealmsHeroes = [
    {
        id: 'nr_hero_01',
        name: 'Philippa Eilhart',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/heroes/Philippa_Eilhart.png'
    },
    {
        id: 'nr_hero_02',
        name: 'Vernon Roche',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/heroes/Vernon_Roche.png'
    },
    {
        id: 'nr_hero_03',
        name: 'John Natalis',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/heroes/John_Natalis.png'
    },
    {
        id: 'nr_hero_04',
        name: 'Esterad Thyssen',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/heroes/Esterad_Thyssen.png'
    }
];

export const northernRealmsUnits = [
    // Close Combat Units
    {
        id: 'nr_unit_01',
        name: 'Redanian Foot Soldier',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 1,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/redanian_foot_soldier.png'
    },
    {
        id: 'nr_unit_02',
        name: 'Poor Fucking Infantry',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 1,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: 'src/assets/images/northern_realms/poor_fucking_infantry.png'
    },
    {
        id: 'nr_unit_03',
        name: 'Blue Stripes Commando',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: 'src/assets/images/northern_realms/blue_stripes_commando.png'
    },
    {
        id: 'nr_unit_04',
        name: 'Prince Stennis',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: 'src/assets/images/northern_realms/prince_stennis.png'
    },
    {
        id: 'nr_unit_05',
        name: 'Siegfried of Denesle',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/siegfried_of_denesle.png'
    },
    {
        id: 'nr_unit_06',
        name: 'Sigismund Dijkstra',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: 'src/assets/images/northern_realms/sigismund_dijkstra.png'
    },
    {
        id: 'nr_unit_07',
        name: 'Ves',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/ves.png'
    },
    {
        id: 'nr_unit_08',
        name: 'Yarpen Zigrin',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/yarpen_zigrin.png'
    },
    // Ranged Units
    {
        id: 'nr_unit_09',
        name: 'Crinfrid Reavers Dragon Hunter',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.RANGED,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: 'src/assets/images/northern_realms/crinfrid_reavers_dragon_hunter.png'
    },
    {
        id: 'nr_unit_10',
        name: 'Dethmold',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/dethmold.png'
    },
    {
        id: 'nr_unit_11',
        name: 'Keira Metz',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/keira_metz.png'
    },
    {
        id: 'nr_unit_12',
        name: 'Sabrina Glevissig',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/sabrina_glevissig.png'
    },
    {
        id: 'nr_unit_13',
        name: 'Sheldon Skaggs',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/sheldon_skaggs.png'
    },
    {
        id: 'nr_unit_14',
        name: 'Síle de Tansarville',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/sile_de_tansarville.png'
    },
    // Siege Units
    {
        id: 'nr_unit_15',
        name: 'Ballista',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/ballista.png'
    },
    {
        id: 'nr_unit_16',
        name: 'Catapult',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 8,
        row: RowPosition.SIEGE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: 'src/assets/images/northern_realms/catapult.png'
    },
    {
        id: 'nr_unit_17',
        name: 'Dun Banner Medic',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.SIEGE,
        ability: CardAbility.MEDIC,
        imageUrl: 'src/assets/images/northern_realms/dun_banner_medic.png'
    },
    {
        id: 'nr_unit_18',
        name: 'Kaedweni Siege Expert',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 1,
        row: RowPosition.SIEGE,
        ability: CardAbility.MORALE_BOOST,
        imageUrl: 'src/assets/images/northern_realms/kaedweni_siege_expert.png'
    },
    {
        id: 'nr_unit_19',
        name: '	Siege Tower',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/siege_tower.png'
    },
    {
        id: 'nr_unit_20',
        name: 'Thaler',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 1,
        row: RowPosition.SIEGE,
        ability: CardAbility.SPY,
        imageUrl: 'src/assets/images/northern_realms/thaler.png'
    },
    {
        id: 'nr_unit_21',
        name: 'Trebuchet',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/northern_realms/trebuchet.png'
    },
];

export const northernRealmsDeck = {
    leaders: northernRealmsLeaders,
    heroes: northernRealmsHeroes,
    units: northernRealmsUnits
};