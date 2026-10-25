import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/AppContext'
import { PasswordPolicy } from '../../domain'
import { asset } from '../components/asset'

export function ChangePasswordPage() {
  const { services, user, setUser, logout } = useApp()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return <Navigate to="/login" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      setUser(await services.auth.changePassword(user.id, current, next, confirm))
      navigate('/', { replace: true })
    } catch (err: any) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="login-container">
      <img src={asset('pwa-192x192.png')} alt="" className="koala-round" />
      <h2>{user.mustChangePassword ? 'Crie sua senha' : 'Trocar senha'}</h2>
      {user.mustChangePassword && <p className="tagline">Você entrou com uma senha temporária. Defina uma senha pessoal para continuar.</p>}
      <form onSubmit={submit} className="login-card" aria-label="Trocar senha">
        <label>Senha atual (temporária)<input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></label>
        <label>Nova senha<input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required /></label>
        <label>Confirmar nova senha<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>
        <p className="hint">Mínimo {PasswordPolicy.MIN_LENGTH} caracteres, com letras e números.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>Salvar nova senha</button>
        <button type="button" className="btn-text" onClick={logout}>Sair</button>
      </form>
    </div>
  )
}
