# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**Reverde** (nome de trabalho) — projeto de hackathon (Desafio 2: CAR / Cadastro Ambiental Rural). Plataforma que diagnostica a conformidade ambiental de imóveis rurais contra o Código Florestal, ajuda a retificar o cadastro, e conecta excedente e déficit de mata num marketplace (venda de CRA / aluguel de servidão).

A fonte da verdade do produto e da arquitetura está em `docs/`:
- `docs/00_visao_geral_reverde.md` — visão, escopo, fluxo do demo. **Leia primeiro.**
- `docs/01_documentacao_tecnica_raphael.md` — arquitetura, stack, modelo de dados, API, ordem de build.
- `docs/02_documentacao_dominio_pitch_bianca.md` — regras do Código Florestal que viram cálculo, pitch.

Estes docs estão em português e descrevem o sistema-alvo; o código ainda não foi escrito. Ao implementar, siga-os e mantenha-os atualizados se a realidade divergir.

## Princípio arquitetural central (não viole)

**O trabalho geoespacial pesado roda OFFLINE, antes do evento**, num pipeline Python que popula o PostGIS com um município inteiro já calculado (déficit/excedente/score por imóvel). Em runtime a API só faz lookup de dado pré-calculado. Isso é o que torna o demo instantâneo e à prova de wifi ruim.

Consequência prática: a **Consulta Rápida** (`GET /propriedades/:codImovel`) nunca calcula nada na hora — só lê. Não introduza cálculo geoespacial síncrono no caminho de request.

## Stack alvo

- **Backend:** NestJS (TypeScript), modular, DTOs com validação.
- **Banco:** PostgreSQL 16 + PostGIS.
- **Frontend:** Angular (standalone components, signals) + mapa Leaflet ou MapLibre GL.
- **IA:** chamada a um LLM para gerar o texto do diagnóstico e o rascunho de retificação **a partir de números já calculados** — a IA explica/redige, nunca inventa o cálculo (mantém auditável).
- **Pré-processamento:** Python offline (geopandas, shapely, rasterstats) cruzando SICAR × MapBiomas.

Ao construir aplicações de IA, use os modelos Claude mais recentes (ver skill `claude-api`).

## Escopo: base sólida vs cereja (regra de corte)

Sempre exista um demo funcional. Construa e proteja a **base** antes de tocar na **cereja**; se faltar tempo, corte a cereja de cima para baixo.

- **Base sólida:** login gov.br mockado, Consulta Rápida com mapa + score, diagnóstico em linguagem simples sobre um município pré-carregado.
- **Cereja:** Análise Completa (upload `.CAR` → pendências oficiais → rascunho de retificação), marketplace (venda/aluguel + match), registro rastreável.

## Ordem de construção (do doc técnico, seção 11)

1. Pipeline Python validado num município pequeno → popula PostGIS (maior risco técnico, validar cedo: CRS/projeções/recorte raster).
2. NestJS + PostGIS com `GET /propriedades/:codImovel` devolvendo dado real.
3. Mapa Angular acendendo camadas (perímetro, APP, RL, déficit) + score grande. **← já é um demo apresentável.**
4. Texto da IA no painel.
5. Login gov.br mockado caindo direto no painel.
6. (Cereja) Marketplace.
7. (Cereja) Análise Completa.

## Convenções de domínio que afetam o código

- A chave de cada imóvel é `cod_imovel` (= número do CAR, campo `COD_IMOVEL` do SICAR). Toda indexação e lookup gira em torno disso.
- **Déficit/excedente** = vegetação nativa real (MapBiomas) − RL exigida (% por bioma aplicado à área). Real < exigido → déficit (vira demanda no marketplace); real > exigido → excedente (vira oferta).
- **Marketplace usa um único campo `tipo_oferta`** (`venda` | `arrendamento`) sobre a mesma estrutura. Arrendamento adiciona `prazo_meses` + valor periódico. Não duplique modelos para venda vs aluguel.
- **Autenticação gov.br é mockup no MVP** mas deve ficar isolada num `AuthModule` atrás de uma interface `IdentityProvider`, para trocar mock por OIDC real (Authorization Code + PKCE) sem mexer no resto. O login confirma identidade (CPF/nome); **não** baixa o CAR — o vínculo com a propriedade vem do número ou do upload.
- **Análise Completa exige o arquivo `.CAR` completo** (com etapa Geo / polígonos internos de RL e APP), não o `.RET` simplificado.

Tabelas mínimas do PostGIS: `usuario`, `propriedade`, `diagnostico`, `pendencia`, `oferta`, `match` (detalhe na seção 5 do doc técnico).

## Comandos

O projeto ainda não foi inicializado — não há `package.json`, build, lint ou testes. Ao fazer o scaffold, registre aqui os comandos reais (instalar, rodar dev do NestJS e do Angular, subir PostGIS, rodar o pipeline Python, testes). Até lá, não invente comandos.

## Infra / deploy

Antes de qualquer escolha de deploy, porta, nginx, banco ou PM2, leia e siga `C:\Users\Raphael\Documents\Projetos\VPS_GUIDE.md`.
