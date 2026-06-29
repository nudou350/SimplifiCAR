import { Component, inject } from '@angular/core';
import { HaPipe, KmPipe, MilPipe } from '../core/format.pipes';
import { AppState, UiBioma, UiFilter } from '../core/state.service';
import { Oferta } from '../core/types';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [HaPipe, MilPipe, KmPipe],
  template: `
    <section data-screen-label="Marketplace" style="max-width:1180px;margin:0 auto;padding:22px clamp(16px,4vw,40px) 80px;">
      <h1 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(28px,4vw,40px);letter-spacing:-.02em;margin:0;line-height:1.05;">Marketplace de reserva</h1>
      <p style="margin:10px 0 0;font-size:18px;line-height:1.5;color:var(--tinta-muda);max-width:54ch;">Compense seu déficit comprando uma cota ou alugando a reserva de um vizinho — ou anuncie seu excedente.</p>

      @if (deficit() > 0.05) {
        <div style="display:flex;align-items:flex-start;gap:11px;margin:18px 0 20px;padding:13px 15px;background:rgba(200,68,43,.07);border:1.5px solid rgba(200,68,43,.3);border-radius:12px;">
          <span aria-hidden="true" style="flex:none;width:18px;height:18px;border-radius:3px;margin-top:1px;background:repeating-linear-gradient(45deg,#C8442B 0 3px,#F5DAD3 3px 6px);border:1px solid #C8442B;"></span>
          <p style="margin:0;font-size:15px;line-height:1.45;color:var(--tinta);">Seu imóvel tem <strong style="color:var(--deficit-tx);">déficit de {{ deficit() | ha:1 }} no {{ bioma() }}</strong>. Ofertas do mesmo bioma podem <strong>casar</strong> com ele.</p>
        </div>
      } @else {
        <div style="display:flex;align-items:flex-start;gap:11px;margin:18px 0 20px;padding:13px 15px;background:rgba(31,141,73,.07);border:1.5px solid rgba(31,141,73,.3);border-radius:12px;">
          <span aria-hidden="true" style="flex:none;width:18px;height:18px;border-radius:3px;margin-top:1px;background:var(--mata);"></span>
          <p style="margin:0;font-size:15px;line-height:1.45;color:var(--tinta);">Navegue pelas ofertas de reserva por bioma — ou <strong>anuncie seu excedente</strong> para quem precisa compensar.</p>
        </div>
      }

      <div style="display:flex;flex-wrap:wrap;gap:14px 18px;align-items:center;margin-bottom:8px;">
        <div role="group" aria-label="Tipo de oferta" style="display:inline-flex;background:#EFF1EB;border:1.5px solid var(--linha);border-radius:10px;padding:3px;gap:2px;">
          @for (f of filters; track f.v) {
            <button (click)="s.setFilter(f.v)" [style.background]="s.mkFilter() === f.v ? '#1B2018' : '#FFFFFF'" [style.color]="s.mkFilter() === f.v ? '#EFF1EB' : '#4A4F44'" style="min-height:42px;padding:0 15px;border-radius:8px;font-weight:600;font-size:15px;display:inline-flex;align-items:center;gap:7px;">{{ f.label }}</button>
          }
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;align-items:center;">
          <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--tinta-muda);margin-right:2px;">Bioma</span>
          @for (b of biomas; track b.v) {
            <button (click)="s.setBioma(b.v)"
              [style.border]="'1.5px solid ' + (s.mkBioma() === b.v ? '#1F8D49' : '#D6DACE')"
              [style.background]="s.mkBioma() === b.v ? 'rgba(31,141,73,.12)' : '#FFFFFF'"
              [style.color]="s.mkBioma() === b.v ? '#14532D' : '#4A4F44'"
              [style.fontWeight]="s.mkBioma() === b.v ? '700' : '600'"
              style="min-height:40px;padding:0 13px;border-radius:999px;font-size:14px;">{{ b.label }}</button>
          }
        </div>
      </div>
      <p aria-live="polite" style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--tinta-muda);margin:0 0 16px;">{{ s.offers().length }} ofertas encontradas</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:14px;">
        @for (offer of s.offers(); track offer.id) {
          <article style="background:var(--card);border:1.5px solid var(--linha);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(27,32,24,.04);">
            <div [style.height.px]="4" [style.background]="isVenda(offer) ? 'var(--valor)' : 'var(--agua)'"></div>
            <div style="padding:15px 15px 16px;display:flex;flex-direction:column;gap:11px;flex:1;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--tinta-muda);">{{ offer.bioma }}</span>
                @if (isVenda(offer)) {
                  <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--valor-tx);background:rgba(201,162,39,.14);border-radius:6px;padding:4px 9px;"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8.5 8 2.5l6 6-5.5 5.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="6" r="1.1" fill="currentColor"/></svg>Venda · CRA</span>
                } @else {
                  <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--agua);background:rgba(45,111,166,.13);border-radius:6px;padding:4px 9px;"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M8 5v3.2l2 1.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Aluguel</span>
                }
              </div>
              <div>
                <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:30px;letter-spacing:-.02em;line-height:1;">{{ offer.areaHa | ha:1 }}</div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:16px;color:var(--valor-tx);font-weight:600;margin-top:5px;">{{ offer.valor | mil }}{{ offer.unidade }}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;font-size:13.5px;color:var(--tinta-muda);">
                <span>{{ offer.municipio }} · {{ offer.uf }} · {{ offer.distanciaKm | km }}</span>
                @if (offer.prazoMeses) {
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;">prazo: {{ prazoLabel(offer) }}</span>
                }
              </div>
              <div style="margin-top:auto;padding-top:4px;">
                @if (offer.compativel && s.temDeficit()) {
                  <button (click)="s.casar(offer)" style="width:100%;min-height:46px;border-radius:9px;background:var(--mata);color:#FAFBF7;font-weight:700;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px;">
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15s-6-3.7-6-8a3.3 3.3 0 0 1 6-1.9A3.3 3.3 0 0 1 15 7c0 4.3-6 8-6 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
                    Casar com meu déficit
                  </button>
                } @else if (offer.compativel) {
                  <div style="display:flex;align-items:center;gap:7px;min-height:46px;justify-content:center;font-size:13px;color:var(--mata-tx);border:1.5px dashed rgba(31,141,73,.4);border-radius:9px;">Compatível · você não tem déficit a compensar</div>
                } @else {
                  <div style="display:flex;align-items:center;gap:7px;min-height:46px;justify-content:center;font-size:13px;color:var(--tinta-muda);border:1.5px dashed var(--linha);border-radius:9px;">Bioma diferente do seu déficit</div>
                }
              </div>
            </div>
          </article>
        }
      </div>

      @if (s.offers().length === 0) {
        <div style="text-align:center;padding:48px 24px;border:1.5px dashed var(--linha);border-radius:16px;background:rgba(250,251,247,.6);">
          <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:22px;margin-bottom:8px;">Nenhuma oferta nesse filtro ainda</div>
          <p style="margin:0 auto 18px;max-width:42ch;font-size:16px;line-height:1.5;color:var(--tinta-muda);">Anuncie seu excedente e seja o primeiro do seu bioma — quem tem déficit vai te encontrar.</p>
          <button (click)="s.anunciar()" style="min-height:50px;padding:0 22px;border-radius:10px;background:var(--mata);color:#FAFBF7;font-weight:700;font-size:16px;">Anunciar excedente</button>
        </div>
      }
    </section>
  `,
})
export class MarketplaceComponent {
  s = inject(AppState);
  filters: { v: UiFilter; label: string }[] = [
    { v: 'todos', label: 'Tudo' },
    { v: 'venda', label: 'Venda (CRA)' },
    { v: 'aluguel', label: 'Aluguel' },
  ];
  biomas: { v: UiBioma; label: string }[] = [
    { v: 'todos', label: 'Todos' },
    { v: 'Cerrado', label: 'Cerrado' },
    { v: 'Caatinga', label: 'Caatinga' },
    { v: 'Amazônia', label: 'Amazônia' },
    { v: 'Mata Atlântica', label: 'Mata Atlântica' },
  ];

  deficit() {
    return this.s.diagnostico()?.deficitHa ?? 0;
  }
  bioma() {
    return this.s.property()?.bioma ?? 'Cerrado';
  }
  isVenda(o: Oferta) {
    return o.tipoOferta === 'venda';
  }
  prazoLabel(o: Oferta) {
    const anos = Math.round((o.prazoMeses ?? 0) / 12);
    return `${anos} anos`;
  }
}
