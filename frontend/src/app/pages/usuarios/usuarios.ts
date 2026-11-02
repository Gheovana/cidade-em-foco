import { Component, OnInit, signal } from '@angular/core';

import { Api } from '../../api';
import { UsuarioInfo } from '../../models';

@Component({
  selector: 'app-usuarios',
  imports: [],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  usuarios = signal<UsuarioInfo[]>([]);
  erro = signal('');

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.listarUsuarios().subscribe({
      next: (lista) => this.usuarios.set(lista),
      error: () => this.erro.set('Não foi possível carregar os usuários.'),
    });
  }
}