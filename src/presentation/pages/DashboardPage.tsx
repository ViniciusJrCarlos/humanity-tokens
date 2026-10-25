import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../hooks/AppContext'
import { HistoryService, type DashboardStats } from "../../application/HistoryService"
import type { Analysis } from '../../domain'
import { LEVELS } from '../../domain'

const fmt = (n: number) => n.toLocaleString('pt-BR')

export function DashboardPage() {
  const { services, user } = useApp()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<Analysis[]>([])

  useEffect(() => {
    if (!user) return
    services.history.list(user.id).then((items) => {
      setRecent(items.slice(0, 3))
      setStats(HistoryService.computeStats(items))
    })
  }, [services, user])

  if (!stats) return <p>Carregando…</p>
  return (
    <section>
      <h2>Olá, {user?.name.split(' ')[0]} 👋</h2>
      <div className="cards">
        <div className="card"><h3>Análises</h3><p className="big" data-testid="stat-total">{fmt(stats.totalAnalyses)}</p></div>
        <div className="card"><h3>Tokens economizados</h3><p className="big green" data-testid="stat-saved">{fmt(stats.tokensSaved)}</p><small>de {fmt(stats.tokensOriginal)} originais (aprox.)</small></div>
        <div className="card"><h3>Economia média</h3><p className="big" data-testid="stat-avg">{stats.averageSavings}%</p></div>
      </div>
      <Link to="/analyzer" className="btn-primary large">Nova análise</Link>
      <h3 className="section-title">Recentes</h3>
      {recent.length === 0 ? <p className="muted">Nenhuma análise ainda. Comece pelo Analisador.</p> : (
        <ul className="history-list">
          {recent.map((a) => (
            <li key={a.id} className="card history-item">
              <span className="badge">{LEVELS[a.level].label}</span>
              <p className="snippet">{a.props.original.slice(0, 120)}</p>
              <span className="green">−{a.props.savingsPercent}%</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
