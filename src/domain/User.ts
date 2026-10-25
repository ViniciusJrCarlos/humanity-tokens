/** Entidade de usuário. A senha nunca é guardada em texto puro, apenas o hash. */
export type AuthProvider = 'local' | 'google' | 'microsoft'

export interface UserProps {
  id: string
  email: string
  name: string
  passwordHash: string
  passwordSalt: string
  mustChangePassword: boolean
  provider: AuthProvider
  createdAt: string
  updatedAt: string
}

export class User {
  constructor(private props: UserProps) {}

  get id() { return this.props.id }
  get email() { return this.props.email }
  get name() { return this.props.name }
  get passwordHash() { return this.props.passwordHash }
  get passwordSalt() { return this.props.passwordSalt }
  get mustChangePassword() { return this.props.mustChangePassword }
  get provider() { return this.props.provider }

  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  changePassword(hash: string, salt: string): void {
    this.props = { ...this.props, passwordHash: hash, passwordSalt: salt, mustChangePassword: false, updatedAt: new Date().toISOString() }
  }

  toJSON(): UserProps { return { ...this.props } }

  toSession(): SessionUser {
    return { id: this.id, email: this.email, name: this.name, provider: this.provider, mustChangePassword: this.mustChangePassword }
  }
}

export interface SessionUser {
  id: string
  email: string
  name: string
  provider: AuthProvider
  mustChangePassword: boolean
}
