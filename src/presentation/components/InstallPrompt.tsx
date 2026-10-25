import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { asset } from './asset'

export function InstallPrompt() {
  const { visible, canPrompt, isIos, install, dismiss } = useInstallPrompt()
  if (!visible) return null
  return (
    <div className="install-backdrop" role="dialog" aria-labelledby="install-title">
      <div className="install-card">
        <img src={asset('pwa-192x192.png')} alt="" className="install-icon" />
        <h3 id="install-title">Instalar o Humanity Tokens</h3>
        <p>Com um toque o app vai para a tela inicial e funciona mesmo sem internet.</p>
        {isIos && !canPrompt && (
          <ol className="install-steps">
            <li>Toque em <strong>Compartilhar</strong> (quadrado com seta) no Safari.</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
          </ol>
        )}
        <div className="install-actions">
          <button className="btn-text" onClick={dismiss}>Agora não</button>
          {canPrompt ? <button className="btn-primary" onClick={install}>Instalar</button>
            : <button className="btn-primary" onClick={dismiss}>Entendi</button>}
        </div>
      </div>
    </div>
  )
}
