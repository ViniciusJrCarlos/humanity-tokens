import { User } from '../domain'
import type { PasswordHasher, UserRepository } from '../domain'

export interface SeedUser { email: string; name: string; temporaryPassword: string }

/**
 * Usuários de TESTE fictícios. A senha temporária é pública de propósito (documentada no README)
 * e precisa ser trocada no primeiro acesso. Nenhum dado real.
 */
export const TEST_USERS: SeedUser[] = [
  { email: 'teste@humanitytokens.app', name: 'Ana Koala', temporaryPassword: 'Koala@2026' },
  { email: 'demo@humanitytokens.app', name: 'Bruno Eucalipto', temporaryPassword: 'Koala@2026' },
]

const LEGACY_NAMES = ['Usuário Teste', 'Demo Koala']

export class SeedService {
  constructor(private readonly users: UserRepository, private readonly hasher: PasswordHasher, private readonly idGen: () => string) {}

  /** Cria os usuários de teste apenas se ainda não existirem. */
  async ensureTestUsers(seed: SeedUser[] = TEST_USERS): Promise<number> {
    let created = 0
    for (const s of seed) {
      const email = User.normalizeEmail(s.email)
      const existing = await this.users.findByEmail(email)
      if (existing) {
        // v1.0 usava nomes genéricos; dá o nome fictício novo sem mexer na senha.
        if (LEGACY_NAMES.includes(existing.name)) { existing.rename(s.name); await this.users.save(existing) }
        continue
      }
      const { hash, salt } = await this.hasher.hash(s.temporaryPassword)
      const now = new Date().toISOString()
      await this.users.save(new User({
        id: this.idGen(), email, name: s.name, passwordHash: hash, passwordSalt: salt,
        mustChangePassword: true, provider: 'local', createdAt: now, updatedAt: now,
      }))
      created++
    }
    return created
  }
}
