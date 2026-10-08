# Arquitetura

Como o Kurio está organizado, os contratos entre cliente e API, as políticas de sessão, carrinho, cache e tempo real, e as decisões, desvios e limitações da entrega. Setup e comandos estão no [README](README.md).

## Visão geral

```text
 rotas (TanStack Router)  →  features (telas, queries, mutations)  →  lib/api (Axios)  ─┐
                                    ↑ cache (TanStack Query)                            │ REST /api
                                    │                                                   ▼
 lib/realtime (socket.io-client) ───┘                     MSW: handlers → domínio → banco simulado
          │ WebSocket /realtime                                         ▲
          └──────────────→  servidor Socket.IO simulado (MSW ws) ───────┘ (mesmos dados)
```

- **Contratos** (`src/contracts`): schemas Zod de requisições, respostas, erros e eventos. A mesma definição valida as respostas no cliente, os formulários e as entradas dos handlers simulados.
- **Features** (`src/features/<domínio>`): cada domínio tem `api.ts` (chamadas Axios + validação do contrato), `query-keys.ts`, `queries.ts` (query options, mutations, invalidações) e componentes. As telas não conhecem URLs nem formatos de transporte.
- **Rotas** (`src/routes`): só configuração (search params, guards, loaders, pending/not-found); os componentes vêm das features e são carregados sob demanda.
- **Mocks** (`src/mocks`): handlers MSW, regras de domínio, banco persistido, servidor Socket.IO e painel de cenários. Componentes, hooks e o cliente Axios não têm respostas fictícias nem caminhos alternativos de negócio: o app só conversa com a rede.

## Rotas

| Caminho                                                                  | Tela                                                   | Acesso                             | Carregamento                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                                                                      | Início: destaques, catálogo, busca, filtros, ordenação | Público                            | Loader dispara catálogo e destaques sem bloquear; skeletons imediatos                                    |
| `/nfts/$nftId`                                                           | Detalhe (`?edition=` na URL)                           | Público                            | Loader aguarda o detalhe (404 vira "NFT não encontrado"); relacionados em paralelo; skeleton após 200 ms |
| `/carrinho`                                                              | Carrinho                                               | Público (visitante ou conta)       | Query do carrinho e da cotação                                                                           |
| `/login`, `/cadastro`                                                    | Autenticação (modal no desktop, página no mobile)      | Visitante; com sessão, redireciona | `?redirect=` (somente caminhos internos) e `?reason=expired\|required`                                   |
| `/pagamento`                                                             | Pagamento                                              | Sessão                             | Guard + carrinho, cotação e carteiras                                                                    |
| `/pedidos/$orderId`                                                      | Confirmação e recibo                                   | Sessão (dono)                      | Query do pedido + tempo real                                                                             |
| `/perfil`, `/perfil/carteiras`, `/perfil/favoritos`, `/perfil/atividade` | Perfil, carteiras, lista de interesse, histórico       | Sessão                             | Queries privadas                                                                                         |
| qualquer outro                                                           | "Página não encontrada"                                | Público                            | —                                                                                                        |

As rotas privadas ficam sob o layout sem caminho `_authenticated`, cujo `beforeLoad` revalida a sessão. Todas as rotas aceitam acesso direto e refresh (rewrite para `index.html` no deploy).

## Contratos REST

Base `VITE_API_URL` (`/api`), JSON. Os schemas e comentários de cada recurso estão em `src/contracts/*.ts`.

**Convenções**

- Sessão: `Authorization: Bearer <token>` (token opaco). Carrinho de visitante: `X-Guest-Cart: <uuid>`. Pedido: `Idempotency-Key: <uuid>`.
- Valores em ETH trafegam como strings decimais (`"1.19"`, até 18 casas) e são calculados em inteiros de 18 casas (`src/lib/eth.ts`), no cliente e nos mocks, sem ponto flutuante. Quantidades são inteiras.
- Recursos que mudam em tempo real (NFT, pedido) têm `version` monotônica, a mesma dos eventos.
- Listas de query string usam chaves repetidas (`?categories=a&categories=b`).

**Erros.** Toda resposta não-2xx tem o corpo `{ "error": { code, message, fields?, details? } }`. `code` é estável, `message` é um texto pt-BR de fallback e `fields` associa mensagens aos campos do formulário.

