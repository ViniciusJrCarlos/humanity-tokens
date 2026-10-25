import type { User } from './User'
import type { Analysis } from './Analysis'
import type { PromptTemplate } from './PromptTemplate'
import type { Preferences } from './Preferences'

/** Contratos de persistência. Hoje: IndexedDB. Depois: Google Drive / Firebase. */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  save(user: User): Promise<void>
  count(): Promise<number>
}

export interface AnalysisRepository {
  add(analysis: Analysis): Promise<void>
  listByUser(userId: string): Promise<Analysis[]>
  delete(id: string): Promise<void>
  clearByUser(userId: string): Promise<number>
}

export interface TemplateRepository {
  add(t: PromptTemplate): Promise<void>
  listByUser(userId: string): Promise<PromptTemplate[]>
  delete(id: string): Promise<void>
}

export interface PreferencesStore {
  load(): Preferences
  save(p: Preferences): void
}

export interface PasswordHasher {
  hash(password: string, salt?: string): Promise<{ hash: string; salt: string }>
  verify(password: string, hash: string, salt: string): Promise<boolean>
}

export interface SessionStore {
  get(): string | null
  set(userId: string): void
  clear(): void
}
