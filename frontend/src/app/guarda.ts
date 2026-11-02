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

// Páginas de administrador: quem não é admin volta ao início.
// (O backend também recusa com erro 403.)
export const guardaAdmin: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.ehAdmin ? true : router.parseUrl('/inicio');
};