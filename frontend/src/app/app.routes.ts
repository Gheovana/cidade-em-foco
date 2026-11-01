import { Routes } from '@angular/router';

import { Painel } from './layout/painel/painel';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Mapa } from './pages/mapa/mapa';
import { MinhasSolicitacoes } from './pages/minhas-solicitacoes/minhas-solicitacoes';
import { Registrar } from './pages/registrar/registrar';
import { Relatorios } from './pages/relatorios/relatorios';

export const routes: Routes = [
  // Tela de login: sem menu lateral.
  { path: 'login', component: Login },

  // Todas as telas abaixo aparecem dentro do Painel (com menu lateral).
  {
    path: '',
    component: Painel,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Dashboard },
      { path: 'registrar', component: Registrar },
      { path: 'minhas-solicitacoes', component: MinhasSolicitacoes },
      { path: 'mapa', component: Mapa },
      { path: 'relatorios', component: Relatorios },
    ],
  },

  // Qualquer endereço desconhecido volta para o início.
  { path: '**', redirectTo: '' },
];