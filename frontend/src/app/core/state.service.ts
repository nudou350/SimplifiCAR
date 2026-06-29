import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { fallbackOfertas, fallbackPropriedade } from './fallback';
import { Oferta, Pendencia, Propriedade, TipoOferta } from './types';

export type Screen = 'hero' | 'painel' | 'marketplace' | 'analise' | 'corridor';
export type LoginAction = 'anunciar' | 'compensar' | 'casar' | 'pendencias' | 'retificar' | null;
export type UiFilter = 'todos' | 'venda' | 'aluguel';
export type UiBioma = 'todos' | 'Cerrado' | 'Caatinga' | 'Amazônia' | 'Mata Atlântica';
export type UploadState = 'idle' | 'uploading' | 'done';

export const MG_EXAMPLE = 'MG-3127008-6CAD429ED6934E68818CD3FC21D797A6';

const ROUTE_FOR_ACTION: Record<string, Screen> = {
  anunciar: 'marketplace',
  compensar: 'marketplace',
  casar: 'marketplace',
  retificar: 'analise',
  pendencias: 'analise',
};

// Central app state. Translates the mockup's DSL `Component` state class into
// Angular signals (state) + methods (the onClick handlers).
@Injectable({ providedIn: 'root' })
export class AppState {
  private api = inject(ApiService);

  // ---- navigation / session ----
  screen = signal<Screen>('hero');
  loggedIn = signal(false);

  // ---- consulta rápida ----
  carInput = signal('');
  consulting = signal(false);
  loadError = signal<string | null>(null);
  offline = signal(false);
  property = signal<Propriedade | null>(null);
  ignite = signal(0); // 0..6 drives the map "acendendo" sequence

  // ---- login modal ----
  loginOpen = signal(false);
  loginPending = signal<LoginAction>(null);
  loginLoading = signal(false);

  // ---- tooltip ----
  tip = signal<'cra' | 'mf' | 'arrendamento' | null>(null);

  // ---- marketplace ----
  mkFilter = signal<UiFilter>('todos');
  mkBioma = signal<UiBioma>('todos');
  allOffers = signal<Oferta[]>([]);
  offersLoading = signal(false);

  // ---- match modal ----
  matchOpen = signal(false);
  matchOffer = signal<Oferta | null>(null);
  matchDone = signal(false);
  private pendingOffer: Oferta | null = null;

  // ---- análise completa ----
  uploadState = signal<UploadState>('idle');
  uploadFileName = signal('');
  uploadPendencias = signal<Pendencia[]>([]);
  uploadedPropId = signal<number | null>(null); // imóvel criado pelo upload (§4.7)
  retDone = signal(false);
  retMinuta = signal<string[] | null>(null);
  retMinutaTexto = signal<string | null>(null); // minuta completa (p/ download)

