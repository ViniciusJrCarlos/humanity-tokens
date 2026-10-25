import { beforeAll, describe, expect, it } from 'vitest'
import { Analysis, PromptOptimizer, StructuredPromptBuilder, TokenEstimator } from '../src/domain'
import type { TokenCounter } from '../src/domain'
import { TiktokenCounter } from '../src/infrastructure/TiktokenCounter'
import { AnalyzerService } from '../src/application/AnalyzerService'
import { ReportService } from '../src/application/ReportService'
import { MemoryAnalysisRepo, idGen } from './helpers'

let exact: TokenCounter
beforeAll(async () => { exact = await TiktokenCounter.load() })

describe('TiktokenCounter (o200k_base)', () => {
  it('conta tokens exatos conhecidos', () => {
    expect(exact.exact).toBe(true)
    expect(exact.count('')).toBe(0)
    expect(exact.count('hello world')).toBe(2)
    expect(exact.count('Olá, mundo!')).toBeGreaterThan(0)
  })
  it('estimador continua disponível como fallback', () => {
    expect(new TokenEstimator().exact).toBe(false)
  })
})

describe('StructuredPromptBuilder', () => {
  const b = new StructuredPromptBuilder()
  const text = 'Oi! você poderia me explicar como funciona a fotossíntese? sou professor do ensino fundamental. quero em tópicos curtos. não use termos técnicos. Obrigado desde já'
  it('monta as seções com instruções diretas e pontuação', () => {
    const out = b.build(text)
    expect(out).toContain('Papel:\nVocê é um professor experiente e didático.')
    expect(out).toContain('Tarefa:\n- Explique como funciona a fotossíntese.')
    expect(out).toContain('Contexto:\n- Sou professor do ensino fundamental.')
    expect(out).toMatch(/Formato de resposta:\n- .*tópicos curtos\./)
    expect(out).toContain('- Não use termos técnicos.')
    expect(out).not.toMatch(/obrigado|oi!/i)
  })
  it('detecta papel explícito', () => {
    expect(b.build('Aja como um revisor de textos. revisar o parágrafo abaixo')).toMatch(/^Papel:\nVocê é um revisor de textos\.\n\nTarefa:\n- Revise o parágrafo abaixo\./)
  })
  it('texto vazio ou só saudação não gera prompt', () => {
    expect(b.build('  ')).toBe('')
    expect(b.build('Olá! Obrigado')).toBe('')
  })
})

describe('Modos e diferença com sinal', () => {
  const opt = new PromptOptimizer()
  beforeAll(() => opt.useCounter(exact))
  it('estruturado pode aumentar tokens e isso não vira economia', () => {
    const r = opt.run('Explique a fotossíntese.', 'estruturado', 'humano')
    expect(r.mode).toBe('estruturado'); expect(r.tokenizer).toBe('o200k_base')
    expect(r.tokenDelta).toBeGreaterThan(0); expect(r.deltaPercent).toBeGreaterThan(0)
    expect(r.savingsPercent).toBe(0)
  })
  it('enxugar reduz e tem delta negativo', () => {
    const r = opt.run('Por favor, você poderia basicamente me explicar a fotossíntese a fim de entender?', 'enxugar', 'tecnico')
    expect(r.tokenDelta).toBeLessThan(0); expect(r.savingsPercent).toBe(-r.deltaPercent)
  })
  it('salvar usa o texto editado e reconta', async () => {
    const repo = new MemoryAnalysisRepo(); const svc = new AnalyzerService(opt, repo, idGen)
    const r = svc.preview('Por favor, explique a fotossíntese.', 'humano', 30, 'enxugar')
    const a = await svc.save('u', r, 'Explique a fotossíntese em 3 tópicos curtos para crianças.')
    expect(a.props.optimized).toContain('crianças')
    expect(a.props.optimizedTokens).toBe(exact.count(a.props.optimized))
  })
})

describe('Relatório com recontagem', () => {
  it('reconta análises antigas estimadas a partir do texto salvo e separa por modo', () => {
    const est = new PromptOptimizer() // estimativa (como na v1.0/v1.1)
    const old = Analysis.fromResult('u', est.optimize('Por favor, basicamente resuma este texto.', 'tecnico'), 'a1')
    const legacy = new Analysis({ ...old.props, tokenizer: undefined as any, mode: undefined as any })
    const noText = new Analysis({ ...old.props, id: 'a3', original: undefined as any, tokenizer: undefined as any })
    const ex = new PromptOptimizer(exact)
    const st = Analysis.fromResult('u', ex.structure('Explique a fotossíntese.'), 'a2')
    const r = ReportService.build([legacy, st, noText], exact, 0)
    expect(r.exactCount).toBe(2); expect(r.estimatedCount).toBe(1)
    expect(r.byMode.enxugar.analyses).toBe(2); expect(r.byMode.estruturado.analyses).toBe(1)
    expect(r.byMode.estruturado.tokensAdded).toBeGreaterThan(0)
    expect(r.byMode.enxugar.tokensOriginal).toBe(exact.count(legacy.props.original) + noText.props.originalTokens)
  })
})

describe('StructuredPromptBuilder — casos de borda', () => {
  it('"seja breve" é restrição, não papel', () => {
    const out = new StructuredPromptBuilder().build('Na verdade eu preciso que você me diga, no presente momento, quais são os três maiores rios do Brasil. Por favor seja breve.')
    expect(out).toContain('Papel:\n' + StructuredPromptBuilder.DEFAULT_ROLE)
    expect(out).toMatch(/Restrições:\n(- .*\n)*- Seja breve\./)
    expect(out).not.toContain('presente momento')
  })
})
