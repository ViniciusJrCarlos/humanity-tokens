import { asset } from '../components/asset'
import { CHANGELOG } from '../changelog'

export function AboutPage() {
  return (
    <section className="stack">
      <h2>Sobre</h2>
      <div className="card about-head">
        <img src={asset('pwa-192x192.png')} alt="" />
        <div>
          <h3>Humanity Tokens</h3>
          <p className="muted">Mais humano. Mais claro. Menos tokens.</p>
          <p>Versão <b data-testid="app-version">{__APP_VERSION__}</b>{import.meta.env.VITE_STORAGE_PREFIX ? ' · prévia' : ''}</p>
        </div>
      </div>
      <div className="card">
        <h3>Novidades</h3>
        {CHANGELOG.map((c) => (
          <div key={c.version} className="changelog">
            <h4>v{c.version} · {c.title}</h4>
            <ul>{c.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="muted small">Otimização heurística, sem IA, com tokens estimados. A integração com IA está prevista no roadmap.</p>
    </section>
  )
}
