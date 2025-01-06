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
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/geralt.png'
    },
    {
        id: 'neutral_hero_02',
        name: 'Cirilla Fiona Elen Riannon',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 15,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/ciri.png'
    },
    {
        id: 'neutral_hero_03',
        name: 'Yennefer of Vengerberg',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 7,
        row: RowPosition.RANGED,
        ability: CardAbility.MEDIC,
        imageUrl: '/assets/cards/neutral/yennefer.png'
    },
    {
        id: 'neutral_hero_04',
        name: 'Triss Merigold',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 7,
        row: RowPosition.RANGED,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/triss.png'
    },
    {
        id: 'neutral_hero_05',
        name: 'Mysterious Elf',
        faction: Faction.NEUTRAL,
        type: CardType.HERO,
        strength: 0,
        row: RowPosition.CLOSE,
        ability: CardAbility.SPY,
        imageUrl: '/assets/cards/neutral/triss.png'
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
        imageUrl: '/assets/cards/neutral/dandelion.png'
    },
    {
        id: 'neutral_unit_02',
        name: 'Vesemir',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 6,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/vesemir.png'
    },
    {
        id: 'neutral_unit_03',
        name: 'Zoltan Chivay',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/zoltan.png'
    },
    {
        id: 'neutral_unit_04',
        name: 'Emiel Regis Rohellec Terzieff',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/regis.png'
    },
    {
        id: 'neutral_unit_05',
        name: 'Bovine Defense Force',
        faction: Faction.NEUTRAL,
        type: CardType.UNIT,
        strength: 5,
        row: RowPosition.CLOSE,
        ability: CardAbility.NONE,
        imageUrl: '/assets/cards/neutral/regis.png'
    }
];

export const neutralSpecials = [
    {
        id: 'neutral_special_01',
        name: 'Decoy',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.DECOY,
        imageUrl: '/assets/cards/neutral/decoy.png',
        description: 'Swap with a non-Hero unit on your side of the battlefield'
    },
    {
        id: 'neutral_special_02',
        name: 'Scorch',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.SCORCH,
        imageUrl: '/assets/cards/neutral/scorch.png',
        description: 'Destroys the strongest card(s) on the battlefield'
    },
    {
        id: 'neutral_special_03',
        name: 'Commander\'s Horn',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.COMMANDERS_HORN,
        imageUrl: '/assets/cards/neutral/commanders_horn.png',
        description: 'Doubles the strength of all unit cards in a row'
    },
    {
        id: 'neutral_special_04',
        name: 'Impenetrable Fog',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.FOG,
        imageUrl: '/assets/cards/neutral/fog.png',
        description: 'Sets the strength of all Ranged Combat units to 1'
    },
    {
        id: 'neutral_special_05',
        name: 'Torrential Rain',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.RAIN,
        imageUrl: '/assets/cards/neutral/rain.png',
        description: 'Sets the strength of all Siege units to 1'
    },
    {
        id: 'neutral_special_06',
        name: 'Biting Frost',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.FROST,
        imageUrl: '/assets/cards/neutral/frost.png',
        description: 'Sets the strength of all Close Combat units to 1'
    },
    {
        id: 'neutral_special_07',
        name: 'Clear Weather',
        faction: Faction.NEUTRAL,
        type: CardType.SPECIAL,
        strength: 0,
        ability: CardAbility.CLEAR_WEATHER,
        imageUrl: '/assets/cards/neutral/clear_weather.png',
        description: 'Removes all Weather Card effects'
    }
];

export const neutralDeck = {
    heroes: neutralHeroes,
    units: neutralUnits,
    specials: neutralSpecials
};