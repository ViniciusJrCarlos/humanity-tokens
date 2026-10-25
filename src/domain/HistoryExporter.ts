import type { Analysis } from './Analysis'

/** Converte o histórico para JSON ou CSV (sem senhas nem dados do usuário). */
export class HistoryExporter {
  static readonly COLUMNS = ['data', 'metodo', 'nivel', 'tokens_original', 'tokens_otimizado', 'economia_pct', 'original', 'otimizado'] as const

  static toJSON(items: Analysis[]): string {
    return JSON.stringify(items.map((a) => ({
      createdAt: a.props.createdAt, method: a.method, level: a.level,
      originalTokens: a.props.originalTokens, optimizedTokens: a.props.optimizedTokens,
      savingsPercent: a.props.savingsPercent, original: a.props.original, optimized: a.props.optimized,
    })), null, 2)
  }

  static toCSV(items: Analysis[]): string {
    const esc = (v: string | number) => {
      const s = String(v)
      return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = items.map((a) => [a.props.createdAt, a.method, a.level, a.props.originalTokens, a.props.optimizedTokens,
      a.props.savingsPercent, a.props.original, a.props.optimized].map(esc).join(','))
    return [HistoryExporter.COLUMNS.join(','), ...rows].join('\r\n')
  }
}
