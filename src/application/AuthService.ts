import { User, PasswordPolicy } from '../domain'
import type { PasswordHasher, SessionStore, UserRepository, SessionUser } from '../domain'
import { AuthError } from './errors'

/** Casos de uso de autenticação local (v1.0, apenas para testes). */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly session: SessionStore,
  ) {}

  async login(email: string, password: string): Promise<SessionUser> {
    const user = await this.users.findByEmail(User.normalizeEmail(email))
    // Mensagem genérica para não revelar se o e-mail existe.
    if (!user || !(await this.hasher.verify(password, user.passwordHash, user.passwordSalt))) {
      throw new AuthError('E-mail ou senha inválidos.')
    }
    this.session.set(user.id)
    return user.toSession()
  }

  async changePassword(userId: string, current: string, next: string, confirm: string): Promise<SessionUser> {
    const user = await this.users.findById(userId)
    if (!user) throw new AuthError('Sessão expirada. Entre novamente.')
    if (!(await this.hasher.verify(current, user.passwordHash, user.passwordSalt))) throw new AuthError('Senha atual incorreta.')
    if (next !== confirm) throw new AuthError('A confirmação não confere com a nova senha.')
    if (next === current) throw new AuthError('A nova senha precisa ser diferente da temporária.')
    const errors = PasswordPolicy.validate(next)
    if (errors.length) throw new AuthError(errors.join(' '))
    const { hash, salt } = await this.hasher.hash(next)
    user.changePassword(hash, salt)
    await this.users.save(user)
    return user.toSession()
  }

  async updateName(userId: string, name: string): Promise<SessionUser> {
    const user = await this.users.findById(userId)
    if (!user) throw new AuthError('Sessão expirada. Entre novamente.')
    try { user.rename(name) } catch (e: any) { throw new AuthError(e.message) }
    await this.users.save(user)
    return user.toSession()
  }

  async currentUser(): Promise<SessionUser | null> {
    const id = this.session.get()
    if (!id) return null
    const user = await this.users.findById(id)
    if (!user) { this.session.clear(); return null }
    return user.toSession()
  }

  logout(): void { this.session.clear() }
}
