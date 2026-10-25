import type { TokenCounter } from './TokenCounter'

/**
 * Estimativa APROXIMADA (fallback enquanto o tokenizador exato carrega, ou em testes).
 * Média entre ~4 caracteres/token e palavras×1,3 + pontuação.
 */
export class TokenEstimator implements TokenCounter {
  readonly id = 'estimate' as const
  readonly exact = false
  readonly label = 'Estimativa'

  count(text: string): number { return TokenEstimator.estimate(text) }

  static words(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  static estimate(text: string): number {
    const t = text.trim()
    if (!t) return 0
    const byChars = t.length / 4
    const byWords = TokenEstimator.words(t) * 1.3 + (t.match(/[.,;:!?()"'\-]/g)?.length ?? 0) * 0.5
    return Math.max(1, Math.round((byChars + byWords) / 2))
  }
}
