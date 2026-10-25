import { useEffect, useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { LEVELS } from '../../domain'
import { deltaClass, signed } from '../components/format'
import type { Analysis } from '../../domain'

export function HistoryPage() {
  const { services, user } = useApp()
  const [items, setItems] = useState<Analysis[] | null>(null)
  const load = () => user && services.history.list(user.id).then(setItems)
  useEffect(() => { load() }, [services, user])

  const remove = async (id: string) => { await services.history.remove(id); load() }

  if (!items) return <p>Carregando…</p>
  return (
    <section>
      <h2>Histórico</h2>
      <p className="muted small">Salvo localmente neste aparelho (IndexedDB).</p>
      {items.length === 0 ? <p className="muted">Nenhuma análise salva.</p> : (
        <ul className="history-list" data-testid="history">
          {items.map((a) => (
            <li key={a.id} className="card history-item">
              <div className="history-meta">
                <span className="badge">{a.mode === 'estruturado' ? 'Estruturado' : `Enxugar · ${LEVELS[a.level].label}`}</span>
                <span className="muted small">{new Date(a.props.createdAt).toLocaleString('pt-BR')}</span>
                <span className={deltaClass(a.tokenDelta)}>{a.props.originalTokens} → {a.props.optimizedTokens} tokens ({signed(a.tokenDelta)}, {a.deltaPercent > 0 ? '+' : ''}{a.deltaPercent}%)</span>
                {a.tokenizer === 'estimate' && <span className="badge soon" title="Salva antes do contador exato">estimativa</span>}
              </div>
              <p className="snippet"><b>Original:</b> {a.props.original}</p>
              <p className="snippet pre"><b>Resultado:</b> {a.props.optimized}</p>
              <button className="btn-text danger" onClick={() => remove(a.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
