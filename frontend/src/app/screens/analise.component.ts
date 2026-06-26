import { Component, inject } from '@angular/core';
import { AppState } from '../core/state.service';
import { Pendencia } from '../core/types';

const TITULO: Record<string, string> = {
  reserva_legal: 'Reserva Legal abaixo do mínimo',
  app: 'APP do córrego sem recomposição',
  embargo: 'Sem sobreposição com embargo',
};

@Component({
  selector: 'app-analise',
  standalone: true,
  template: `
    <section data-screen-label="Análise Completa" style="max-width:1100px;margin:0 auto;padding:22px clamp(16px,4vw,40px) 80px;">
      <div style="display:inline-flex;align-items:center;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--valor-tx);background:rgba(201,162,39,.14);border-radius:999px;padding:6px 13px;margin-bottom:14px;">★ Análise Completa</div>
      <h1 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(28px,4vw,40px);letter-spacing:-.02em;margin:0;line-height:1.05;">Envie o arquivo .CAR completo</h1>
      <p style="margin:10px 0 24px;font-size:18px;line-height:1.5;color:var(--tinta-muda);max-width:58ch;">A consulta pública já te deu o diagnóstico. Com o arquivo completo, mostramos as <strong style="color:var(--tinta);">pendências oficiais</strong> e geramos a <strong style="color:var(--tinta);">retificação</strong>.</p>

      <div style="display:flex;flex-wrap:wrap;gap:clamp(16px,2.4vw,28px);align-items:flex-start;">
        <div style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:16px;">
          <div style="background:rgba(45,111,166,.06);border:1.5px solid rgba(45,111,166,.28);border-radius:14px;padding:16px 18px;">
            <div style="display:flex;align-items:center;gap:9px;font-weight:700;font-size:16px;margin-bottom:8px;"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.2" stroke="#2D6FA6" stroke-width="1.6"/><path d="M9 8v4" stroke="#2D6FA6" stroke-width="1.7" stroke-linecap="round"/><circle cx="9" cy="5.6" r="1" fill="#2D6FA6"/></svg>Por que o arquivo completo?</div>
            <p style="margin:0;font-size:15.5px;line-height:1.55;color:var(--tinta-muda);">Ele traz a <strong style="color:var(--agua);">etapa Geo</strong> — os polígonos da sua Reserva Legal e das APPs. O demonstrativo simplificado (PDF) não tem essa geometria, então não dá para calcular pendências nem retificar.</p>
          </div>
          <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:14px;padding:16px 18px 18px;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--tinta-muda);margin-bottom:14px;">Como obter na Central do Proprietário</div>
            <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;">
              @for (step of steps; track $index) {
                <li style="display:flex;gap:12px;align-items:flex-start;">
                  <span aria-hidden="true" [style.background]="$index === steps.length - 1 ? 'var(--mata)' : 'var(--tinta)'" style="flex:none;width:26px;height:26px;border-radius:50%;color:var(--papel);display:grid;place-items:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;">{{ $index + 1 }}</span>
                  <span style="font-size:15.5px;line-height:1.45;" [innerHTML]="step"></span>
                </li>
              }
            </ol>
          </div>
        </div>

        <div style="flex:1 1 320px;min-width:0;">
          <input #fileInput type="file" accept=".car,.ret,.zip" hidden (change)="onPick($event)">

          @if (s.uploadState() === 'idle') {
            <button (click)="fileInput.click()" (drop)="onDrop($event)" (dragover)="$event.preventDefault()" style="width:100%;min-height:300px;border:2px dashed var(--linha);border-radius:16px;background:rgba(250,251,247,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:30px;text-align:center;">
              <span aria-hidden="true" style="width:56px;height:56px;border-radius:14px;background:rgba(31,141,73,.12);display:grid;place-items:center;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 16V5M12 5 8 9m4-4 4 4" stroke="#1F8D49" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" stroke="#1F8D49" stroke-width="1.9" stroke-linecap="round"/></svg></span>
              <span style="font-weight:700;font-size:18px;color:var(--tinta);">Arraste o arquivo .CAR aqui</span>
              <span style="font-size:15px;color:var(--tinta-muda);">ou toque para selecionar</span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--tinta-muda);margin-top:4px;">.car · até 50 MB</span>
            </button>
          }

          @if (s.uploadState() === 'uploading') {
            <div role="status" style="width:100%;min-height:300px;border:1.5px solid var(--linha);border-radius:16px;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:30px;text-align:center;">
              <span aria-hidden="true" style="width:44px;height:44px;border-radius:50%;border:3.5px solid var(--linha);border-top-color:var(--mata);animation:scSpin .8s linear infinite;"></span>
              <span style="font-weight:600;font-size:16px;">Lendo a geometria (RL e APP)…</span>
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--tinta-muda);">{{ s.uploadFileName() }}</span>
            </div>
          }

          @if (s.uploadState() === 'done') {
            <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:18px;">
              <div style="display:flex;align-items:center;gap:9px;margin-bottom:14px;"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-8" stroke="#1F8D49" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-weight:700;font-size:16px;">Arquivo lido · {{ s.uploadPendencias().length }} itens analisados</span></div>
              <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                @for (pen of s.uploadPendencias(); track $index) {
                  <div style="display:flex;gap:11px;align-items:flex-start;padding:12px;border-radius:10px;" [style.background]="penBg(pen)" [style.border]="'1px solid ' + penBorder(pen)">
                    <span aria-hidden="true" [style.background]="penIconBg(pen)" [style.color]="pen.gravidade === 'ok' ? '#fff' : (pen.tipo === 'app' ? '#3a2e08' : '#fff')" style="flex:none;width:22px;height:22px;border-radius:6px;display:grid;place-items:center;font-weight:700;font-size:13px;">{{ pen.gravidade === 'ok' ? '✓' : '!' }}</span>
                    <div>
                      <div style="font-weight:600;font-size:15px;" [style.color]="penTitleColor(pen)">{{ titulo(pen) }}</div>
                      <div style="font-size:13.5px;color:var(--tinta-muda);line-height:1.4;">{{ pen.descricao }}</div>
                    </div>
                  </div>
                }
              </div>
              @if (s.retDone()) {
                <div style="background:#F4F6F2;border:1px solid var(--linha);border-radius:11px;padding:14px;">
                  <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;margin-bottom:8px;"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-8" stroke="#1F8D49" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Minuta de retificação gerada</div>
                  <div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;line-height:1.6;color:var(--tinta-muda);border-left:2px solid var(--mata);padding-left:10px;margin-bottom:12px;">
                    @if (s.retMinuta(); as itens) {
                      @for (item of itens; track $index) { {{ item }}<br> }
                    } @else {
                      retificacao_{{ codShort() }}.pdf<br>RL proposta: {{ rlProposta() }} ha · APP: +1,2 ha<br>compensação: CRA {{ deficit() }} ha
                    }
                  </div>
                  <button style="width:100%;min-height:48px;border-radius:9px;background:var(--tinta);color:var(--papel);font-weight:600;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px;"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m0 0L5 7m3 3 3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12v1.5h10V12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Baixar minuta (.pdf)</button>
                </div>
              } @else {
                <button (click)="s.genRet()" style="width:100%;min-height:52px;border-radius:10px;background:var(--mata);color:#FAFBF7;font-weight:700;font-size:16px;display:inline-flex;align-items:center;justify-content:center;gap:9px;">
                  Gerar retificação do CAR
                  @if (!s.loggedIn()) {<svg width="14" height="16" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="currentColor" stroke-width="1.6"/></svg>}
                </button>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class AnaliseComponent {
  s = inject(AppState);
  steps = [
    'Acesse a Central do Proprietário no SICAR e entre com <strong>gov.br</strong>.',
    'Selecione o imóvel e clique em <strong>Baixar</strong>.',
    'Baixe o arquivo <strong>completo (.car)</strong> — não o PDF simplificado.',
    'Volte aqui e <strong>envie o arquivo</strong> ao lado.',
  ];

  onPick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.s.startUpload(file);
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    this.s.startUpload(file);
  }

  titulo(p: Pendencia) {
    return TITULO[p.tipo] ?? p.tipo;
  }
  private isOk(p: Pendencia) {
    return p.gravidade === 'ok';
  }
  private isGold(p: Pendencia) {
    return !this.isOk(p) && p.tipo === 'app';
  }
  penBg(p: Pendencia) {
    return this.isOk(p) ? 'rgba(31,141,73,.08)' : this.isGold(p) ? 'rgba(201,162,39,.1)' : 'rgba(200,68,43,.07)';
  }
  penBorder(p: Pendencia) {
    return this.isOk(p) ? 'rgba(31,141,73,.25)' : this.isGold(p) ? 'rgba(201,162,39,.35)' : 'rgba(200,68,43,.25)';
  }
  penIconBg(p: Pendencia) {
    return this.isOk(p) ? 'var(--mata)' : this.isGold(p) ? 'var(--valor)' : 'var(--deficit)';
  }
  penTitleColor(p: Pendencia) {
    return this.isOk(p) ? 'var(--mata-tx)' : this.isGold(p) ? 'var(--valor-tx)' : 'var(--deficit-tx)';
  }

  codShort() {
    return (this.s.property()?.codImovel ?? 'CAR').split('-').slice(0, 2).join('-');
  }
  deficit() {
    return (this.s.diagnostico()?.deficitHa ?? 8).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }
  rlProposta() {
    return (this.s.diagnostico()?.rlExigidaHa ?? 12.5).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }
}
