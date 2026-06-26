import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  Diagnostico,
  MatchResponse,
  Oferta,
  Propriedade,
  RetificacaoResponse,
  TipoOferta,
} from './types';

// Typed client for every endpoint in the frozen contract (§4).
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  // §4.1 Consulta Rápida
  getPropriedade(codImovel: string): Observable<Propriedade> {
    return this.http.get<Propriedade>(`${this.base}/propriedades/${encodeURIComponent(codImovel)}`);
  }

  // §4.2
  getDiagnostico(propriedadeId: number): Observable<Diagnostico> {
    return this.http.get<Diagnostico>(`${this.base}/diagnosticos/${propriedadeId}`);
  }

  // §4.3 gov.br mock login
  authMock(codImovel?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/govbr/mock`, codImovel ? { codImovel } : {});
  }

  // §4.4 marketplace listing
  getOfertas(tipo?: TipoOferta, bioma?: string): Observable<Oferta[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    if (bioma) params = params.set('bioma', bioma);
    return this.http.get<Oferta[]>(`${this.base}/marketplace/ofertas`, { params });
  }

  // §4.5 create offer
  createOferta(body: {
    propriedadeId: number;
    tipoOferta: TipoOferta;
    areaHa: number;
    bioma: string;
    valor: number;
    unidade?: string;
    prazoMeses?: number;
  }): Observable<Oferta> {
    return this.http.post<Oferta>(`${this.base}/marketplace/ofertas`, body);
  }

  // §4.6 match
  match(ofertaId: number, propriedadeDemandanteId: number): Observable<MatchResponse> {
    return this.http.post<MatchResponse>(`${this.base}/marketplace/match`, {
      ofertaId,
      propriedadeDemandanteId,
    });
  }

  // §4.7 upload .RET/.CAR
  uploadCar(file: File): Observable<Propriedade> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Propriedade>(`${this.base}/propriedades/upload`, form);
  }

  // §4.8 retificação draft
  gerarRetificacao(diagnosticoId: number): Observable<RetificacaoResponse> {
    return this.http.post<RetificacaoResponse>(
      `${this.base}/diagnosticos/${diagnosticoId}/retificacao`,
      {},
    );
  }
}
