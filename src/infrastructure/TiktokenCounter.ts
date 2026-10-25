import type { TokenCounter } from '../domain'
import type { Tiktoken } from 'js-tiktoken/lite'

/**
 * Contagem EXATA no padrão OpenAI (encoding o200k_base, usado pelo GPT-4o e posteriores).
 * O vocabulário (~2 MB) é carregado sob demanda em um chunk separado e fica em cache para uso offline.
 */
export class TiktokenCounter implements TokenCounter {
  readonly id = 'o200k_base' as const
  readonly exact = true
  readonly label = 'OpenAI o200k'
  private constructor(private readonly enc: Tiktoken) {}

  count(text: string): number { return text ? this.enc.encode(text).length : 0 }

  private static loading: Promise<TiktokenCounter> | null = null
  static load(): Promise<TiktokenCounter> {
    TiktokenCounter.loading ??= Promise.all([import('js-tiktoken/lite'), import('js-tiktoken/ranks/o200k_base')])
      .then(([{ Tiktoken }, ranks]) => new TiktokenCounter(new Tiktoken(ranks.default)))
    return TiktokenCounter.loading
  }
}
