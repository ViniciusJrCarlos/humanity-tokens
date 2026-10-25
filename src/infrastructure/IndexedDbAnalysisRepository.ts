import { Analysis } from '../domain'
import type { AnalysisProps, AnalysisRepository } from '../domain'
import { run } from './IndexedDb'

export class IndexedDbAnalysisRepository implements AnalysisRepository {
  constructor(private readonly db: IDBDatabase) {}

  async add(a: Analysis) { await run(this.db, 'analyses', 'readwrite', (s) => s.put(a.props)) }
  async listByUser(userId: string) {
    const rows = await run<AnalysisProps[]>(this.db, 'analyses', 'readonly', (s) => s.index('userId').getAll(userId))
    return rows.map((r) => new Analysis(r))
  }
  async clearByUser(userId: string) {
    const items = await this.listByUser(userId)
    for (const a of items) await this.delete(a.id)
    return items.length
  }
  async delete(id: string) { await run(this.db, 'analyses', 'readwrite', (s) => s.delete(id)) }
}
