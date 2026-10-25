import type { Preferences, PreferencesStore, ThemeMode } from '../domain'

export class PreferencesService {
  constructor(private readonly store: PreferencesStore) {}
  get(): Preferences { return this.store.load() }
  update(change: Partial<{ theme: ThemeMode; accent: string }>): Preferences {
    const next = this.store.load().with(change)
    this.store.save(next)
    return next
  }
}
