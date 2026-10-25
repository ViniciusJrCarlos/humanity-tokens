import { PromptTemplate } from '../domain'
import type { PromptTemplateProps, TemplateRepository } from '../domain'
import { run } from './IndexedDb'

export class IndexedDbTemplateRepository implements TemplateRepository {
  constructor(private readonly db: IDBDatabase) {}
  async add(t: PromptTemplate) { await run(this.db, 'templates', 'readwrite', (s) => s.put(t.props)) }
  async listByUser(userId: string) {
    const rows = await run<PromptTemplateProps[]>(this.db, 'templates', 'readonly', (s) => s.index('userId').getAll(userId))
    return rows.map((r) => new PromptTemplate(r))
  }
  async delete(id: string) { await run(this.db, 'templates', 'readwrite', (s) => s.delete(id)) }
}
