import { NavLink } from 'react-router-dom'
import { useApp } from '../hooks/AppContext'
import { asset } from './asset'

export function Header() {
  const { user, logout } = useApp()
  return (
    <header className="app-header">
      <NavLink to="/" className="brand">
        <img src={asset('pwa-192x192.png')} alt="" />
        <span>Humanity <b>Tokens</b></span>
      </NavLink>
      <nav>
        <NavLink to="/" end>Início</NavLink>
        <NavLink to="/analyzer">Analisador</NavLink>
        <NavLink to="/history">Histórico</NavLink>
      </nav>
      <div className="user-box">
        <span className="user-name">{user?.name}</span>
        <button onClick={logout} className="btn-text">Sair</button>
      </div>
    </header>
  )
}
