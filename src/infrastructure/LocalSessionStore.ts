import { storageKey } from './storageKeys'
import type { SessionStore } from '../domain'

/** Guarda só o id do usuário logado (nunca senha) no localStorage. */
export class LocalSessionStore implements SessionStore {
  constructor(private readonly key = storageKey('session')) {}
  get() { return localStorage.getItem(this.key) }
  set(userId: string) { localStorage.setItem(this.key, userId) }
  clear() { localStorage.removeItem(this.key) }
}
