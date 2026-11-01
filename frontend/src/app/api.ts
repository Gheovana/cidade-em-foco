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
}