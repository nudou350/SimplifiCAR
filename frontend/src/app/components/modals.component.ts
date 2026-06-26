import { Component, inject } from '@angular/core';
import { HaPipe, MilPipe } from '../core/format.pipes';
import { AppState } from '../core/state.service';

@Component({
  selector: 'app-modals',
  standalone: true,
  imports: [HaPipe],
  template: `
    <!-- CONSULTA LOADER -->
    @if (s.consulting()) {
      <div role="status" aria-live="polite" style="position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(27,32,24,.62);backdrop-filter:blur(3px);padding:24px;">
        <div style="background:var(--card);border-radius:16px;padding:36px 40px;display:flex;flex-direction:column;align-items:center;gap:16px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5);">
          <div aria-hidden="true" style="width:42px;height:42px;border-radius:50%;border:3.5px solid var(--linha);border-top-color:var(--mata);animation:scSpin .8s linear infinite;"></div>
          <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:15px;color:var(--tinta);">Consultando dados públicos…</p>
          <p style="margin:0;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.1em;color:var(--tinta-muda);text-transform:uppercase;">SICAR · MapBiomas</p>
        </div>
      </div>
    }

    <!-- gov.br LOGIN -->
    @if (s.loginOpen()) {
      <div role="dialog" aria-modal="true" aria-label="Entrar com gov.br" style="position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:rgba(27,32,24,.62);backdrop-filter:blur(3px);padding:20px;">
        <div style="width:100%;max-width:412px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.55);">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--linha);background:#F4F6F2;">
            <span aria-hidden="true" style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:21px;letter-spacing:-.02em;color:#1351B4;">gov.br</span>
            <button (click)="s.closeLogin()" aria-label="Fechar" style="width:36px;height:36px;display:grid;place-items:center;border-radius:8px;color:var(--tinta-muda);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div style="padding:26px 24px 28px;">
            <h2 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:23px;letter-spacing:-.02em;margin:0 0 8px;">Entrar com gov.br</h2>
            <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:var(--tinta-muda);">{{ s.loginPendingText() }}</p>
            <button (click)="s.doLogin()" style="width:100%;min-height:54px;border-radius:10px;background:#1351B4;color:#fff;font-weight:700;font-size:17px;display:inline-flex;align-items:center;justify-content:center;gap:10px;">
              @if (s.loginLoading()) {
                <span aria-hidden="true" style="width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;animation:scSpin .7s linear infinite;"></span> Entrando…
              } @else {
                Entrar com gov.br
              }
            </button>
            <div style="display:flex;align-items:center;gap:9px;margin-top:18px;padding:11px 13px;background:#F4F6F2;border-radius:9px;">
              <svg width="16" height="18" viewBox="0 0 15 17" fill="none" aria-hidden="true" style="flex:none"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="#4A4F44" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="#4A4F44" stroke-width="1.6"/></svg>
              <span style="font-size:13.5px;line-height:1.45;color:var(--tinta-muda);">A mesma conta que você já usa no SICAR. Não criamos cadastro novo.</span>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- TOOLTIP / JARGÃO -->
    @if (s.tip()) {
      <div role="dialog" aria-modal="true" aria-label="Explicação do termo" (click)="s.closeTip()" style="position:fixed;inset:0;z-index:75;display:flex;align-items:flex-end;justify-content:center;background:rgba(27,32,24,.5);backdrop-filter:blur(2px);">
        <div (click)="$event.stopPropagation()" style="width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;padding:22px 22px 26px;box-shadow:0 -12px 40px rgba(0,0,0,.3);">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <h2 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:20px;letter-spacing:-.01em;margin:0;">{{ s.tipInfo().term }}</h2>
            <button (click)="s.closeTip()" aria-label="Fechar" style="flex:none;width:36px;height:36px;display:grid;place-items:center;border-radius:8px;color:var(--tinta-muda);margin:-6px -6px 0 0;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
          </div>
          <p style="margin:12px 0 18px;font-size:17px;line-height:1.55;color:var(--tinta-muda);">{{ s.tipInfo().text }}</p>
          <button (click)="s.closeTip()" style="width:100%;min-height:50px;border-radius:10px;background:var(--tinta);color:var(--papel);font-weight:600;font-size:16px;">Entendi</button>
        </div>
      </div>
    }

    <!-- CASAR / PAREAMENTO -->
    @if (s.matchOpen()) {
      <div role="dialog" aria-modal="true" aria-label="Casar pareamento" (click)="s.closeMatch()" style="position:fixed;inset:0;z-index:78;display:grid;place-items:center;background:rgba(27,32,24,.62);backdrop-filter:blur(3px);padding:18px;">
        <div (click)="$event.stopPropagation()" style="width:100%;max-width:486px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.55);">
          @if (!s.matchDone()) {
            <div style="padding:24px 22px 26px;">
              <h2 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:23px;letter-spacing:-.02em;margin:0 0 4px;">Casar pareamento</h2>
              <p style="margin:0 0 18px;font-size:15.5px;line-height:1.5;color:var(--tinta-muda);">Os dois lados saem ganhando:</p>
              <div style="display:flex;align-items:stretch;gap:10px;">
                <div style="flex:1;background:rgba(31,141,73,.08);border:1.5px solid rgba(31,141,73,.3);border-radius:12px;padding:13px;">
                  <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mata-tx);margin-bottom:6px;">Você</div>
                  <div style="font-weight:700;font-size:15px;line-height:1.2;margin-bottom:8px;">{{ propNome() }}</div>
                  <div style="font-size:13.5px;line-height:1.45;color:var(--tinta);">Cobre o déficit de <strong>{{ deficit() | ha:1 }}</strong> e o selo vira <strong style="color:var(--mata-tx);">Em dia</strong>.</div>
                </div>
                <div style="flex:none;display:grid;place-items:center;color:var(--tinta-muda);" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 8h13m0 0-3-3m3 3-3 3M19 14H6m0 0 3-3m-3 3 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                <div style="flex:1;background:rgba(201,162,39,.1);border:1.5px solid rgba(201,162,39,.4);border-radius:12px;padding:13px;">
                  <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--valor-tx);margin-bottom:6px;">Vizinho</div>
                  <div style="font-weight:700;font-size:15px;line-height:1.2;margin-bottom:8px;">{{ offerArea() }} · {{ offerTipo() }}</div>
                  <div style="font-size:13.5px;line-height:1.45;color:var(--tinta);">Recebe <strong style="color:var(--valor-tx);">{{ offerValor() }}</strong> pela reserva preservada em {{ offerLocal() }}.</div>
                </div>
              </div>
              <button (click)="s.confirmMatch()" style="width:100%;min-height:54px;margin-top:18px;border-radius:10px;background:#1351B4;color:#fff;font-weight:700;font-size:16px;display:inline-flex;align-items:center;justify-content:center;gap:9px;">
                <svg width="16" height="18" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="currentColor" stroke-width="1.6"/></svg>
                Confirmar e assinar com gov.br
              </button>
              <button (click)="s.closeMatch()" style="width:100%;min-height:46px;margin-top:8px;border-radius:10px;color:var(--tinta-muda);font-weight:600;font-size:15px;">Agora não</button>
            </div>
          } @else {
            <div style="padding:30px 24px 26px;text-align:center;">
              <div aria-hidden="true" style="width:60px;height:60px;border-radius:50%;background:rgba(31,141,73,.14);display:grid;place-items:center;margin:0 auto 14px;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4 10-11" stroke="#1F8D49" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
              <h2 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:23px;letter-spacing:-.02em;margin:0 0 8px;">Pareamento solicitado!</h2>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:var(--tinta-muda);">Enviamos o contrato para o vizinho. Quando ele assinar, sua Reserva Legal fica regularizada.</p>
              <div style="text-align:left;background:#F4F6F2;border:1px solid var(--linha);border-radius:10px;padding:13px 14px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;line-height:1.6;color:var(--tinta-muda);">
                <div style="border-bottom:1px dashed var(--linha);padding-bottom:7px;margin-bottom:7px;color:var(--tinta);">CONTRATO DE COMPENSAÇÃO · CRA</div>
                ✓ Assinado eletronicamente via <strong style="color:#1351B4;">gov.br</strong><br>João C. · CPF •••.123.456-•• · 26/06/2026 14:32
              </div>
              <button (click)="s.closeMatch()" style="width:100%;min-height:52px;margin-top:18px;border-radius:10px;background:var(--mata);color:#FAFBF7;font-weight:700;font-size:16px;">Concluir</button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class ModalsComponent {
  s = inject(AppState);

  propNome() {
    return this.s.property()?.nome ?? 'Seu imóvel';
  }
  deficit() {
    return this.s.diagnostico()?.deficitHa ?? 8;
  }
  offerArea() {
    const o = this.s.matchOffer();
    return o ? new HaPipe().transform(o.areaHa, 1) : '';
  }
  offerTipo() {
    const o = this.s.matchOffer();
    return o ? (o.tipoOferta === 'venda' ? 'Venda · CRA' : 'Aluguel') : '';
  }
  offerValor() {
    const o = this.s.matchOffer();
    return o ? new MilPipe().transform(o.valor) + (o.unidade ?? '') : '';
  }
  offerLocal() {
    const o = this.s.matchOffer();
    return o ? `${o.municipio} · ${o.uf}` : '';
  }
}
