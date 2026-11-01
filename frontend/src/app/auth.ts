import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

interface RespostaLogin {
  token: string;
  usuario: UsuarioLogado;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private base = 'http://127.0.0.1:8000';

  // Usuário atual (null se ninguém estiver logado).
  usuario = signal<UsuarioLogado | null>(this.lerUsuarioSalvo());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, senha: string) {
    return this.http.post<RespostaLogin>(`${this.base}/auth/login`, { email, senha }).pipe(
      tap((r) => {
        sessionStorage.setItem('token', r.token);
        sessionStorage.setItem('usuario', JSON.stringify(r.usuario));
        this.usuario.set(r.usuario);
      }),
    );
  }

  cadastrar(nome: string, email: string, senha: string) {
    return this.http.post(`${this.base}/usuarios`, { nome, email, senha });
  }

  sair() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return sessionStorage.getItem('token');
  }

  get logado(): boolean {
    return this.token !== null;
  }

  get ehAdmin(): boolean {
    return this.usuario()?.tipo === 'admin';
  }

  private lerUsuarioSalvo(): UsuarioLogado | null {
    try {
      const texto = sessionStorage.getItem('usuario');
      return texto ? JSON.parse(texto) : null;
    } catch {
      return null;
    }
  }
}