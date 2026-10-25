import { useEffect, useMemo, useState } from 'react'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useApp } from '../hooks/AppContext'
import { ReportService } from '../../application/ReportService'
import type { Analysis } from '../../domain'
import { TokenBadge } from '../components/TokenBadge'
import { fmt, signed } from '../components/format'

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

export function ReportsPage() {
  const { services, user, prefs, counter } = useApp()
  const [items, setItems] = useState<Analysis[] | null>(null)
  useEffect(() => { services.history.list(user!.id).then(setItems) }, [services, user])
  const report = useMemo(() => items && ReportService.build(items, counter), [items, counter])
  const colors = useMemo(() => ({ accent: css('--accent'), green: css('--green'), warn: css('--warn'), muted: css('--muted'), border: css('--border'), card: css('--card'), ai: '#a78bfa', orig: css('--muted') }), [prefs])

  if (!report) return <p>Carregando…</p>
  const h = report.byMethod.heuristic, en = report.byMode.enxugar, st = report.byMode.estruturado
  ChartJS.defaults.color = colors.muted
  const bottom = { legend: { position: 'bottom' as const } }
  const yAxis = { y: { beginAtZero: true, grid: { color: colors.border } }, x: { grid: { display: false } } }

  return (
    <section className="stack">
      <div className="title-row"><h2>Relatórios</h2><TokenBadge /></div>
      <div className="cards four">
        <div className="card"><h3>Original → resultado (sem IA)</h3><p className="big" data-testid="rep-orig-opt">{fmt(h.tokensOriginal)} → {fmt(h.tokensOptimized)}</p><small className="muted">{h.analyses} análise(s)</small></div>
        <div className="card"><h3>Economizados (Enxugar)</h3><p className="big green" data-testid="rep-saved">{signed(-en.tokensSaved)}</p></div>
        <div className="card"><h3>Acrescentados (Estruturado)</h3><p className="big warn" data-testid="rep-added">{signed(st.tokensAdded)}</p><small className="muted">clareza, não economia</small></div>
        <div className="card"><h3>Com IA</h3><p className="big muted">—</p><span className="badge soon">Em breve</span></div>
      </div>
      {report.estimatedCount > 0
        ? <p className="notice" data-testid="rep-recount">{report.estimatedCount} análise(s) seguem como estimativa (sem texto salvo para recontar).</p>
        : report.exactCount > 0 && <p className="muted small" data-testid="rep-recount">Todas as {report.exactCount} análise(s) contadas com o tokenizador exato (antigas foram recontadas a partir do texto salvo).</p>}
      {h.analyses === 0 ? <p className="card muted">Ainda não há análises salvas. Faça algumas no Analisador para ver os gráficos.</p> : (
        <div className="charts">
          <div className="card chart-card wide">
            <h3>Tokens: original × resultado, por modo</h3>
            <div className="chart-box"><Bar data={{
              labels: ['Enxugar', 'Prompt estruturado'],
              datasets: [
                { label: 'Original', data: [en.tokensOriginal, st.tokensOriginal], backgroundColor: colors.orig, borderRadius: 8 },
                { label: 'Resultado', data: [en.tokensOptimized, st.tokensOptimized], backgroundColor: colors.accent, borderRadius: 8 },
              ],
            }} options={{ maintainAspectRatio: false, plugins: bottom, scales: yAxis }} /></div>
          </div>
          <div className="card chart-card">
            <h3>Por método</h3>
            <div className="chart-box"><Bar data={{
              labels: ['Sem IA', 'Com IA (em breve)'],
              datasets: [
                { label: 'Original', data: [h.tokensOriginal, report.byMethod.ai.tokensOriginal], backgroundColor: colors.orig, borderRadius: 8 },
                { label: 'Resultado', data: [h.tokensOptimized, report.byMethod.ai.tokensOptimized], backgroundColor: [colors.accent, colors.ai], borderRadius: 8 },
              ],
            }} options={{ maintainAspectRatio: false, plugins: bottom, scales: yAxis }} /></div>
          </div>
          <div className="card chart-card">
            <h3>Enxugar: mantidos × economizados</h3>
            <div className="chart-box"><Doughnut data={{
              labels: ['Tokens mantidos', 'Tokens economizados'],
              datasets: [{ data: [en.tokensOptimized, en.tokensSaved], backgroundColor: [colors.accent, colors.green], borderColor: colors.card, borderWidth: 3 }],
            }} options={{ maintainAspectRatio: false, plugins: bottom }} /></div>
          </div>
          <div className="card chart-card wide">
            <h3>Diferença líquida por dia (negativo = economia)</h3>
            <div className="chart-box"><Line data={{
              labels: report.daily.map((d) => d.day.split('-').reverse().slice(0, 2).join('/')),
              datasets: [
                { label: 'Sem IA', data: report.daily.map((d) => d.heuristic), borderColor: colors.accent, backgroundColor: colors.accent + '33', fill: true, tension: 0.3 },
                { label: 'Com IA (em breve)', data: report.daily.map((d) => d.ai), borderColor: colors.ai, borderDash: [6, 4], pointRadius: 0 },
              ],
            }} options={{ maintainAspectRatio: false, plugins: bottom, scales: { y: { grid: { color: colors.border } }, x: { grid: { display: false } } } }} /></div>
          </div>
        </div>
      )}
      <p className="notice">🤖 <b>Com IA: em breve.</b> A série "com IA" aparece quando a otimização por IA real (Fase 3) for ativada. Cada análise já registra o método e o modo usados.</p>
    </section>
  )
}
