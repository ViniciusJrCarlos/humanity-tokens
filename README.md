# Humanity Tokens

PWA para análise, otimização e humanização de prompts.
**Mais humano. Mais claro. Menos tokens.**

> Versão **1.1.2**: login local com usuários de teste, banco local (IndexedDB), contagem exata de tokens no padrão OpenAI (o200k_base), modos Enxugar e Prompt estruturado (sem IA), temas, perfil, configurações, relatórios comparativos e modelos favoritos.

- Oficial (branch `main`): https://viniciusjrcarlos.github.io/humanity-tokens/
- Prévia (branch `dev`): https://viniciusjrcarlos.github.io/humanity-tokens/preview/

A prévia tem banco, sessão e PWA próprios (scope `/humanity-tokens/preview/`), sem misturar dados com a oficial.

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

| Nome fictício | E-mail | Senha temporária |
|---|---|---|
| Ana Koala | teste@humanitytokens.app | Koala@2026 |
| Bruno Eucalipto | demo@humanitytokens.app | Koala@2026 |

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

## Novidades da v1.1.2

- **Tokens exatos**: contagem com `js-tiktoken` (vocabulário `o200k_base`, padrão OpenAI do GPT-4o em diante), carregado sob demanda e guardado no cache offline. Enquanto carrega, o app mostra uma estimativa marcada como tal.
- **Prompt estruturado** (sem IA): organiza o pedido em Papel, Tarefa, Contexto, Formato de resposta e Restrições, corrige pontuação/maiúsculas e transforma pedidos vagos em instruções diretas. Pode **aumentar** os tokens; o app mostra a diferença com sinal (+/−) e não chama aumento de economia.
- **Resultado editável** com botão grande "Copiar prompt" (copia o texto editado).
- **Relatórios**: original × resultado por modo (Enxugar / Estruturado) e por método (sem IA / com IA em breve). Análises antigas são recontadas com o tokenizador exato a partir do texto salvo.

## Funcionalidades (v1.1)
- Cabeçalho com nome/e-mail e menu do usuário (Perfil, Configurações, Sobre, Sair com confirmação). No celular: navegação inferior e menu em folha.
- Temas Sistema/Claro/Escuro/Suave e 6 cores de destaque (`domain/Preferences.ts`), salvos localmente.
- Perfil: editar nome e trocar senha. Configurações: tema, cor, exportar histórico (JSON/CSV) e limpar.
- Relatórios (Chart.js): pizza de uso × economia e linhas por dia, séries "sem IA" e "com IA (em breve)". Cada análise registra `method` (`heuristic` | `ai`).
- Analisador: copiar resultado e modelos de prompt favoritos.
- Sobre: versão lida do `package.json` e novidades (`presentation/changelog.ts`).

## PWA
- `start_url` e `scope` = `/humanity-tokens/`, com ícones 192/512, maskable, apple-touch-icon e favicon.
- Service worker (Workbox) faz cache do app para funcionar **offline**.
- Convite próprio de instalação ("Agora não" / "Instalar"). No iPhone aparecem as instruções do Safari (Compartilhar → Adicionar à Tela de Início).
- Rotas com `HashRouter` (`#/analyzer`), sem 404 no GitHub Pages.

## Deploy (GitHub Pages)
O workflow `.github/workflows/deploy.yml` roda a cada push na `main` ou na `dev`: faz o checkout das duas branches, testa a `dev` e monta um único site com `scripts/build-pages.sh` (a `main` na raiz e a `dev` em `/preview/`).
Em *Settings → Pages*, a origem precisa estar como **GitHub Actions**.

## Versionamento
- `dev`: desenvolvimento e prévias.
- `main`: o que está publicado.
- Tags de ponto de volta: `v1.0-preview`, `v1.0`, `v1.1`, `v1.1.2`… Para voltar: `git checkout v1.0` (ou reverter a `main` para a tag).

## Roadmap (do roteiro)
1. **MVP**: login Google + e-mail/senha, analisador, PWA, Drive do usuário (esta prévia cobre login local, analisador, PWA e histórico local).
2. Histórico completo no Drive, templates, comparador.
3. Integração com IA real.
4. Banco próprio (Azure) e Outlook.

## Futuro: Android / iOS
A base React pode ser empacotada com **Capacitor**.
