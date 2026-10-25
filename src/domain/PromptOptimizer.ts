import { LEVELS, LevelId } from './OptimizationLevel'
import { TokenEstimator } from './TokenEstimator'
import { StructuredPromptBuilder } from './StructuredPromptBuilder'
import type { TokenCounter, TokenizerId } from './TokenCounter'

/** Como a análise foi feita. 'ai' fica reservado para a Fase 3 (IA real). */
export type AnalysisMethod = 'heuristic' | 'ai'

/** Modo sem IA: 'enxugar' reduz tokens; 'estruturado' organiza (pode aumentar). */
export type OptimizationMode = 'enxugar' | 'estruturado'

export interface OptimizationResult {
  method: AnalysisMethod
  mode: OptimizationMode
  tokenizer: TokenizerId
  /** Diferença com sinal: otimizado − original (negativo = economia). */
  tokenDelta: number
  /** Diferença percentual com sinal (negativo = economia). */
  deltaPercent: number
  original: string
  optimized: string
  level: LevelId
  originalTokens: number
  optimizedTokens: number
  /** Percentual de tokens economizados (0–100; 0 quando aumenta). */
  savingsPercent: number
  changes: { label: string; count: number }[]
}

/**
 * Otimizador heurístico (sem IA): remove preenchimento, encurta expressões,
 * elimina frases e palavras repetidas e normaliza espaços.
 * A intensidade (10–50) só afeta o nível Custom: define quantas famílias de regras entram.
 */
export class PromptOptimizer {
  constructor(private counter: TokenCounter = new TokenEstimator(), private readonly structured = new StructuredPromptBuilder()) {}

  /** Troca o contador (ex.: quando o tokenizador exato termina de carregar). */
  useCounter(counter: TokenCounter) { this.counter = counter }
  get tokenCounter(): TokenCounter { return this.counter }

  /** Monta o resultado comparando original e otimizado com o contador atual. */
  compare(text: string, out: string, mode: OptimizationMode, level: LevelId, changes: { label: string; count: number }[]): OptimizationResult {
    const originalTokens = this.counter.count(text)
    const optimizedTokens = this.counter.count(out)
    const tokenDelta = optimizedTokens - originalTokens
    const deltaPercent = originalTokens ? Math.round((tokenDelta / originalTokens) * 100) : 0
    return {
      method: 'heuristic', mode, tokenizer: this.counter.id, original: text, optimized: out, level,
      originalTokens, optimizedTokens, tokenDelta, deltaPercent, savingsPercent: Math.max(0, -deltaPercent), changes,
    }
  }

  structure(text: string): OptimizationResult {
    const out = this.structured.build(text)
    return this.compare(text, out, 'estruturado', 'tecnico', out ? [{ label: 'estruturado', count: 1 }] : [])
  }

  run(text: string, mode: OptimizationMode, levelId: LevelId, intensity = 30): OptimizationResult {
    return mode === 'estruturado' ? this.structure(text) : this.optimize(text, levelId, intensity)
  }

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

    return this.compare(text, out, 'enxugar', levelId, [...counts].map(([label, count]) => ({ label, count })))
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