| HTTP            | `code`                                                                                               | Quando                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 400             | `VALIDATION_ERROR`                                                                                   | Query string inválida (ex.: preço mínimo maior que o máximo)                                   |
| 401             | `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS`                                          | Sem sessão, sessão expirada ou revogada, login inválido                                        |
| 403             | `WALLET_REJECTED` (`FORBIDDEN` reservado)                                                            | Conexão recusada na carteira                                                                   |
| 404             | `NOT_FOUND`                                                                                          | Recurso inexistente ou de outro colecionador (não revela existência)                           |
| 409             | `CONFLICT`, `AVAILABILITY_CONFLICT`, `QUOTE_OUTDATED`, `IDEMPOTENCY_CONFLICT`, `WALLET_DISCONNECTED` | Cadastro/slot em uso, estoque, cotação desatualizada, chave reutilizada, carteira desconectada |
| 422             | `VALIDATION_ERROR`                                                                                   | Corpo inválido, com `fields`                                                                   |
| 429 · 500 · 503 | `RATE_LIMITED` · `SERVER_ERROR` · `SERVICE_UNAVAILABLE`                                              | Falhas transitórias (retentáveis)                                                              |

No cliente, falhas sem resposta viram `NETWORK_ERROR`, `TIMEOUT` (10 s, via `AbortController`) ou `CANCELED`; respostas fora do contrato viram `INVALID_RESPONSE`. Todo erro chega às telas como `ApiError` com `code`, `status`, `fields` e `retryable`.

**Recursos**

