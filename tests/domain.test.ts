import { describe, expect, it } from 'vitest'
import { PasswordPolicy, PromptOptimizer, TokenEstimator, User } from '../src/domain'

describe('TokenEstimator', () => {
  it('retorna 0 para texto vazio e cresce com o texto', () => {
    expect(TokenEstimator.estimate('   ')).toBe(0)
    expect(TokenEstimator.estimate('uma frase curta')).toBeLessThan(TokenEstimator.estimate('uma frase bem mais longa que a anterior, com vírgulas e mais palavras'))
  })
  it('conta palavras', () => expect(TokenEstimator.words(' a  b c ')).toBe(3))
})

describe('PromptOptimizer', () => {
  const opt = new PromptOptimizer()
  const text = 'Por favor, você poderia basicamente me explicar a fotossíntese a fim de que eu entenda muito muito bem? Na verdade quero algo simples.'

  it('remove preenchimento e repetições e economiza tokens', () => {
    const r = opt.optimize(text, 'tecnico')
    expect(r.optimized).not.toMatch(/por favor|basicamente|na verdade/i)
    expect(r.optimized).not.toMatch(/muito muito/)
    expect(r.optimized).toMatch(/para que/)
    expect(r.optimizedTokens).toBeLessThan(r.originalTokens)
    expect(r.savingsPercent).toBeGreaterThan(0)
  })
  it('modo humano mantém cortesia "por favor"', () => {
    expect(opt.optimize(text, 'humano').optimized.toLowerCase()).toContain('por favor')
  })
  it('remove frases duplicadas', () => {
    const r = opt.optimize('Seja breve. Use tópicos. Seja breve.', 'humano')
    expect(r.optimized).toBe('Seja breve. Use tópicos.')
  })
  it('custom com intensidade maior aplica mais regras', () => {
    const lo = opt.optimize(text, 'custom', 10), hi = opt.optimize(text, 'custom', 50)
    expect(hi.optimizedTokens).toBeLessThanOrEqual(lo.optimizedTokens)
  })
  it('não altera texto já enxuto', () => {
    expect(opt.optimize('Liste três capitais europeias.', 'tecnico').optimized).toBe('Liste três capitais europeias.')
  })
})

describe('PasswordPolicy e User', () => {
  it('valida força da senha', () => {
    expect(PasswordPolicy.validate('abc')).not.toHaveLength(0)
    expect(PasswordPolicy.validate('NovaSenha1')).toHaveLength(0)
  })
  it('troca de senha limpa a obrigação', () => {
    const u = new User({ id: '1', email: 'a@b.c', name: 'A', passwordHash: 'h', passwordSalt: 's', mustChangePassword: true, provider: 'local', createdAt: '', updatedAt: '' })
    u.changePassword('h2', 's2')
    expect(u.mustChangePassword).toBe(false)
    expect(u.toSession()).not.toHaveProperty('passwordHash')
    expect(User.normalizeEmail('  A@B.C ')).toBe('a@b.c')
  })
})
