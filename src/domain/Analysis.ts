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
  get savedTokens() { return this.props.originalTokens - this.props.optimizedTokens }

  static fromResult(userId: string, result: OptimizationResult, id: string): Analysis {
    return new Analysis({ ...result, id, userId, createdAt: new Date().toISOString() })
  }
}
