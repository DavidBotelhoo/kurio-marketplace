# Kurio · Marketplace de NFTs

Marketplace de NFTs em React e TypeScript: descoberta, compra e conta do colecionador, nos layouts desktop e mobile. API REST, autenticação, carteiras, pagamentos e eventos em tempo real rodam sobre uma API simulada com MSW, sem backend.

- Repositório: https://github.com/DavidBotelhoo/kurio-marketplace
- Demonstração: _(URL publicada no deploy)_
- Arquitetura, contratos e decisões: [ARCHITECTURE.md](ARCHITECTURE.md)
- Performance e Lighthouse: [docs/performance.md](docs/performance.md)

| Responsabilidade        | Tecnologia                                                     |
| ----------------------- | -------------------------------------------------------------- |
| Interface e linguagem   | React 19, TypeScript 6                                         |
| Build                   | Vite 8                                                         |
| Roteamento              | TanStack Router (rotas por arquivo, code splitting automático) |
| Estado remoto           | TanStack Query 5                                               |
| Cliente HTTP            | Axios                                                          |
| Tempo real              | socket.io-client                                               |
| Estilo e componentes    | Tailwind CSS 4, shadcn/ui (Radix)                              |
| Formulários e validação | React Hook Form, Zod (contratos compartilhados com os mocks)   |
| API simulada            | MSW 2 (REST) e @mswjs/socket.io-binding (Socket.IO)            |
| Testes                  | Playwright (E2E, regressão visual, axe)                        |
| Auditoria               | Lighthouse 13                                                  |

## Requisitos

- Node.js 22.19 ou superior (`.nvmrc`)
- pnpm 9 (`corepack enable` usa a versão de `packageManager`)
- Para testes e auditoria: o Chromium do Playwright (`pnpm exec playwright install chromium`)

## Setup

```sh
git clone https://github.com/DavidBotelhoo/kurio-marketplace.git
cd kurio-marketplace
corepack enable
pnpm install
pnpm dev            # http://localhost:5173, com a API simulada
```

Não há serviços externos: o checkout limpo roda com os valores versionados em `.env`.

## Variáveis de ambiente

Os padrões ficam em `.env` (versionado, sem segredos). Para sobrescrever localmente, copie `.env.example` para `.env.local`.

| Variável            | Padrão    | Uso                                                                                                                                   |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`      | `/api`    | Base da API REST usada pelo Axios.                                                                                                    |
| `VITE_REALTIME_URL` | _(vazio)_ | Origem do servidor Socket.IO; vazio usa a própria página, servida pelos mocks.                                                        |
| `VITE_ENABLE_MOCKS` | `true`    | `true` ativa a API simulada (MSW) no desenvolvimento, no build de demonstração e nos testes. `false` chama `VITE_API_URL` de verdade. |

O caminho do Socket.IO é fixo em `/realtime` (ver [ARCHITECTURE.md](ARCHITECTURE.md#transporte-e-limitações-no-ambiente-de-mocks)).

## Comandos

| Comando                             | O que faz                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`                          | Servidor de desenvolvimento com a API simulada e os devtools do Router e do Query. |
| `pnpm build`                        | Verificação de tipos e build de produção em `dist/` (mocks incluídos).             |
| `pnpm preview`                      | Serve `dist/` em http://localhost:4173.                                            |
| `pnpm typecheck`                    | `tsc -b` em app, testes e configs.                                                 |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (type-checked, React Hooks, jsx-a11y, regras do TanStack).                  |
| `pnpm format` / `pnpm format:check` | Prettier (com ordenação de classes Tailwind).                                      |
| `pnpm test:e2e`                     | Build, preview e suíte Playwright completa (desktop e mobile).                     |
| `pnpm test:e2e:ui`                  | Playwright em modo UI.                                                             |
| `pnpm test:e2e:report`              | Abre o relatório HTML da última execução (com traces das falhas).                  |
| `pnpm test:visual:update`           | Regrava as baselines de regressão visual.                                          |
| `pnpm audit:lighthouse`             | Build e auditoria Lighthouse (início e detalhe, mobile e desktop, 3 execuções).    |

