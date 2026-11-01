import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Solicitacao } from './models';

@Injectable({ providedIn: 'root' })
export class Api {
  // Endereço do backend. Fica num lugar só, para ser fácil de trocar.
  private base = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  listarOcorrencias(): Observable<Solicitacao[]> {
    return this.http.get<Solicitacao[]>(`${this.base}/ocorrencias`);
  }

  // Recebe um FormData (campos + arquivo da foto).
  criarOcorrencia(dados: FormData): Observable<Solicitacao> {
    return this.http.post<Solicitacao>(`${this.base}/ocorrencias`, dados);
  }

  // Monta o endereço completo de uma foto guardada no backend.
  urlFoto(nome: string): string {
    return `${this.base}/uploads/${nome}`;
  }
}