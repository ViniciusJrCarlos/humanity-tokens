import { FormEvent, useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { Avatar } from '../components/Avatar'
import { PasswordPolicy, User } from '../../domain'

export function ProfilePage() {
  const { services, user, setUser } = useApp()
  const [name, setName] = useState(user!.name)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const saveName = async (e: FormEvent) => {
    e.preventDefault()
    try { setUser(await services.auth.updateName(user!.id, name)); setNameMsg({ ok: true, text: 'Nome atualizado.' }) }
    catch (err: any) { setNameMsg({ ok: false, text: err.message }) }
  }
  const savePw = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setUser(await services.auth.changePassword(user!.id, pw.current, pw.next, pw.confirm))
      setPw({ current: '', next: '', confirm: '' }); setPwMsg({ ok: true, text: 'Senha alterada.' })
    } catch (err: any) { setPwMsg({ ok: false, text: err.message }) }
  }

  return (
    <section className="stack">
      <h2>Perfil</h2>
      <div className="card profile-head">
        <Avatar name={user!.name} size={64} />
        <div><b>{user!.name}</b><p className="muted small">{user!.email}</p><span className="badge">Conta de teste local</span></div>
      </div>
      <form className="card form" onSubmit={saveName} aria-label="Nome">
        <h3>Nome exibido</h3>
        <label>Nome<input value={name} maxLength={User.NAME_MAX} onChange={(e) => setName(e.target.value)} /></label>
        {nameMsg && <p className={nameMsg.ok ? 'success' : 'error'} role="status">{nameMsg.text}</p>}
        <button className="btn-primary" type="submit">Salvar nome</button>
      </form>
      <form className="card form" onSubmit={savePw} aria-label="Trocar senha">
        <h3>Trocar senha</h3>
        <label>Senha atual<input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></label>
        <label>Nova senha<input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
        <label>Confirmar nova senha<input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></label>
        <p className="hint">Mínimo {PasswordPolicy.MIN_LENGTH} caracteres, com letras e números.</p>
        {pwMsg && <p className={pwMsg.ok ? 'success' : 'error'} role="status">{pwMsg.text}</p>}
        <button className="btn-primary" type="submit">Alterar senha</button>
      </form>
    </section>
  )
}
