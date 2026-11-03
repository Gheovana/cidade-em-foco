import { Routes } from '@angular/router';

import { guarda, guardaAdmin } from './guarda';
import { Painel } from './layout/painel/painel';
import { Dashboard } from './pages/dashboard/dashboard';
import { Detalhe } from './pages/detalhe/detalhe';
import { Login } from './pages/login/login';
import { Mapa } from './pages/mapa/mapa';
import { MinhasSolicitacoes } from './pages/minhas-solicitacoes/minhas-solicitacoes';
import { Registrar } from './pages/registrar/registrar';
import { Relatorios } from './pages/relatorios/relatorios';
import { Usuarios } from './pages/usuarios/usuarios';

export const routes: Routes = [
  // Tela de login: sem menu lateral.
  { path: 'login', component: Login },

  // Todas as telas abaixo aparecem dentro do Painel (com menu lateral).
  {
    path: '',
    component: Painel,
    canActivate: [guarda],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Dashboard },
      { path: 'registrar', component: Registrar },
      { path: 'minhas-solicitacoes', component: MinhasSolicitacoes },
      { path: 'solicitacao/:id', component: Detalhe },
      { path: 'solicitacao/:id/editar', component: Registrar },
      { path: 'mapa', component: Mapa },
      { path: 'relatorios', component: Relatorios },
      { path: 'usuarios', component: Usuarios, canActivate: [guardaAdmin] },
    ],
  },

  // Qualquer endereço desconhecido volta para o início.
  { path: '**', redirectTo: '' },
];