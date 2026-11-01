import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from './auth';

// Se não estiver logado, manda para a tela de login.
// Atenção: isto só melhora a experiência. A segurança de verdade
// está no backend, que recusa pedidos sem token válido.
export const guarda: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.logado ? true : router.parseUrl('/login');
};
