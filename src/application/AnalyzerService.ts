import { PromptOptimizer, Analysis } from '../domain'
import type { AnalysisRepository, LevelId, OptimizationResult } from '../domain'

/** Analisa um prompt e salva o resultado no histórico. */
export class AnalyzerService {
  constructor(
    private readonly optimizer: PromptOptimizer,
    private readonly history: AnalysisRepository,
    private readonly idGen: () => string,
  ) {}

  preview(text: string, level: LevelId, intensity: number): OptimizationResult {
    return this.optimizer.optimize(text, level, intensity)
  }

  async analyzeAndSave(userId: string, text: string, level: LevelId, intensity: number): Promise<Analysis> {
    if (!text.trim()) throw new Error('Escreva ou cole um texto para analisar.')
    const analysis = Analysis.fromResult(userId, this.optimizer.optimize(text, level, intensity), this.idGen())
    await this.history.add(analysis)
    return analysis
  }
}
