import { describe, it, expect } from 'vitest'
import { StructuredPromptBuilder, CONFIRM_INSTRUCTION } from '../src/domain/StructuredPromptBuilder'

const REAL = 'Chat, referente a proxima atualização do projeto é possivel hospedarmos a ferramenta e e gerar um aplicativo android ou a pessoa usar na web mesmo porem como sabemos tem os custos de pagar hospedagem e banco de dados e se precisar de alguma i.a implementada tambem, nesse caso se for algo gratuito como teremos custos, tipo limitar o numero de usuarios mostrar que como o projeto nao vai ter anuncios deixar uma aba de donate ou contribua com projeto e mostrar temos 100 usuarios tipo um contador que se expirar ou o usuario ficar sem usar o app por um tempo ele perde o acesso e a pessoa que deixasse o cadastro fosse liberado e se nao responder o email enviado ele tambem volta pro final da fila tipo enquanto o projeto nao se pagar nao liberasse mais usuarios para usar a ferramenta, entende. O que expliquei??'

describe('v1.1.4 — prompt estruturado', () => {
  const b = new StructuredPromptBuilder()
  const p = b.parse(REAL)
  it('deduz o papel pelo tema', () => {
    expect(p.role).toContain('produto digital')
    expect(b.build('Crie um plano de postagens para o Instagram da minha loja.')).toContain('marketing digital')
    expect(b.build('Corrija este código em Python que dá erro.')).toContain('desenvolvedor de software')
    expect(b.build('Quais os três maiores rios do Brasil?')).toContain(StructuredPromptBuilder.DEFAULT_ROLE)
  })
  it('quebra texto longo em um tópico por ideia', () => {
    expect(p.task.length).toBeGreaterThanOrEqual(5)
    expect(p.task.every((t) => t.length < 200)).toBe(true)
    expect(p.task.join(' ')).not.toMatch(/^Chat,|e e /)
  })
  it('pergunta solta vira instrução de confirmação', () => {
    expect(p.task.join(' ')).not.toMatch(/expliquei|entende/i)
    expect(p.format).toContain(CONFIRM_INSTRUCTION)
    expect(b.build('Explique a fotossíntese. Entendeu?')).toContain(CONFIRM_INSTRUCTION)
  })
  it('"Seja breve" continua em Restrições e "agir como" vira papel', () => {
    const out = b.build('Você poderia, por gentileza, agir como um especialista em marketing digital? Crie um plano de postagens. Seja breve e objetivo.')
    expect(out).toContain('Papel:\nVocê é um especialista em marketing digital.')
    expect(out).toMatch(/Restrições:\n- Seja breve e objetivo\./)
  })
})
