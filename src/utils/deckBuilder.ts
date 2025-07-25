import { neutralDeck } from "@/data/cards/neutral";
import { northernRealmsDeck } from "@/data/cards/northern-realms";
import { nilfgaardianEmpireDeck } from "@/data/cards/nilfgaardian-empire";
import { Card, CardType, UnitCard, SpecialCard, LeaderCard, Faction } from "@/types/card";
import { createUniqueCard, createMultipleUniqueCards } from "@/utils/cardHelpers";

interface DeckWithLeader {
    deck: Card[];
    leader: LeaderCard;
}

export const createInitialDeck = (faction: Faction, player: 'player' | 'opponent'): DeckWithLeader => {

    switch (faction) {
        case Faction.NORTHERN_REALMS:
            return defaultNorthernRealmsDeck(player);
        case Faction.NILFGAARD:
            return defaultNilfgaardDeck(player);
        default:
            throw new Error('Invalid faction');
    }
};


const defaultNorthernRealmsDeck = (player: 'player' | 'opponent'): DeckWithLeader => {
    const deck: Card[] = [];

    // Add Leader (not part of the deck but needed for the player state)
    const leader = northernRealmsDeck.leaders.find(l => l.name === 'Foltest: Lord Commander of The North');
    if (!leader) throw new Error('Leader card not found');

    // Add Heroes
    // Northern Realms heroes
    const vernonRoche = northernRealmsDeck.heroes.find(h => h.name === 'Vernon Roche');
    const esteradThyssen = northernRealmsDeck.heroes.find(h => h.name === 'Esterad Thyssen');
    const phillippaEilhart = northernRealmsDeck.heroes.find(h => h.name === 'Philippa Eilhart');
    const keiraMetz = northernRealmsDeck.heroes.find(h => h.name === 'Keira Metz');
    if (vernonRoche) deck.push(createUniqueCard({ ...vernonRoche, type: CardType.HERO as CardType.HERO }, player));
    if (esteradThyssen) deck.push(createUniqueCard({ ...esteradThyssen, type: CardType.HERO as CardType.HERO }, player));
    if (phillippaEilhart) deck.push(createUniqueCard({ ...phillippaEilhart, type: CardType.HERO as CardType.HERO }, player));
    if (keiraMetz) deck.push(createUniqueCard({ ...keiraMetz, type: CardType.HERO as CardType.HERO }, player));

    // Neutral heroes
    const geralt = neutralDeck.heroes.find(h => h.name === 'Geralt of Rivia');
    const triss = neutralDeck.heroes.find(h => h.name === 'Triss Merigold');
    const mysteriousElf = neutralDeck.heroes.find(h => h.name === 'Mysterious Elf');
    if (geralt) deck.push(createUniqueCard({ ...geralt, type: CardType.HERO as CardType.HERO }, player));
    if (triss) deck.push(createUniqueCard({ ...triss, type: CardType.HERO as CardType.HERO }, player));
    if (mysteriousElf) deck.push(createUniqueCard({ ...mysteriousElf, type: CardType.HERO as CardType.HERO }, player));

    // Spy units
    const princeStenis = northernRealmsDeck.units.find(u => u.name === 'Prince Stennis');
    const sigismund = northernRealmsDeck.units.find(u => u.name === 'Sigismund Dijkstra');
    const thaler = northernRealmsDeck.units.find(u => u.name === 'Thaler');
    if (princeStenis) deck.push(createUniqueCard({ ...princeStenis, type: CardType.UNIT as CardType.UNIT }, player));
    if (sigismund) deck.push(createUniqueCard({ ...sigismund, type: CardType.UNIT as CardType.UNIT }, player));
    if (thaler) deck.push(createUniqueCard({ ...thaler, type: CardType.UNIT as CardType.UNIT }, player));

    // Northern Realms Unit
    const dunBannerMedic = northernRealmsDeck.units.find(u => u.name === 'Dun Banner Medic');
    if (dunBannerMedic) {
        const cards = createMultipleUniqueCards(
            { ...dunBannerMedic, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            5
        );
        deck.push(...cards);
    }

    // Blue Stripes Commando (3 copies)
    const blueStripes = northernRealmsDeck.units.find(u => u.name === 'Blue Stripes Commando');
    if (blueStripes) {
        const cards = createMultipleUniqueCards(
            { ...blueStripes, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            3
        );
        deck.push(...cards);
    }

    // Crinfrid Reavers Dragon Hunter (3 copies)
    const crinfridReavers = northernRealmsDeck.units.find(u => u.name === 'Crinfrid Reavers Dragon Hunter');
    if (crinfridReavers) {
        const cards = createMultipleUniqueCards(
            { ...crinfridReavers, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            3
        );
        deck.push(...cards);
    }

    const catapult = northernRealmsDeck.units.find(u => u.name === 'Catapult');
    if (catapult) {
        const cards = createMultipleUniqueCards(
            { ...catapult, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Special Cards
    // Decoy (2 copies)
    const decoy = neutralDeck.specials.find(s => s.name === 'Decoy');
    if (decoy) {
        const cards = createMultipleUniqueCards(
            { ...decoy, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Commander's Horn (2 copies)
    const horn = neutralDeck.specials.find(s => s.name === "Commander's Horn");
    if (horn) {
        const cards = createMultipleUniqueCards(
            { ...horn, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Scorch (2 copies)
    const scorch = neutralDeck.specials.find(s => s.name === 'Scorch');
    if (scorch) {
        const cards = createMultipleUniqueCards(
            { ...scorch, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    const frost = neutralDeck.specials.find(s => s.name === 'Biting Frost');
    if (frost) deck.push(createUniqueCard({ ...frost, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, player));

    const fog = neutralDeck.specials.find(s => s.name === 'Impenetrable Fog');
    if (fog) deck.push(createUniqueCard({ ...fog, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, player));

    // Additional neutral units
    const gaunterDarkness = neutralDeck.units.find(u => u.name === "Gaunter O'Dimm: Darkness");
    if (gaunterDarkness) {
        const cards = createMultipleUniqueCards(
            { ...gaunterDarkness, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    const gaunter = neutralDeck.units.find(u => u.name === "Gaunter O'Dimm");
    if (gaunter) deck.push(createUniqueCard({ ...gaunter, type: CardType.UNIT as CardType.UNIT }, player));

    const villentretenmerth = neutralDeck.units.find(u => u.name === 'Villentretenmerth');
    if (villentretenmerth) deck.push(createUniqueCard({ ...villentretenmerth, type: CardType.UNIT as CardType.UNIT }, player));

    const olgierd = neutralDeck.units.find(u => u.name === 'Olgierd von Everec');
    if (olgierd) deck.push(createUniqueCard({ ...olgierd, type: CardType.UNIT as CardType.UNIT }, player));

    return {
        deck,
        leader: createUniqueCard({ ...leader, type: CardType.LEADER as CardType.LEADER, strength: 0, used: false }, player)
    };
}

const defaultNilfgaardDeck = (player: 'player' | 'opponent'): DeckWithLeader => {
    const deck: Card[] = [];

    // Neutral heroes
    const ciri = neutralDeck.heroes.find(h => h.name === 'Cirilla Fiona Elen Riannon');
    if (ciri) deck.push(createUniqueCard({ ...ciri, type: CardType.HERO as CardType.HERO }, player));

    const yennefer = neutralDeck.heroes.find(h => h.name === 'Yennefer of Vengerberg');
    if (yennefer) deck.push(createUniqueCard({ ...yennefer, type: CardType.HERO as CardType.HERO }, player));

    const mysteriousElf = neutralDeck.heroes.find(h => h.name === 'Mysterious Elf');
    if (mysteriousElf) deck.push(createUniqueCard({ ...mysteriousElf, type: CardType.HERO as CardType.HERO }, player));

    // Heroes
    const emhyr = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Emhyr var Emreis');
    const letho = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Letho of Gulet');
    const menno = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Menno Coehoorn');
    const tibor = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Tibor Eggebracht');
    const morvran = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Morvran Voorhis');

    if (emhyr) deck.push(createUniqueCard({ ...emhyr, type: CardType.HERO as CardType.HERO }, player));
    if (letho) deck.push(createUniqueCard({ ...letho, type: CardType.HERO as CardType.HERO }, player));
    if (menno) deck.push(createUniqueCard({ ...menno, type: CardType.HERO as CardType.HERO }, player));
    if (tibor) deck.push(createUniqueCard({ ...tibor, type: CardType.HERO as CardType.HERO }, player));
    if (morvran) deck.push(createUniqueCard({ ...morvran, type: CardType.HERO as CardType.HERO }, player));

    // Neutral units
    const villentretenmerth = neutralDeck.units.find(u => u.name === 'Villentretenmerth');
    if (villentretenmerth) deck.push(createUniqueCard({ ...villentretenmerth, type: CardType.UNIT as CardType.UNIT }, player));

    const gaunterDarkness = neutralDeck.units.find(u => u.name === 'Gaunter O\'Dimm: Darkness');
    if (gaunterDarkness) {
        const cards = createMultipleUniqueCards(
            { ...gaunterDarkness, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    const gaunter = neutralDeck.units.find(u => u.name === 'Gaunter O\'Dimm');
    if (gaunter) deck.push(createUniqueCard({ ...gaunter, type: CardType.UNIT as CardType.UNIT }, player));

    const olgierd = neutralDeck.units.find(u => u.name === 'Olgierd von Everec');
    if (olgierd) deck.push(createUniqueCard({ ...olgierd, type: CardType.UNIT as CardType.UNIT }, player));

    // Units
    const youngEmissary = nilfgaardianEmpireDeck.units.find(u => u.name === 'Young Emissary');
    if (youngEmissary) {
        const cards = createMultipleUniqueCards(
            { ...youngEmissary, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            6
        );
        deck.push(...cards);
    }

    const blackInfantryArcher = nilfgaardianEmpireDeck.units.find(u => u.name === 'Black Infantry Archer');
    if (blackInfantryArcher) {
        const cards = createMultipleUniqueCards(
            { ...blackInfantryArcher, type: CardType.UNIT as CardType.UNIT }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Spies
    const stefan = nilfgaardianEmpireDeck.units.find(u => u.name === 'Stefan Skellen');
    const shilard = nilfgaardianEmpireDeck.units.find(u => u.name === 'Shilard Fitz-Oesterlen');
    const vattier = nilfgaardianEmpireDeck.units.find(u => u.name === 'Vattier de Rideaux');

    if (stefan) deck.push(createUniqueCard({ ...stefan, type: CardType.UNIT as CardType.UNIT }, player));
    if (shilard) deck.push(createUniqueCard({ ...shilard, type: CardType.UNIT as CardType.UNIT }, player));
    if (vattier) deck.push(createUniqueCard({ ...vattier, type: CardType.UNIT as CardType.UNIT }, player));

    // Weather cards
    const frost = neutralDeck.specials.find(s => s.name === 'Biting Frost');
    if (frost) deck.push(createUniqueCard({ ...frost, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, player));

    const rain = neutralDeck.specials.find(s => s.name === 'Torrential Rain');
    if (rain) deck.push(createUniqueCard({ ...rain, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, player));



    const clear = neutralDeck.specials.find(s => s.name === 'Clear Weather');
    if (clear) {
        const cards = createMultipleUniqueCards(
            { ...clear, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Decoy (2 copies)
    const decoy = neutralDeck.specials.find(s => s.name === 'Decoy');
    if (decoy) {
        const cards = createMultipleUniqueCards(
            { ...decoy, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Commander's Horn (2 copies)
    const horn = neutralDeck.specials.find(s => s.name === "Commander's Horn");
    if (horn) {
        const cards = createMultipleUniqueCards(
            { ...horn, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Scorch (2 copies)
    const scorch = neutralDeck.specials.find(s => s.name === 'Scorch');
    if (scorch) {
        const cards = createMultipleUniqueCards(
            { ...scorch, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }, 
            player, 
            2
        );
        deck.push(...cards);
    }

    // Leader
    const leader = nilfgaardianEmpireDeck.leaders.find(l => l.name === 'Emhyr var Emreis: The Relentless');

    return {
        deck,
        leader: createUniqueCard({ ...leader!, type: CardType.LEADER as CardType.LEADER, strength: 0, used: false, ability: leader!.ability }, player)
    };
}
