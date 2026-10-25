/** Contrato de contagem de tokens. */
export type TokenizerId = 'o200k_base' | 'estimate'

export interface TokenCounter {
  readonly id: TokenizerId
  /** true = contagem exata do tokenizador; false = estimativa. */
  readonly exact: boolean
  readonly label: string
  count(text: string): number
}
