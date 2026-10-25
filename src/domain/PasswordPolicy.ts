/** Regras para a nova senha definida pelo usuário. */
export class PasswordPolicy {
  static readonly MIN_LENGTH = 8

  static validate(password: string): string[] {
    const errors: string[] = []
    if (password.length < PasswordPolicy.MIN_LENGTH) errors.push(`Use pelo menos ${PasswordPolicy.MIN_LENGTH} caracteres.`)
    if (!/[A-Za-z]/.test(password)) errors.push('Inclua pelo menos uma letra.')
    if (!/\d/.test(password)) errors.push('Inclua pelo menos um número.')
    return errors
  }
}
