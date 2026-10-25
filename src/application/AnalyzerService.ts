import { PromptOptimizer, Analysis } from '../domain'
import type { AnalysisRepository, LevelId, OptimizationMode, OptimizationResult, TokenCounter } from '../domain'

/** Analisa um prompt e salva o resultado no histórico. */
export class AnalyzerService {
  constructor(
    private readonly optimizer: PromptOptimizer,
    private readonly history: AnalysisRepository,
    private readonly idGen: () => string,
  ) {}

  preview(text: string, level: LevelId, intensity: number, mode: OptimizationMode = 'enxugar'): OptimizationResult {
    return this.optimizer.run(text, mode, level, intensity)
  }

  get counter(): TokenCounter { return this.optimizer.tokenCounter }
  useCounter(counter: TokenCounter) { this.optimizer.useCounter(counter) }

  /** Salva o resultado; se o usuário editou o texto otimizado, salva a versão editada recontada. */
  async save(userId: string, result: OptimizationResult, editedText?: string): Promise<Analysis> {
    if (!result.original.trim()) throw new Error('Escreva ou cole um texto para analisar.')
    const final = editedText !== undefined && editedText !== result.optimized
      ? this.optimizer.compare(result.original, editedText, result.mode, result.level, [...result.changes, { label: 'editado', count: 1 }])
      : result
    const analysis = Analysis.fromResult(userId, final, this.idGen())
    await this.history.add(analysis)
    return analysis
  }

  async analyzeAndSave(userId: string, text: string, level: LevelId, intensity: number): Promise<Analysis> {
    if (!text.trim()) throw new Error('Escreva ou cole um texto para analisar.')
    const analysis = Analysis.fromResult(userId, this.optimizer.optimize(text, level, intensity), this.idGen())
    await this.history.add(analysis)
    return analysis
  }
}
