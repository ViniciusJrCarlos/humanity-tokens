import type { LevelId } from './OptimizationLevel'
import type { OptimizationResult } from './PromptOptimizer'

export interface AnalysisProps extends OptimizationResult {
  id: string
  userId: string
  createdAt: string
}

/** Uma análise salva no histórico do usuário. */
export class Analysis {
  constructor(readonly props: AnalysisProps) {}
  get id() { return this.props.id }
  get userId() { return this.props.userId }
  get level(): LevelId { return this.props.level }
  /** Registros antigos (v1.0) não tinham método: eram todos heurísticos. */
  get method() { return this.props.method ?? 'heuristic' }
  /** Registros antigos (v1.0/v1.1) eram todos do modo Enxugar, com tokens estimados. */
  get mode() { return this.props.mode ?? 'enxugar' }
  get tokenizer() { return this.props.tokenizer ?? 'estimate' }
  /** Diferença com sinal (otimizado − original). */
  get tokenDelta() { return this.props.optimizedTokens - this.props.originalTokens }
  get deltaPercent() { return this.props.originalTokens ? Math.round((this.tokenDelta / this.props.originalTokens) * 100) : 0 }
  get savedTokens() { return this.props.originalTokens - this.props.optimizedTokens }

  static fromResult(userId: string, result: OptimizationResult, id: string): Analysis {
    return new Analysis({ ...result, id, userId, createdAt: new Date().toISOString() })
  }
}
