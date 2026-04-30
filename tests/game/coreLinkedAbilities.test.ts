import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialMonstersStarterDeckPreset,
  officialSkelligeStarterDeckPreset,
} from "@/data/catalog";
import {
  executeCommand,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogDeckPreset, CatalogRow } from "@/game/catalog";

const createConfig = (
  seed: string | number,
  options: { humanDeck?: CatalogDeckPreset; opponentDeck?: CatalogDeckPreset } = {},
): MatchConfig => ({
  matchId: `cCp12-linked-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: (options.humanDeck ?? currentNorthernRealmsDeckPreset).faction,
      deckPreset: options.humanDeck ?? currentNorthernRealmsDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: (options.opponentDeck ?? currentNilfgaardDeckPreset).faction,
      deckPreset: options.opponentDeck ?? currentNilfgaardDeckPreset,
    },
  ],
  catalog: { cards: currentCatalogCards, leaders: currentCatalogLeaders },
});

const createState = (
  seed: string | number,
  options?: { humanDeck?: CatalogDeckPreset; opponentDeck?: CatalogDeckPreset },
) => startMatch(createConfig(seed, options)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const findCards = (state: MatchState, sourceId: string): CardInstanceId[] =>
  Object.values(state.cardsById)
    .filter((candidate) => candidate.sourceId === sourceId)
    .map((candidate) => candidate.instanceId);

const findCard = (state: MatchState, sourceId: string, exclude: readonly CardInstanceId[] = []) => {
  const cardId = findCards(state, sourceId).find((candidate) => !exclude.includes(candidate));
  if (!cardId) {
    throw new Error(`Missing test card source ${sourceId}`);
  }
  return cardId;
};

const removeEverywhere = (state: MatchState, cardId: CardInstanceId) => {
  Object.values(state.seats).forEach((seat) => {
    seat.deck = seat.deck.filter((id) => id !== cardId);
    seat.hand = seat.hand.filter((id) => id !== cardId);
    seat.discard = seat.discard.filter((id) => id !== cardId);
    seat.sideDeck = seat.sideDeck.filter((id) => id !== cardId);
    seat.removedFromGame = seat.removedFromGame.filter((id) => id !== cardId);
    Object.values(seat.board).forEach((row) => {
      row.units = row.units.filter((id) => id !== cardId);
      if (row.horn === cardId) row.horn = null;
    });
  });
  state.weather.entries = state.weather.entries.filter((id) => id !== cardId);
};

const putInHand = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].hand.push(cardId);
    state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putInDeck = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  state.seats[seatId].deck = [];
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].deck.push(cardId);
    state.cardsById[cardId].zone = { kind: "deck", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putInDiscard = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].discard.push(cardId);
    state.cardsById[cardId].zone = { kind: "discard", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putOnBoard = (
  state: MatchState,
  seatId: SeatId,
  cardId: CardInstanceId,
  row: CatalogRow,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const placeInSideDeck = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].sideDeck.push(cardId);
  state.cardsById[cardId].zone = { kind: "side_deck", seat: seatId };
};

const placeInWeather = (state: MatchState, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
};

const addCardInstance = (
  state: MatchState,
  seatId: SeatId,
  sourceId: string,
  suffix: string,
): CardInstanceId => {
  const instanceId = `${seatId}:cCp12:${suffix}:${sourceId}`;
  const instance: CardInstance = {
    instanceId,
    sourceId,
    sourceKind: "card",
    owner: seatId,
    controller: seatId,
    zone: { kind: "hand", seat: seatId },
  };
  state.cardsById[instanceId] = instance;
  state.seats[seatId].hand.push(instanceId);
  return instanceId;
};

const preparePlayingTurn = (state: MatchState, seatId: SeatId = "seat_a") => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

describe("Linked ability engine regressions (cCp12)", () => {
  describe("Gaunter / Darkness directional Muster", () => {
    it("base Gaunter pulls Darkness copies from hand and deck", () => {
      const state = createState("gaunter-forward");
      const gaunter = findCard(state, "neutral.gaunter-odimm");
      const [darknessHand, darknessDeck] = findCards(state, "neutral.gaunter-odimm-darkness");
      preparePlayingTurn(state);
      putInHand(state, "seat_a", [gaunter, darknessHand]);
      putInDeck(state, "seat_a", [darknessDeck]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: gaunter,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
      });

      expect(result.state.seats.seat_a.board.ranged.units).toEqual(
        expect.arrayContaining([darknessHand, darknessDeck]),
      );
      expect(result.state.seats.seat_a.board.siege.units).toContain(gaunter);
      expect(result.state.seats.seat_a.deck).not.toContain(darknessDeck);
      expect(result.state.seats.seat_a.hand).not.toContain(darknessHand);
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: "ability_resolved",
          abilityId: "muster",
          outcome: "played_linked",
        }),
      );
    });

    it("Darkness pulls only other Darkness copies and never base Gaunter from hand or deck", () => {
      const state = createState("gaunter-reverse");
      const gaunter = findCard(state, "neutral.gaunter-odimm");
      const [darknessPlayed, darknessDeckA, darknessDeckB] = findCards(
        state,
        "neutral.gaunter-odimm-darkness",
      );
      preparePlayingTurn(state);
      putInHand(state, "seat_a", [darknessPlayed, gaunter]);
      putInDeck(state, "seat_a", [darknessDeckA, darknessDeckB]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: darknessPlayed,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
      });

      expect(result.state.seats.seat_a.board.ranged.units).toEqual(
        expect.arrayContaining([darknessPlayed, darknessDeckA, darknessDeckB]),
      );
      // Base Gaunter is still in hand — Darkness does not pull base Gaunter.
      expect(result.state.seats.seat_a.hand).toContain(gaunter);
      expect(result.state.seats.seat_a.board.siege.units).not.toContain(gaunter);
      expect(result.state.seats.seat_a.board.ranged.units).not.toContain(gaunter);
      expect(result.state.seats.seat_a.board.close.units).not.toContain(gaunter);
    });
  });

  describe("Cerys named hero-to-group", () => {
    it("Cerys pulls Clan Drummond Shield Maidens from hand and deck", () => {
      const state = createState("cerys-shield-maidens", {
        humanDeck: officialSkelligeStarterDeckPreset,
      });
      const cerys = findCard(state, "skellige.cerys");
      const maidens = findCards(state, "skellige.clan-drummond-shield-maiden");
      expect(maidens.length).toBeGreaterThanOrEqual(3);
      const [maidenHand, maidenDeckA, maidenDeckB] = maidens;
      preparePlayingTurn(state);
      putInHand(state, "seat_a", [cerys, maidenHand]);
      putInDeck(state, "seat_a", [maidenDeckA, maidenDeckB]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: cerys,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      });

      expect(result.state.seats.seat_a.board.close.units).toEqual(
        expect.arrayContaining([cerys, maidenHand, maidenDeckA, maidenDeckB]),
      );
      expect(result.state.seats.seat_a.deck).not.toContain(maidenDeckA);
      expect(result.state.seats.seat_a.deck).not.toContain(maidenDeckB);
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: "ability_resolved",
          abilityId: "muster",
          outcome: "played_linked",
        }),
      );
    });

    it("Shield Maiden does not summon Cerys when played", () => {
      const state = createState("shield-maiden-no-pull", {
        humanDeck: officialSkelligeStarterDeckPreset,
      });
      const cerys = findCard(state, "skellige.cerys");
      const [maidenHand] = findCards(state, "skellige.clan-drummond-shield-maiden");
      preparePlayingTurn(state);
      putInHand(state, "seat_a", [maidenHand, cerys]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: maidenHand,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      });

      expect(result.state.seats.seat_a.board.close.units).toContain(maidenHand);
      expect(result.state.seats.seat_a.board.close.units).not.toContain(cerys);
      expect(result.state.seats.seat_a.hand).toContain(cerys);
      // Shield Maiden's tight_bond resolves to board state; no muster fires.
      expect(
        result.events.some(
          (event) =>
            event.type === "ability_triggered" &&
            event.sourceId === "skellige.clan-drummond-shield-maiden" &&
            (event.abilityId === "muster" || event.abilityId === "muster_roach"),
        ),
      ).toBe(false);
    });
  });

  describe("Same-source Muster ignores board and discard copies", () => {
    it("Nekker Muster pulls hand+deck copies and leaves board/discard copies alone", () => {
      const state = createState("nekker-exclusions", {
        humanDeck: officialMonstersStarterDeckPreset,
      });
      const baseInstances = findCards(state, "monsters.nekker");
      expect(baseInstances.length).toBe(3);
      const [nekkerPlayed, nekkerOnBoard, nekkerInDiscard] = baseInstances;
      const nekkerHandExtra = addCardInstance(state, "seat_a", "monsters.nekker", "hand-extra");
      const nekkerDeckExtra = addCardInstance(state, "seat_a", "monsters.nekker", "deck-extra");

      preparePlayingTurn(state);
      putInHand(state, "seat_a", [nekkerPlayed, nekkerHandExtra]);
      putOnBoard(state, "seat_a", nekkerOnBoard, "close");
      putInDiscard(state, "seat_a", [nekkerInDiscard]);
      putInDeck(state, "seat_a", [nekkerDeckExtra]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: nekkerPlayed,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      });

      expect(result.state.seats.seat_a.board.close.units).toEqual(
        expect.arrayContaining([
          nekkerPlayed,
          nekkerOnBoard,
          nekkerHandExtra,
          nekkerDeckExtra,
        ]),
      );
      expect(result.state.seats.seat_a.discard).toContain(nekkerInDiscard);
      expect(result.state.seats.seat_a.hand).not.toContain(nekkerHandExtra);
      expect(result.state.seats.seat_a.deck).not.toContain(nekkerDeckExtra);
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: "ability_resolved",
          abilityId: "muster",
          outcome: "played_linked",
        }),
      );
    });
  });

  describe("Multi-card group Muster", () => {
    it("Crone Brewess pulls Weavess and Whispess but never Arachas", () => {
      const state = createState("crone-group", {
        humanDeck: officialMonstersStarterDeckPreset,
      });
      const brewess = findCard(state, "monsters.crone-brewess");
      const weavess = findCard(state, "monsters.crone-weavess");
      const whispess = findCard(state, "monsters.crone-whispess");
      const [arachasHand, arachasDeckA] = findCards(state, "monsters.arachas");
      preparePlayingTurn(state);
      putInHand(state, "seat_a", [brewess, weavess, arachasHand]);
      putInDeck(state, "seat_a", [whispess, arachasDeckA]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: brewess,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      });

      expect(result.state.seats.seat_a.board.close.units).toEqual(
        expect.arrayContaining([brewess, weavess, whispess]),
      );
      // Arachas remains where placed.
      expect(result.state.seats.seat_a.hand).toContain(arachasHand);
      expect(result.state.seats.seat_a.deck).toContain(arachasDeckA);
    });
  });

  describe("Avenger and Berserker linked side-deck replacements", () => {
    it("Cow Avenger summons Bovine from side deck via linkedSourceIds[0]", () => {
      // Frost normalizes close-row strengths to 1 so Cow (printed 0) becomes a valid Scorch target.
      const state = createState("cow-avenger-smoke");
      const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");
      const frost = addCardInstance(state, "seat_a", "neutral.biting-frost", "frost");
      const cow = addCardInstance(state, "seat_b", "neutral.cow", "cow");
      const bovine = addCardInstance(state, "seat_b", "neutral.bovine-defense-force", "bovine");
      putOnBoard(state, "seat_b", cow, "close");
      placeInSideDeck(state, "seat_b", bovine);
      placeInWeather(state, frost);
      preparePlayingTurn(state);
      state.seats.seat_a.hand = [scorch];
      state.cardsById[scorch].zone = { kind: "hand", seat: "seat_a" };

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: scorch,
        target: { kind: "none" },
      });

      // Scorch destroys Cow (the only close-row unit at effective strength 1) and Avenger
      // summons Bovine onto the same row from seat_b's side deck.
      expect(result.state.seats.seat_b.discard).toContain(cow);
      expect(result.state.seats.seat_b.sideDeck).not.toContain(bovine);
      expect(result.state.seats.seat_b.board.close.units).toContain(bovine);
      expect(
        result.events.some(
          (event) => event.type === "card_summoned" && event.toCardId === bovine,
        ),
      ).toBe(true);
    });

    it("Berserker linked replacement is still summoned when Mardroeme lands", () => {
      const state = createState("berserker-smoke", {
        humanDeck: officialSkelligeStarterDeckPreset,
      });
      const berserker = findCard(state, "skellige.berserker");
      const vildkaarl = state.seats.seat_a.sideDeck.find(
        (id) => state.cardsById[id]?.sourceId === "skellige.vildkaarl",
      );
      expect(vildkaarl).toBeDefined();
      const mardroeme = findCard(state, "skellige.mardroeme");

      preparePlayingTurn(state);
      putOnBoard(state, "seat_a", berserker, "close");
      putInHand(state, "seat_a", [mardroeme]);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: mardroeme,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      });

      expect(result.state.seats.seat_a.removedFromGame).toContain(berserker);
      expect(result.state.seats.seat_a.sideDeck).not.toContain(vildkaarl!);
      expect(result.state.seats.seat_a.board.close.units).toContain(vildkaarl!);
    });
  });
});
