import { neutralDeck } from "@/data/cards/neutral";
import { northernRealmsDeck } from "@/data/cards/northern-realms";
import { nilfgaardianEmpireDeck } from "@/data/cards/nilfgaardian-empire";
import { Card, CardType, UnitCard, SpecialCard, LeaderCard, Faction } from "@/types/card";

interface DeckWithLeader {
    deck: Card[];
    leader: LeaderCard;
}

export const createInitialDeck = (faction: Faction): DeckWithLeader => {

    switch (faction) {
        case Faction.NORTHERN_REALMS:
            return defaultNorthernRealmsDeck();
        case Faction.NILFGAARD:
            return defaultNilfgaardDeck();
        default:
            throw new Error('Invalid faction');
    }
};


const defaultNorthernRealmsDeck = (): DeckWithLeader => {
    const deck: Card[] = [];

    // Add Leader (not part of the deck but needed for the player state)
    const leader = northernRealmsDeck.leaders.find(l => l.name === 'Foltest: Lord Commander of The North');
    if (!leader) throw new Error('Leader card not found');

    // Add Heroes
    // Northern Realms heroes
    const vernonRoche = northernRealmsDeck.heroes.find(h => h.name === 'Vernon Roche');
    const esteradThyssen = northernRealmsDeck.heroes.find(h => h.name === 'Esterad Thyssen');
    const phillippaEilhart = northernRealmsDeck.heroes.find(h => h.name === 'Philippa Eilhart');
    if (vernonRoche) deck.push({ ...vernonRoche, type: CardType.HERO as CardType.HERO });
    if (esteradThyssen) deck.push({ ...esteradThyssen, type: CardType.HERO as CardType.HERO });
    if (phillippaEilhart) deck.push({ ...phillippaEilhart, type: CardType.HERO as CardType.HERO });

    // Neutral heroes
    const geralt = neutralDeck.heroes.find(h => h.name === 'Geralt of Rivia');
    const ciri = neutralDeck.heroes.find(h => h.name === 'Cirilla Fiona Elen Riannon');
    const yennefer = neutralDeck.heroes.find(h => h.name === 'Yennefer of Vengerberg');
    const mysteriousElf = neutralDeck.heroes.find(h => h.name === 'Mysterious Elf');
    if (geralt) deck.push({ ...geralt, type: CardType.HERO as CardType.HERO });
    if (ciri) deck.push({ ...ciri, type: CardType.HERO as CardType.HERO });
    if (yennefer) deck.push({ ...yennefer, type: CardType.HERO as CardType.HERO });
    if (mysteriousElf) deck.push({ ...mysteriousElf, type: CardType.HERO as CardType.HERO });

    // Spy units
    const princeStenis = northernRealmsDeck.units.find(u => u.name === 'Prince Stennis');
    const sigismund = northernRealmsDeck.units.find(u => u.name === 'Sigismund Dijkstra');
    const thaler = northernRealmsDeck.units.find(u => u.name === 'Thaler');
    if (princeStenis) deck.push({ ...princeStenis, type: CardType.UNIT as CardType.UNIT });
    if (sigismund) deck.push({ ...sigismund, type: CardType.UNIT as CardType.UNIT });
    if (thaler) deck.push({ ...thaler, type: CardType.UNIT as CardType.UNIT });

    // Northern Realms Unit
    const dunBannerMedic = northernRealmsDeck.units.find(u => u.name === 'Dun Banner Medic');
    if (dunBannerMedic) deck.push({ ...dunBannerMedic, type: CardType.UNIT as CardType.UNIT });

    // Blue Stripes Commando (3 copies)
    const blueStripes = northernRealmsDeck.units.find(u => u.name === 'Blue Stripes Commando');
    if (blueStripes) {
        // Create three separate cards with the correct type
        const cards: UnitCard[] = [
            { ...blueStripes, type: CardType.UNIT as CardType.UNIT },
            { ...blueStripes, id: blueStripes.id + '_2', type: CardType.UNIT as CardType.UNIT },
            { ...blueStripes, id: blueStripes.id + '_3', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
    }

    // Crinfrid Reavers Dragon Hunter (3 copies)
    const crinfridReavers = northernRealmsDeck.units.find(u => u.name === 'Crinfrid Reavers Dragon Hunter');
    if (crinfridReavers) {
        // Create three separate cards with the correct type
        const cards: UnitCard[] = [
            { ...crinfridReavers, type: CardType.UNIT as CardType.UNIT },
            { ...crinfridReavers, id: crinfridReavers.id + '_2', type: CardType.UNIT as CardType.UNIT },
            { ...crinfridReavers, id: crinfridReavers.id + '_3', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
    }

    const catapult = northernRealmsDeck.units.find(u => u.name === 'Catapult');

    if (catapult) {
        // Create three separate cards with the correct type
        const cards: UnitCard[] = [
            { ...catapult, type: CardType.UNIT as CardType.UNIT },
            { ...catapult, id: catapult.id + '_2', type: CardType.UNIT as CardType.UNIT },
        ];
        deck.push(...cards);
    }

    // Special Cards
    // Decoy (2 copies)
    const decoy = neutralDeck.specials.find(s => s.name === 'Decoy');
    if (decoy) {
        const cards: SpecialCard[] = [
            { ...decoy, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...decoy, id: decoy.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Commander's Horn (2 copies)
    const horn = neutralDeck.specials.find(s => s.name === "Commander's Horn");
    if (horn) {
        const cards: SpecialCard[] = [
            { ...horn, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...horn, id: horn.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Scorch (2 copies)
    const scorch = neutralDeck.specials.find(s => s.name === 'Scorch');
    if (scorch) {
        const cards: SpecialCard[] = [
            { ...scorch, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...scorch, id: scorch.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Additional neutral units
    const gaunterDarkness = neutralDeck.units.find(u => u.name === "Gaunter O'Dimm: Darkness");
    if (gaunterDarkness) {
        // Create three separate cards with the correct type
        const cards: UnitCard[] = [
            { ...gaunterDarkness, type: CardType.UNIT as CardType.UNIT },
            { ...gaunterDarkness, id: gaunterDarkness.id + '_2', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
    }

    const villentretenmerth = neutralDeck.units.find(u => u.name === 'Villentretenmerth');
    if (villentretenmerth) deck.push({ ...villentretenmerth, type: CardType.UNIT as CardType.UNIT });

    return {
        deck,
        leader: { ...leader, type: CardType.LEADER as CardType.LEADER, strength: 0, used: false  }
    };
}

const defaultNilfgaardDeck = (): DeckWithLeader => {
    const deck: Card[] = [];

    // Neutral heroes
    const geralt = neutralDeck.heroes.find(h => h.name === 'Geralt of Rivia');
    if (geralt) deck.push({ ...geralt, type: CardType.HERO as CardType.HERO });

    const ciri = neutralDeck.heroes.find(h => h.name === 'Cirilla Fiona Elen Riannon');
    if (ciri) deck.push({ ...ciri, type: CardType.HERO as CardType.HERO });

    const yennefer = neutralDeck.heroes.find(h => h.name === 'Yennefer of Vengerberg');
    if (yennefer) deck.push({ ...yennefer, type: CardType.HERO as CardType.HERO });

    const mysteriousElf = neutralDeck.heroes.find(h => h.name === 'Mysterious Elf');
    if (mysteriousElf) deck.push({ ...mysteriousElf, type: CardType.HERO as CardType.HERO });

    // Heroes
    const emhyr = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Emhyr var Emreis');
    const letho = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Letho of Gulet');
    const menno = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Menno Coehoorn');
    const tibor = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Tibor Eggebracht');
    const morvran = nilfgaardianEmpireDeck.heroes.find(h => h.name === 'Morvran Voorhis');

    if (emhyr) deck.push({ ...emhyr, type: CardType.HERO as CardType.HERO });
    if (letho) deck.push({ ...letho, type: CardType.HERO as CardType.HERO });
    if (menno) deck.push({ ...menno, type: CardType.HERO as CardType.HERO });
    if (tibor) deck.push({ ...tibor, type: CardType.HERO as CardType.HERO });
    if (morvran) deck.push({ ...morvran, type: CardType.HERO as CardType.HERO });

    // Neutral units
    const villentretenmerth = neutralDeck.units.find(u => u.name === 'Villentretenmerth');
    if (villentretenmerth) deck.push({ ...villentretenmerth, type: CardType.UNIT as CardType.UNIT });
    const gaunterDarkness = neutralDeck.units.find(u => u.name === 'Gaunter O\'Dimm: Darkness');
    if (gaunterDarkness) {
        const cards: UnitCard[] = [
            { ...gaunterDarkness, type: CardType.UNIT as CardType.UNIT },
            { ...gaunterDarkness, id: gaunterDarkness.id + '_2', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
    }

    // Units
    const youngEmissary = nilfgaardianEmpireDeck.units.find(u => u.name === 'Young Emissary');
    if (youngEmissary) {
        const cards: UnitCard[] = [
            { ...youngEmissary, type: CardType.UNIT as CardType.UNIT },
            { ...youngEmissary, id: youngEmissary.id + '_2', type: CardType.UNIT as CardType.UNIT },
            { ...youngEmissary, id: youngEmissary.id + '_3', type: CardType.UNIT as CardType.UNIT },
            { ...youngEmissary, id: youngEmissary.id + '_4', type: CardType.UNIT as CardType.UNIT },
            { ...youngEmissary, id: youngEmissary.id + '_5', type: CardType.UNIT as CardType.UNIT },
            { ...youngEmissary, id: youngEmissary.id + '_6', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
    }

    const blackInfantryArcher = nilfgaardianEmpireDeck.units.find(u => u.name === 'Black Infantry Archer');
    if (blackInfantryArcher) {
        const cards: UnitCard[] = [
            { ...blackInfantryArcher, type: CardType.UNIT as CardType.UNIT },
            { ...blackInfantryArcher, id: blackInfantryArcher.id + '_2', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
    }

    // Spies
    const stefan = nilfgaardianEmpireDeck.units.find(u => u.name === 'Stefan Skellen');
    const shilard = nilfgaardianEmpireDeck.units.find(u => u.name === 'Shilard Fitz-Oesterlen');
    const vattier = nilfgaardianEmpireDeck.units.find(u => u.name === 'Vattier de Rideaux');

    if (stefan) deck.push({ ...stefan, type: CardType.UNIT as CardType.UNIT });
    if (shilard) deck.push({ ...shilard, type: CardType.UNIT as CardType.UNIT });
    if (vattier) deck.push({ ...vattier, type: CardType.UNIT as CardType.UNIT });

    // Weather cards
    const frost = neutralDeck.specials.find(s => s.name === 'Biting Frost');
    if (frost) {
        const cards: SpecialCard[] = [
            { ...frost, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...frost, id: frost.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    const clear = neutralDeck.specials.find(s => s.name === 'Clear Weather');
    if (clear) {
        const cards: SpecialCard[] = [
            { ...clear, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...clear, id: clear.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Decoy (2 copies)
    const decoy = neutralDeck.specials.find(s => s.name === 'Decoy');
    if (decoy) {
        const cards: SpecialCard[] = [
            { ...decoy, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...decoy, id: decoy.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Commander's Horn (2 copies)
    const horn = neutralDeck.specials.find(s => s.name === "Commander's Horn");
    if (horn) {
        const cards: SpecialCard[] = [
            { ...horn, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...horn, id: horn.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Scorch (2 copies)
    const scorch = neutralDeck.specials.find(s => s.name === 'Scorch');
    if (scorch) {
        const cards: SpecialCard[] = [
            { ...scorch, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
            { ...scorch, id: scorch.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
    }

    // Leader
    const leader = nilfgaardianEmpireDeck.leaders.find(l => l.name === 'Emhyr var Emreis: The Relentless');

    return {
        deck,
        leader: { ...leader!, type: CardType.LEADER as CardType.LEADER, strength: 0, used: false, ability: leader!.ability }
    };
}