## Credenciais fictícias

As contas são semeadas pela API simulada; as senhas existem apenas como hash PBKDF2 no banco simulado.

| Colecionador | E-mail             | Usuário        | Senha        |
| ------------ | ------------------ | -------------- | ------------ |
| Nova Ribeiro | `nova@kurio.test`  | `nova.ribeiro` | `Kurio@2026` |
| David Dev    | `david@kurio.test` | `david.dev`    | `Kurio@2026` |

Nova já tem duas carteiras cadastradas (principal e secundária). O painel de mocks também lista essas credenciais em "Usuários de teste".

Cupons: `LANCAMENTO10` (10%), `KURIO5` (0,05 ETH), `BLACKFRIDAY25` (expirado). Qualquer outro código é inválido.

## API simulada: cenários e reset

A camada de mocks intercepta a rede (service worker do MSW) e mantém um banco simulado no `localStorage`, consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos, e entre respostas REST e eventos Socket.IO. Ela é ativada por `VITE_ENABLE_MOCKS` e faz parte do build publicado.

### Painel de controle

O botão flutuante **"API simulada: <cenário>"**, no canto inferior esquerdo, abre o painel:

| Seção            | Controles                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cenário          | Escolha e aplicação de um cenário pré-definido.                                                                                                              |
| Rede             | Latência (sem latência, rápida, realista, lenta, fora de ordem) e modo sem conexão.                                                                          |
| Falhas injetadas | Falha por operação (HTTP 500, 503, 429, falha de conexão ou timeout), antes ou depois de processar, para a próxima requisição, as próximas 3 ou até remover. |
| Sessões          | Duração de novas sessões e "Expirar sessões agora".                                                                                                          |
| Tempo real       | Para um NFT: alterar preço, esgotar edição, repor estoque, reenviar o último evento, enviar um evento antigo e derrubar a conexão.                           |
| Carteira         | Resposta da extensão simulada (aprovar ou recusar) e "Desconectar carteiras".                                                                                |
| Pedidos          | Resultado dos próximos pagamentos, tempo pendente e "Liquidar pendentes agora".                                                                              |
| Dados            | **Restaurar dados** (recria o banco e encerra a sessão, mantendo o cenário) e **Restaurar tudo** (volta também ao cenário padrão).                           |

### Cenários pré-definidos

| Id                 | Cenário                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `default`          | Dados completos, latência realista (150–500 ms) e nenhuma falha.                                         |
| `instant`          | Respostas imediatas (usado pelos testes).                                                                |
| `slow-network`     | Todas as respostas levam de 1,8 a 3,5 s (skeletons visíveis).                                            |
| `out-of-order`     | Requisições ímpares da mesma operação levam 1,6 s e as pares 250 ms: a resposta antiga chega por último. |
| `offline`          | Todas as requisições falham por falta de conexão.                                                        |
| `empty-catalog`    | Nenhum NFT: buscas e destaques vazios.                                                                   |
| `catalog-error`    | A listagem responde HTTP 500 nas 3 primeiras tentativas e se recupera na nova tentativa do usuário.      |
| `short-session`    | Sessões expiram 60 s após o login.                                                                       |
| `wallet-rejected`  | A carteira simulada recusa as conexões.                                                                  |
| `payment-declined` | Novos pedidos ficam pendentes e são recusados.                                                           |
| `order-timeout`    | O primeiro pedido é criado, mas a resposta se perde (timeout).                                           |
| `slow-settlement`  | Pedidos ficam pendentes por 30 s.                                                                        |
| `server-errors`    | Todas as requisições respondem HTTP 500.                                                                 |

### Pela URL

Os parâmetros são lidos antes de o app iniciar e removidos da barra de endereço:

