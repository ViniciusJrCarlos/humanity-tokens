import type { AnalysisRepository, Analysis, SessionStore, UserRepository, User, TemplateRepository, PromptTemplate, PreferencesStore } from '../src/domain'
import { Preferences } from '../src/domain'

export class MemoryUserRepo implements UserRepository {
  map = new Map<string, User>()
  async findByEmail(e: string) { return [...this.map.values()].find((u) => u.email === e) ?? null }
  async findById(id: string) { return this.map.get(id) ?? null }
  async save(u: User) { this.map.set(u.id, u) }
  async count() { return this.map.size }
}
export class MemoryAnalysisRepo implements AnalysisRepository {
  items: Analysis[] = []
  async add(a: Analysis) { this.items.push(a) }
  async listByUser(id: string) { return this.items.filter((a) => a.userId === id) }
  async delete(id: string) { this.items = this.items.filter((a) => a.id !== id) }
  async clearByUser(id: string) { const n = this.items.filter((a) => a.userId === id).length; this.items = this.items.filter((a) => a.userId !== id); return n }
}
export class MemorySession implements SessionStore {
  v: string | null = null
  get() { return this.v } set(id: string) { this.v = id } clear() { this.v = null }
}
let n = 0
export const idGen = () => `id-${++n}`
export class MemoryTemplateRepo implements TemplateRepository {
  items: PromptTemplate[] = []
  async add(t: PromptTemplate) { this.items.push(t) }
  async listByUser(id: string) { return this.items.filter((t) => t.props.userId === id) }
  async delete(id: string) { this.items = this.items.filter((t) => t.id !== id) }
}
export class MemoryPrefs implements PreferencesStore {
  p = new Preferences()
  load() { return this.p } save(p: Preferences) { this.p = p }
}
