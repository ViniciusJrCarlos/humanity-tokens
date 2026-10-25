/**
 * Estimativa APROXIMADA de tokens. Não é o tokenizador oficial de nenhum modelo:
 * combina ~4 caracteres por token com a contagem de palavras e pontuação.
 */
export class TokenEstimator {
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
