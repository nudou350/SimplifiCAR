import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import * as L from 'leaflet';
import { AppState } from '../core/state.service';
import { GeoTipo } from '../core/types';

interface LayerEntry {
  layer: L.Path;
  threshold: number; // ignite step at which this layer fades in
  strokeOp: number;
  fillOp: number;
  strokeOnly: boolean;
}

// Maps raw SICAR tipos -> canonical tipos (contract §5). Backend already
// normalizes, this is a safety net for raw geometry.
function canonical(t: GeoTipo): GeoTipo {
  const s = String(t).toUpperCase();
  if (s.includes('SEDE')) return 'sede';
  if (s.startsWith('APP') || s.startsWith('RIO') || s.includes('HIDRO')) return 'app';
  if (s.includes('CONSOLIDADA')) return 'consolidada';
  if (s.includes('RECUPERAR') || s.includes('DEFICIT') || s === 'DEFICIT_RL') return 'deficit_rl';
  if (s.includes('RL') || s.includes('RESERVA') || s.includes('ARL')) return 'reserva_legal';
  if (s.includes('VEGETACAO') || s === 'VEGETACAO') return 'vegetacao';
  if (s.includes('IMOVEL') || s.includes('PERIMETRO')) return 'perimetro';
  return t;
}

// Canonical tipo -> Leaflet style + ignite threshold (contract §5 colours).
const TIPO_STYLE: Record<string, { color: string; fill?: string; weight: number; threshold: number; strokeOnly?: boolean; dash?: string; fillOp: number; strokeOp: number }> = {
  perimetro: { color: '#FAFBF7', weight: 3, threshold: 1, strokeOnly: true, dash: '8 6', fillOp: 0, strokeOp: 1 },
  app: { color: '#2D6FA6', fill: '#2D6FA6', weight: 3, threshold: 2, fillOp: 0.35, strokeOp: 0.9 },
  consolidada: { color: '#C9B36A', fill: '#E0C97F', weight: 1, threshold: 1, fillOp: 0.85, strokeOp: 0.6 },
  vegetacao: { color: '#5BB85B', fill: '#7DC975', weight: 1, threshold: 3, fillOp: 0.85, strokeOp: 0.7 },
  reserva_legal: { color: '#14532D', fill: '#1F8D49', weight: 1.5, threshold: 4, fillOp: 0.85, strokeOp: 0.8 },
  deficit_rl: { color: '#C8442B', fill: '#C8442B', weight: 2.5, threshold: 5, dash: '6 5', fillOp: 0.32, strokeOp: 1 },
  sede: { color: '#FAFBF7', fill: '#1B2018', weight: 2, threshold: 2, fillOp: 1, strokeOp: 1 },
};

// Human-readable label + 1-line explanation per canonical tipo, shown on hover
// so anyone (banca incluída) entende o que cada cor significa. Cor casa com TIPO_STYLE.
const TIPO_LABEL: Record<string, { nome: string; cor: string; desc: string }> = {
  perimetro: { nome: 'Perímetro do imóvel', cor: '#FAFBF7', desc: 'Os limites da propriedade declarados no CAR.' },
  app: { nome: 'APP — Área de Preservação Permanente', cor: '#2D6FA6', desc: 'Faixa protegida por lei (beira de rio, nascente, encosta). Não pode ser desmatada.' },
  consolidada: { nome: 'Área consolidada', cor: '#E0C97F', desc: 'Área já em uso (lavoura, pasto, construção) antes de 2008 — uso regularizável.' },
  vegetacao: { nome: 'Vegetação nativa', cor: '#7DC975', desc: 'Mata nativa existente detectada por satélite (MapBiomas).' },
  reserva_legal: { nome: 'Reserva Legal', cor: '#1F8D49', desc: 'Percentual do imóvel que a lei exige manter com mata nativa (20% aqui; 80% na Amazônia).' },
  deficit_rl: { nome: 'Déficit de Reserva Legal', cor: '#C8442B', desc: 'O que falta de mata para cumprir a lei. Vira demanda no marketplace (compensar via CRA ou aluguel).' },
  sede: { nome: 'Sede do imóvel', cor: '#FAFBF7', desc: 'Ponto da sede / benfeitoria principal.' },
};

// HTML do tooltip de uma feature (nome + área quando houver + explicação).
function tooltipHtml(tipo: string, areaHa?: number): string {
  const info = TIPO_LABEL[tipo];
  if (!info) return '';
  const area =
    typeof areaHa === 'number' && isFinite(areaHa) && areaHa > 0
      ? ` · ${areaHa.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`
      : '';
  return (
    `<span class="sc-tip-head"><i style="background:${info.cor}"></i>${info.nome}${area}</span>` +
    `<span class="sc-tip-desc">${info.desc}</span>`
  );
}