  private timers: any[] = [];
  private t(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
    return id;
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  // ===== derived =====
  isApp = computed(() => this.screen() !== 'hero');
  diagnostico = computed(() => this.property()?.diagnostico ?? null);

  faixa = computed(() => {
    const s = this.diagnostico()?.score ?? 0;
    return s >= 80 ? 'Em dia' : s >= 50 ? 'Com pendências' : 'Irregular';
  });
  faixaColor = computed(() => {
    const s = this.diagnostico()?.score ?? 0;
    return s >= 80 ? '#14532D' : s >= 50 ? '#8A6D12' : '#8F2D1B';
  });

  // campos de futebol ~ 1 ha (mockup convention: 8 ha = 8 campos)
  camposFutebol = computed(() => Math.max(0, Math.round(this.diagnostico()?.deficitHa ?? 0)));

  // Há déficit a compensar? Gate do "casar" — sem déficit, casar não faz sentido
  // (mesmo limiar de 0,05 ha usado em computeScore / situacao).
  temDeficit = computed(() => (this.diagnostico()?.deficitHa ?? 0) > 0.05);

  offers = computed(() => {
    const f = this.mkFilter();
    const b = this.mkBioma();
    const propBioma = this.property()?.bioma ?? null;
    const wantTipo: TipoOferta | null = f === 'todos' ? null : f === 'venda' ? 'venda' : 'arrendamento';
    return this.allOffers()
      .filter(
        (o) => (wantTipo === null || o.tipoOferta === wantTipo) && (b === 'todos' || o.bioma === b),
      )
      // Compatibilidade = mesmo bioma do imóvel consultado (Código Florestal, Art. 48:
      // compensação de RL deve ser no mesmo bioma). Calculamos aqui, onde conhecemos o
      // bioma do déficit do usuário; o backend não tem esse contexto e usa um default.
      .map((o) => ({ ...o, compativel: propBioma ? o.bioma === propBioma : o.compativel }));
  });

  // ===== navigation =====
  goHome() {
    this.screen.set('hero');
  }
  go(screen: Screen) {
    this.screen.set(screen);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    if (screen === 'marketplace') this.loadOffers();
  }

  // ===== consulta rápida (§4.1) =====
  consult() {
    const cod = this.carInput().trim();
    if (!cod || this.consulting()) return;
    this.runConsult(cod);
  }
  consultExample() {
    this.carInput.set(MG_EXAMPLE);
    this.runConsult(MG_EXAMPLE);
  }
  consultAgain() {
    // re-run the loader animation for the current property
    const cod = this.property()?.codImovel ?? this.carInput().trim();
    if (cod) this.runConsult(cod);
    else this.goHome();
  }

  private runConsult(cod: string) {
    this.consulting.set(true);
    this.loadError.set(null);
    this.api.getPropriedade(cod).subscribe({
      next: (p) => {
        this.offline.set(false);
        this.onProperty(p);
      },
      error: () => {
        // Graceful: keep the demo alive with offline fallback data.
        this.offline.set(true);
        this.loadError.set('Sem conexão com o servidor — exibindo dados de demonstração.');
        this.onProperty(fallbackPropriedade(cod));
      },
    });
  }

  private onProperty(p: Propriedade) {
    // small min delay so the loader reads as "consultando dados públicos"
    this.t(() => {
      this.property.set(p);
      this.consulting.set(false);
      this.screen.set('painel');
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
      this.startIgnite();
    }, 900);
  }

  startIgnite() {
    this.clearTimers();
    this.ignite.set(0);
    [1, 2, 3, 4, 5, 6].forEach((s, i) => this.t(() => this.ignite.set(s), 250 + i * 230));
  }

  // ===== tooltips =====
  openTip(key: 'cra' | 'mf' | 'arrendamento') {
    this.tip.set(key);
  }
  closeTip() {
    this.tip.set(null);
  }
  tipInfo() {
    const key = this.tip();
    const map = {
      cra: {
        term: 'CRA — Cota de Reserva Ambiental',
        text: 'Um título que representa uma área de vegetação nativa preservada além do exigido. Quem tem déficit de Reserva Legal pode comprar uma CRA para compensar, em vez de plantar tudo de novo.',
      },
      mf: {
        term: 'Módulo fiscal',
        text: 'Unidade de medida agrária que muda de município para município. Define o porte do imóvel e algumas regras ambientais. Aqui, 1 módulo ≈ 20 hectares.',
      },
      arrendamento: {
        term: 'Arrendamento de reserva',
        text: 'Você aluga a área de reserva de um vizinho por um prazo, em vez de comprar. Costuma ser a forma mais barata de cobrir o déficit no curto prazo.',
      },
    };
    return key ? map[key] : { term: '', text: '' };
  }

  // ===== marketplace =====
  setFilter(f: UiFilter) {
    this.mkFilter.set(f);
  }
  setBioma(b: UiBioma) {
    this.mkBioma.set(b);
  }
  loadOffers() {
    if (this.offersLoading()) return;
    this.offersLoading.set(true);
    this.api.getOfertas().subscribe({
      next: (list) => {
        this.allOffers.set(list?.length ? list : fallbackOfertas());
        this.offersLoading.set(false);
      },
      error: () => {
        this.offline.set(true);
        this.allOffers.set(fallbackOfertas());
        this.offersLoading.set(false);
      },
    });
  }
  casar(offer: Oferta) {
    if (!this.loggedIn()) {
      this.pendingOffer = offer;
      this.openLogin('casar');
      return;
    }
    this.matchOffer.set(offer);
    this.matchOpen.set(true);
    this.matchDone.set(false);
  }
  confirmMatch() {
    const offer = this.matchOffer();
    const demId = this.property()?.diagnostico.propriedadeId;
    if (offer && demId != null) {
      this.api.match(offer.id, demId).subscribe({
        next: () => this.matchDone.set(true),
        error: () => this.matchDone.set(true), // demo still completes
      });
    } else {
      this.matchDone.set(true);
    }
  }
  closeMatch() {
    this.matchOpen.set(false);
    this.matchDone.set(false);
  }
  anunciar() {
    this.loggedIn() ? this.go('analise') : this.openLogin('anunciar');
  }

  // ===== painel gated actions =====
  compensar() {
    this.loggedIn() ? this.go('marketplace') : this.openLogin('compensar');
  }
  verPendencias() {
    this.loggedIn() ? this.go('analise') : this.openLogin('pendencias');
  }
  gerarRetificacao() {
    this.loggedIn() ? this.go('analise') : this.openLogin('retificar');
  }

  // ===== análise completa (§4.7 / §4.8) =====
  startUpload(file?: File) {
    if (this.uploadState() !== 'idle') return;
    this.uploadState.set('uploading');
    this.uploadFileName.set(file?.name ?? 'imovel_completo.car');
    if (file) {
      this.api.uploadCar(file).subscribe({
        next: (p) => {
          this.uploadPendencias.set(p.pendencias ?? this.demoPendencias());
          this.uploadedPropId.set(p.diagnostico?.propriedadeId ?? null);
          this.uploadState.set('done');
        },
        error: () => {
          this.uploadPendencias.set(this.demoPendencias());
          this.uploadState.set('done');
        },
      });
    } else {
      this.t(() => {
        this.uploadPendencias.set(this.demoPendencias());
        this.uploadState.set('done');
      }, 1700);
    }
  }
  private demoPendencias(): Pendencia[] {
    return [
      { tipo: 'reserva_legal', gravidade: 'alerta', descricao: 'Déficit de 8,0 ha (Cerrado exige 20%).' },
      { tipo: 'app', gravidade: 'alerta', descricao: '1,2 ha de faixa de proteção a recompor.' },
      { tipo: 'embargo', gravidade: 'ok', descricao: 'Nenhuma área embargada detectada.' },
    ];
  }
  genRet() {
    if (!this.loggedIn()) {
      this.openLogin('retificar');
      return;
    }
    this.applyRet();
  }
  private applyRet() {
    // Prefer the property created by the .RET upload (Análise Completa); fall
    // back to the consulted property when retificação is triggered from the painel.
    const id = this.uploadedPropId() ?? this.property()?.diagnostico?.propriedadeId;
    if (id != null) {
      this.api.gerarRetificacao(id).subscribe({
        next: (r) => {
          this.retMinuta.set(r.itens ?? null);
          this.retMinutaTexto.set(r.minuta ?? null);
          this.retDone.set(true);
        },
        error: () => this.retDone.set(true),
      });
    } else {
      this.retDone.set(true);
    }
  }

  /**
   * Baixa a minuta de retificação como arquivo .txt. Usa o texto completo
   * devolvido pela API; se faltar (ex.: offline), monta um fallback a partir
   * dos números já carregados — o download nunca sai vazio.
   */
  baixarMinuta() {
    if (typeof document === 'undefined') return;
    const texto = this.retMinutaTexto() ?? this.minutaFallback();
    const cod = this.property()?.codImovel ?? 'CAR';
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retificacao_${cod}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private minutaFallback(): string {
    const p = this.property();
    const d = this.diagnostico();
    const cod = p?.codImovel ?? 'CAR';
    const fmt = (v?: number) =>
      (v ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    return [
      'MINUTA DE RETIFICAÇÃO DO CADASTRO AMBIENTAL RURAL',
      '',
      `Imóvel: ${p?.nome ?? cod} (CAR ${cod}), ${p?.municipio ?? '—'}/${p?.uf ?? '—'}.`,
      `Área total: ${fmt(p?.areaHa)} ha. Score de conformidade: ${d?.score ?? 0}/100.`,
      '',
      'Providências sugeridas:',
      ...(this.retMinuta() ?? ['Confirmar a vetorização de RL e APP na Central do CAR.']).map(
        (it, i) => `  ${i + 1}. ${it}`,
      ),
      '',
      'Rascunho gerado automaticamente a partir do diagnóstico — revisar com responsável',
      'técnico antes do envio à Central do CAR.',
    ].join('\n');
  }

  // ===== login (§4.3) =====
  openLogin(action: LoginAction) {
    this.loginOpen.set(true);
    this.loginPending.set(action);
    this.loginLoading.set(false);
  }
  closeLogin() {
    this.loginOpen.set(false);
    this.loginLoading.set(false);
  }
  openLoginGeneric() {
    this.openLogin(null);
  }
  doLogin() {
    if (this.loginLoading()) return;
    this.loginLoading.set(true);
    const finish = () => {
      const pending = this.loginPending();
      const offer = this.pendingOffer;
      this.loggedIn.set(true);
      this.loginOpen.set(false);
      this.loginLoading.set(false);
      this.loginPending.set(null);
      this.pendingOffer = null;
      const route = pending ? ROUTE_FOR_ACTION[pending] : undefined;
      if (route) this.go(route);
      if (pending === 'casar' && offer) {
        this.matchOffer.set(offer);
        this.matchOpen.set(true);
        this.matchDone.set(false);
      }
      if (pending === 'retificar' && this.uploadState() === 'done') this.applyRet();
    };
    this.api.authMock(this.property()?.codImovel).subscribe({
      next: () => this.t(finish, 300),
      error: () => this.t(finish, 300), // mock login always succeeds for the demo
    });
  }
  loginPendingText() {
    const a = this.loginPending();
    const map: Record<string, string> = {
      anunciar: 'Entre para anunciar seu excedente no marketplace.',
      compensar: 'Entre para compensar seu déficit com cota (CRA) ou aluguel.',
      casar: 'Entre para fechar este pareamento com o vizinho.',
      pendencias: 'Entre para ver as pendências oficiais do seu imóvel.',
      retificar: 'Entre para gerar a retificação do seu CAR.',
    };
    return (a && map[a]) || 'Use a mesma conta que você já usa no SICAR. É um toque.';
  }
}
