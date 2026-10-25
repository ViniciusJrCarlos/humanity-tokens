import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/infrastructure/IndexedDb'
import { IndexedDbUserRepository } from '../src/infrastructure/IndexedDbUserRepository'
import { IndexedDbAnalysisRepository } from '../src/infrastructure/IndexedDbAnalysisRepository'
import { Analysis, PromptOptimizer, User } from '../src/domain'

describe('Repositórios IndexedDB', () => {
  it('salva e busca usuários e análises', async () => {
    const db = await openDatabase('test-db')
    const users = new IndexedDbUserRepository(db)
    await users.save(new User({ id: 'u1', email: 'a@b.c', name: 'A', passwordHash: 'h', passwordSalt: 's', mustChangePassword: true, provider: 'local', createdAt: '', updatedAt: '' }))
    expect((await users.findByEmail('a@b.c'))?.id).toBe('u1')
    expect(await users.count()).toBe(1)
    const repo = new IndexedDbAnalysisRepository(db)
    await repo.add(Analysis.fromResult('u1', new PromptOptimizer().optimize('Por favor, teste.', 'tecnico'), 'a1'))
    expect(await repo.listByUser('u1')).toHaveLength(1)
    await repo.delete('a1')
    expect(await repo.listByUser('u1')).toHaveLength(0)
  })
})
