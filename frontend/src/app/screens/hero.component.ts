import { Component, inject } from '@angular/core';
import { AppState } from '../core/state.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section data-screen-label="Abertura" style="max-width:1000px;margin:0 auto;padding:clamp(20px,4vw,56px) clamp(16px,4vw,40px) 72px;display:flex;flex-direction:column;align-items:center;text-align:center;">
      <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.16em;color:var(--tinta-muda);text-transform:uppercase;display:inline-flex;align-items:center;gap:9px;margin-bottom:22px;">
        <span aria-hidden="true" style="width:7px;height:7px;border-radius:50%;background:var(--mata);animation:scPulse 2.4s ease-in-out infinite;"></span>
        Cadastro Ambiental Rural · dado público
      </span>
      <h1 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(34px,7.2vw,68px);line-height:1.03;letter-spacing:-.025em;margin:0;max-width:14ch;text-wrap:balance;">Sua terra está em dia com a lei ambiental?</h1>
      <p style="font-size:clamp(18px,2.3vw,22px);line-height:1.5;color:var(--tinta-muda);max-width:34ch;margin:20px 0 0;text-wrap:pretty;">Descubra em segundos. De graça, sem cadastro, com dado público.</p>

      <div style="width:100%;max-width:640px;margin-top:38px;background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:clamp(18px,3vw,26px);box-shadow:0 1px 2px rgba(27,32,24,.04),0 18px 40px -28px rgba(27,32,24,.4);text-align:left;">
        <label for="carField" style="display:block;font-family:'IBM Plex Mono',monospace;font-size:12.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--tinta-muda);margin-bottom:11px;">Informe o número do CAR</label>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <input id="carField" type="text" autocomplete="off" spellcheck="false" placeholder="UF-0000000-0000.0000.0000.0000"
                 [value]="s.carInput()" (input)="s.carInput.set($any($event.target).value)" (keydown.enter)="s.consult()"
                 aria-label="Número do CAR"
                 style="flex:1 1 240px;min-width:0;min-height:58px;padding:0 16px;border:1.5px solid var(--linha);border-radius:10px;background:#fff;font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:.02em;color:var(--tinta);">
          <button (click)="s.consult()" style="flex:0 0 auto;min-height:58px;padding:0 26px;border-radius:10px;background:var(--mata);color:#FAFBF7;font-weight:700;font-size:18px;display:inline-flex;align-items:center;gap:9px;box-shadow:0 1px 0 rgba(20,83,45,.55);">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.8"/><path d="m12.5 12.5 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            Consultar
          </button>
        </div>
        <button (click)="s.consultExample()" style="margin-top:14px;display:inline-flex;align-items:center;gap:7px;font-size:15px;color:var(--agua);font-weight:600;padding:6px 2px;min-height:32px;">
          Não tem em mãos? Ver com um imóvel de exemplo
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <ul style="list-style:none;margin:34px 0 0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 12px;">
        @for (badge of badges; track badge) {
          <li style="display:inline-flex;align-items:center;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--tinta-muda);background:rgba(250,251,247,.7);border:1px solid var(--linha);border-radius:999px;padding:8px 14px;">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-8" stroke="#1F8D49" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ badge }}
          </li>
        }
      </ul>
    </section>
  `,
})
export class HeroComponent {
  s = inject(AppState);
  badges = ['Dados públicos do SICAR', 'Cobertura real via MapBiomas', 'Código Florestal · Lei 12.651/2012'];
}
