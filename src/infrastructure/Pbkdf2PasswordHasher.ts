import type { PasswordHasher } from '../domain'

const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/** Hash de senha com PBKDF2-SHA256 (Web Crypto), salt aleatório de 16 bytes. */
export class Pbkdf2PasswordHasher implements PasswordHasher {
  constructor(private readonly iterations = 210_000) {}

  async hash(password: string, salt?: string) {
    const saltBytes = salt ? fromB64(salt) : crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: this.iterations }, key, 256)
    return { hash: toB64(bits), salt: toB64(saltBytes) }
  }

  async verify(password: string, hash: string, salt: string) {
    const { hash: candidate } = await this.hash(password, salt)
    // comparação em tempo constante
    if (candidate.length !== hash.length) return false
    let diff = 0
    for (let i = 0; i < hash.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i)
    return diff === 0
  }
}