- `?mock-scenario=<id>` aplica um cenário (ex.: `/?mock-scenario=slow-network`).
- `?mock-reset` restaura os dados, sem trocar o cenário.
- `?mock-panel=0` esconde o painel (`?mock-panel=1` mostra).

Exemplo: `/carrinho?mock-scenario=payment-declined&mock-reset`.

Para scripts e testes, `window.__kurioMocks` expõe as mesmas operações do painel (cenários, falhas, sessões, eventos, pedidos) e um snapshot do banco.

## Como reproduzir os fluxos de falha

Cada roteiro parte de **Restaurar dados** (ou `?mock-reset`). Entre parênteses, a spec que automatiza o fluxo.

1. **Carregamento lento e skeletons:** aplique `slow-network` e abra o início, um NFT e o carrinho (`loading.spec.ts`).
2. **Falha e nova tentativa no catálogo:** aplique `catalog-error`; após os retries automáticos o catálogo mostra o erro, e "Tentar novamente" recupera (`loading.spec.ts`).
3. **Respostas fora de ordem:** aplique `out-of-order` e troque filtros rapidamente; só o resultado dos parâmetros atuais aparece (`loading.spec.ts`).
4. **Sem conexão e erros HTTP:** aplique `offline` ou `server-errors`, ou injete uma falha numa operação em "Falhas injetadas".
5. **Resultado vazio:** aplique `empty-catalog`, ou busque um termo inexistente e use "Limpar filtros" (`catalog.spec.ts`).
6. **NFT inexistente e edição esgotada:** abra `/nfts/nao-existe`; em `/nfts/obsidian-duke-738` todas as edições estão esgotadas e `/nfts/clover-regent-173` tem a última unidade de uma edição (`detail.spec.ts`).
7. **Cadastro com conflito:** em `/cadastro`, use `nova@kurio.test` ou o usuário `nova.ribeiro` (`auth.spec.ts`).
8. **Sessão expirada:** aplique `short-session`, entre e espere 60 s, ou use "Expirar sessões agora". A próxima ação privada leva ao login, que retoma o fluxo; no pagamento, o formulário volta preenchido (`auth.spec.ts`).
9. **Favorito com falha:** entre, injete uma falha em "Favoritos (incluir)" para a próxima requisição e favorite um NFT; o coração muda na hora e volta ao estado anterior com aviso (`favorites.spec.ts`).
10. **Cupom inválido ou expirado:** no carrinho, use `BLACKFRIDAY25` ou um código qualquer (`cart.spec.ts`).
11. **Carrinho do visitante ao entrar:** adicione itens sem login, recarregue e entre; os itens são mesclados ao carrinho da conta (`cart.spec.ts`).
12. **Preço ou estoque mudando durante a compra:** com um NFT no carrinho, use "Tempo real → Alterar preço" ou "Esgotar edição". O carrinho avisa e atualiza o resumo; com a revisão do pagamento aberta, os valores mudam e é preciso confirmar de novo; se a cotação ficou desatualizada no envio, a API rejeita o pedido (`QUOTE_OUTDATED`) e a revisão mostra os novos valores para uma nova confirmação (`realtime-checkout.spec.ts`).
13. **Carteira recusa ou desconecta:** aplique `wallet-rejected` antes de confirmar, ou use "Desconectar carteiras" com a revisão aberta.
14. **Pagamento recusado:** aplique `payment-declined` e conclua uma compra; o pedido termina recusado e o carrinho é preservado (`checkout-failures.spec.ts`).
15. **Clique repetido e timeout após criar o pedido:** clique várias vezes em confirmar; ou aplique `order-timeout`, confirme e use "Tentar novamente". Nos dois casos existe um único pedido (`checkout-failures.spec.ts`).
16. **Pedido pendente com recarga ou desconexão:** aplique `slow-settlement`, confirme uma compra e recarregue a página ou use "Derrubar conexão". O pedido é retomado sem nova compra e termina confirmado (`realtime.spec.ts`).
17. **Eventos duplicados ou antigos:** use "Reenviar último" ou "Enviar antigo" com um NFT aberto; o estado não regride e o aviso não se repete (`realtime.spec.ts`).

