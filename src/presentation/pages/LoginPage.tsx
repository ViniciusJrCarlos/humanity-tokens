import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/AppContext'
import { asset } from '../components/asset'

export function LoginPage() {
  const { services, user, setUser } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : '/'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const u = await services.auth.login(email, password)
      setUser(u)
      navigate(u.mustChangePassword ? '/change-password' : '/', { replace: true })
    } catch (err: any) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="login-container">
      <img src={asset('logo-login.jpg')} alt="Humanity Tokens" className="login-logo" />
      <p className="tagline">Mais humano. Mais claro. Menos tokens.</p>

      <form onSubmit={submit} className="login-card" aria-label="Entrar">
        <label>E-mail<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <div className="divider">ou</div>
        <button type="button" className="btn-google" onClick={() => setInfo('Login com Google chega na próxima versão (Firebase Auth + Google Drive). Por enquanto use o usuário de teste.')}>
          <span className="g">G</span> Continuar com Google
        </button>
        {info && <p className="info">{info}</p>}
      </form>

      <p className="pwa-note">🍃 PWA instalável · funciona offline no celular</p>
      <p className="version">v1.0 prévia · ambiente de testes</p>
    </div>
  )
}
