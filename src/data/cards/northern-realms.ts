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
        imageUrl: '',
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
        imageUrl: '/assets/cards/northern-realms/foltest_commander.png',
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
        imageUrl: '/assets/cards/northern-realms/foltest_commander.png',
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
        imageUrl: '/assets/cards/northern-realms/foltest_siege.png',
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
        imageUrl: '/assets/cards/northern-realms/foltest_siege.png',
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
        imageUrl: '/assets/cards/northern-realms/philippa.png'
    },
    {
        id: 'nr_hero_02',
        name: 'Vernon Roche',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/vernon_roche.png'
    },
    {
        id: 'nr_hero_03',
        name: 'John Natalis',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/john_natalis.png'
    },
    {
        id: 'nr_hero_04',
        name: 'Esterad Thyssen',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.HERO,
        strength: 10,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/esterad.png'
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
        imageUrl: '/assets/cards/northern-realms/blue_stripes_commando.png'
    },
    {
        id: 'nr_unit_02',
        name: 'Poor Fucking Infantry',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 1,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/assets/cards/northern-realms/blue_stripes_commando.png'
    },
    {
        id: 'nr_unit_03',
        name: 'Blue Stripes Commando',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.CLOSE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/assets/cards/northern-realms/blue_stripes_commando.png'
    },
    {
        id: 'nr_unit_04',
        name: 'Prince Stennis',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: '/assets/cards/northern-realms/stennis.png'
    },
    {
        id: 'nr_unit_05',
        name: 'Siegfried of Denesle',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/siegfried.png'
    },
    {
        id: 'nr_unit_06',
        name: 'Sigismund Dijkstra',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 7,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: '/assets/cards/northern-realms/dijkstra.png'
    },
    {
        id: 'nr_unit_07',
        name: 'Ves',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 8,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/ves.png'
    },
    {
        id: 'nr_unit_08',
        name: 'Yarpen Zigrin',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 9,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/yarpen.png'
    },
    // Ranged Units
    {
        id: 'nr_unit_09',
        name: 'Crinfrid Reavers Dragon Hunter',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 10,
        row: RowPosition.RANGED,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/assets/cards/northern-realms/crinfrid_reaver.png'
    },
    {
        id: 'nr_unit_10',
        name: 'Dethmold',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 11,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/crinfrid_reaver.png'
    },
    {
        id: 'nr_unit_13',
        name: 'Keira Metz',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 12,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/keira_metz.png'
    },
    {
        id: 'nr_unit_13',
        name: 'Sabrina Glevissig',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 13,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/keira_metz.png'
    },
    {
        id: 'nr_unit_13',
        name: 'Sheldon Skaggs',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 14,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/keira_metz.png'
    },
    {
        id: 'nr_unit_13',
        name: 'Síle de Tansarville',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 15,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/keira_metz.png'
    },
    // Siege Units
    {
        id: 'nr_unit_09',
        name: 'Ballista',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 16,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/thaler.png'
    },
    {
        id: 'nr_unit_09',
        name: '	Catapult',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 17,
        row: RowPosition.SIEGE,
        ability: CardAbility.TIGHT_BOND,
        imageUrl: '/assets/cards/northern-realms/thaler.png'
    },
    {
        id: 'nr_unit_09',
        name: 'Dun Banner Medic',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 18,
        row: RowPosition.SIEGE,
        ability: CardAbility.MEDIC,
        imageUrl: '/assets/cards/northern-realms/thaler.png'
    },
    {
        id: 'nr_unit_09',
        name: 'Kaedweni Siege Expert',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 19,
        row: RowPosition.SIEGE,
        ability: CardAbility.MORALE_BOOST,
        imageUrl: '/assets/cards/northern-realms/thaler.png'
    },
    {
        id: 'nr_unit_09',
        name: '	Siege Tower',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 20,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/thaler.png'
    },
    {
        id: 'nr_unit_09',
        name: 'Thaler',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 21,
        row: RowPosition.SIEGE,
        ability: CardAbility.SPY,
        imageUrl: '/assets/cards/northern-realms/thaler.png'
    },
    {
        id: 'nr_unit_14',
        name: 'Trebuchet',
        faction: Faction.NORTHERN_REALMS,
        type: CardType.UNIT,
        strength: 22,
        row: RowPosition.SIEGE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/northern-realms/trebuchet.png'
    },
];

export const northernRealmsDeck = {
    leaders: northernRealmsLeaders,
    heroes: northernRealmsHeroes,
    units: northernRealmsUnits
};