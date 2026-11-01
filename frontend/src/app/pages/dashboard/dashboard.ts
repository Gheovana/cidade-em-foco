import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // "signal" é um valor que o Angular observa: quando muda, a tela atualiza.
  // Começam em zero. Na Etapa 9 serão preenchidos com dados reais da API.
  abertas = signal(0);
  emAndamento = signal(0);
  resolvidas = signal(0);

  // Lista de regiões com a quantidade de problemas (vazia por enquanto).
  regioes = signal<{ nome: string; total: number }[]>([]);
}