# Auditoria Lighthouse

> Gerado por `pnpm audit:lighthouse` (configuração em [lighthouse.config.ts](../../lighthouse.config.ts)). Não edite à mão: a próxima execução sobrescreve esta pasta.

Mediana de 3 execuções por página e perfil. Metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90. Valores abaixo da meta aparecem em **negrito** com ⚠️.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Relatório (execução mediana) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início | Mobile | **80** ⚠️ | 100 | 100 | 100 | 4,3 s | 0,021 | 18 ms | [HTML](mobile/home-2.report.html) · [JSON](mobile/home-2.report.json) |
| Detalhe do NFT | Mobile | **80** ⚠️ | 100 | 100 | 100 | 4,3 s | 0,000 | 17 ms | [HTML](mobile/nft-detail-1.report.html) · [JSON](mobile/nft-detail-1.report.json) |
| Início | Desktop | 99 | 100 | 100 | 100 | 1,0 s | 0,004 | 0 ms | [HTML](desktop/home-1.report.html) · [JSON](desktop/home-1.report.json) |
| Detalhe do NFT | Desktop | 99 | 100 | 100 | 100 | 0,9 s | 0,000 | 0 ms | [HTML](desktop/nft-detail-1.report.html) · [JSON](desktop/nft-detail-1.report.json) |

Os relatórios HTML abrem direto no navegador; os JSON podem ser carregados no [Lighthouse Viewer](https://googlechrome.github.io/lighthouse/viewer/).

## Ambiente

- Data: 2026-10-08T20:18:18.786Z
- Commit: aa560ec (com alterações locais)
- Lighthouse: 13.5.0 (API Node, chrome-launcher)
- Navegador: Google Chrome for Testing 156.0.8078.4 (--headless=new), via Playwright (Chrome for Testing)
- Node.js: v22.21.0
- Sistema: macOS 26.5.1 (arm64)
- CPU: Apple M4 (10 núcleos), memória 16 GB
- BenchmarkIndex do Lighthouse (mediana): 3566

## Condições de execução

- Build de produção (`vite build`) servido por `vite preview` (gzip) em `http://localhost:4174`, com o fallback de SPA.
- API simulada com o cenário padrão: MSW (service worker), Socket.IO simulado e painel de controle dos mocks, como na versão publicada.
- Execuções sequenciais, cada uma em um perfil novo do Chrome: sem cache, storage ou service worker de execuções anteriores.
- Presets do próprio Lighthouse, sem ajustes:

| Perfil | Form factor | Tela emulada | Throttling | RTT | Download | CPU |
| --- | --- | --- | --- | --- | --- | --- |
| Mobile | mobile | 412×823 @1.75x | simulate | 150 ms | 1,6 Mbps | 4× |
| Desktop | desktop | 1350×940 @1x | simulate | 40 ms | 10,0 Mbps | 1× |

Páginas auditadas:

- Início: `/`
- Detalhe do NFT: `/nfts/emerald-ape-042`

## Execuções

### Início · Mobile

| Execução | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index | Relatórios |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 81 | 100 | 100 | 100 | 4,2 s | 0,021 | 38 ms | 2,9 s | 2,9 s | [HTML](mobile/home-1.report.html) · [JSON](mobile/home-1.report.json) |
| 2 | 80 | 100 | 100 | 100 | 4,3 s | 0,021 | 18 ms | 3,0 s | 3,0 s | [HTML](mobile/home-2.report.html) · [JSON](mobile/home-2.report.json) |
| 3 | 80 | 100 | 100 | 100 | 4,3 s | 0,021 | 17 ms | 3,0 s | 3,0 s | [HTML](mobile/home-3.report.html) · [JSON](mobile/home-3.report.json) |

### Detalhe do NFT · Mobile

| Execução | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index | Relatórios |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 80 | 100 | 100 | 100 | 4,3 s | 0,000 | 11 ms | 3,0 s | 3,0 s | [HTML](mobile/nft-detail-1.report.html) · [JSON](mobile/nft-detail-1.report.json) |
| 2 | 80 | 100 | 100 | 100 | 4,3 s | 0,000 | 34 ms | 3,0 s | 3,0 s | [HTML](mobile/nft-detail-2.report.html) · [JSON](mobile/nft-detail-2.report.json) |
| 3 | 80 | 100 | 100 | 100 | 4,3 s | 0,000 | 17 ms | 3,0 s | 3,0 s | [HTML](mobile/nft-detail-3.report.html) · [JSON](mobile/nft-detail-3.report.json) |

### Início · Desktop

| Execução | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index | Relatórios |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 99 | 100 | 100 | 100 | 0,9 s | 0,004 | 0 ms | 0,7 s | 0,7 s | [HTML](desktop/home-1.report.html) · [JSON](desktop/home-1.report.json) |
| 2 | 99 | 100 | 100 | 100 | 1,0 s | 0,004 | 0 ms | 0,7 s | 0,7 s | [HTML](desktop/home-2.report.html) · [JSON](desktop/home-2.report.json) |
| 3 | 99 | 100 | 100 | 100 | 1,0 s | 0,004 | 0 ms | 0,7 s | 0,7 s | [HTML](desktop/home-3.report.html) · [JSON](desktop/home-3.report.json) |

### Detalhe do NFT · Desktop

| Execução | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index | Relatórios |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 99 | 100 | 100 | 100 | 0,9 s | 0,000 | 0 ms | 0,7 s | 0,7 s | [HTML](desktop/nft-detail-1.report.html) · [JSON](desktop/nft-detail-1.report.json) |
| 2 | 99 | 100 | 100 | 100 | 0,9 s | 0,000 | 0 ms | 0,7 s | 0,7 s | [HTML](desktop/nft-detail-2.report.html) · [JSON](desktop/nft-detail-2.report.json) |
| 3 | 99 | 100 | 100 | 100 | 1,0 s | 0,000 | 0 ms | 0,7 s | 0,7 s | [HTML](desktop/nft-detail-3.report.html) · [JSON](desktop/nft-detail-3.report.json) |

## Como reproduzir

```sh
pnpm exec playwright install chromium   # Chrome for Testing usado pelo Playwright
pnpm audit:lighthouse                   # build + 12 execuções (alguns minutos)
```

Para outro navegador baseado em Chromium, defina `CHROME_PATH`. Os números variam com a máquina (veja o BenchmarkIndex): compare execuções feitas no mesmo ambiente.
