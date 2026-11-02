import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  OcorrenciaDetalhe,
  PontoMapa,
  Relatorio,
  Solicitacao,
  StatusOcorrencia,
  UsuarioInfo,
} from './models';

@Injectable({ providedIn: 'root' })
export class Api {
  // Endereço do backend. Fica num lugar só, para ser fácil de trocar.
  private base = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  listarOcorrencias(): Observable<Solicitacao[]> {
    return this.http.get<Solicitacao[]>(`${this.base}/ocorrencias`);
  }

  buscarOcorrencia(id: number): Observable<OcorrenciaDetalhe> {
    return this.http.get<OcorrenciaDetalhe>(`${this.base}/ocorrencias/${id}`);
  }

  // Recebe um FormData (campos + arquivo da foto).
  criarOcorrencia(dados: FormData): Observable<Solicitacao> {
    return this.http.post<Solicitacao>(`${this.base}/ocorrencias`, dados);
  }

  // Só funciona para administrador (o backend confere).
  alterarStatus(id: number, status: StatusOcorrencia): Observable<OcorrenciaDetalhe> {
    return this.http.patch<OcorrenciaDetalhe>(`${this.base}/ocorrencias/${id}/status`, { status });
  }

  // Só funciona para administrador (o backend confere).
  listarUsuarios(): Observable<UsuarioInfo[]> {
    return this.http.get<UsuarioInfo[]>(`${this.base}/usuarios`);
  }

  // Pontos de toda a cidade, com dados mínimos, para o mapa.
  listarPontosMapa(): Observable<PontoMapa[]> {
    return this.http.get<PontoMapa[]>(`${this.base}/mapa`);
  }

  // Admin recebe o relatório geral; usuário comum, o das suas ocorrências.
  obterRelatorio(): Observable<Relatorio> {
    return this.http.get<Relatorio>(`${this.base}/relatorios`);
  }

  // Monta o endereço completo de uma foto guardada no backend.
  urlFoto(nome: string): string {
    return `${this.base}/uploads/${nome}`;
  }
}