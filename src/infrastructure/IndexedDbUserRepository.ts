import { User } from '../domain'
import type { UserProps, UserRepository } from '../domain'
import { run } from './IndexedDb'

export class IndexedDbUserRepository implements UserRepository {
  constructor(private readonly db: IDBDatabase) {}

  async findByEmail(email: string) {
    const row = await run<UserProps | undefined>(this.db, 'users', 'readonly', (s) => s.index('email').get(email))
    return row ? new User(row) : null
  }
  async findById(id: string) {
    const row = await run<UserProps | undefined>(this.db, 'users', 'readonly', (s) => s.get(id))
    return row ? new User(row) : null
  }
  async save(user: User) { await run(this.db, 'users', 'readwrite', (s) => s.put(user.toJSON())) }
  count() { return run<number>(this.db, 'users', 'readonly', (s) => s.count()) }
}
