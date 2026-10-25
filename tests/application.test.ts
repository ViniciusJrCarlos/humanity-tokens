import { beforeEach, describe, expect, it } from 'vitest'
import { AuthService } from '../src/application/AuthService'
import { SeedService, TEST_USERS } from '../src/application/SeedService'
import { AnalyzerService } from '../src/application/AnalyzerService'
import { HistoryService } from '../src/application/HistoryService'
import { PromptOptimizer } from '../src/domain'
import { Pbkdf2PasswordHasher } from '../src/infrastructure/Pbkdf2PasswordHasher'
import { MemoryAnalysisRepo, MemorySession, MemoryUserRepo, idGen } from './helpers'

const hasher = new Pbkdf2PasswordHasher(1000)

describe('Pbkdf2PasswordHasher', () => {
  it('gera hash com salt e verifica', async () => {
    const a = await hasher.hash('segredo1'), b = await hasher.hash('segredo1')
    expect(a.hash).not.toBe(b.hash)
    expect(await hasher.verify('segredo1', a.hash, a.salt)).toBe(true)
    expect(await hasher.verify('errada', a.hash, a.salt)).toBe(false)
  })
})

describe('AuthService', () => {
  let users: MemoryUserRepo, auth: AuthService, session: MemorySession
  const { email, temporaryPassword } = TEST_USERS[0]
  beforeEach(async () => {
    users = new MemoryUserRepo(); session = new MemorySession()
    auth = new AuthService(users, hasher, session)
    await new SeedService(users, hasher, idGen).ensureTestUsers()
  })

  it('semeia usuários sem senha em texto puro e não duplica', async () => {
    expect(await users.count()).toBe(TEST_USERS.length)
    expect(await new SeedService(users, hasher, idGen).ensureTestUsers()).toBe(0)
    const u = await users.findByEmail(email)
    expect(JSON.stringify(u!.toJSON())).not.toContain(temporaryPassword)
  })
  it('login com senha temporária exige troca', async () => {
    const s = await auth.login(email.toUpperCase(), temporaryPassword)
    expect(s.mustChangePassword).toBe(true)
    expect(session.get()).toBe(s.id)
  })
  it('rejeita senha errada com mensagem genérica', async () => {
    await expect(auth.login(email, 'x')).rejects.toThrow('E-mail ou senha inválidos.')
    await expect(auth.login('ninguem@x.com', 'x')).rejects.toThrow('E-mail ou senha inválidos.')
  })
  it('troca de senha valida regras e libera acesso', async () => {
    const s = await auth.login(email, temporaryPassword)
    await expect(auth.changePassword(s.id, temporaryPassword, 'curta', 'curta')).rejects.toThrow()
    await expect(auth.changePassword(s.id, temporaryPassword, 'NovaSenha1', 'Outra123')).rejects.toThrow('confirmação')
    await expect(auth.changePassword(s.id, temporaryPassword, temporaryPassword, temporaryPassword)).rejects.toThrow('diferente')
    const after = await auth.changePassword(s.id, temporaryPassword, 'NovaSenha1', 'NovaSenha1')
    expect(after.mustChangePassword).toBe(false)
    auth.logout()
    await expect(auth.login(email, temporaryPassword)).rejects.toThrow()
    expect((await auth.login(email, 'NovaSenha1')).mustChangePassword).toBe(false)
  })
})

describe('AnalyzerService + HistoryService', () => {
  it('salva análises e calcula estatísticas reais', async () => {
    const repo = new MemoryAnalysisRepo()
    const analyzer = new AnalyzerService(new PromptOptimizer(), repo, idGen)
    const history = new HistoryService(repo)
    expect((await history.stats('u1')).totalAnalyses).toBe(0)
    await analyzer.analyzeAndSave('u1', 'Por favor, basicamente explique isso a fim de entender.', 'tecnico', 30)
    await analyzer.analyzeAndSave('u1', 'Liste três frutas.', 'humano', 30)
    await analyzer.analyzeAndSave('u2', 'Outro usuário.', 'humano', 30)
    const st = await history.stats('u1')
    expect(st.totalAnalyses).toBe(2)
    expect(st.tokensSaved).toBeGreaterThan(0)
    await expect(analyzer.analyzeAndSave('u1', '  ', 'humano', 30)).rejects.toThrow()
  })
})
