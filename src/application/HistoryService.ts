import { HistoryExporter } from '../domain'
import type { Analysis, AnalysisRepository } from '../domain'

export interface DashboardStats {
  totalAnalyses: number
  tokensOriginal: number
  tokensOptimized: number
  tokensSaved: number
  averageSavings: number
  lastAnalysisAt: string | null
}

/** Consulta o histórico e calcula as métricas do dashboard a partir dos dados reais. */
export class HistoryService {
  constructor(private readonly repo: AnalysisRepository) {}

  async list(userId: string): Promise<Analysis[]> {
    const items = await this.repo.listByUser(userId)
    return items.sort((a, b) => b.props.createdAt.localeCompare(a.props.createdAt))
  }

  clear(userId: string): Promise<number> { return this.repo.clearByUser(userId) }

  async exportAs(userId: string, format: 'json' | 'csv'): Promise<string> {
    const items = await this.list(userId)
    return format === 'json' ? HistoryExporter.toJSON(items) : HistoryExporter.toCSV(items)
  }

  remove(id: string): Promise<void> { return this.repo.delete(id) }

  async stats(userId: string): Promise<DashboardStats> {
    return HistoryService.computeStats(await this.list(userId))
  }

  static computeStats(items: Analysis[]): DashboardStats {
    const tokensOriginal = items.reduce((s, a) => s + a.props.originalTokens, 0)
    const tokensOptimized = items.reduce((s, a) => s + a.props.optimizedTokens, 0)
    return {
      totalAnalyses: items.length,
      tokensOriginal,
      tokensOptimized,
      tokensSaved: tokensOriginal - tokensOptimized,
      averageSavings: items.length ? Math.round(items.reduce((s, a) => s + a.props.savingsPercent, 0) / items.length) : 0,
      lastAnalysisAt: items[0]?.props.createdAt ?? null,
    }
  }
}
