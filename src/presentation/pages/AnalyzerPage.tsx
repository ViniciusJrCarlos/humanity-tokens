import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { LEVELS, TokenEstimator } from '../../domain'
import type { LevelId, PromptTemplate } from '../../domain'

const EXAMPLE = 'Olá, por favor, você poderia basicamente me explicar de forma detalhada como funciona a fotossíntese a fim de que eu consiga entender muito muito bem? Na verdade é importante ressaltar que eu preciso que você use uma linguagem simples. Obrigado desde já!'

export function AnalyzerPage() {
  const { services, user } = useApp()
  const [original, setOriginal] = useState('')
  const [level, setLevel] = useState<LevelId>('humano')
  const [intensity, setIntensity] = useState(30)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [tplTitle, setTplTitle] = useState('')
  const [showSave, setShowSave] = useState(false)
  const loadTemplates = () => services.templates.list(user!.id).then(setTemplates)
  useEffect(() => { loadTemplates() }, [services, user])

  const result = useMemo(() => original.trim() ? services.analyzer.preview(original, level, intensity) : null, [original, level, intensity, services])

  const save = async () => {
    setError('')
    try { await services.analyzer.analyzeAndSave(user!.id, original, level, intensity); setSaved(true) }
    catch (e: any) { setError(e.message) }
  }
  const copy = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(result.optimized) } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: result.optimized })
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  const saveTemplate = async () => {
    try { await services.templates.save(user!.id, tplTitle, original); setTplTitle(''); setShowSave(false); loadTemplates() }
    catch (e: any) { setError(e.message) }
  }
  const useTemplate = (id: string) => { const t = templates.find((x) => x.id === id); if (t) { setOriginal(t.text); setSaved(false) } }
  const removeTemplate = async (id: string) => { await services.templates.remove(id); loadTemplates() }

  return (
    <section>
      <h2>Analisador</h2>
      <div className="metrics">
        <div className="card"><small>Palavras</small><b>{TokenEstimator.words(original)}</b></div>
        <div className="card"><small>Tokens (aprox.)</small><b>{result ? `${result.originalTokens} → ${result.optimizedTokens}` : 0}</b></div>
        <div className="card"><small>Melhoria</small><b className="green" data-testid="savings">{result?.savingsPercent ?? 0}%</b></div>
      </div>

      <div className="controls">
        <div className="levels" role="group" aria-label="Nível">
          {Object.values(LEVELS).map((l) => (
            <button key={l.id} className={level === l.id ? 'active' : ''} onClick={() => { setLevel(l.id); setSaved(false) }} title={l.description}>{l.label}</button>
          ))}
        </div>
        {level === 'custom' && (
          <label className="percent">Intensidade: {intensity}%
            <input type="range" min={10} max={50} step={10} value={intensity} onChange={(e) => { setIntensity(Number(e.target.value)); setSaved(false) }} />
          </label>
        )}
      </div>
      <p className="muted small">{LEVELS[level].description}</p>

      <div className="analyzer-grid">
        <div className="panel">
          <div className="panel-head"><h3>Texto original</h3><div className="row tight">
            <button className="btn-text" onClick={() => { setOriginal(EXAMPLE); setSaved(false) }}>Usar exemplo</button>
            <button className="btn-text" onClick={() => setShowSave((v) => !v)} disabled={!original.trim()}>★ Salvar modelo</button>
          </div></div>
          {showSave && (
            <div className="row tight">
              <input className="input" placeholder="Nome do modelo" aria-label="Nome do modelo" value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} />
              <button className="btn-secondary" onClick={saveTemplate}>Salvar</button>
            </div>
          )}
          {templates.length > 0 && (
            <div className="templates" aria-label="Modelos favoritos">
              {templates.map((t) => (
                <span key={t.id} className="chip tpl"><button onClick={() => useTemplate(t.id)} title={t.text}>★ {t.title}</button><button onClick={() => removeTemplate(t.id)} aria-label={`Excluir modelo ${t.title}`}>×</button></span>
              ))}
            </div>
          )}
          <textarea aria-label="Texto original" value={original} onChange={(e) => { setOriginal(e.target.value); setSaved(false) }} placeholder="Cole ou escreva seu prompt aqui…" rows={12} />
        </div>
        <div className="panel">
          <div className="panel-head"><h3>Versão otimizada</h3>{result && <button className="btn-secondary small-btn" onClick={copy}>{copied ? 'Copiado ✓' : 'Copiar'}</button>}</div>
          <div className="result" data-testid="optimized">{result?.optimized || 'A versão otimizada aparece aqui enquanto você digita.'}</div>
          {result && result.changes.length > 0 && (
            <div className="chips">{result.changes.map((c) => <span key={c.label} className="chip">{c.label}: {c.count}</span>)}</div>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn-primary" onClick={save} disabled={!result || saved}>{saved ? 'Salvo no histórico ✓' : 'Humanizar e salvar'}</button>
      </div>
      <p className="muted small">Otimização heurística (sem IA): remove preenchimento, repetições e expressões longas. A contagem de tokens é uma estimativa.</p>
    </section>
  )
}