| Recurso        | Método e caminho                                                                              | Resposta e erros principais                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessão e conta | `POST /auth/register`                                                                         | 201 `AuthResponse` · 409 `CONFLICT` (e-mail/usuário, em `fields`) · 422                                                                                                                                                                        |
|                | `POST /auth/login`                                                                            | 200 `AuthResponse` · 401 `INVALID_CREDENTIALS`                                                                                                                                                                                                 |
|                | `GET /auth/session`                                                                           | 200 `AuthResponse` · 401 `UNAUTHENTICATED` / `SESSION_EXPIRED`                                                                                                                                                                                 |
|                | `POST /auth/logout`                                                                           | 204 (idempotente)                                                                                                                                                                                                                              |
| NFTs           | `GET /nfts?q&categories&networks&minPrice&maxPrice&tab&sort&page&pageSize`                    | 200 `{ items, meta, facets }` (contagem por filtro e faixa de preço) · 400                                                                                                                                                                     |
|                | `GET /nfts/highlights`                                                                        | 200 `{ hero, featured }`                                                                                                                                                                                                                       |
|                | `GET /nfts/:nftId` · `GET /nfts/:nftId/related`                                               | 200 `NftDetail` (edições, galeria, avaliações) · 404                                                                                                                                                                                           |
| Favoritos      | `GET /favorites` · `PUT /favorites/:nftId` · `DELETE /favorites/:nftId`                       | 200 lista · 200 item · 204 (inclusão e remoção idempotentes) · 404                                                                                                                                                                             |
| Carrinho       | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:itemId` · `DELETE /cart/items/:itemId` | 200 `CartResponse` (linhas, limites, avisos) · 409 `AVAILABILITY_CONFLICT` (com a disponibilidade em `details`) · 404 · 422                                                                                                                    |
|                | `POST /cart/merge` (Bearer + `X-Guest-Cart`)                                                  | 200 `{ cart, mergedLines, adjustments }` (idempotente)                                                                                                                                                                                         |
| Cotação        | `PUT /cart/coupon` · `DELETE /cart/coupon`                                                    | 200 `CartResponse` · 422 (`fields.code`: cupom inválido ou expirado)                                                                                                                                                                           |
|                | `POST /cart/quote`                                                                            | 200 `Quote`: disponibilidade, subtotal, desconto, taxa por rede, total, `purchasable`, `issues`, validade de 10 min                                                                                                                            |
| Pedidos        | `POST /orders` (`Idempotency-Key`)                                                            | 201 pedido `pending` · 200 mesmo pedido (mesma chave e corpo, `Idempotent-Replayed: true`) · 409 `IDEMPOTENCY_CONFLICT` / `QUOTE_OUTDATED` (com nova cotação) / `CONFLICT` (cotação já usada, `details.orderId`) / `WALLET_DISCONNECTED` · 422 |
|                | `GET /orders` · `GET /orders/:orderId`                                                        | 200 (mais recentes primeiro) · 404                                                                                                                                                                                                             |
| Perfil         | `GET /profile` · `PATCH /profile`                                                             | 200 `User` · 409 `CONFLICT` · 422                                                                                                                                                                                                              |
|                | `PUT /profile/avatar` · `DELETE /profile/avatar`                                              | 200 `User` · 422 (tipo ou tamanho)                                                                                                                                                                                                             |
|                | `POST /profile/password`                                                                      | 204 (encerra as outras sessões) · 422 (`fields.currentPassword`)                                                                                                                                                                               |
| Carteiras      | `GET /wallets` · `POST /wallets` · `PATCH /wallets/:walletId`                                 | 200/201 `Wallet` (principal e secundária) · 409 (slot ocupado) · 404 · 422                                                                                                                                                                     |
|                | `POST /wallet-connections` · `GET` · `DELETE /wallet-connections/:id`                         | 201 conexão · 403 `WALLET_REJECTED` · 404 (desconectada) · 204                                                                                                                                                                                 |

## Eventos em tempo real

Socket.IO no namespace padrão, transporte WebSocket, caminho `/realtime`, com o token da sessão em `auth` no handshake.

| Direção            | Mensagem                    | Payload                                                                                                                                    |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Cliente → servidor | `subscribe` / `unsubscribe` | Lista de tópicos: `nft:<id>` (público), `order:<id>` (só o dono)                                                                           |
| Servidor → cliente | `nft.updated`               | `{ id, type, resource: { type: "nft", id }, version, occurredAt, data: { changes, priceEth, compareAtPriceEth, availability, editions } }` |
| Servidor → cliente | `order.updated`             | Mesmo envelope, `resource.type: "order"`, `data`: o pedido completo                                                                        |

Os eventos carregam o **estado atual** do recurso, não um delta: aplicar duas vezes não muda nada, e uma versão menor ou igual à do cache é ignorada.

**Cliente** (`src/lib/realtime/client.ts`)

- Valida cada payload contra o contrato e descarta os inválidos.
- Descarta duplicatas por `id` (últimos 500) antes dos listeners, então avisos e toasts não se repetem; as atualizações de cache ainda comparam `version`.
- Tópicos com contagem de referências: cada tela assina o que mostra (cards visíveis, detalhe, carrinho, favoritos, pedidos pendentes) e libera ao desmontar; na reconexão, os tópicos ativos são reenviados.
- Um socket por sessão: login, logout ou troca de usuário fecham a conexão anterior e removem os listeners, então eventos atrasados da sessão antiga não chegam ao novo usuário. O servidor recusa `order:<id>` de quem não é o dono.
- Interrupções mostram "Reconectando…" e, ao voltar, "Conexão em tempo real restabelecida".

### Transporte e limitações no ambiente de mocks

O servidor é emulado no navegador: o MSW intercepta o WebSocket, e o `@mswjs/socket.io-binding` codifica e decodifica os pacotes Socket.IO. O binding não tem salas, broadcast nem heartbeat, então `src/mocks/realtime/server.ts` acrescenta registro de conexões e tópicos, pings Engine.IO (sem eles o cliente cai a cada ~30 s), leitura do token no pacote CONNECT, verificação de tópicos privados e um log de eventos para reenviar duplicatas ou versões antigas nos testes.

- **Só WebSocket:** o long-polling HTTP do Engine.IO não é interceptado, então o cliente usa `transports: ['websocket']`.
- **Caminho `/realtime`:** o MSW remove o prefixo `/socket.io` ao casar URLs, o que capturaria também o WebSocket de HMR do Vite.
- **Ordem de carga:** o Engine.IO captura o `WebSocket` global ao ser avaliado, então o `socket.io-client` só carrega depois que o MSW está ativo (`lib/realtime/transport.ts`, após o request gate).
- **Uma aba por servidor:** cada aba tem sua instância do servidor simulado. O banco é compartilhado entre abas (`localStorage` + evento `storage`), mas eventos só chegam às conexões da aba que gerou a mudança; as outras se atualizam por REST (foco, reconexão, navegação). A liquidação de pedidos usa Web Locks para que duas abas não liquidem o mesmo pedido.

## Reconciliação REST × Socket.IO

- **REST é a fonte da verdade.** Eventos atualizam o cache onde isso é seguro (preço e disponibilidade em listas, destaques, relacionados, favoritos e detalhe, sempre comparando `version`). Listas filtradas são marcadas como desatualizadas sem refetch imediato, porque um novo preço pode mudar a página a que o NFT pertence.
- **Carrinho e cotação** não são remendados: um `nft.updated` mais novo que a versão da linha refaz a consulta do carrinho e da cotação, e o usuário vê o que mudou (preço, esgotado, quantidade ajustada).
- **Reconexão:** todas as queries ativas são invalidadas e refeitas, e os pedidos pendentes da sessão são relidos por `GET /orders/:id`, para cobrir eventos perdidos durante a queda.
- **Pedido pendente:** o id fica em `sessionStorage` (`pendingOrders`) até um estado terminal. Após recarregar, o app reassina `order:<id>` e consulta o pedido. Confirmado e recusado são terminais: eventos posteriores não mudam o pedido.
- **Checkout:** a cotação revisada tem `id`. Se a cotação muda com a revisão aberta, os valores são atualizados e o botão exige nova confirmação. Se mudou entre a revisão e o envio, a API responde `QUOTE_OUTDATED` com a nova cotação e a revisão reabre com as diferenças.

## Política de sessão

- **Armazenamento:** o `localStorage` guarda só `{ token, userId, expiresAt }`; os dados do usuário vêm de `GET /auth/session` (query por token). Senhas não são armazenadas em claro: o banco simulado guarda apenas hash PBKDF2-SHA256 com sal.
- **Refresh:** a sessão é restaurada do token e revalidada pela API. Um token recusado é esquecido.
- **Rotas privadas:** o `beforeLoad` de `_authenticated` revalida a sessão a cada entrada (`staleTime: 0`, requisições concorrentes compartilhadas) e, sem sessão, redireciona para `/login?redirect=<href>&reason=…`. Depois do login o fluxo volta ao mesmo lugar, com os search params. O `redirect` aceita apenas caminhos internos (sem open redirect).
- **Expiração durante a navegação ou o checkout:** qualquer 401 de uma requisição autenticada passa por um único handler. Ele ignora respostas atrasadas de um token que já não é o atual, avisa "Sua sessão expirou", leva ao login preservando o destino e limpa a sessão. O formulário de pagamento é salvo como rascunho em `sessionStorage` e volta preenchido; uma tentativa de pedido em andamento é retomada com a mesma chave.
- **Logout, troca de usuário e outras abas:** quando o usuário da sessão muda, por qualquer motivo, todas as queries privadas são canceladas e removidas, e o socket é recriado com o novo token. A mudança feita em outra aba é espelhada pelo evento `storage` e reexecuta os guards.
- **Alteração de senha** encerra as outras sessões do colecionador.

## Estado do carrinho

- **Dono:** com sessão, o carrinho é do colecionador (`Bearer`); sem sessão, é um carrinho de visitante na API, identificado por um UUID criado antes da primeira inclusão e guardado em `localStorage` (`X-Guest-Cart`). Os dois sobrevivem a refresh porque vivem na API simulada, não na memória.
- **Mescla ao entrar:** a primeira consulta do carrinho da conta com um carrinho de visitante pendente chama `POST /cart/merge`. As linhas são somadas, ajustadas ao limite disponível e o carrinho de visitante é apagado (operação idempotente; funciona também se o login ocorreu em outra aba). O usuário é avisado, inclusive de ajustes de quantidade.
- **Escritas:** todas as mutations do carrinho compartilham um `scope` e chegam à API na ordem em que foram feitas. Cada resposta substitui o carrinho no cache, e consultas em andamento são canceladas antes para não sobrescrever o estado novo. A API decide disponibilidade, limites e preços; o cliente só exibe. `AVAILABILITY_CONFLICT` ou `NOT_FOUND` refazem o carrinho para mostrar o estado real.
- **Cotação:** fica sob a chave do carrinho (invalidar o carrinho reprecifica), é refeita a cada escrita e quando expira (10 min). O resumo (subtotal, desconto, taxa de rede, total) vem sempre dela, e o checkout só confirma com uma cotação `purchasable`.
- **Após a compra:** a API remove do carrinho apenas os itens e quantidades comprados, e o cupom; em falha ou recusa, nada é removido.

## Estratégia de cache

Configuração em `src/lib/query-client.ts`:

| Política         | Valor                                                                                      | Motivo                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `staleTime`      | 30 s (sessão: 60 s; destaques: 5 min)                                                      | Navegação rápida sem dados velhos por muito tempo                                                           |
| `gcTime`         | 5 min                                                                                      | Voltar a uma tela reaproveita o cache                                                                       |
| Retries de query | Até 2, backoff exponencial (0,5–4 s), só para erros transitórios (rede, timeout, 429, 5xx) | 4xx falha na hora                                                                                           |
| `retryOnMount`   | `false`                                                                                    | Uma query que já falhou não é refeita só porque um componente montou; o usuário decide ("Tentar novamente") |
| Foco e reconexão | Refetch das queries ativas                                                                 | Volta a sincronizar ao retornar à aba ou à rede                                                             |
| Mutations        | Sem retry automático                                                                       | Evita efeitos duplicados; pedidos usam chave de idempotência                                                |

**Chaves e isolamento.** Dados públicos usam chaves por parâmetro (`['nfts', 'list', params]`, `['nfts', 'detail', id]`), então cada combinação de filtros tem sua entrada e uma resposta atrasada nunca sobrescreve outra. Dados privados ficam sob `['private', userId, …]` (carrinho da conta, favoritos, pedidos, carteiras, conexões) e são removidos de uma vez quando a sessão termina ou muda. A sessão é chaveada pelo token.

**Cancelamento e respostas obsoletas.** O `signal` do TanStack Query vai até o Axios: mudar busca, filtro ou página cancela a requisição anterior. A lista usa `keepPreviousData` para manter a página atual enquanto a próxima carrega. A busca tem debounce de 350 ms e substitui a entrada do histórico enquanto o usuário digita.

**Invalidação após mutations e eventos**

| Origem                           | Efeito                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escrita no carrinho ou cupom     | Carrinho substituído pela resposta; cotação invalidada                                                                                            |
| Favorito                         | Atualização otimista; refetch quando o último toggle concorrente termina                                                                          |
| Pedido criado ou `order.updated` | Pedido gravado no cache se a versão for mais nova; histórico invalidado; pedido confirmado invalida o carrinho (a API removeu os itens comprados) |
| Perfil e avatar · carteiras      | Resposta grava no perfil e no usuário da sessão (header, checkout) · na lista de carteiras                                                        |
| `nft.updated`                    | Patch por versão nas views do NFT; listas marcadas como desatualizadas; carrinho e cotação refeitos se o NFT estiver no carrinho                  |
| Reconexão do socket              | Todas as queries ativas refeitas; pedidos pendentes relidos                                                                                       |

**Atualização otimista.** O favorito muda no cache antes da requisição. Em falha, só aquele NFT volta ao estado anterior, preservando toggles concorrentes de outros NFTs, e o usuário é avisado. Toggles do mesmo NFT compartilham um `scope` e chegam à API na ordem dos cliques. O catálogo também aplica os controles de filtro de forma otimista (`useOptimistic`) enquanto a navegação conclui.

**Estado na URL.** Busca, categorias, redes, faixa de preço, aba, ordenação e página do catálogo vivem nos search params de `/` (valores padrão omitidos), validados na rota, e sobrevivem a refresh e histórico. Mudar um filtro reinicia a paginação. A edição selecionada no detalhe também fica na URL (`?edition=`).

## Checkout e pedidos

- **Revisão:** o envio do formulário valida os campos (React Hook Form + o schema do contrato), conecta a carteira selecionada (conexão simulada, que pode ser aprovada, recusada ou desconectada) e reprecifica a cotação antes de abrir o diálogo de revisão.
- **Idempotência:** cada confirmação cria uma tentativa com `Idempotency-Key` própria, guardada em `sessionStorage` até a API responder. Timeout, falha de rede, clique repetido ou recarga reenviam a mesma tentativa, e a API devolve o mesmo pedido. A mesma chave com outro corpo gera `IDEMPOTENCY_CONFLICT`.
- **Estados:** `pending` → `confirmed` | `rejected`. A página do pedido mostra pendente, confirmado (recibo) ou recusado (carrinho preservado); o recibo só aparece para pedido confirmado pela simulação.
- **Recibo:** o pedido guarda um snapshot de itens, subtotal, cupom e desconto, taxa de rede, total, dados do colecionador, carteira e rede, e a transação simulada (hash e link do explorador). Mudanças posteriores no catálogo não o alteram.

## Camada de mocks (MSW)

- **Uma API para todos os ambientes:** os mesmos handlers servem `pnpm dev`, o build publicado e os testes. Cada rota declara uma operação (`nfts.list`, `orders.create`, …) e passa pelas mesmas condições de rede antes e depois do resolver: modo offline, latência determinística (semente fixa) e regras de falha. Uma regra "após processar" aplica a operação e perde a resposta, que é o cenário de timeout com idempotência.
- **Domínio único:** catálogo, favoritos, carrinho, cotação, perfil, carteiras e pedidos compartilham um banco em memória, persistido em `localStorage` e semeado de fixtures determinísticas: 36 NFTs, 8 categorias, 3 redes, 4 tipos de edição, 2 usuários, 3 cupons. As mudanças feitas pelo painel ou pelo domínio (preço, estoque, liquidação de pedido) passam pela mesma camada que responde ao REST e publica os eventos.
- **Cenários e reset:** cenários pré-definidos (`src/mocks/config.ts`), seleção pelo painel ou por `?mock-scenario=`, e reset que restaura o banco semeado e limpa todas as chaves `kurio.*` do app. Lista completa no [README](README.md#api-simulada-cenários-e-reset).
- **Senhas:** hash PBKDF2-SHA256 (Web Crypto) com sal, nas fixtures e no banco persistido.
- **Service worker reiniciado:** o navegador encerra service workers ociosos (por exemplo, numa aba em segundo plano), e o worker do MSW reiniciado não sabe mais quais abas o ativaram, deixando as requisições irem para a rede, onde o host estático responde `index.html`. Antes de cada requisição, o request gate confirma que o worker ainda atende a aba; se a última confirmação tem mais de 5 s ou a aba ficou oculta, ela se anuncia de novo com a mensagem `MOCK_ACTIVATE` do próprio MSW e espera a resposta, sem recarregar a página.

## Acessibilidade

- Link "Pular para o conteúdo", foco visível em todos os controles e, a cada troca de página, foco no título da nova página (filtros e paginação mantêm o foco).
- Diálogos e drawers (Radix): foco inicial, foco preso, Escape e devolução do foco ao gatilho.
- Formulários com labels (inclusive onde o layout só mostra placeholder), erros associados por `aria-describedby` e foco no primeiro campo inválido; erros da API aparecem no campo correspondente.
- Mutations e eventos em tempo real anunciados por regiões `status` e toasts (preço alterado, edição esgotada, pedido confirmado, reconexão).
- Skeletons com shimmer e dimensões finais; animações respeitam `prefers-reduced-motion`.
- Imagens de NFT com texto alternativo descritivo; imagens decorativas com `alt=""`.
- A galeria mobile é uma região rolável focável por teclado.
- Verificação automatizada com axe (WCAG A/AA) em todas as telas, nos dois viewports.

Ajustes em relação ao layout:

- Pontos de paginação do carrossel com 12 px de espaço (Figma: 8 px), para que os centros fiquem a 24 px (WCAG 2.5.8).
- Pontos do hero com 24 px entre centros (Figma: 16 px), pelo mesmo motivo; o grupo fica centrado na posição do Figma.
- Pontos da galeria mobile são indicador de posição, não botões: com 7 px e 7 px de espaço não atingem o tamanho mínimo de alvo. As vistas mudam por swipe ou pelas setas, com a galeria focada.
- Bordas dos campos mantidas com a cor do Figma (contraste ~1,34:1 com o fundo). Os campos são identificados pelo label e pelo placeholder, e foco e erro usam bordas de alto contraste.

## Decisões de UX

- Login e cadastro são um modal sobre o início no desktop e uma página no mobile, como no Figma. Concluir leva ao destino do `redirect`; fechar o modal volta à página de origem (ou ao início, se ela for privada).
- Ações fora do escopo (páginas editoriais, suporte, ofertas, downloads, login social) existem no layout, mas mostram "não está disponível nesta demonstração" e nunca simulam sucesso.
- Busca: no desktop, a lupa do header (como no Figma) abre o campo de busca em qualquer página; digitar atualiza o catálogo do início e rola até os resultados, Enter fecha o campo. No celular e no tablet, a barra "Explorar coleções" fica no topo do início, como no frame mobile.
- Filtros ativos aparecem como chips removíveis acima dos resultados (não estão no Figma), com "Limpar filtros".
- O "NFT em destaque" exibe nome e preço sobre a arte (não estão no Figma): sem eles, a oferta não diria o que nem quanto.
- Remoção de item do carrinho com "Desfazer".
- O carrossel do hero troca de destaque pelos pontos ou arrastando a arte (toque, caneta ou mouse); o gesto não abre o NFT e o scroll vertical da página continua funcionando. Não há rotação automática.
- Os carrosséis com rolagem (relacionados, recomendações do carrinho, galeria mobile) rolam nativamente com toque, trackpad e teclado, e também podem ser arrastados com o mouse: ao soltar, assentam no item mais próximo, e um arraste nunca abre o card.
- Mudanças em tempo real piscam o valor alterado (sem animação com movimento reduzido) e são anunciadas.
- Telas sem frame (confirmação mobile, perfil e carteiras no mobile, estados de erro, vazio e carregamento, revisão do pedido, estados de conexão da carteira) seguem os componentes e tokens do design.

## Desvios do Figma

- Detalhe: os valores de "Contrato" e "Direitos autorais" estavam trocados no Figma; foram corrigidos.
- O arquivo tem só 4 ilustrações (`design/assets/images`). Os 36 NFTs das fixtures as reutilizam, e os relacionados podem repetir a arte do NFT aberto.
- Detalhe desktop: a linha de disponibilidade da edição (que não existe no Figma) fica ao lado dos chips, para a coluna de compra ocupar a mesma altura da galeria.
- Detalhe mobile: inclui seções do desktop que o frame mobile não tem (abas de informações e relacionados), além da linha de status da edição (disponibilidade e limite por pedido).
- Carrinho: chip da edição em cada linha; desconto sempre exibido no resumo (`(-) 0.00 ETH` sem cupom); posição do ícone de lixeira ajustada no mobile; recomendações só a partir de 768 px.
- Pagamento: seleção de rede também no mobile; indicação e ENS obrigatórios conforme o layout; diálogo de revisão e estados de conexão da carteira, que não existem no Figma.
- Perfil no mobile: navegação entre seções em pílulas.
- iOS: campos de formulário usam 16 px (Figma: 13–15 px). Abaixo disso, o iOS amplia a página ao focar o campo e a mantém ampliada, e o layout deixa de caber na tela.
- Ícones de senha visível e de filtro selecionado desenhados no estilo do conjunto, pois não existem no arquivo.
- Ajustes de acessibilidade listados na seção acima.

## Telas de celular e área segura

A página ocupa a tela inteira (`viewport-fit=cover`), e as alturas usam `dvh`, que acompanha as barras do navegador. A tab bar e as barras fixas (compra no detalhe, resumo do carrinho, pagamento, filtros) somam `env(safe-area-inset-bottom)` ao seu espaço, ficando acima da barra de gestos e da barra de ferramentas do navegador; o container lateral respeita o notch em paisagem.

## Limitações

- **Sem backend:** a API e o servidor Socket.IO são simulados no navegador. Dados ficam no `localStorage` de cada navegador; "Restaurar dados" volta ao estado inicial.
- **Tempo real por aba:** eventos só chegam às conexões da aba que gerou a mudança (ver [transporte](#transporte-e-limitações-no-ambiente-de-mocks)).
- **StrictMode em desenvolvimento:** em `pnpm dev`, o React monta os componentes duas vezes, e requisições disparadas por efeitos podem consumir duas vezes uma regra de falha de "próxima requisição". Build, preview, testes e deploy não têm esse efeito.
- **`tldts` substituído:** o MSW inclui o tough-cookie, que importa o `tldts` (Public Suffix List, ~110 KB gzip). Como a API simulada não usa cookies, um stub mínimo (`src/mocks/vendor/tldts-lite.ts`) é usado no lugar.
- **`FORBIDDEN`:** o código 403 faz parte do contrato e é tratado pelo cliente, mas a simulação responde 404 a recursos de outro colecionador para não revelar sua existência, e recusa em silêncio a assinatura de tópicos privados alheios.
- **Baselines visuais só para macOS:** os snapshots têm sufixo `-darwin`; em outro sistema, gere as baselines antes de comparar.
- **Performance mobile abaixo da meta** do Lighthouse (80), por ser um SPA com a API no navegador; análise em [docs/performance.md](docs/performance.md).
