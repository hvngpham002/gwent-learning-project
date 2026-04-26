import ReduxGameManager from './components/game/ReduxGameManager'
import EngineGameManager from './components/game/EngineGameManager'
import AuthenticMatchScreen from './components/gwent/AuthenticMatchScreen'
import AuthenticUiHarness from './components/gwent/AuthenticUiHarness'
import { getAuthenticUiViewFromSearch, getEngineUiVariantFromSearch, shouldUseEngineUi } from './appMode'

function App() {
  const search = window.location.search;
  const useEngineUi = shouldUseEngineUi({
    search,
    envFlag: import.meta.env.VITE_ENGINE_UI,
  });

  if (!useEngineUi) {
    return <ReduxGameManager />;
  }

  if (getEngineUiVariantFromSearch(search) === 'authentic') {
    if (getAuthenticUiViewFromSearch(search) === 'harness') {
      return <AuthenticUiHarness />;
    }

    return <AuthenticMatchScreen />;
  }
  return <EngineGameManager />;
}

export default App
