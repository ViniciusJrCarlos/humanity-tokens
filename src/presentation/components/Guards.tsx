import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../hooks/AppContext'
import { Header } from './Header'

/** Exige login e, se a senha for temporária, força a troca antes de qualquer tela. */
export function ProtectedLayout() {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />
  return (<><Header /><main className="container"><Outlet /></main></>)
}
