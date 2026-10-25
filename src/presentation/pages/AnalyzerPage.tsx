import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { LEVELS } from '../../domain'
import type { LevelId, OptimizationMode, PromptTemplate } from '../../domain'
import { TokenBadge } from '../components/TokenBadge'
import { deltaClass, signed } from '../components/format'

const EXAMPLE = 'Olá, por favor, você poderia basicamente me explicar de forma detalhada como funciona a fotossíntese a fim de que eu consiga entender muito muito bem? Sou professor do ensino fundamental. Quero em tópicos curtos. Por favor use uma linguagem simples. Obrigado desde já!'

const MODES: { id: OptimizationMode; label: string; help: string }[] = [
  { id: 'enxugar', label: 'Enxugar', help: 'Tira enrolação e repetições para gastar menos tokens.' },
  { id: 'estruturado', label: 'Prompt estruturado', help: 'Organiza em Papel, Tarefa, Contexto, Formato e Restrições. Deixa o pedido mais claro, mas pode usar MAIS tokens.' },
]

export function AnalyzerPage() {
  const { services, user, counter } = useApp()
  const [original, setOriginal] = useState('')
  const [mode, setMode] = useState<OptimizationMode>('enxugar')
  const [level, setLevel] = useState<LevelId>('humano')
  const [intensity, setIntensity] = useState(30)
  const [edited, setEdited] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [tplTitle, setTplTitle] = useState('')
  const [showSave, setShowSave] = useState(false)
  const loadTemplates = () => services.templates.list(user!.id).then(setTemplates)
  useEffect(() => { loadTemplates() }, [services, user])

  const result = useMemo(
    () => (original.trim() ? services.analyzer.preview(original, level, intensity, mode) : null),
    [original, level, intensity, mode, services, counter],
  )
  // O resultado gerado vira o texto editável; editar não muda o original.
  useEffect(() => { setEdited(result?.optimized ?? ''); setSaved(false) }, [result])

  const finalTokens = result ? counter.count(edited) : 0
  const delta = result ? finalTokens - result.originalTokens : 0
  const deltaPct = result && result.originalTokens ? Math.round((delta / result.originalTokens) * 100) : 0

  const save = async () => {
    setError('')
    try { if (result) { await services.analyzer.save(user!.id, result, edited); setSaved(true) } }
    catch (e: any) { setError(e.message) }
  }
  const copy = async () => {
    if (!edited) return
    try { await navigator.clipboard.writeText(edited) } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: edited })
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  const saveTemplate = async () => {
    try { await services.templates.save(user!.id, tplTitle, original); setTplTitle(''); setShowSave(false); loadTemplates() }
    catch (e: any) { setError(e.message) }
  }
  const useTemplate = (id: string) => { const t = templates.find((x) => x.id === id); if (t) setOriginal(t.text) }
  const removeTemplate = async (id: string) => { await services.templates.remove(id); loadTemplates() }

  return (
    <section>
      <div className="title-row"><h2>Analisador</h2><TokenBadge /></div>

      <div className="segmented mode-switch" role="radiogroup" aria-label="Modo">
        {MODES.map((m) => (
          <button key={m.id} role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'active' : ''} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>
      <p className="muted small">{MODES.find((m) => m.id === mode)!.help}</p>

      {mode === 'enxugar' && (
        <div className="controls">
          <div className="levels" role="group" aria-label="Nível">
            {Object.values(LEVELS).map((l) => (
              <button key={l.id} className={level === l.id ? 'active' : ''} onClick={() => setLevel(l.id)} title={l.description}>{l.label}</button>
            ))}
          </div>
          {level === 'custom' && (
            <label className="percent">Intensidade: {intensity}%
              <input type="range" min={10} max={50} step={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />
            </label>
          )}
        </div>
      )}

      <div className="metrics">
        <div className="card"><small>Tokens originais</small><b data-testid="tok-original">{result?.originalTokens ?? 0}</b></div>
        <div className="card"><small>Tokens no resultado</small><b data-testid="tok-final">{finalTokens}</b></div>
        <div className="card">
          <small>{delta < 0 ? 'Economia' : delta > 0 ? 'Aumento' : 'Diferença'}</small>
          <b className={deltaClass(delta)} data-testid="tok-delta">{signed(delta)} ({deltaPct > 0 ? '+' : ''}{deltaPct}%)</b>
        </div>
      </div>
      {result && delta > 0 && <p className="notice warn-notice" data-testid="increase-note">O resultado usa <b>{delta} tokens a mais</b> que o original. Isso não é economia: o ganho aqui é clareza e organização.</p>}

      <div className="analyzer-grid">
        <div className="panel">
          <div className="panel-head"><h3>Texto original</h3><div className="row tight">
            <button className="btn-text" onClick={() => setOriginal(EXAMPLE)}>Usar exemplo</button>
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
          <textarea aria-label="Texto original" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="Cole ou escreva seu prompt aqui…" rows={12} />
        </div>
        <div className="panel">
          <div className="panel-head"><h3>{mode === 'estruturado' ? 'Prompt estruturado' : 'Versão otimizada'}</h3>{edited !== (result?.optimized ?? '') && <span className="badge">editado</span>}</div>
          <textarea className="result" aria-label="Resultado" data-testid="optimized" value={edited} onChange={(e) => setEdited(e.target.value)}
            placeholder="O resultado aparece aqui enquanto você digita. Você pode editar antes de copiar." rows={12} />
          {result && result.changes.length > 0 && (
            <div className="chips">{result.changes.map((c) => <span key={c.label} className="chip">{c.label}: {c.count}</span>)}</div>
          )}
          <button className="btn-primary btn-copy" onClick={copy} disabled={!edited}>{copied ? 'Copiado ✓' : '📋 Copiar prompt'}</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn-secondary" onClick={save} disabled={!result || saved}>{saved ? 'Salvo no histórico ✓' : 'Salvar no histórico'}</button>
      </div>
      <p className="muted small">Sem IA: regras fixas de reescrita. {counter.exact ? 'Tokens contados com o tokenizador oficial da OpenAI (o200k_base, GPT-4o e posteriores); outros modelos podem contar diferente.' : 'Contagem estimada até o tokenizador exato carregar.'}</p>
    </section>
  )
}
