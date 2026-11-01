import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { Solicitacao } from '../../models';

type Filtro = 'todas' | 'aberto' | 'em_andamento' | 'resolvido';

@Component({
  selector: 'app-minhas-solicitacoes',
  imports: [DatePipe],
  templateUrl: './minhas-solicitacoes.html',
  styleUrl: './minhas-solicitacoes.css',
})
export class MinhasSolicitacoes {
  filtros: { valor: Filtro; nome: string }[] = [
    { valor: 'todas', nome: 'Todas' },
    { valor: 'aberto', nome: 'Abertas' },
    { valor: 'em_andamento', nome: 'Em andamento' },
    { valor: 'resolvido', nome: 'Resolvidas' },
  ];

  rotulosStatus: Record<string, string> = {
    aberto: 'Aberta',
    em_andamento: 'Em andamento',
    resolvido: 'Resolvida',
  };

  nomesCategoria: Record<string, string> = {
    buraco: 'Buraco na via',
    iluminacao: 'Iluminação pública',
    lixo: 'Lixo acumulado',
    vazamento: 'Vazamento',
    outros: 'Outros',
  };

  filtroAtual = signal<Filtro>('todas');

  // Vazia por enquanto. Na Etapa 9 será preenchida com os dados da API.
  solicitacoes = signal<Solicitacao[]>([]);

  // "computed" recalcula sozinho quando o filtro ou a lista mudam.
  visiveis = computed(() => {
    const filtro = this.filtroAtual();
    const todas = this.solicitacoes();
    return filtro === 'todas' ? todas : todas.filter((s) => s.status === filtro);
  });

  escolher(filtro: Filtro) {
    this.filtroAtual.set(filtro);
  }
}