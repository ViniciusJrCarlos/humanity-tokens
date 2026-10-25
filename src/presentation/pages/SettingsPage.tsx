import { useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { ACCENTS, THEMES } from '../../domain'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { downloadText } from '../components/download'

export function SettingsPage() {
  const { services, user, prefs, updatePrefs } = useApp()
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')

  const exportAs = async (format: 'json' | 'csv') => {
    const content = await services.history.exportAs(user!.id, format)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadText(`humanity-tokens-historico-${stamp}.${format}`, content, format === 'json' ? 'application/json' : 'text/csv')
    setMsg(`Histórico exportado em ${format.toUpperCase()}.`)
  }
  const clear = async () => {
    const n = await services.history.clear(user!.id)
    setConfirm(false); setMsg(`${n} análise(s) removida(s).`)
  }

  return (
    <section className="stack">
      <h2>Configurações</h2>
      <div className="card form">
        <h3>Tema</h3>
        <div className="segmented" role="radiogroup" aria-label="Tema">
          {THEMES.map((t) => (
            <button key={t.id} role="radio" aria-checked={prefs.theme === t.id} className={prefs.theme === t.id ? 'active' : ''} onClick={() => updatePrefs({ theme: t.id })}>{t.label}</button>
          ))}
        </div>
        <p className="hint">"Sistema" segue o modo claro/escuro do aparelho.</p>
        <h3>Cor de destaque</h3>
        <div className="swatches" role="radiogroup" aria-label="Cor de destaque">
          {ACCENTS.map((a) => (
            <button key={a.id} role="radio" aria-checked={prefs.accent === a.id} aria-label={a.label} title={a.label}
              className={`swatch ${prefs.accent === a.id ? 'active' : ''}`} style={{ background: a.hex }} onClick={() => updatePrefs({ accent: a.id })} />
          ))}
        </div>
      </div>
      <div className="card form">
        <h3>Histórico</h3>
        <p className="muted small">Os dados ficam só neste aparelho. Exporte para guardar uma cópia.</p>
        <div className="row">
          <button className="btn-secondary" onClick={() => exportAs('json')}>Exportar JSON</button>
          <button className="btn-secondary" onClick={() => exportAs('csv')}>Exportar CSV</button>
          <button className="btn-danger" onClick={() => setConfirm(true)}>Limpar histórico</button>
        </div>
        {msg && <p className="success" role="status">{msg}</p>}
      </div>
      <ConfirmDialog open={confirm} title="Limpar histórico?" message="Todas as suas análises salvas neste aparelho serão apagadas. Não dá para desfazer."
        confirmLabel="Apagar tudo" danger onConfirm={clear} onCancel={() => setConfirm(false)} />
    </section>
  )
}
