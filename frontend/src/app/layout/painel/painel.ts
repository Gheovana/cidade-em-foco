import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Auth } from '../../auth';

@Component({
  selector: 'app-painel',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
})
export class Painel {
  constructor(public auth: Auth) {}

  sair() {
    this.auth.sair();
  }
}