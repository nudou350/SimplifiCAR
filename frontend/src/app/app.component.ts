import { Component, inject } from '@angular/core';
import { ModalsComponent } from './components/modals.component';
import { AppState, Screen } from './core/state.service';
import { AnaliseComponent } from './screens/analise.component';
import { CorridorComponent } from './screens/corridor.component';
import { HeroComponent } from './screens/hero.component';
import { MarketplaceComponent } from './screens/marketplace.component';
import { PainelComponent } from './screens/painel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeroComponent,
    PainelComponent,
    MarketplaceComponent,
    AnaliseComponent,
    CorridorComponent,
    ModalsComponent,
  ],
  template: `
    <div style="--papel:#EFF1EB;--card:#FAFBF7;--tinta:#1B2018;--tinta-muda:#4A4F44;--linha:#D6DACE;--mata:#1F8D49;--mata-tx:#14532D;--agua:#2D6FA6;--deficit:#C8442B;--deficit-tx:#8F2D1B;--valor:#C9A227;--valor-tx:#8A6D12;font-family:'Public Sans',system-ui,-apple-system,sans-serif;color:var(--tinta);background:var(--papel);min-height:100vh;position:relative;overflow-x:hidden;-webkit-font-smoothing:antialiased;">

      <div aria-hidden="true" style="position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(#D6DACE 1px,transparent 1px),linear-gradient(90deg,#D6DACE 1px,transparent 1px);background-size:46px 46px;opacity:.4;"></div>
      <div aria-hidden="true" style="position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(120% 80% at 50% -10%,rgba(239,241,235,0) 40%,#EFF1EB 78%);"></div>

      <header role="banner" style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px clamp(16px,4vw,40px);max-width:1280px;margin:0 auto;">
        <a (click)="s.goHome()" aria-label="SimplifiCAR, página inicial" style="display:inline-flex;align-items:center;gap:7px;text-decoration:none;cursor:pointer;">
          <span style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(20px,2.4vw,25px);color:var(--tinta);letter-spacing:-.02em;">Simplifi</span>
          <span style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(20px,2.4vw,25px);color:#FAFBF7;background:var(--mata);border:1.5px solid var(--mata-tx);padding:0 8px 2px;border-radius:5px;letter-spacing:.06em;transform:rotate(-2deg);box-shadow:0 1.5px 0 rgba(20,83,45,.6),inset 0 0 0 2px rgba(250,251,247,.18);">CAR</span>
        </a>
        @if (!s.loggedIn()) {
          <button (click)="s.openLoginGeneric()" style="display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:1.5px solid var(--linha);border-radius:8px;background:var(--card);font-weight:600;font-size:15px;color:var(--tinta);">
            <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true"><rect x="1.5" y="7" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M4 7V4.5a3.5 3.5 0 1 1 7 0V7" stroke="currentColor" stroke-width="1.6"/></svg>
            Entrar com gov.br
          </button>
        } @else {
          <div style="display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:0 14px;border:1.5px solid var(--linha);border-radius:999px;background:var(--card);">
            <span style="width:28px;height:28px;border-radius:50%;background:var(--mata);color:#FAFBF7;display:grid;place-items:center;font-weight:700;font-size:13px;">JC</span>
            <span style="font-weight:600;font-size:14px;">João C. <span style="color:var(--tinta-muda);font-weight:500;">· gov.br</span></span>
          </div>
        }
      </header>

      @if (s.isApp()) {
        <nav aria-label="Seções do app" style="position:relative;z-index:4;border-top:1px solid var(--linha);border-bottom:1px solid var(--linha);background:rgba(250,251,247,.7);backdrop-filter:blur(5px);">
          <div style="max-width:1280px;margin:0 auto;display:flex;gap:2px;padding:0 clamp(8px,4vw,40px);overflow-x:auto;">
            @for (tab of tabs; track tab.screen) {
              <button (click)="s.go(tab.screen)" [attr.aria-current]="s.screen() === tab.screen ? 'page' : null"
                [style.color]="s.screen() === tab.screen ? '#1B2018' : '#4A4F44'"
                [style.fontWeight]="s.screen() === tab.screen ? '700' : '600'"
                [style.borderBottom]="'3px solid ' + (s.screen() === tab.screen ? '#1F8D49' : 'transparent')"
                style="flex:0 0 auto;min-height:50px;padding:0 16px;font-size:15px;white-space:nowrap;">{{ tab.label }}</button>
            }
          </div>
        </nav>
      }

      <main role="main" style="position:relative;z-index:2;">
        @switch (s.screen()) {
          @case ('hero') { <app-hero></app-hero> }
          @case ('painel') { <app-painel></app-painel> }
          @case ('marketplace') { <app-marketplace></app-marketplace> }
          @case ('analise') { <app-analise></app-analise> }
          @case ('corridor') { <app-corridor></app-corridor> }
        }
      </main>

      <app-modals></app-modals>
    </div>
  `,
})
export class AppComponent {
  s = inject(AppState);
  tabs: { screen: Screen; label: string }[] = [
    { screen: 'painel', label: 'Painel' },
    { screen: 'marketplace', label: 'Marketplace' },
    { screen: 'analise', label: 'Análise Completa' },
    { screen: 'corridor', label: 'Corredores' },
  ];
}
