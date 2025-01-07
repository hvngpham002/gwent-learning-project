// src/data/cards/neutral.ts
import { CardType, Faction, RowPosition, CardAbility } from '../../types/card';

export const neutralHeroes = [
    {
        id: 'neutral_hero_01',
        name: 'Geralt of Rivia',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 15,
        row: RowPosition.CLOSE,
        ability: CardAbility.MUSTER_ROACH,
        imageUrl: 'src/assets/images/neutral/Geralt.png'
    },
    {
        id: 'neutral_hero_02',
        name: 'Cirilla Fiona Elen Riannon',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 15,
        row: RowPosition.CLOSE,
        ability: CardAbility.MUSTER_ROACH,
        imageUrl: 'src/assets/images/neutral/Cirilla_Fiona_Elen_Riannon.jpg'
    },
    {
        id: 'neutral_hero_03',
        name: 'Yennefer of Vengerberg',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 7,
        row: RowPosition.RANGED,
        ability: CardAbility.MEDIC,
        imageUrl: 'src/assets/images/neutral/Yennefer.png'
    },
    {
        id: 'neutral_hero_04',
        name: 'Triss Merigold',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 7,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/neutral/Triss.png'
    },
    {
        id: 'neutral_hero_05',
        name: 'Mysterious Elf',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 0,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: 'src/assets/images/neutral/Mysterious_Elf.png'
    }
];

export const neutralUnits = [
    {
        id: 'neutral_unit_01',
        name: 'Dandelion',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.CLOSE,
        ability: CardAbility.COMMANDERS_HORN,
        imageUrl: 'src/assets/images/neutral/dandelion.png'
    },
    {
        id: 'neutral_unit_02',
        name: 'Vesemir',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/neutral/vesemir.png'
    },
    {
        id: 'neutral_unit_03',
        name: 'Zoltan Chivay',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/neutral/zoltan.png'
    },
    {
        id: 'neutral_unit_04',
        name: 'Emiel Regis Rohellec Terzieff',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/neutral/emiel_regis.png'
    },
    {
        id: 'neutral_unit_05',
        name: 'Bovine Defense Force',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 8,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/neutral/bovine_defense_force.png'
    },
    {
        id: 'neutral_unit_06',
        name: 'Cow',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 0,
        row: RowPosition.CLOSE,
        ability: CardAbility.AVENGER,
        imageUrl: 'src/assets/images/neutral/cow.png'
    },
    {
        id: 'neutral_unit_07',
        name: 'Olgierd von Everec',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.CLOSE,
        availableRows: [RowPosition.CLOSE, RowPosition.RANGED],
        ability: CardAbility.AGILE,
        imageUrl: 'src/assets/images/neutral/olgierd_von_everec.png'
    },
    {
        id: 'neutral_unit_08',
        name: 'Roach',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 3,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: 'src/assets/images/neutral/roach.png'
    },
    {
        id: 'neutral_unit_09',
        name: 'Villentretenmerth',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 7,
        row: RowPosition.CLOSE,
        ability: CardAbility.SCORCH_CLOSE,
        imageUrl: 'src/assets/images/neutral/villentretenmerth.png'
    },
    {
        id: 'neutral_unit_10',
        name: 'Gaunter O\'Dimm',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 2,
        row: RowPosition.SIEGE,
        ability: CardAbility.MUSTER,
        imageUrl: 'src/assets/images/neutral/gaunt_odimm.png'
    },
    {
        id: 'neutral_unit_11',
        name: 'Gaunter O\'Dimm: Darkness',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 4,
        row: RowPosition.RANGED,
        ability: CardAbility.MUSTER,
        imageUrl: 'src/assets/images/neutral/gaunter_odimm_darkness.png'
    },
];

export const neutralSpecials = [
    {
        id: 'neutral_special_01',
        name: 'Decoy',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.DECOY,
        imageUrl: 'src/assets/images/neutral/decoy.png',
        description: 'Swap with a non-Hero unit on your side of the battlefield'
    },
    {
        id: 'neutral_special_02',
        name: 'Scorch',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.SCORCH,
        imageUrl: 'src/assets/images/neutral/scorch.png',
        description: 'Destroys the strongest card(s) on the battlefield'
    },
    {
        id: 'neutral_special_03',
        name: 'Commander\'s Horn',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.COMMANDERS_HORN,
        imageUrl: 'src/assets/images/neutral/commanders_horn.png',
        description: 'Doubles the strength of all unit cards in a row'
    },
    {
        id: 'neutral_special_04',
        name: 'Impenetrable Fog',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.FOG,
        imageUrl: 'src/assets/images/neutral/impenetrable_fog.png',
        description: 'Sets the strength of all Ranged Combat units to 1'
    },
    {
        id: 'neutral_special_05',
        name: 'Torrential Rain',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.RAIN,
        imageUrl: 'src/assets/images/neutral/torrential_rain.png',
        description: 'Sets the strength of all Siege units to 1'
    },
    {
        id: 'neutral_special_06',
        name: 'Biting Frost',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.FROST,
        imageUrl: 'src/assets/images/neutral/biting_frost.png',
        description: 'Sets the strength of all Close Combat units to 1'
    },
    {
        id: 'neutral_special_07',
        name: 'Clear Weather',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.CLEAR_WEATHER,
        imageUrl: 'src/assets/images/neutral/clear_weather.png',
        description: 'Removes all Weather Card effects'
    },
    {
        id: 'neutral_special_08',
        name: 'Skellige Storm',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.SKELLIGE_STORM,  // Would need to be added to enum
        imageUrl: 'src/assets/images/neutral/skellige_storm.png',
        description: 'Sets the strength of all Ranged and Siege units to 1'
    }
];

export const neutralDeck = {
    heroes: neutralHeroes,
    units: neutralUnits,
    specials: neutralSpecials
};