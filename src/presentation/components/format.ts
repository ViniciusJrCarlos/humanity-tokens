/** Formatação de números e diferenças com sinal (economia = negativo). */
export const fmt = (n: number) => n.toLocaleString('pt-BR')
export const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n))
export const deltaClass = (n: number) => (n < 0 ? 'green' : n > 0 ? 'warn' : 'muted')
