import ReduxGameManager from './components/game/ReduxGameManager'
import EngineGameManager from './components/game/EngineGameManager'
import { shouldUseEngineUi } from './appMode'

function App() {
  const useEngineUi = shouldUseEngineUi({
    search: window.location.search,
    envFlag: import.meta.env.VITE_ENGINE_UI,
  });

  return (
      useEngineUi ? <EngineGameManager /> : <ReduxGameManager />
  )
}

export default App
