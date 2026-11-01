import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Api } from '../../api';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  abertas = signal(0);
  emAndamento = signal(0);
  resolvidas = signal(0);
  regioes = signal<{ nome: string; total: number }[]>([]);
  erro = signal('');

  constructor(private api: Api) {}

  // ngOnInit roda uma vez, quando a página é aberta.
  ngOnInit() {
    this.api.listarOcorrencias().subscribe({
      next: (lista) => {
        this.abertas.set(lista.filter((o) => o.status === 'aberto').length);
        this.emAndamento.set(lista.filter((o) => o.status === 'em_andamento').length);
        this.resolvidas.set(lista.filter((o) => o.status === 'resolvido').length);

        // Conta quantas ocorrências há em cada região.
        const contagem = new Map<string, number>();
        for (const o of lista) {
          const nome = o.regiao?.trim() || 'Não informada';
          contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
        }
        this.regioes.set(
          [...contagem.entries()]
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total),
        );
      },
      error: () => this.erro.set('Não foi possível carregar os dados. O backend está rodando?'),
    });
  }
}