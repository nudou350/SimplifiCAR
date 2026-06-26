# SimplifiCAR — Frontend (Angular 19 + signals + Leaflet)

SPA do MVP: Abertura → Painel (mapa Leaflet acendendo camadas + Selo de Conformidade + diagnóstico) → Marketplace → Análise Completa → Corredores. Consome a API NestJS pelo contrato congelado (`docs/07_contrato_mvp.md`).

## Comandos

```bash
npm install
npm start          # dev server em http://localhost:4200
npm run build      # build de produção (dist/frontend)
```

A API é esperada em `http://localhost:3012` (configurável em `src/environments/environment.ts`).
Se o backend estiver fora do ar, o app degrada com elegância: a chamada real é feita; em
falha, exibe um selo "Modo demonstração" e dados ilustrativos (`src/app/core/fallback.ts`)
para o demo nunca quebrar.

## Estrutura

- `src/app/core/` — `types.ts` (contrato §4/§5 tipado), `api.service.ts` (HttpClient), `state.service.ts` (estado central em signals, espelha a DSL do mockup), `fallback.ts` (dados offline), `format.pipes.ts`.
- `src/app/screens/` — `hero`, `painel`, `parcel-map` (Leaflet), `marketplace`, `analise`, `corridor`.
- `src/app/components/modals.component.ts` — login gov.br (mock), tooltips, match, loader.
- `src/app/app.component.ts` — header + nav + switch de telas + modais.

Paleta/tipografia/telas reproduzem `docs/design/SimplifiCAR.dc.html`. O mapa SVG do mockup
foi traduzido para Leaflet real, colorindo por `tipo` canônico (contrato §5) e animando as
camadas em sequência ("acendendo").
