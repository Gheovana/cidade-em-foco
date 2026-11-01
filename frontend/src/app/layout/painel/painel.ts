import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-painel',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
})
export class Painel {
  constructor(private router: Router) {}

  // TEMPORÁRIO: na Etapa 10 também vai apagar a sessão do usuário.
  sair() {
    this.router.navigate(['/login']);
  }
}