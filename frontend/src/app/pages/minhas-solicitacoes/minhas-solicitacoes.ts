import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';

import { Api } from '../../api';
import { Solicitacao } from '../../models';

type Filtro = 'todas' | 'aberto' | 'em_andamento' | 'resolvido';

@Component({
  selector: 'app-minhas-solicitacoes',
  imports: [DatePipe],
  templateUrl: './minhas-solicitacoes.html',
  styleUrl: './minhas-solicitacoes.css',
})
export class MinhasSolicitacoes implements OnInit {
  // Botões de filtro que aparecem no topo da página.
  filtros: { valor: Filtro; nome: string }[] = [
    { valor: 'todas', nome: 'Todas' },
    { valor: 'aberto', nome: 'Abertas' },
    { valor: 'em_andamento', nome: 'Em andamento' },
    { valor: 'resolvido', nome: 'Resolvidas' },
  ];

  // Textos exibidos para cada status.
  rotulosStatus: Record<string, string> = {
    aberto: 'Aberta',
    em_andamento: 'Em andamento',
    resolvido: 'Resolvida',
  };

  // Nomes amigáveis para cada categoria.
  nomesCategoria: Record<string, string> = {
    buraco: 'Buraco na via',
    iluminacao: 'Iluminação pública',
    lixo: 'Lixo acumulado',
    vazamento: 'Vazamento',
    outros: 'Outros',
  };

  filtroAtual = signal<Filtro>('todas');
  solicitacoes = signal<Solicitacao[]>([]);
  erro = signal('');

  // Recalcula sozinho quando o filtro ou a lista mudam.
  visiveis = computed(() => {
    const filtro = this.filtroAtual();
    const todas = this.solicitacoes();
    return filtro === 'todas' ? todas : todas.filter((s) => s.status === filtro);
  });

  constructor(private api: Api) {}

  // Roda uma vez, quando a página abre: busca as ocorrências na API.
  ngOnInit() {
    this.api.listarOcorrencias().subscribe({
      next: (lista) => this.solicitacoes.set(lista),
      error: () => this.erro.set('Não foi possível carregar as solicitações.'),
    });
  }

  escolher(filtro: Filtro) {
    this.filtroAtual.set(filtro);
  }
}