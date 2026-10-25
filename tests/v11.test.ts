import { describe, expect, it } from 'vitest'
import { Analysis, HistoryExporter, Preferences, PromptOptimizer, PromptTemplate, User } from '../src/domain'
import { ReportService } from '../src/application/ReportService'
import { PreferencesService } from '../src/application/PreferencesService'
import { TemplateService } from '../src/application/TemplateService'
import { HistoryService } from '../src/application/HistoryService'
import { AuthService } from '../src/application/AuthService'
import { SeedService, TEST_USERS } from '../src/application/SeedService'
import { Pbkdf2PasswordHasher } from '../src/infrastructure/Pbkdf2PasswordHasher'
import { MemoryAnalysisRepo, MemoryPrefs, MemorySession, MemoryTemplateRepo, MemoryUserRepo, idGen } from './helpers'

const opt = new PromptOptimizer()
const mk = (userId: string, text: string, createdAt: string, method?: 'ai') => {
  const a = Analysis.fromResult(userId, opt.optimize(text, 'tecnico'), idGen())
  return new Analysis({ ...a.props, createdAt, ...(method ? { method } : {}) })
}

describe('User v1.1', () => {
  const u = () => new User({ id: '1', email: 'a@b.c', name: 'A', passwordHash: 'h', passwordSalt: 's', mustChangePassword: false, provider: 'local', createdAt: '', updatedAt: '' })
  it('renomeia com validação', () => {
    const x = u(); x.rename('  Ana   Koala ')
    expect(x.name).toBe('Ana Koala')
    expect(() => x.rename('  ')).toThrow()
    expect(() => x.rename('x'.repeat(61))).toThrow()
  })
  it('gera iniciais', () => {
    expect(User.initials('Ana Koala')).toBe('AK')
    expect(User.initials('bruno')).toBe('B')
  })
})

describe('Preferences', () => {
  it('padrão segue o sistema e valida valores', () => {
    const p = Preferences.from({ theme: 'neon', accent: 'xyz' })
    expect(p.theme).toBe('system'); expect(p.accent).toBe('azul')
    expect(p.resolve(true)).toBe('dark'); expect(p.resolve(false)).toBe('light')
    expect(p.with({ theme: 'soft' }).resolve(true)).toBe('soft')
    expect(p.with({ accent: 'roxo' }).accentHex).toBe('#7C3AED')
  })
  it('service persiste', () => {
    const store = new MemoryPrefs(); const s = new PreferencesService(store)
    s.update({ theme: 'dark' }); s.update({ accent: 'verde' })
    expect(store.load().toJSON()).toEqual({ theme: 'dark', accent: 'verde' })
  })
})

describe('Método da análise', () => {
  it('nova análise é heurística e registros antigos assumem heurística', () => {
    expect(opt.optimize('Por favor, teste.', 'humano').method).toBe('heuristic')
    const old = new Analysis({ ...mk('u', 'teste', '2026-01-01T12:00:00Z').props, method: undefined as any })
    expect(old.method).toBe('heuristic')
  })
})

describe('ReportService', () => {
  it('separa sem IA / com IA e agrupa por dia', () => {
    const items = [
      mk('u', 'Por favor, basicamente explique isso a fim de entender.', '2026-10-24T15:00:00Z'),
      mk('u', 'Na verdade, você poderia listar três frutas, por favor?', '2026-10-25T15:00:00Z'),
      mk('u', 'Por favor, basicamente resuma.', '2026-10-25T16:00:00Z', 'ai'),
    ]
    const r = ReportService.build(items, 180)
    expect(r.byMethod.heuristic.analyses).toBe(2)
    expect(r.byMethod.ai.analyses).toBe(1)
    expect(r.hasAiData).toBe(true)
    expect(r.daily.map((d) => d.day)).toEqual(['2026-10-24', '2026-10-25'])
    expect(r.daily[1].ai).toBeLessThan(0)
    expect(r.usagePercent).toBeGreaterThan(0); expect(r.usagePercent).toBeLessThan(100)
  })
  it('histórico vazio', () => {
    const r = ReportService.build([])
    expect(r.usagePercent).toBe(0); expect(r.daily).toEqual([]); expect(r.hasAiData).toBe(false)
  })
})

describe('Exportação e limpeza do histórico', () => {
  it('CSV escapa aspas, vírgulas e quebras de linha', () => {
    const a = mk('u', 'Diga "olá", mundo\nagora.', '2026-10-25T10:00:00Z')
    const csv = HistoryExporter.toCSV([a])
    expect(csv.split('\r\n')[0]).toBe(HistoryExporter.COLUMNS.join(','))
    expect(csv).toContain('"Diga ""olá"", mundo\nagora."')
    const json = JSON.parse(HistoryExporter.toJSON([a]))
    expect(json[0]).toMatchObject({ method: 'heuristic', level: 'tecnico' })
    expect(json[0]).not.toHaveProperty('userId')
  })
  it('limpa só o histórico do usuário', async () => {
    const repo = new MemoryAnalysisRepo(); const h = new HistoryService(repo)
    await repo.add(mk('u1', 'a', '2026-10-25T10:00:00Z')); await repo.add(mk('u2', 'b', '2026-10-25T10:00:00Z'))
    expect(await h.clear('u1')).toBe(1)
    expect(await h.list('u2')).toHaveLength(1)
    expect(await h.exportAs('u1', 'csv')).toBe(HistoryExporter.COLUMNS.join(','))
  })
})

describe('Modelos favoritos', () => {
  it('cria, lista em ordem e remove', async () => {
    const s = new TemplateService(new MemoryTemplateRepo(), idGen)
    await s.save('u', 'Resumo', 'Resuma em 3 tópicos.')
    const t = await s.save('u', '', 'Explique como para uma criança de 10 anos.')
    expect(t.title).toBe('Explique como para uma criança de 10 anos.'.slice(0, 40))
    expect((await s.list('u')).map((x) => x.title)[1]).toBe('Resumo')
    await s.remove(t.id); expect(await s.list('u')).toHaveLength(1)
    expect(() => PromptTemplate.create('x', 'u', 'a', '  ')).toThrow()
  })
})

describe('Perfil', () => {
  it('atualiza nome e semeia nomes fictícios, migrando nomes antigos', async () => {
    const users = new MemoryUserRepo(); const hasher = new Pbkdf2PasswordHasher(1000)
    const seed = new SeedService(users, hasher, idGen)
    await seed.ensureTestUsers([{ email: TEST_USERS[0].email, name: 'Usuário Teste', temporaryPassword: 'Koala@2026' }])
    await seed.ensureTestUsers()
    const u = await users.findByEmail(TEST_USERS[0].email)
    expect(u!.name).toBe('Ana Koala')
    const auth = new AuthService(users, hasher, new MemorySession())
    expect((await auth.updateName(u!.id, 'Ana K.')).name).toBe('Ana K.')
    await expect(auth.updateName(u!.id, ' ')).rejects.toThrow()
  })
})
