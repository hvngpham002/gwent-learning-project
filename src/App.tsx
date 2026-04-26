import ReduxGameManager from './components/game/ReduxGameManager'
import EngineGameManager from './components/game/EngineGameManager'
import AuthenticUiHarness from './components/gwent/AuthenticUiHarness'
import { getEngineUiVariantFromSearch, shouldUseEngineUi } from './appMode'

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
    return <AuthenticUiHarness />;
  }

  return <EngineGameManager />;
}

export default App
