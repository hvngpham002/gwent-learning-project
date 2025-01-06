export enum Faction {
    NORTHERN_REALMS = 'northern_realms',
    NILFGAARD = 'nilfgaard',
    MONSTERS = 'monsters',
    SCOIATAEL = 'scoiatael',
    SKELLIGE = 'skellige',
    NEUTRAL = 'neutral'
}

export enum RowPosition {
    CLOSE = 'close',
    RANGED = 'ranged',
    SIEGE = 'siege'
}

export enum CardType {
    UNIT = 'unit',
    SPECIAL = 'special',
    LEADER = 'leader',
    HERO = 'hero'
}

// Unified abilities for both unit and special cards
export enum CardAbility {
    // Unit-specific abilities
    TIGHT_BOND = 'tight_bond',     // Doubles strength if unit of same name
    MEDIC = 'medic',               // Revive a card from discard
    MORALE_BOOST = 'morale_boost', // +1 to all units in row
    SPY = 'spy',                   // Place on opponent's field, draw 2 cards
    MUSTER = 'muster',             // Play all cards with same name from deck
    AGILE = 'agile',               // Can be placed in multiple rows
    
    // Special card abilities (can also appear on units)
    SCORCH = 'scorch',             // Destroy card(s) with highest strength
    COMMANDERS_HORN = 'commanders_horn', // Double strength of all units in row
    DECOY = 'decoy',               // Swap with a non-Hero unit
    FROST = 'frost',               // Sets Close Combat units to 1
    FOG = 'fog',                   // Sets Ranged units to 1
    RAIN = 'rain',                 // Sets Siege units to 1
    CLEAR_WEATHER = 'clear_weather', // Clears all weather effects
    
    NONE = 'none'                  // No special ability
}

export enum LeaderAbility {
    CLEAR_WEATHER = 'clear_weather',
    SCORCH_SIEGE = 'scorch_siege',
    SCORCH_RANGED = 'scorch_range',
    DOUBLE_SIEGE = 'double_siege',
    PLAY_FROST = 'play_frost',
    PLAY_FOG = 'play_fog',
    PLAY_RAIN = 'play_rain',
}

export interface BaseCard {
    id: string;
    name: string;
    faction: Faction;
    type: CardType;
    imageUrl: string;
    description?: string;
}

export interface UnitCard extends BaseCard {
    type: CardType.UNIT | CardType.HERO;
    strength: number;
    row: RowPosition;
    ability: CardAbility;
    availableRows?: RowPosition[];  // For agile units
}

export interface SpecialCard extends BaseCard {
    type: CardType.SPECIAL;
    strength: 0;
    ability: CardAbility;
}

export interface LeaderCard extends BaseCard {
    type: CardType.LEADER;
    strength: 0;
    ability: LeaderAbility;
    used: boolean;
}

export type Card = UnitCard | SpecialCard | LeaderCard;

export interface BoardRow {
    cards: UnitCard[];
    hornActive: boolean;
}

export interface BoardState {
    close: BoardRow;
    ranged: BoardRow;
    siege: BoardRow;
}

export interface PlayerState {
    deck: Card[];
    hand: Card[];
    discard: Card[];
    leader: LeaderCard;
    passed: boolean;
    lives: number;
}

export interface GameState {
    player: PlayerState;
    opponent: PlayerState;
    playerBoard: BoardState;
    opponentBoard: BoardState;
    currentRound: number;
    playerScore: number;
    opponentScore: number;
    currentTurn: 'player' | 'opponent';
    gamePhase: 'setup' | 'playing' | 'roundEnd' | 'gameEnd';
    activeWeatherEffects: Set<CardAbility>;  // Track active weather effects (FROST, FOG, RAIN)
}