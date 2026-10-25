import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { SessionUser } from '../../domain'
import { createServices, Services } from '../../infrastructure/container'

interface AppState {
  services: Services
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  logout: () => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Services | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createServices()
      .then(async (s) => { setUser(await s.auth.currentUser()); setServices(s) })
      .catch((e) => setError(String(e?.message ?? e)))
  }, [])

  const logout = useCallback(() => { services?.auth.logout(); setUser(null) }, [services])

  if (error) return <div className="center-screen">Não foi possível abrir o banco local: {error}</div>
  if (!services) return <div className="center-screen">Carregando…</div>
  return <Ctx.Provider value={{ services, user, setUser, logout }}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp fora do AppProvider')
  return ctx
}
