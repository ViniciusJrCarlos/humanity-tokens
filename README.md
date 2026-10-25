# Humanity Tokens

PWA para análise, otimização e humanização de prompts.
**Mais humano. Mais claro. Menos tokens.**

> Versão **v1.0 (prévia de testes)**: login local com usuários de teste, banco local no navegador (IndexedDB) e otimização heurística (sem IA).

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento: http://localhost:5173/humanity-tokens/
npm test           # testes unitários (vitest)
npm run build      # gera dist/
npm run preview    # serve o build: http://localhost:4173/humanity-tokens/
npm run icons      # regera os ícones do PWA a partir de assets/brand/app-icon.jpg
```

## Usuários de teste (fictícios)

| E-mail | Senha temporária |
|---|---|
| teste@humanitytokens.app | Koala@2026 |
| demo@humanitytokens.app | Koala@2026 |

No primeiro acesso a troca de senha é **obrigatória** (mín. 8 caracteres, letras e números).
As senhas ficam guardadas só como hash (PBKDF2-SHA256, 210 mil iterações, salt aleatório) no IndexedDB **do próprio aparelho**.
Cada navegador/celular tem seu próprio banco: a senha nova vale só naquele aparelho.
Para recomeçar do zero, limpe os dados do site no navegador.

> Atenção: autenticação 100% no navegador serve **apenas para testes**. Não use dados reais.

## Arquitetura (camadas, orientada a objetos)

```
src/
├── domain/            # Regras de negócio puras, sem dependência de React ou do navegador
│   ├── User.ts                 entidade de usuário (troca de senha, sessão)
│   ├── Analysis.ts             entidade de análise salva
│   ├── PasswordPolicy.ts       regras da nova senha
│   ├── TokenEstimator.ts       estimativa aproximada de tokens
│   ├── OptimizationLevel.ts    níveis Mais Humano / Mais Técnico / Custom e suas regras
│   ├── PromptOptimizer.ts      otimizador heurístico
│   └── repositories.ts         interfaces (UserRepository, AnalysisRepository, PasswordHasher, SessionStore)
├── application/       # Casos de uso
│   ├── AuthService.ts          login, troca obrigatória de senha, sessão, logout
│   ├── SeedService.ts          cria os usuários de teste
│   ├── AnalyzerService.ts      analisa e salva no histórico
│   └── HistoryService.ts       histórico e métricas do dashboard
├── infrastructure/    # Implementações concretas (trocáveis)
│   ├── IndexedDb*.ts           repositórios IndexedDB
│   ├── Pbkdf2PasswordHasher.ts hash com Web Crypto
│   ├── LocalSessionStore.ts    sessão (só o id do usuário)
│   └── container.ts            composição das dependências
└── presentation/      # React: páginas, componentes, hooks e CSS
    ├── pages/   Login, Troca de senha, Dashboard, Analisador, Histórico
    ├── components/  Header, rotas protegidas, convite de instalação do PWA
    └── hooks/   AppContext (injeção dos serviços), useInstallPrompt
```

Para trocar o armazenamento por **Google Drive** ou o login por **Firebase/Google/Microsoft**, basta criar novas classes que implementem as interfaces de `domain/repositories.ts` e registrá-las em `infrastructure/container.ts`. Domínio, casos de uso e telas não mudam.

### Analisador
Heurística honesta, **sem IA**: remove palavras de preenchimento ("basicamente", "na verdade"…), troca expressões longas por curtas ("a fim de" → "para"), elimina palavras e frases repetidas e, no modo Técnico, transforma pedidos em instruções diretas. A contagem de tokens é uma **estimativa** (média entre ~4 caracteres/token e palavras×1,3).
- **Mais Humano**: mantém cortesias como "por favor".
- **Mais Técnico**: remove cortesias e usa imperativo.
- **Custom**: a intensidade (10–50%) define quantas regras entram.

## PWA
- `start_url` e `scope` = `/humanity-tokens/`, com ícones 192/512, maskable, apple-touch-icon e favicon.
- Service worker (Workbox) faz cache do app para funcionar **offline**.
- Convite próprio de instalação ("Agora não" / "Instalar"). No iPhone aparecem as instruções do Safari (Compartilhar → Adicionar à Tela de Início).
- Rotas com `HashRouter` (`#/analyzer`), sem 404 no GitHub Pages.

## Deploy (GitHub Pages)
O workflow `.github/workflows/deploy.yml` roda testes e build e publica `dist/` a cada push na `main` (ou manualmente).
Em *Settings → Pages*, a origem precisa estar como **GitHub Actions**.

## Versionamento
- `dev`: desenvolvimento e prévias.
- `main`: o que está publicado.
- Tags de ponto de volta: `v1.0-preview`, `v1.0`, `v1.1`… Para voltar: `git checkout v1.0` (ou reverter a `main` para a tag).

## Roadmap (do roteiro)
1. **MVP**: login Google + e-mail/senha, analisador, PWA, Drive do usuário (esta prévia cobre login local, analisador, PWA e histórico local).
2. Histórico completo no Drive, templates, comparador.
3. Integração com IA real.
4. Banco próprio (Azure) e Outlook.

## Futuro: Android / iOS
A base React pode ser empacotada com **Capacitor**.
