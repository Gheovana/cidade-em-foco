import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // Controla qual aba está visível: "entrar" ou "cadastrar".
  aba: 'entrar' | 'cadastrar' = 'entrar';

  constructor(private router: Router) {}

  mudarAba(aba: 'entrar' | 'cadastrar') {
    this.aba = aba;
  }

  // TEMPORÁRIO: só leva para o painel para testarmos a navegação.
  // Na Etapa 10, isto vai validar e-mail e senha no backend.
  entrar() {
    this.router.navigate(['/inicio']);
  }
}