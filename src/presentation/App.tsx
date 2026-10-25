import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './hooks/AppContext'
import { ProtectedLayout } from './components/Guards'
import { InstallPrompt } from './components/InstallPrompt'
import { LoginPage } from './pages/LoginPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { AnalyzerPage } from './pages/AnalyzerPage'
import { HistoryPage } from './pages/HistoryPage'
import './App.css'

// HashRouter: funciona no GitHub Pages sem 404 ao recarregar rotas.
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/analyzer" element={<AnalyzerPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <InstallPrompt />
    </AppProvider>
  )
}
