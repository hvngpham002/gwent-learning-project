import React, { useState } from "react";

import { getAuthenticUiViewFromSearch, type AuthenticUiView } from "@/appMode";
import type { CatalogDeckPreset } from "@/game/catalog";

import AuthenticAiLabScreen from "./AuthenticAiLabScreen";
import AuthenticComponentFoundationPage from "./AuthenticComponentFoundationPage";
import AuthenticCardStudioScreen from "./AuthenticCardStudioScreen";
import AuthenticDeckBuilderScreen from "./AuthenticDeckBuilderScreen";
import AuthenticMatchScreen from "./AuthenticMatchScreen";
import AuthenticOfficialPortingScreen from "./AuthenticOfficialPortingScreen";
import AuthenticPreGameScreen from "./AuthenticPreGameScreen";
import AuthenticUiHarness from "./AuthenticUiHarness";
import { normalizeDeckStore, readDeckBuilderStore, writeDeckBuilderStore } from "./deckBuilderStorage";
import { createEmptyDeckPreset, makeUniqueDeckName } from "./deckBuilderViewModel";
import { readCardStudioStore, writeCardStudioStore } from "./cardStudioStorage";
import {
  buildCardStudioBlockedSources,
  buildCustomCatalogSourceSets,
} from "./cardStudioViewModel";
import { readOfficialPortingStore, writeOfficialPortingStore } from "./officialPortingStorage";
import { ENGINE_AI_POLICY_ID } from "../game/engine/engineShellViewModels";
import { seedFromSearch, type AuthenticMatchSetupConfig } from "./preGameViewModel";

interface AuthenticGameAppProps {
  readonly routeView?: AuthenticUiView;
  readonly search?: string;
}

const AuthenticGameApp: React.FC<AuthenticGameAppProps> = ({ routeView, search = window.location.search }) => {
  const resolvedRouteView = routeView ?? getAuthenticUiViewFromSearch(search);
  const [viewOverride, setViewOverride] = useState<"pregame" | "deck-builder" | "card-studio" | "official-porting" | "ai-lab" | null>(null);
  const [returnViewFromStudio, setReturnViewFromStudio] = useState<"pregame" | "deck-builder">("pregame");
  const [setupConfig, setSetupConfig] = useState<AuthenticMatchSetupConfig | null>(null);
  const [deckStore, setDeckStore] = useState(() => readDeckBuilderStore());
  const [customCatalogStore, setCustomCatalogStore] = useState(() => readCardStudioStore());
  const [officialPortingStore, setOfficialPortingStore] = useState(() => readOfficialPortingStore());
  const customSourceSets = buildCustomCatalogSourceSets(customCatalogStore.store);
  const blockedCustomSources = buildCardStudioBlockedSources(customCatalogStore.store);
  const view = setupConfig ? "match" : (viewOverride ?? resolvedRouteView);

  const updateDecks = (decks: readonly CatalogDeckPreset[], activePresetId?: string) => {
    const normalizedStore = normalizeDeckStore(decks, activePresetId);
    setDeckStore({
      store: normalizedStore,
      warning: null,
    });
  };

  const openDeckBuilder = (mode: "create" | "edit" = "edit") => {
    if (mode === "create") {
      const deck = createEmptyDeckPreset(
        `local-${Date.now().toString(36)}-${deckStore.store.decks.length + 1}`,
        makeUniqueDeckName("New Deck", deckStore.store.decks),
        "northern_realms",
        customSourceSets.leaders,
      );
      const nextStore = normalizeDeckStore([...deckStore.store.decks, deck], deck.presetId);
      const write = writeDeckBuilderStore(nextStore);
      setDeckStore({ store: nextStore, warning: write.warning });
    }
    setViewOverride("deck-builder");
  };

  const openCardStudio = (returnView: "pregame" | "deck-builder" = view === "deck-builder" ? "deck-builder" : "pregame") => {
    setReturnViewFromStudio(returnView);
    setViewOverride("card-studio");
  };

  const updateCustomCatalog = (store: typeof customCatalogStore.store) => {
    const write = writeCardStudioStore(store);
    setCustomCatalogStore({ store, warning: write.warning });
  };

  const updateOfficialPorting = (store: typeof officialPortingStore.store) => {
    const write = writeOfficialPortingStore(store);
    setOfficialPortingStore({ store, warning: write.warning });
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
      catalogCards: customSourceSets.cards,
      catalogLeaders: customSourceSets.leaders,
    });
  };

  if (view === "harness") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticUiHarness />
      </div>
    );
  }

  if (view === "ui-component-foundation") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticComponentFoundationPage />
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
          sourceSets={customSourceSets}
          blockedSources={blockedCustomSources}
          onDecksChange={updateDecks}
          onExit={() => setViewOverride("pregame")}
          onPlay={playDeck}
          onOpenCardStudio={() => openCardStudio("deck-builder")}
        />
      </div>
    );
  }

  if (view === "card-studio") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticCardStudioScreen
          store={customCatalogStore.store}
          decks={deckStore.store.decks}
          storageWarning={customCatalogStore.warning}
          onStoreChange={updateCustomCatalog}
          onDecksChange={updateDecks}
          onExit={() => setViewOverride(returnViewFromStudio)}
        />
      </div>
    );
  }

  if (view === "official-porting") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticOfficialPortingScreen
          store={officialPortingStore.store}
          storageWarning={officialPortingStore.warning}
          onStoreChange={updateOfficialPorting}
          onExit={() => setViewOverride("pregame")}
        />
      </div>
    );
  }

  if (view === "ai-lab") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticAiLabScreen onBack={() => setViewOverride("pregame")} />
      </div>
    );
  }

  return (
    <div data-testid="authentic-game-app">
        <AuthenticPreGameScreen
          search={search}
          localDecks={deckStore.store.decks}
          sourceSets={customSourceSets}
          blockedSources={blockedCustomSources}
          onBeginMatch={setSetupConfig}
          onOpenDeckBuilder={openDeckBuilder}
          onOpenCardStudio={() => openCardStudio("pregame")}
          onOpenAiLab={() => setViewOverride("ai-lab")}
        />
    </div>
  );
};

export default AuthenticGameApp;
