/** Preferências visuais do usuário (salvas localmente). */
export type ThemeMode = 'system' | 'light' | 'dark' | 'soft'
export type ResolvedTheme = Exclude<ThemeMode, 'system'>

export interface AccentColor { id: string; label: string; hex: string }

export const ACCENTS: AccentColor[] = [
  { id: 'azul', label: 'Azul', hex: '#2563EB' },
  { id: 'verde', label: 'Verde', hex: '#10B981' },
  { id: 'roxo', label: 'Roxo', hex: '#7C3AED' },
  { id: 'rosa', label: 'Rosa', hex: '#DB2777' },
  { id: 'laranja', label: 'Laranja', hex: '#EA580C' },
  { id: 'grafite', label: 'Grafite', hex: '#475569' },
]

export const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
  { id: 'soft', label: 'Suave' },
]

export class Preferences {
  constructor(readonly theme: ThemeMode = 'system', readonly accent: string = 'azul') {}

  static from(raw: unknown): Preferences {
    const r = (raw ?? {}) as Partial<{ theme: string; accent: string }>
    const theme = THEMES.some((t) => t.id === r.theme) ? (r.theme as ThemeMode) : 'system'
    const accent = ACCENTS.some((a) => a.id === r.accent) ? r.accent! : 'azul'
    return new Preferences(theme, accent)
  }

  with(change: Partial<{ theme: ThemeMode; accent: string }>): Preferences {
    return Preferences.from({ theme: this.theme, accent: this.accent, ...change })
  }

  /** Resolve "Sistema" a partir da preferência do aparelho. */
  resolve(systemPrefersDark: boolean): ResolvedTheme {
    return this.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : this.theme
  }

  get accentHex(): string { return ACCENTS.find((a) => a.id === this.accent)!.hex }
  toJSON() { return { theme: this.theme, accent: this.accent } }
}
