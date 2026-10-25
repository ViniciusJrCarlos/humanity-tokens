import { LEVELS, LevelId } from './OptimizationLevel'
import { TokenEstimator } from './TokenEstimator'

/** Como a análise foi feita. 'ai' fica reservado para a Fase 3 (IA real). */
export type AnalysisMethod = 'heuristic' | 'ai'

export interface OptimizationResult {
  method: AnalysisMethod
  original: string
  optimized: string
  level: LevelId
  originalTokens: number
  optimizedTokens: number
  /** Percentual real de tokens economizados (0–100). */
  savingsPercent: number
  changes: { label: string; count: number }[]
}

/**
 * Otimizador heurístico (sem IA): remove preenchimento, encurta expressões,
 * elimina frases e palavras repetidas e normaliza espaços.
 * A intensidade (10–50) só afeta o nível Custom: define quantas famílias de regras entram.
 */
export class PromptOptimizer {
  optimize(text: string, levelId: LevelId, intensity = 30): OptimizationResult {
    const level = LEVELS[levelId]
    let rules = level.rules
    if (levelId === 'custom') {
      const fraction = Math.min(1, Math.max(0.2, intensity / 50))
      rules = rules.slice(0, Math.ceil(rules.length * fraction))
    }
    const counts = new Map<string, number>()
    const bump = (label: string, n: number) => n && counts.set(label, (counts.get(label) ?? 0) + n)

    let out = text
    for (const rule of rules) {
      const n = out.match(rule.pattern)?.length ?? 0
      if (n) { out = out.replace(rule.pattern, rule.replacement); bump(rule.label, n) }
    }
    const dedup = this.removeRepetition(out)
    bump('repetição', dedup.removed)
    out = this.tidy(dedup.text)

    const originalTokens = TokenEstimator.estimate(text)
    const optimizedTokens = TokenEstimator.estimate(out)
    const savingsPercent = originalTokens ? Math.max(0, Math.round((1 - optimizedTokens / originalTokens) * 100)) : 0
    return {
      method: 'heuristic', original: text, optimized: out, level: levelId, originalTokens, optimizedTokens, savingsPercent,
      changes: [...counts].map(([label, count]) => ({ label, count })),
    }
  }

  /** Remove palavras duplicadas seguidas ("muito muito") e frases repetidas. */
  private removeRepetition(text: string): { text: string; removed: number } {
    let removed = 0
    let t = text.replace(/\b(\p{L}+)(\s+\1\b)+/giu, (_m, word) => { removed++; return word })
    const seen = new Set<string>()
    const sentences = t.split(/(?<=[.!?])\s+/)
    t = sentences.filter((s) => {
      const key = s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
      if (!key) return true
      if (seen.has(key)) { removed++; return false }
      seen.add(key); return true
    }).join(' ')
    return { text: t, removed }
  }

  private tidy(text: string): string {
    return text
      .split('\n').map((line) => line
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([,;:])\1+/g, '$1')
        .replace(/^[\s,;:]+/, '')
        .replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_m, p, c) => p + c.toUpperCase())
        .trim())
      .join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }
}
