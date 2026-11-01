import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  aba: 'entrar' | 'cadastrar' = 'entrar';

  email = '';
  senha = '';
  nome = '';

  mensagem = signal('');
  erro = signal(false);
  carregando = signal(false);

  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  mudarAba(aba: 'entrar' | 'cadastrar') {
    this.aba = aba;
    this.mensagem.set('');
  }

  entrar() {
    if (!this.email.trim() || !this.senha) {
      this.avisar('Informe e-mail e senha.', true);
      return;
    }
    this.carregando.set(true);
    this.auth.login(this.email, this.senha).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.avisar(
          e.status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível conectar ao servidor.',
          true,
        );
      },
    });
  }

  cadastrar() {
    if (this.nome.trim().length < 2 || !this.email.trim() || this.senha.length < 6) {
      this.avisar('Preencha o nome, o e-mail e uma senha com no mínimo 6 caracteres.', true);
      return;
    }
    this.carregando.set(true);
    this.auth.cadastrar(this.nome, this.email, this.senha).subscribe({
      next: () => {
        this.carregando.set(false);
        this.senha = '';
        this.aba = 'entrar';
        this.avisar('Conta criada! Agora é só entrar.', false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        if (e.status === 409) {
          this.avisar('Este e-mail já está cadastrado.', true);
        } else if (e.status === 422) {
          this.avisar('Dados inválidos. Confira o e-mail e a senha.', true);
        } else {
          this.avisar('Não foi possível conectar ao servidor.', true);
        }
      },
    });
  }

  private avisar(texto: string, ehErro: boolean) {
    this.mensagem.set(texto);
    this.erro.set(ehErro);
  }
}