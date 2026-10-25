import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/AppContext'
import { asset } from './asset'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { ConfirmDialog } from './ConfirmDialog'

export const NAV = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/analyzer', label: 'Analisar', icon: 'analyze' },
  { to: '/history', label: 'Histórico', icon: 'history' },
  { to: '/reports', label: 'Relatórios', icon: 'reports' },
]

/** Cabeçalho com navegação (PC) e menu do usuário com avatar (PC e celular). */
export function Header() {
  const { user, logout } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  if (!user) return null
  const go = (to: string) => { setOpen(false); navigate(to) }

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <img src={asset('pwa-192x192.png')} alt="" />
        <span>Humanity <b>Tokens</b></span>
      </Link>
      <nav className="top-nav" aria-label="Principal">
        {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>)}
      </nav>
      <div className="user-menu" ref={ref}>
        <button className="user-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Menu do usuário">
          <span className="user-text"><b data-testid="header-name">{user.name}</b><small>{user.email}</small></span>
          <Avatar name={user.name} />
        </button>
        {open && (
          <>
            <div className="sheet-backdrop" onClick={() => setOpen(false)} />
            <div className="menu" role="menu">
              <div className="menu-head">
                <Avatar name={user.name} size={44} />
                <div><b>{user.name}</b><small>{user.email}</small></div>
              </div>
              <button role="menuitem" onClick={() => go('/profile')}><Icon name="user" /> Perfil</button>
              <button role="menuitem" onClick={() => go('/settings')}><Icon name="settings" /> Configurações</button>
              <button role="menuitem" onClick={() => go('/about')}><Icon name="info" /> Sobre</button>
              <hr />
              <button role="menuitem" className="danger" onClick={() => { setOpen(false); setConfirm(true) }}><Icon name="logout" /> Sair</button>
            </div>
          </>
        )}
      </div>
      <ConfirmDialog open={confirm} title="Sair da conta?" message={`Você vai sair como ${user.name}. Seu histórico continua salvo neste aparelho.`}
        confirmLabel="Sair" danger onConfirm={() => { setConfirm(false); logout() }} onCancel={() => setConfirm(false)} />
    </header>
  )
}

/** Navegação inferior (apenas no celular, via CSS). */
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação inferior">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end}><Icon name={n.icon} size={22} /><span>{n.label}</span></NavLink>
      ))}
    </nav>
  )
}
