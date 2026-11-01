import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { Auth } from './auth';

// Roda em TODA requisição: anexa o token e, se o servidor disser
// que o login expirou (401), encerra a sessão.
export const interceptador: HttpInterceptorFn = (requisicao, proximo) => {
  const auth = inject(Auth);
  const token = auth.token;

  if (token) {
    requisicao = requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return proximo(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && !requisicao.url.includes('/auth/login')) {
        auth.sair();
      }
      return throwError(() => erro);
    }),
  );
};