import { Component, OnInit, computed, signal } from '@angular/core';

import { Api } from '../../api';
import { Relatorio } from '../../models';

@Component({
  selector: 'app-relatorios',
  imports: [],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class Relatorios implements OnInit {
  dados = signal<Relatorio | null>(null);
  erro = signal('');

  // Maior valor de cada lista, usado para calcular o tamanho das barras.
  maxTipo = computed(() => Math.max(1, ...(this.dados()?.por_tipo.map((i) => i.total) ?? [])));
  maxRegiao = computed(() => Math.max(1, ...(this.dados()?.por_regiao.map((i) => i.total) ?? [])));

  constructor(private api: Api) {}

  // Roda uma vez, quando a página abre: busca o relatório já calculado pelo backend.
  ngOnInit() {
    this.api.obterRelatorio().subscribe({
      next: (d) => this.dados.set(d),
      error: () => this.erro.set('Não foi possível carregar o relatório. O backend está rodando?'),
    });
  }

  percentual(valor: number, maximo: number): number {
    return (valor / maximo) * 100;
  }
}