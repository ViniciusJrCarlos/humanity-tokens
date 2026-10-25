import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { Preferences, SessionUser, ThemeMode } from '../../domain'
import { createServices, Services } from '../../infrastructure/container'

interface AppState {
  services: Services
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  logout: () => void
  prefs: Preferences
  updatePrefs: (change: Partial<{ theme: ThemeMode; accent: string }>) => void
}

const Ctx = createContext<AppState | null>(null)
const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)')

/** Aplica tema e cor de destaque no <html> (variáveis CSS). */
function applyTheme(prefs: Preferences) {
  const root = document.documentElement
  const resolved = prefs.resolve(!!darkQuery()?.matches)
  root.dataset.theme = resolved
  root.style.setProperty('--accent', prefs.accentHex)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0f172a' : prefs.accentHex)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Services | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createServices()
      .then(async (s) => { setUser(await s.auth.currentUser()); setPrefs(s.preferences.get()); setServices(s) })
      .catch((e) => setError(String(e?.message ?? e)))
  }, [])

  useEffect(() => {
    if (!prefs) return
    applyTheme(prefs)
    const mq = darkQuery()
    const onChange = () => applyTheme(prefs)
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [prefs])

  const logout = useCallback(() => { services?.auth.logout(); setUser(null) }, [services])
  const updatePrefs = useCallback((c: Partial<{ theme: ThemeMode; accent: string }>) => {
    if (services) setPrefs(services.preferences.update(c))
  }, [services])

  if (error) return <div className="center-screen">Não foi possível abrir o banco local: {error}</div>
  if (!services || !prefs) return <div className="center-screen">Carregando…</div>
  return <Ctx.Provider value={{ services, user, setUser, logout, prefs, updatePrefs }}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp fora do AppProvider')
  return ctx
}
