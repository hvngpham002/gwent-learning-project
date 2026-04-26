import React, { useState } from "react";

import { getAuthenticUiViewFromSearch } from "@/appMode";

import AuthenticMatchScreen from "./AuthenticMatchScreen";
import AuthenticPreGameScreen from "./AuthenticPreGameScreen";
import AuthenticUiHarness from "./AuthenticUiHarness";
import type { AuthenticMatchSetupConfig } from "./preGameViewModel";

interface AuthenticGameAppProps {
  readonly search?: string;
}

const AuthenticGameApp: React.FC<AuthenticGameAppProps> = ({ search = window.location.search }) => {
  const view = getAuthenticUiViewFromSearch(search);
  const [setupConfig, setSetupConfig] = useState<AuthenticMatchSetupConfig | null>(null);

  if (view === "harness") {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticUiHarness />
      </div>
    );
  }

  if (view === "match" || setupConfig) {
    return (
      <div data-testid="authentic-game-app">
        <AuthenticMatchScreen setupConfig={setupConfig ?? undefined} onReturnToPreGame={() => setSetupConfig(null)} />
      </div>
    );
  }

  return (
    <div data-testid="authentic-game-app">
      <AuthenticPreGameScreen search={search} onBeginMatch={setSetupConfig} />
    </div>
  );
};

export default AuthenticGameApp;
