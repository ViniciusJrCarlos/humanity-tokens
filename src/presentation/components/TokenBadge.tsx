import { useApp } from '../hooks/AppContext'
/** Indica se a contagem é exata (OpenAI o200k) ou estimativa. */
export function TokenBadge() {
  const { counter } = useApp()
  return counter.exact
    ? <span className="badge" data-testid="tokenizer" title="Contagem exata com o tokenizador o200k_base (GPT-4o e posteriores)">Tokens no padrão OpenAI (o200k)</span>
    : <span className="badge soon" data-testid="tokenizer">Carregando contador exato… (estimativa)</span>
}