@Component({
  selector: 'app-parcel-map',
  standalone: true,
  template: `
    <div class="map-shell">
      <div class="map-badge">
        <span class="dot"></span> Vista cadastral · MapBiomas
      </div>
      <div #mapEl class="map-canvas" role="img"
           aria-label="Mapa cadastral do imóvel com as camadas de área consolidada, vegetação, Reserva Legal, APP e déficit."></div>
    </div>
  `,
  styles: [`
    .map-shell{position:relative;border-radius:16px;overflow:hidden;background:#1B2018;border:1.5px solid #2A3024;box-shadow:0 24px 50px -28px rgba(27,32,24,.7);}
    .map-badge{position:absolute;top:14px;left:16px;z-index:500;display:flex;align-items:center;gap:9px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(250,251,247,.85);pointer-events:none;}
    .map-badge .dot{width:7px;height:7px;border-radius:50%;background:#1F8D49;box-shadow:0 0 0 4px rgba(31,141,73,.25);animation:scPulse 2.4s ease-in-out infinite;}
    .map-canvas{height:540px;width:100%;background:#1B2018;background-image:linear-gradient(rgba(250,251,247,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(250,251,247,.06) 1px,transparent 1px);background-size:46px 46px;}
    .map-canvas .leaflet-container{background:transparent;font:inherit;}
    .map-canvas .leaflet-interactive{cursor:pointer;}
    :host ::ng-deep .sc-tip{background:#11150F;border:1px solid #3A4233;border-radius:9px;padding:8px 11px;max-width:248px;white-space:normal;box-shadow:0 14px 30px -12px rgba(0,0,0,.7);}
    :host ::ng-deep .sc-tip::before{display:none;}
    :host ::ng-deep .sc-tip .sc-tip-head{display:flex;align-items:center;gap:7px;font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:13px;color:#FAFBF7;line-height:1.25;}
    :host ::ng-deep .sc-tip .sc-tip-head i{width:10px;height:10px;border-radius:3px;flex:0 0 auto;border:1px solid rgba(250,251,247,.45);}
    :host ::ng-deep .sc-tip .sc-tip-desc{display:block;margin-top:4px;font-size:12px;line-height:1.4;color:rgba(250,251,247,.78);}
  `],
})
export class ParcelMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  private state = inject(AppState);
  private map?: L.Map;
  private entries: LayerEntry[] = [];
  private lastGeoRef: unknown = null;

  constructor() {
    // Rebuild layers whenever the consulted property changes.
    effect(() => {
      const prop = this.state.property();
      if (this.map && prop && prop.geo !== this.lastGeoRef) {
        this.lastGeoRef = prop.geo;
        this.render(prop.geo);
      }
    });
    // Fade layers in following the ignite sequence.
    effect(() => {
      const ig = this.state.ignite();
      this.applyIgnite(ig);
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([-15, -47], 5);
    const prop = this.state.property();
    if (prop) {
      this.lastGeoRef = prop.geo;
      this.render(prop.geo);
      this.applyIgnite(this.state.ignite());
    }
  }

  private render(geo: { features: any[] }): void {
    if (!this.map) return;
    this.entries.forEach((e) => this.map!.removeLayer(e.layer));
    this.entries = [];
    if (!geo?.features?.length) return;

    const bounds = L.latLngBounds([]);
    for (const f of geo.features) {
      const tipo = canonical(f.properties?.tipo);
      const st = TIPO_STYLE[tipo];
      if (!st) continue;
      const isPoint = f.geometry?.type === 'Point' || tipo === 'sede';
      let layer: L.Path;
      if (isPoint) {
        const c = f.geometry?.coordinates;
        if (!Array.isArray(c)) continue;
        layer = L.circleMarker([c[1], c[0]], { radius: 6, color: st.color, fillColor: st.fill, weight: st.weight });
      } else {
        layer = L.geoJSON(f as any, {
          style: () => ({
            color: st.color,
            weight: st.weight,
            fillColor: st.fill,
            dashArray: st.dash,
            lineJoin: 'round',
            // strokeOnly (perímetro): sem preenchimento, p/ não capturar o hover
            // da área inteira e deixar as camadas internas responderem.
            fill: !st.strokeOnly,
            fillOpacity: 0,
            opacity: 0,
          }),
        }) as unknown as L.Path;
      }
      // Tooltip explicativo no hover (segue o cursor). Diz o que é a cor.
      const html = tooltipHtml(tipo, f.properties?.areaHa);
      if (html) {
        layer.bindTooltip(html, {
          sticky: true,
          direction: 'top',
          className: 'sc-tip',
          opacity: 1,
        });
      }
      layer.addTo(this.map);
      const lb = (layer as any).getBounds?.();
      if (lb) bounds.extend(lb);
      else if (isPoint) bounds.extend((layer as L.CircleMarker).getLatLng());
      this.entries.push({
        layer,
        threshold: st.threshold,
        strokeOp: st.strokeOp,
        fillOp: st.fillOp,
        strokeOnly: !!st.strokeOnly,
      });
    }
    if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [36, 36] });
  }

  private applyIgnite(ig: number): void {
    for (const e of this.entries) {
      const on = ig >= e.threshold;
      const style = {
        opacity: on ? e.strokeOp : 0,
        fillOpacity: on ? e.fillOp : 0,
      };
      // L.GeoJSON wraps child layers; setStyle cascades.
      (e.layer as any).setStyle?.(style);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
