import { Component } from '@angular/core';

// Pitch screen with fixed illustrative data (mockup §"Corredores").
@Component({
  selector: 'app-corridor',
  standalone: true,
  template: `
    <section data-screen-label="Corredores" style="max-width:1280px;margin:0 auto;padding:22px clamp(16px,4vw,40px) 80px;">
      <div style="display:inline-flex;align-items:center;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--mata-tx);background:rgba(31,141,73,.12);border-radius:999px;padding:6px 13px;margin-bottom:14px;">Impacto coletivo</div>
      <h1 style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(28px,4vw,40px);letter-spacing:-.02em;margin:0;line-height:1.05;max-width:18ch;">Cada pareamento puxa um corredor de mata</h1>
      <p style="margin:10px 0 22px;font-size:18px;line-height:1.5;color:var(--tinta-muda);max-width:60ch;">Quando vizinhos casam déficit e excedente, a recomposição é empurrada para onde <strong style="color:var(--tinta);">conecta fragmentos</strong> — formando corredores por onde a fauna volta a circular.</p>

      <div style="display:flex;flex-wrap:wrap;gap:clamp(16px,2.2vw,24px);align-items:stretch;">
        <div style="flex:2 1 460px;min-width:0;">
          <div style="position:relative;border-radius:16px;overflow:hidden;background:var(--tinta);border:1.5px solid #2A3024;box-shadow:0 24px 50px -28px rgba(27,32,24,.7);">
            <div style="position:absolute;top:14px;left:16px;z-index:2;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(250,251,247,.85);">Oeste da Bahia · Cerrado</div>
            <svg viewBox="0 0 1000 620" width="100%" style="display:block;height:auto" role="img" aria-label="Mapa regional do Oeste da Bahia mostrando propriedades conectadas formando um corredor de 18 km ao longo do rio.">
              <defs>
                <pattern id="scGrid2" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="#FAFBF7" stroke-width="1" opacity=".5"/></pattern>
                <pattern id="scHatch2" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="13" height="13" fill="#C8442B" opacity=".22"/><line x1="0" y1="0" x2="0" y2="13" stroke="#C8442B" stroke-width="5"/></pattern>
              </defs>
              <rect width="1000" height="620" fill="#1B2018"/>
              <rect width="1000" height="620" fill="url(#scGrid2)" opacity=".5"/>
              <path d="M120,235 C320,150 500,300 700,250 C800,225 880,300 920,300" fill="none" stroke="#1F8D49" stroke-width="58" stroke-linecap="round" opacity=".22" style="animation:scFade .8s ease both"/>
              <path d="M80,120 C260,200 220,360 420,420 C600,470 640,560 900,540" fill="none" stroke="#2D6FA6" stroke-width="5" stroke-linecap="round" opacity=".85"/>
              <g style="animation:scFade .6s ease both;animation-delay:.5s">
                <path d="M345,330 L360,270" stroke="#7DC975" stroke-width="2.5" stroke-dasharray="4 5" fill="none"/><polygon points="360,262 355,274 366,272" fill="#7DC975"/>
                <path d="M605,330 L640,272" stroke="#7DC975" stroke-width="2.5" stroke-dasharray="4 5" fill="none"/><polygon points="643,264 635,275 646,277" fill="#7DC975"/>
              </g>
              <g style="animation:scFade .6s ease both;animation-delay:.15s">
                <polygon points="120,185 215,168 228,240 133,258" fill="#1F8D49"/>
                <polygon points="252,158 348,148 358,216 262,228" fill="#7DC975"/>
                <polygon points="512,178 602,172 612,242 520,250" fill="#1F8D49"/>
                <polygon points="640,214 732,208 742,280 650,288" fill="#7DC975"/>
                <polygon points="772,256 862,256 868,326 778,328" fill="#1F8D49"/>
              </g>
              <g style="animation:scFade .6s ease both;animation-delay:.35s">
                <polygon points="300,335 392,335 400,405 307,409" fill="url(#scHatch2)" stroke="#C8442B" stroke-width="2"/>
                <polygon points="560,335 652,335 660,406 568,410" fill="url(#scHatch2)" stroke="#C8442B" stroke-width="2"/>
              </g>
              <polygon points="170,365 256,365 263,428 177,431" fill="#E0C97F" opacity=".55"/>
              <polygon points="700,366 792,366 799,432 706,434" fill="#E0C97F" opacity=".55"/>
              <g style="animation:scFade .6s ease both;animation-delay:.7s">
                <polygon points="382,202 472,196 481,270 390,278" fill="#1F8D49" stroke="#FAFBF7" stroke-width="3"/>
                <circle cx="430" cy="172" r="5" fill="#FAFBF7"/>
                <text x="430" y="160" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="14" font-weight="600" letter-spacing=".5" fill="#FAFBF7">SEU IMÓVEL</text>
              </g>
              <text x="350" y="445" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="12" fill="#E9B7AC">déficit recompõe aqui ↑</text>
            </svg>
          </div>
        </div>

        <aside style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:14px;">
          <div style="background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(27,32,24,.04);">
            <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:clamp(44px,7vw,60px);letter-spacing:-.03em;line-height:.95;color:var(--mata-tx);">18 km</div>
            <div style="font-size:16px;color:var(--tinta-muda);margin-top:4px;">de corredor contínuo de mata nativa nesta microbacia.</div>
            <div style="display:flex;gap:10px;margin-top:18px;">
              <div style="flex:1;background:rgba(31,141,73,.08);border-radius:11px;padding:12px;"><div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:24px;">34</div><div style="font-size:12.5px;color:var(--tinta-muda);line-height:1.3;">pareamentos fechados</div></div>
              <div style="flex:1;background:rgba(31,141,73,.08);border-radius:11px;padding:12px;"><div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:24px;">1.240 ha</div><div style="font-size:12.5px;color:var(--tinta-muda);line-height:1.3;">recompostos onde conectam</div></div>
            </div>
          </div>
          <div style="background:rgba(31,141,73,.06);border:1.5px solid rgba(31,141,73,.3);border-radius:16px;padding:18px;">
            <div style="display:flex;align-items:center;gap:9px;font-weight:700;font-size:16px;margin-bottom:8px;"><span style="width:14px;height:14px;border-radius:4px;background:#1F8D49;border:2px solid #FAFBF7;box-shadow:0 0 0 1px #1F8D49;" aria-hidden="true"></span>Seu pareamento</div>
            <p style="margin:0;font-size:15.5px;line-height:1.55;color:var(--tinta);">Casar seu déficit com a reserva vizinha em Barreiras fecha um trecho de <strong style="color:var(--mata-tx);">1,9 km</strong> entre dois fragmentos — recomposição vira conexão, não mancha isolada.</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;background:var(--card);border:1.5px solid var(--linha);border-radius:16px;padding:16px;">
            <div style="display:flex;align-items:center;gap:9px;font-size:14px;"><span aria-hidden="true" style="width:14px;height:14px;border-radius:4px;background:#1F8D49;"></span>Mata conectada (corredor)</div>
            <div style="display:flex;align-items:center;gap:9px;font-size:14px;"><span aria-hidden="true" style="width:14px;height:14px;border-radius:4px;background:repeating-linear-gradient(45deg,#C8442B 0 3px,#F5DAD3 3px 6px);border:1px solid #C8442B;"></span>Déficit direcionado ao corredor</div>
            <div style="display:flex;align-items:center;gap:9px;font-size:14px;"><span aria-hidden="true" style="width:14px;height:14px;border-radius:4px;background:#2D6FA6;"></span>Hidrografia (eixo do corredor)</div>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class CorridorComponent {}
