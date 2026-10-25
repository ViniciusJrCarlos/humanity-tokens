import { User } from '../domain'
import type { PasswordHasher, UserRepository } from '../domain'

export interface SeedUser { email: string; name: string; temporaryPassword: string }

/**
 * Usuários de TESTE fictícios. A senha temporária é pública de propósito (documentada no README)
 * e precisa ser trocada no primeiro acesso. Nenhum dado real.
 */
export const TEST_USERS: SeedUser[] = [
  { email: 'teste@humanitytokens.app', name: 'Usuário Teste', temporaryPassword: 'Koala@2026' },
  { email: 'demo@humanitytokens.app', name: 'Demo Koala', temporaryPassword: 'Koala@2026' },
]

export class SeedService {
  constructor(private readonly users: UserRepository, private readonly hasher: PasswordHasher, private readonly idGen: () => string) {}

  /** Cria os usuários de teste apenas se ainda não existirem. */
  async ensureTestUsers(seed: SeedUser[] = TEST_USERS): Promise<number> {
    let created = 0
    for (const s of seed) {
      const email = User.normalizeEmail(s.email)
      if (await this.users.findByEmail(email)) continue
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