## Testes

`pnpm test:e2e` gera o build, sobe o preview na porta 4173 e roda a suíte nos projetos **desktop** (1440×900) e **mobile** (390×844, toque), no Chromium. Cada teste abre o app num contexto novo com `?mock-reset`, cenário `instant` e painel oculto. Latência, falhas, eventos e liquidação de pedidos são controlados pela camada de mocks; o relógio é controlado com `page.clock` onde importa (expiração de sessão). REST passa pelos handlers MSW e eventos pelo socket.io-client, sem tocar no estado do app.

| Spec                        | Cobertura                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `catalog.spec.ts`           | Busca, filtros combinados, ordenação, paginação, histórico, vazio e filtros mobile.    |
| `detail.spec.ts`            | Acesso direto, edição esgotada, limite de quantidade e NFT inexistente.                |
| `auth.spec.ts`              | Cadastro (validação e conflito), login, refresh, logout, troca de usuário e expiração. |
| `favorites.spec.ts`         | Login a partir do favorito, otimismo, rollback e persistência.                         |
| `cart.spec.ts`              | Quantidades, remoção com desfazer, cupons, refresh e carrinho do visitante.            |
| `purchase.spec.ts`          | Compra completa, do catálogo ao recibo confirmado.                                     |
| `checkout-failures.spec.ts` | Pagamento recusado, clique repetido e timeout com idempotência.                        |
| `account.spec.ts`           | Perfil, avatar, senha e carteiras com erros da API.                                    |
| `realtime-checkout.spec.ts` | Preço e disponibilidade mudando durante o checkout.                                    |
| `realtime.spec.ts`          | Duplicatas, eventos antigos, desconexão e pedido pendente após recarga.                |
| `accessibility.spec.ts`     | Teclado, foco em diálogos e drawers, erros associados e axe (WCAG A/AA) nas telas.     |
| `loading.spec.ts`           | Skeletons, falhas com nova tentativa e respostas fora de ordem.                        |
| `visual/visual.spec.ts`     | Regressão visual de início, detalhe, carrinho e pagamento (desktop e mobile).          |

As baselines visuais ficam em `tests/visual/visual.spec.ts-snapshots/` e foram geradas no macOS (sufixo `-darwin`): em outro sistema, gere as suas com `pnpm test:visual:update` antes de comparar. O relatório HTML fica em `playwright-report/`, com trace e screenshot das falhas.

## Lighthouse

`pnpm audit:lighthouse` audita o build de produção com o cenário padrão dos mocks (configuração versionada em `lighthouse.config.ts`). Relatórios HTML/JSON, medianas, versões e condições ficam em [docs/lighthouse/](docs/lighthouse/README.md); a análise, em [docs/performance.md](docs/performance.md).

## Estrutura

```text
src/
  routes/      rotas (arquivos do TanStack Router)
  features/    telas e domínio: api, queries, componentes por funcionalidade
  components/  layout, design system (shadcn/ui adaptado) e ícones
  contracts/   contratos REST e de eventos (Zod), compartilhados com os mocks
  lib/         cliente HTTP, cliente de tempo real, ETH decimal, utilitários
  mocks/       API simulada: handlers MSW, servidor Socket.IO, banco, cenários e painel
tests/         Playwright: e2e, visual e fixtures
scripts/       auditoria Lighthouse
docs/          relatórios e análise de performance
```

## Deploy

O build é estático (`dist/`). Em `vercel.json`, todas as rotas reescrevem para `index.html` (acesso direto e refresh funcionam) e `/assets` tem cache imutável. A API simulada roda no navegador, inclusive na versão publicada.
