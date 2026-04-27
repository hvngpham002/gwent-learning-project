import React, { useState } from "react";

import { getAuthenticUiViewFromSearch } from "@/appMode";
import type { CatalogDeckPreset } from "@/game/catalog";

import AuthenticDeckBuilderScreen from "./AuthenticDeckBuilderScreen";
import AuthenticMatchScreen from "./AuthenticMatchScreen";
import AuthenticPreGameScreen from "./AuthenticPreGameScreen";
import AuthenticUiHarness from "./AuthenticUiHarness";
import { readDeckBuilderStore } from "./deckBuilderStorage";
import { ENGINE_AI_POLICY_ID } from "../game/engine/engineShellViewModels";
import { seedFromSearch, type AuthenticMatchSetupConfig } from "./preGameViewModel";

interface AuthenticGameAppProps {
  readonly search?: string;
}

const AuthenticGameApp: React.FC<AuthenticGameAppProps> = ({ search = window.location.search }) => {
  const routeView = getAuthenticUiViewFromSearch(search);
  const [viewOverride, setViewOverride] = useState<"pregame" | "deck-builder" | null>(null);
  const [setupConfig, setSetupConfig] = useState<AuthenticMatchSetupConfig | null>(null);
  const [deckStore, setDeckStore] = useState(() => readDeckBuilderStore());
  const view = setupConfig ? "match" : (viewOverride ?? routeView);

  const updateDecks = (decks: readonly CatalogDeckPreset[], activePresetId?: string) => {
    setDeckStore({
      store: {
        schemaVersion: "authentic-decks-v1",
        decks,
        activePresetId,
      },
      warning: null,
    });
  };

  const playDeck = (deck: CatalogDeckPreset) => {
    const opponentDeckPresetId = deck.faction === "nilfgaard" ? "current-northern-realms" : "current-nilfgaard";
    const seed = seedFromSearch(search) || `ep5-${Date.now().toString(36)}`;
    setSetupConfig({
      humanDeckPresetId: deck.presetId,
      humanDeckPreset: deck,
      opponentDeckPresetId,
      modeId: "human-vs-ai",
      roundId: "standard",
      formatId: "best-of-3",
      seed,
      aiPolicyId: ENGINE_AI_POLICY_ID,
    });
  };

  if (view === "harness") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticUiHarness />
      </div>
    );
  }

  if (view === "match") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticMatchScreen
          setupConfig={setupConfig ?? undefined}
          onReturnToPreGame={() => {
            setSetupConfig(null);
            setViewOverride("pregame");
          }}
        />
      </div>
    );
  }

  if (view === "deck-builder") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticDeckBuilderScreen
          decks={deckStore.store.decks}
          activePresetId={deckStore.store.activePresetId}
          storageWarning={deckStore.warning}
          onDecksChange={updateDecks}
          onExit={() => setViewOverride("pregame")}
          onPlay={playDeck}
        />
      </div>
    );
  }

  return (
    <div data-testid="authentic-game-app">
      <AuthenticPreGameScreen
        search={search}
        localDecks={deckStore.store.decks}
        onBeginMatch={setSetupConfig}
        onOpenDeckBuilder={() => setViewOverride("deck-builder")}
      />
    </div>
  );
};

export default AuthenticGameApp;
