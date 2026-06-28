import { Component, computed, inject } from '@angular/core';
import { HaPipe } from '../core/format.pipes';
import { AppState } from '../core/state.service';
import { Cobertura } from '../core/types';
import { ParcelMapComponent } from './parcel-map.component';

const CLASSE_COLOR: Record<string, string> = {
  consolidada: '#E0C97F',
  floresta: '#1F8D49',
  savanica: '#7DC975',
  vegetacao: '#7DC975',
  campo: '#D6BC74',
  agua: '#2D6FA6',
  app: '#2D6FA6',
};

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [ParcelMapComponent, HaPipe],
  template: `
    @if (p(); as prop) {
    <section data-screen-label="Painel" style="max-width:1280px;margin:0 auto;padding:22px clamp(16px,4vw,40px) 80px;">

      @if (s.offline()) {
        <div style="margin-bottom:14px;padding:9px 14px;border-radius:10px;background:rgba(201,162,39,.12);border:1px solid rgba(201,162,39,.4);font-size:13.5px;color:var(--valor-tx);font-family:'IBM Plex Mono',monospace;">
          Modo demonstração (servidor offline) — dados ilustrativos.
        </div>
      }

      <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 20px;margin-bottom:18px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--tinta-muda);margin-bottom:7px;">
            <span style="display:inline-flex;align-items:center;gap:6px;color:var(--mata-tx);"><span aria-hidden="true" style="width:7px;height:7px;border-radius:50%;background:var(--mata);"></span> Imóvel localizado</span>
            <span aria-hidden="true">·</span>
            <span>Bioma {{ prop.bioma }}</span>
          </div>
          <h1 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(28px,4vw,40px);letter-spacing:-.02em;margin:0;line-height:1.05;">{{ prop.nome }}</h1>
          <div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font-family:'IBM Plex Mono',monospace;font-size:13.5px;color:var(--tinta-muda);">
            <span style="color:var(--tinta);">{{ prop.codImovel }}</span>
            <span aria-hidden="true" style="color:var(--linha);">|</span>
            <span>{{ prop.municipio }} · {{ prop.uf }}</span>
            <span aria-hidden="true" style="color:var(--linha);">|</span>
            <span style="color:var(--tinta);">Área: {{ prop.areaHa | ha:2 }}</span>
          </div>
        </div>
        <button (click)="s.goHome()" style="display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1.5px solid var(--linha);border-radius:9px;background:var(--card);font-weight:600;font-size:14px;color:var(--tinta-muda);">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="m11 11 3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          Consultar outro imóvel
        </button>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:clamp(16px,2.2vw,24px);align-items:stretch;">

        <!-- LIVING MAP -->
        <div style="flex:2 1 480px;min-width:0;">
          <app-parcel-map></app-parcel-map>
        </div>

        <!-- ASIDE READOUT -->
        <aside role="complementary" aria-label="Diagnóstico da propriedade" style="flex:1 1 340px;min-width:0;display:flex;flex-direction:column;gap:14px;">

          <!-- SELO DE CONFORMIDADE -->
          <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:20px 20px 22px;text-align:center;box-shadow:0 1px 2px rgba(27,32,24,.04);">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tinta-muda);margin-bottom:6px;">Selo de Conformidade</div>
            <div style="width:188px;height:188px;margin:6px auto 4px;position:relative;display:grid;place-items:center;">
              <div aria-hidden="true" style="position:absolute;inset:0;border-radius:50%;border:2px dashed rgba(201,162,39,.35);"></div>
              <svg viewBox="0 0 200 200" width="188" height="188" style="position:relative;animation:scStamp .65s cubic-bezier(.2,.7,.3,1.5) both;transform-origin:center" role="img" [attr.aria-label]="'Pontuação ' + d().score + ' de 100. Status: ' + s.faixa() + '.'">
                <defs>
                  <path id="scArcTop" d="M37,100 A63,63 0 0 1 163,100"/>
                  <path id="scArcBot" d="M30,108 A70,70 0 0 0 170,108"/>
                </defs>
                <circle cx="100" cy="100" r="92" fill="none" [attr.stroke]="seloStroke()" stroke-width="3"/>
                <circle cx="100" cy="100" r="86" fill="none" [attr.stroke]="seloStroke()" stroke-width="6" stroke-dasharray="2 8" opacity=".55"/>
                <circle cx="100" cy="100" r="79" fill="none" [attr.stroke]="seloStroke()" stroke-width="1.5"/>
                <text font-family="'IBM Plex Mono',monospace" font-size="9.5" letter-spacing="3" [attr.fill]="seloText()" opacity=".8"><textPath href="#scArcTop" startOffset="50%" text-anchor="middle">SELO DE CONFORMIDADE</textPath></text>
                <text font-family="'IBM Plex Mono',monospace" font-size="9.5" letter-spacing="3" [attr.fill]="seloText()" opacity=".8"><textPath href="#scArcBot" startOffset="50%" text-anchor="middle">CÓDIGO FLORESTAL</textPath></text>
                <text x="100" y="112" text-anchor="middle" font-family="'Bricolage Grotesque',sans-serif" font-weight="800" font-size="62" [attr.fill]="seloText()">{{ d().score }}</text>
                <text x="100" y="138" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="11" letter-spacing="2" [attr.fill]="seloText()" opacity=".85">DE 100</text>
              </svg>
            </div>
            <div style="display:inline-flex;align-items:center;gap:8px;margin-top:8px;padding:7px 14px;border-radius:999px;" [style.background]="seloStroke() + '24'" [style.border]="'1.5px solid ' + seloStroke() + '80'">
              <span style="font-weight:700;font-size:16px;" [style.color]="s.faixaColor()">{{ s.faixa() }}</span>
            </div>
            @if (d().score >= 80) {
              <p style="margin:12px 0 0;font-size:14px;color:var(--tinta-muda);line-height:1.45;">Seu imóvel está <span style="color:var(--mata-tx);font-weight:600;">em dia</span> com o Código Florestal.</p>
            } @else {
              <p style="margin:12px 0 0;font-size:14px;color:var(--tinta-muda);line-height:1.45;">{{ itensResolver() }} {{ itensResolver() === 1 ? 'item' : 'itens' }} a resolver para chegar ao selo <span style="color:var(--mata-tx);font-weight:600;">Em dia</span>.</p>
            }
          </div>

          <!-- DIAGNÓSTICO IA -->
          <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:18px 18px 20px;box-shadow:0 1px 2px rgba(27,32,24,.04);">
            <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;">
              <span style="display:inline-grid;place-items:center;width:28px;height:28px;border-radius:7px;background:rgba(31,141,73,.12);" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8 6.4 6.4Z" fill="#1F8D49"/></svg></span>
              <div>
                <div style="font-weight:700;font-size:16px;line-height:1.1;">Diagnóstico</div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;color:var(--tinta-muda);">explicado em linguagem simples</div>
              </div>
            </div>
            <p style="margin:0;font-size:18px;line-height:1.5;color:var(--tinta);text-wrap:pretty;">{{ d().textoIa }}</p>
            @if (s.camposFutebol() > 0) {
              <div style="margin-top:14px;padding:12px;background:rgba(31,141,73,.06);border:1px solid rgba(31,141,73,.18);border-radius:10px;">
                <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;" aria-hidden="true">
                  @for (b of campoBlocks(); track $index) {
                    <span style="width:30px;height:20px;border-radius:3px;border:1px solid #14532D;background:linear-gradient(90deg,#1F8D49 48%,rgba(255,255,255,.55) 48%,rgba(255,255,255,.55) 52%,#1F8D49 52%);"></span>
                  }
                </div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--mata-tx);">≈ {{ s.camposFutebol() }} campos de futebol · {{ d().deficitHa | ha:1 }} a recuperar</div>
              </div>
            }
          </div>

          <!-- HOOK -->
          @if (d().situacao === 'deficit') {
            <div style="background:linear-gradient(180deg,rgba(200,68,43,.06),rgba(250,251,247,1) 60%);border:1.5px solid rgba(200,68,43,.35);border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(27,32,24,.04);">
              <div style="display:inline-flex;align-items:center;gap:7px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--deficit-tx);margin-bottom:9px;">
                <span aria-hidden="true" style="width:8px;height:8px;border-radius:2px;background:repeating-linear-gradient(45deg,#C8442B 0 3px,transparent 3px 6px);border:1px solid #C8442B;"></span>
                Déficit de Reserva Legal
              </div>
              <p style="margin:0 0 14px;font-size:18px;line-height:1.45;font-weight:600;text-wrap:pretty;">Você tem <strong style="color:var(--deficit-tx);">{{ d().deficitHa | ha:1 }} de déficit</strong>. Compensar costuma sair bem mais barato que recompor.</p>
              <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:14px;margin-bottom:4px;"><span>Recompor (replantar)</span><span style="font-family:'IBM Plex Mono',monospace;color:var(--deficit-tx);font-weight:600;">~{{ vRecompor() }}</span></div>
                  <div style="height:8px;border-radius:4px;background:#EFE9E2;overflow:hidden;"><div style="width:100%;height:100%;background:var(--deficit);"></div></div>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:14px;margin-bottom:4px;"><span>Comprar cota (<button (click)="s.openTip('cra')" style="color:var(--agua);font-weight:600;text-decoration:underline dotted;text-underline-offset:2px;padding:0;" aria-label="O que é CRA?">CRA</button>)</span><span style="font-family:'IBM Plex Mono',monospace;color:var(--valor-tx);font-weight:600;">~{{ vCra() }}</span></div>
                  <div style="height:8px;border-radius:4px;background:#EFE9E2;overflow:hidden;"><div style="width:42%;height:100%;background:var(--valor);"></div></div>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:14px;margin-bottom:4px;"><span style="display:inline-flex;align-items:center;gap:6px;">Alugar de vizinho <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.04em;background:rgba(31,141,73,.14);color:var(--mata-tx);padding:2px 6px;border-radius:4px;">+ barato</span></span><span style="font-family:'IBM Plex Mono',monospace;color:var(--mata-tx);font-weight:600;">~{{ vAluguel() }}/ano</span></div>
                  <div style="height:8px;border-radius:4px;background:#EFE9E2;overflow:hidden;"><div style="width:12%;height:100%;background:var(--mata);"></div></div>
                </div>
              </div>
              <button (click)="s.compensar()" style="width:100%;min-height:52px;border-radius:10px;background:var(--deficit);color:#FFF;font-weight:700;font-size:17px;display:inline-flex;align-items:center;justify-content:center;gap:9px;">
                Compensar déficit <span aria-hidden="true">→</span>
              </button>
              @if (!s.loggedIn()) {
                <div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:10px;font-size:13px;color:var(--tinta-muda);">
                  <svg width="13" height="14" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="#4A4F44" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="#4A4F44" stroke-width="1.6"/></svg>
                  Entre com gov.br para agir — o diagnóstico é livre.
                </div>
              }
            </div>
          } @else {
            <div style="background:linear-gradient(180deg,rgba(31,141,73,.07),rgba(250,251,247,1) 60%);border:1.5px solid rgba(31,141,73,.35);border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(27,32,24,.04);">
              <div style="display:inline-flex;align-items:center;gap:7px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--mata-tx);margin-bottom:9px;">
                <span aria-hidden="true" style="width:8px;height:8px;border-radius:2px;background:var(--mata);"></span>
                {{ d().situacao === 'excedente' ? 'Excedente de Reserva Legal' : 'Reserva Legal em dia' }}
              </div>
              <p style="margin:0 0 14px;font-size:18px;line-height:1.45;font-weight:600;text-wrap:pretty;">
                @if (d().situacao === 'excedente') {
                  Você tem <strong style="color:var(--mata-tx);">{{ d().excedenteHa | ha:1 }} de excedente</strong> de mata. Isso pode virar renda — anuncie uma cota (CRA) ou alugue para um vizinho com déficit.
                } @else {
                  Sua Reserva Legal cumpre o exigido pelo Código Florestal. Nada a regularizar por aqui.
                }
              </p>
              <button (click)="s.anunciar()" style="width:100%;min-height:52px;border-radius:10px;background:var(--mata);color:#FAFBF7;font-weight:700;font-size:17px;display:inline-flex;align-items:center;justify-content:center;gap:9px;">
                Anunciar excedente <span aria-hidden="true">→</span>
              </button>
              @if (!s.loggedIn()) {
                <div style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:10px;font-size:13px;color:var(--tinta-muda);">
                  <svg width="13" height="14" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="#4A4F44" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="#4A4F44" stroke-width="1.6"/></svg>
                  Entre com gov.br para agir — o diagnóstico é livre.
                </div>
              }
            </div>
          }

          <!-- LEGENDA + PROVENIÊNCIA -->
          <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:16px 16px 14px;box-shadow:0 1px 2px rgba(27,32,24,.04);">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--tinta-muda);margin-bottom:8px;">Cobertura do solo</div>
            <div style="display:flex;flex-direction:column;">
              @for (c of d().coberturas; track c.classe) {
                <div style="display:flex;align-items:center;gap:10px;padding:7px 6px;border-radius:8px;">
                  <span aria-hidden="true" style="flex:none;width:16px;height:16px;border-radius:4px;border:1px solid rgba(27,32,24,.15);" [style.background]="classeColor(c)"></span>
                  <span style="flex:1;font-size:15px;">{{ c.label }}</span>
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--tinta);">{{ c.areaHa | ha:1 }}</span>
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.04em;width:62px;text-align:right;" [style.color]="fonteColor(c.fonte)">{{ fonteLabel(c.fonte) }}</span>
                </div>
              }
              @if (d().deficitHa > 0.05) {
                <div style="display:flex;align-items:center;gap:10px;padding:7px 6px;border-radius:8px;border-top:1px dashed var(--linha);margin-top:2px;">
                  <span aria-hidden="true" style="flex:none;width:16px;height:16px;border-radius:4px;background:repeating-linear-gradient(45deg,#C8442B 0 3px,#F5DAD3 3px 6px);border:1px solid #C8442B;"></span>
                  <span style="flex:1;font-size:15px;color:var(--deficit-tx);font-weight:600;">Déficit de RL</span>
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--deficit-tx);">{{ d().deficitHa | ha:1 }}</span>
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.04em;color:var(--deficit-tx);width:62px;text-align:right;">calculado</span>
                </div>
              }
            </div>
            <p style="margin:10px 6px 0;font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.5;color:var(--tinta-muda);"><strong style="color:var(--tinta);">declarado</strong> = informado no CAR · <strong style="color:var(--agua);">● satélite</strong> = MapBiomas · <strong style="color:var(--deficit-tx);">calculado</strong> = Lei 12.651</p>
          </div>

          <!-- AÇÕES OFICIAIS (gated) -->
          <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:16px;box-shadow:0 1px 2px rgba(27,32,24,.04);">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--tinta-muda);margin-bottom:10px;">Ir além do diagnóstico</div>
            <button (click)="s.verPendencias()" style="width:100%;display:flex;align-items:center;gap:11px;min-height:52px;padding:0 14px;border:1.5px solid var(--linha);border-radius:10px;background:#fff;text-align:left;margin-bottom:9px;">
              <span style="flex:1;font-weight:600;font-size:15px;">Ver pendências oficiais</span>
              @if (!s.loggedIn()) {<svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="#4A4F44" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="#4A4F44" stroke-width="1.6"/></svg>}
              @else {<span aria-hidden="true" style="color:var(--tinta-muda);">→</span>}
            </button>
            <button (click)="s.gerarRetificacao()" style="width:100%;display:flex;align-items:center;gap:11px;min-height:52px;padding:0 14px;border:1.5px solid var(--linha);border-radius:10px;background:#fff;text-align:left;margin-bottom:12px;">
              <span style="flex:1;font-weight:600;font-size:15px;">Gerar retificação do CAR</span>
              @if (!s.loggedIn()) {<svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="#4A4F44" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="#4A4F44" stroke-width="1.6"/></svg>}
              @else {<span aria-hidden="true" style="color:var(--tinta-muda);">→</span>}
            </button>
            <button (click)="s.go('analise')" style="width:100%;min-height:50px;border-radius:10px;background:var(--tinta);color:var(--papel);font-weight:600;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:9px;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 11V3M8 3 5 6M8 3l3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              Enviar arquivo .CAR completo
            </button>
            <p style="margin:9px 2px 0;font-size:12.5px;line-height:1.45;color:var(--tinta-muda);">Pendências e retificação usam o arquivo completo do imóvel.</p>
          </div>

        </aside>
      </div>
    </section>
    }
  `,
})
export class PainelComponent {
  s = inject(AppState);
  p = this.s.property;
  d = computed(() => this.s.diagnostico()!);

