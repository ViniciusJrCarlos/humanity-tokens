import { useEffect, useMemo, useState } from 'react'
import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import { useApp } from '../hooks/AppContext'
import { ReportService } from '../../application/ReportService'
import type { Analysis } from '../../domain'

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
const fmt = (n: number) => n.toLocaleString('pt-BR')

export function ReportsPage() {
  const { services, user, prefs } = useApp()
  const [items, setItems] = useState<Analysis[] | null>(null)
  useEffect(() => { services.history.list(user!.id).then(setItems) }, [services, user])
  const report = useMemo(() => items && ReportService.build(items), [items])
  // Recalcula cores quando o tema muda.
  const colors = useMemo(() => ({ accent: css('--accent'), green: css('--green'), text: css('--text'), muted: css('--muted'), border: css('--border'), ai: '#a78bfa' }), [prefs])

  if (!report) return <p>Carregando…</p>
  const h = report.byMethod.heuristic
  const empty = h.analyses === 0
  ChartJS.defaults.color = colors.muted

  return (
    <section className="stack">
      <h2>Relatórios</h2>
      <div className="cards">
        <div className="card"><h3>Tokens economizados (sem IA)</h3><p className="big green" data-testid="rep-saved">{fmt(h.tokensSaved)}</p></div>
        <div className="card"><h3>Uso de tokens</h3><p className="big" data-testid="rep-usage">{report.usagePercent}%</p><small className="muted">do total original, após otimizar</small></div>
        <div className="card"><h3>Com IA</h3><p className="big muted">—</p><span className="badge soon">Em breve</span></div>
      </div>
      {empty ? <p className="card muted">Ainda não há análises salvas. Faça algumas no Analisador para ver os gráficos.</p> : (
        <div className="charts">
          <div className="card chart-card">
            <h3>Uso × economia (sem IA)</h3>
            <div className="chart-box"><Doughnut data-testid="pie" data={{
              labels: ['Tokens usados', 'Tokens economizados'],
              datasets: [{ data: [h.tokensUsed, h.tokensSaved], backgroundColor: [colors.accent, colors.green], borderColor: css('--card'), borderWidth: 3 }],
            }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
          </div>
          <div className="card chart-card">
            <h3>Tokens economizados por dia</h3>
            <div className="chart-box"><Line data={{
              labels: report.daily.map((d) => d.day.split('-').reverse().slice(0, 2).join('/')),
              datasets: [
                { label: 'Sem IA', data: report.daily.map((d) => d.heuristic), borderColor: colors.accent, backgroundColor: colors.accent + '33', fill: true, tension: 0.3 },
                { label: 'Com IA (em breve)', data: report.daily.map((d) => d.ai), borderColor: colors.ai, borderDash: [6, 4], pointRadius: 0 },
              ],
            }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, grid: { color: colors.border } }, x: { grid: { display: false } } } }} /></div>
          </div>
        </div>
      )}
      <p className="notice">🤖 <b>Com IA — em breve.</b> A série "com IA" aparece quando a otimização por IA real (Fase 3) for ativada. Cada análise já registra o método usado.</p>
    </section>
  )
}
