import type { Analysis, AnalysisMethod, OptimizationMode, TokenCounter } from '../domain'

export interface Totals { analyses: number; tokensOriginal: number; tokensOptimized: number; tokensSaved: number; tokensAdded: number }
export interface DailyPoint { day: string; heuristic: number; ai: number }
export interface Report {
  byMethod: Record<AnalysisMethod, Totals>
  byMode: Record<OptimizationMode, Totals>
  /** Diferença líquida por dia (otimizado − original), por método. Negativo = economia. */
  daily: DailyPoint[]
  /** Tokens do otimizado como % do original (0–∞). */
  usagePercent: number
  hasAiData: boolean
  /** Quantas análises foram recontadas com o tokenizador exato e quantas seguem como estimativa. */
  exactCount: number
  estimatedCount: number
}

const empty = (): Totals => ({ analyses: 0, tokensOriginal: 0, tokensOptimized: 0, tokensSaved: 0, tokensAdded: 0 })

/** Agrega o histórico para a aba Relatórios. Se houver contador exato, reconta textos salvos. */
export class ReportService {
  static build(items: Analysis[], counter?: TokenCounter, timeZoneOffsetMin = new Date().getTimezoneOffset()): Report {
    const byMethod = { heuristic: empty(), ai: empty() }
    const byMode = { enxugar: empty(), estruturado: empty() }
    const days = new Map<string, DailyPoint>()
    let exactCount = 0, estimatedCount = 0
    for (const a of items) {
      let orig = a.props.originalTokens, opt = a.props.optimizedTokens
      const canRecount = counter?.exact && typeof a.props.original === 'string' && typeof a.props.optimized === 'string'
      if (canRecount) { orig = counter!.count(a.props.original); opt = counter!.count(a.props.optimized); exactCount++ }
      else if (a.tokenizer === 'o200k_base') exactCount++
      else estimatedCount++
      const delta = opt - orig
      for (const t of [byMethod[a.method], byMode[a.mode]]) {
        t.analyses++; t.tokensOriginal += orig; t.tokensOptimized += opt
        if (delta < 0) t.tokensSaved -= delta; else t.tokensAdded += delta
      }
      const day = new Date(new Date(a.props.createdAt).getTime() - timeZoneOffsetMin * 60_000).toISOString().slice(0, 10)
      const p = days.get(day) ?? { day, heuristic: 0, ai: 0 }
      p[a.method] += delta
      days.set(day, p)
    }
    const tO = byMethod.heuristic.tokensOriginal + byMethod.ai.tokensOriginal
    const tU = byMethod.heuristic.tokensOptimized + byMethod.ai.tokensOptimized
    return {
      byMethod, byMode, daily: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
      usagePercent: tO ? Math.round((tU / tO) * 100) : 0, hasAiData: byMethod.ai.analyses > 0, exactCount, estimatedCount,
    }
  }
}