  campoBlocks = computed(() => Array.from({ length: Math.min(this.s.camposFutebol(), 16) }));

  itensResolver = computed(() => {
    const d = this.d();
    let n = 0;
    if (d.deficitHa > 0.05) n++;
    if (d.appRecomporHa > 0.05) n++;
    return n || 1;
  });

  seloStroke = computed(() => {
    const s = this.d().score;
    return s >= 80 ? '#1F8D49' : s >= 50 ? '#C9A227' : '#C8442B';
  });
  seloText = computed(() => {
    const s = this.d().score;
    return s >= 80 ? '#14532D' : s >= 50 ? '#8A6D12' : '#8F2D1B';
  });

  // Illustrative compensation costs (mockup: 8 ha => 96k / 40k / 6k/ano).
  private money(n: number) {
    const v = n / 1000;
    const dec = Number.isInteger(v) ? 0 : 1;
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })} mil`;
  }
  vRecompor = computed(() => this.money(this.d().deficitHa * 12000));
  vCra = computed(() => this.money(this.d().deficitHa * 5000));
  vAluguel = computed(() => this.money(this.d().deficitHa * 750));

  classeColor(c: Cobertura) {
    return CLASSE_COLOR[c.classe] ?? '#7DC975';
  }
  fonteLabel(f: string) {
    return f === 'satelite' ? '● satélite' : f === 'calculado' ? 'calculado' : 'declarado';
  }
  fonteColor(f: string) {
    return f === 'satelite' ? 'var(--agua)' : f === 'calculado' ? 'var(--deficit-tx)' : 'var(--tinta-muda)';
  }
}
