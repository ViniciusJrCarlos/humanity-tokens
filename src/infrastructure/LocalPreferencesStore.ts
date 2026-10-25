import { Preferences } from '../domain'
import type { PreferencesStore } from '../domain'
import { storageKey } from './storageKeys'

export class LocalPreferencesStore implements PreferencesStore {
  constructor(private readonly key = storageKey('preferences')) {}
  load() {
    try { return Preferences.from(JSON.parse(localStorage.getItem(this.key) ?? 'null')) } catch { return new Preferences() }
  }
  save(p: Preferences) { localStorage.setItem(this.key, JSON.stringify(p.toJSON())) }
}
