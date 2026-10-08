# Performance e Lighthouse

Auditoria do início (`/`) e do detalhe do NFT (`/nfts/emerald-ape-042`) nos perfis mobile e desktop do Lighthouse, com o build de produção e o cenário padrão dos mocks.

- Executar: `pnpm audit:lighthouse` (build + 12 execuções, alguns minutos). Requer o Chrome for Testing do Playwright (`pnpm exec playwright install chromium`) ou `CHROME_PATH`.
- Configuração versionada: [lighthouse.config.ts](../lighthouse.config.ts) (páginas, perfis, número de execuções, metas) e [scripts/lighthouse.ts](../scripts/lighthouse.ts) (servidor, execução, medianas).
- Resultados: [docs/lighthouse/README.md](lighthouse/README.md), com relatórios HTML/JSON de todas as execuções, versões das ferramentas, ambiente e condições. A pasta é gerada pelo script; este documento traz a análise.

## Resultado (mediana de 3 execuções)

| Página         | Perfil  | Performance | Accessibility | Best Practices | SEO |   FCP |   LCP |   CLS |   TBT |
| -------------- | ------- | ----------: | ------------: | -------------: | --: | ----: | ----: | ----: | ----: |
| Início         | Mobile  |      **80** |           100 |            100 | 100 | 3,0 s | 4,3 s | 0,021 | 18 ms |
| Detalhe do NFT | Mobile  |      **80** |           100 |            100 | 100 | 3,0 s | 4,3 s |     0 | 18 ms |
| Início         | Desktop |          99 |           100 |            100 | 100 | 0,7 s | 1,0 s | 0,004 |  0 ms |
| Detalhe do NFT | Desktop |          99 |           100 |            100 | 100 | 0,7 s | 0,9 s |     0 |  0 ms |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Todas são atingidas, exceto Performance no perfil mobile (80 nas duas páginas).

## Por que a Performance mobile fica em 80

O perfil mobile simula um Moto G Power em Slow 4G (1,6 Mbps, RTT de 150 ms) com CPU 4× mais lenta. TBT (~18 ms) e CLS (≤ 0,021) estão no verde; a nota cai por FCP/Speed Index (~3,0 s) e LCP (~4,3 s), que valem 45% da categoria.

1. **SPA sem pré-renderização.** O `index.html` não tem conteúdo: nada é pintado até o JavaScript da entrada (~115 KB gzip: React DOM, TanStack Router e Query) e os chunks da rota (~55 KB gzip) baixarem e executarem. Com 1,6 Mbps, só esse download leva mais de 1 s, antes de parse, execução e render com CPU 4×. Isso define o FCP de ~3,0 s.
2. **LCP depende da API.** No mobile, o maior elemento é a imagem do primeiro card do catálogo (início) e a imagem principal da galeria (detalhe). As duas só existem depois da resposta de `/api/nfts` ou `/api/nfts/:id`, então o LCP soma a cadeia JS → API → render → imagem ao FCP.
3. **Camada de mocks no navegador.** O cenário padrão roda MSW no próprio navegador: antes da primeira requisição, a página baixa a camada de mocks (~68 KB gzip), semeia o banco simulado e registra o service worker.

Medições de diagnóstico (uma execução cada, fora dos relatórios versionados) mostram o peso de cada fator:

| Variação (mobile)                           | Início                     | Detalhe                      |
| ------------------------------------------- | -------------------------- | ---------------------------- |
| Cenário padrão (mediana acima)              | 80 · FCP 3,0 s · LCP 4,3 s | 80 · FCP 3,0 s · LCP 4,3 s   |
| Preset `instant` (sem latência simulada)    | 81 · FCP 2,9 s · LCP 4,2 s | 78 · FCP 3,1 s · LCP 4,6 s   |
| Build sem mocks (`VITE_ENABLE_MOCKS=false`) | 80 · FCP 2,8 s · LCP 4,2 s | sem dados (API indisponível) |

A latência simulada (150–500 ms) não muda o resultado, e a camada de mocks custa ~0,2 s de FCP. O limite vem do próprio bundle do SPA, baixado e executado antes da primeira pintura.

## Correções feitas a partir da auditoria

A primeira execução encontrou problemas reais, corrigidos no código (não na configuração da auditoria):

| Problema                         | Causa                                                                                                                                      | Correção                                                                                                                                                    | Efeito                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| CLS 0,417 no detalhe mobile      | A lista da galeria não tinha largura definida: as vistas só ganhavam tamanho quando a imagem carregava, e o conteúdo abaixo descia ~355 px | `w-full` na lista da galeria                                                                                                                                | Performance 61 → 80, CLS → 0 |
| CLS 0,125 no detalhe desktop     | No carregamento a frio, o footer ficava logo abaixo do header enquanto a rota carregava e era empurrado quando o conteúdo chegava          | O footer só é renderizado depois da primeira página resolvida                                                                                               | Performance 94 → 99, CLS → 0 |
| `target-size` (Accessibility 97) | Pontos de paginação de 12 px a 20 px de distância (carrossel) e de 7 px a 14 px (galeria mobile)                                           | Carrossel: centros a 24 px (WCAG 2.5.8). Galeria mobile: os pontos viram indicador de posição; as vistas mudam por swipe ou pelas setas com a região focada | Accessibility 97 → 100       |
| `robots-txt` (SEO 92)            | `/robots.txt` caía no fallback do SPA e retornava HTML                                                                                     | `public/robots.txt`                                                                                                                                         | SEO 92 → 100                 |

## Otimizações já presentes

- Code splitting por rota (`autoCodeSplitting` do TanStack Router); HTTP client, schemas, Socket.IO, menu da conta e painel de mocks fora do chunk de entrada.
- A camada de mocks carrega em paralelo com o primeiro render; as requisições esperam por ela (`request-gate`), não a renderização.
- Skeletons com as dimensões finais; imagens com `width`/`height`, AVIF/WebP responsivos (128–1024 px), `fetchpriority="high"` e carregamento eager só acima da dobra, lazy no resto.
- Fonte Roboto Mono auto-hospedada, subset latin com `preload`; cache imutável para `/assets` no deploy ([vercel.json](../vercel.json)).

## O que levaria o mobile a 90 e por que não foi feito

- **Pré-renderização ou SSR com os dados iniciais no HTML** anteciparia FCP e LCP, mas exige outra arquitetura (servidor ou geração estática com dados). A API simulada só existe no navegador, então o HTML não teria os dados do cenário.
- **Remover a camada de mocks ou a latência da auditoria** seria uma simplificação exclusiva para a nota, vedada pelo enunciado, e os diagnósticos acima mostram que mudaria pouco.
- **Cortar dependências do caminho crítico** (por exemplo `tailwind-merge`, ~19 KB gzip, ou o `sonner` na entrada) daria ganhos de décimos de segundo, sem chegar à meta, ao custo de reescrever utilitários usados em todo o design system.

## Diferenças em relação à produção

- A auditoria local usa `vite preview` (gzip, sem cabeçalhos de cache). O deploy na Vercel serve brotli e cache imutável dos assets, mas a primeira visita, que é o que o Lighthouse mede, é sempre fria nos dois casos.
- Os números variam com a máquina; o BenchmarkIndex de cada execução está nos relatórios. Compare execuções feitas no mesmo ambiente.
