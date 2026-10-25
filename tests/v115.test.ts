import { describe, it, expect } from 'vitest'
import { PromptOptimizer, StructuredPromptBuilder } from '../src/domain'

const O = 'Oi, tudo bem? Chat, eu preciso criar um site simples pra minha oficina mecânica porém não sei programar e queria que tivesse uma página com os serviços e os preços e também um botão de WhatsApp pra pessoa agendar, além disso seria bom ter fotos dos carros que já consertamos e nesse caso eu mesmo queria conseguir trocar as fotos sem mexer no código, tipo um painel fácil. Seja breve e use linguagem simples. Faz sentido?'

describe('v1.1.5 — Enxugar', () => {
  const o = new PromptOptimizer()
  it('remove saudação, vocativo e pergunta solta em todos os níveis', () => {
    for (const l of ['humano', 'tecnico', 'custom'] as const) {
      const r = o.optimize(O, l, 30)
      expect(r.optimized).not.toMatch(/tudo bem|Chat,|Faz sentido/)
      expect(r.savingsPercent).toBeGreaterThan(0)
    }
  })
  it('progressão: Humano < Técnico; Custom escala com a intensidade', () => {
    const h = o.optimize(O, 'humano').savingsPercent, t = o.optimize(O, 'tecnico').savingsPercent
    expect(t).toBeGreaterThan(h + 5)
    const c10 = o.optimize(O, 'custom', 10).savingsPercent, c50 = o.optimize(O, 'custom', 50).savingsPercent
    expect(c50).toBeGreaterThanOrEqual(c10); expect(c50).toBe(t)
    expect(o.optimize(O, 'tecnico').optimized).not.toMatch(/\b(tipo|nesse caso|além disso|eu mesmo)\b/)
  })
})

describe('v1.1.5 — Estruturado', () => {
  const b = new StructuredPromptBuilder(); const p = b.parse(O)
  it('papel de desenvolvedor web para iniciantes e contexto do usuário', () => {
    expect(p.role).toContain('desenvolvedor web')
    expect(p.context).toEqual(expect.arrayContaining(['Tenho uma oficina mecânica.', 'Não sei programar.']))
  })
  it('tarefas separadas, sem conectivo pendurado; painel unido à ideia anterior', () => {
    expect(p.task).toEqual(expect.arrayContaining(['Página com os serviços e os preços.', 'Painel fácil para eu trocar as fotos sem mexer no código.']))
    expect(p.task.some((t) => /WhatsApp/.test(t))).toBe(true)
    expect(p.task.every((t) => !/\s(e|ou)\.$/.test(t))).toBe(true)
  })
  it('restrições e formato só com instruções reais', () => {
    expect(p.constraints).toEqual(['Seja breve e use linguagem simples.'])
    expect(p.format.join(' ')).not.toMatch(/código/)
    expect(b.build(O)).toContain('Confirme o que entendeu')
  })
  it('"não use termos técnicos" continua restrição', () => {
    expect(b.parse('Explique a fotossíntese. Não use termos técnicos.').constraints).toEqual(['Não use termos técnicos.'])
  })
})
