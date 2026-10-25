import type { Analysis, AnalysisMethod } from '../domain'

export interface MethodTotals { method: AnalysisMethod; analyses: number; tokensOriginal: number; tokensSaved: number; tokensUsed: number }
export interface DailyPoint { day: string; heuristic: number; ai: number }
export interface Report {
  byMethod: Record<AnalysisMethod, MethodTotals>
  /** Tokens economizados por dia (AAAA-MM-DD), separados por método. */
  daily: DailyPoint[]
  /** Percentual dos tokens originais efetivamente usados após otimização (0–100). */
  usagePercent: number
  hasAiData: boolean
}

/** Agrega o histórico para a aba Relatórios. */
export class ReportService {
  static build(items: Analysis[], timeZoneOffsetMin = new Date().getTimezoneOffset()): Report {
    const empty = (method: AnalysisMethod): MethodTotals => ({ method, analyses: 0, tokensOriginal: 0, tokensSaved: 0, tokensUsed: 0 })
    const byMethod = { heuristic: empty('heuristic'), ai: empty('ai') }
    const days = new Map<string, DailyPoint>()
    for (const a of items) {
      const m = byMethod[a.method]
      m.analyses++; m.tokensOriginal += a.props.originalTokens; m.tokensUsed += a.props.optimizedTokens; m.tokensSaved += a.savedTokens
      const local = new Date(new Date(a.props.createdAt).getTime() - timeZoneOffsetMin * 60_000)
      const day = local.toISOString().slice(0, 10)
      const p = days.get(day) ?? { day, heuristic: 0, ai: 0 }
      p[a.method] += a.savedTokens
      days.set(day, p)
    }
    const totalOrig = byMethod.heuristic.tokensOriginal + byMethod.ai.tokensOriginal
    const totalUsed = byMethod.heuristic.tokensUsed + byMethod.ai.tokensUsed
    return {
      byMethod,
      daily: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
      usagePercent: totalOrig ? Math.round((totalUsed / totalOrig) * 100) : 0,
      hasAiData: byMethod.ai.analyses > 0,
    }
  }
}
