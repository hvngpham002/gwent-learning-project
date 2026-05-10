import EngineGameManager from './components/game/EngineGameManager'
import AuthenticGameApp from './components/gwent/AuthenticGameApp'
import LegacyRoute from './legacy/LegacyRoute'
import { resolveAppRoute } from './appMode'

function App() {
  const route = resolveAppRoute({
    pathname: window.location.pathname,
    search: window.location.search,
    envFlag: import.meta.env.VITE_ENGINE_UI,
  })

  if (route.surface === 'legacy') {
    return <LegacyRoute />
  }

  if (route.surface === 'engine-diagnostic') {
    return <EngineGameManager />
  }

  return <AuthenticGameApp routeView={route.view} search={window.location.search} />
}

export default App
