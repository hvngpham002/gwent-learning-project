import ReduxGameManager from './components/game/ReduxGameManager'
import EngineGameManager from './components/game/EngineGameManager'
import AuthenticGameApp from './components/gwent/AuthenticGameApp'
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
    return <AuthenticGameApp search={search} />;
  }
  return <EngineGameManager />;
}

export default App
