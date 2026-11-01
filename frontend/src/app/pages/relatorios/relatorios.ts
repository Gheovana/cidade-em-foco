import { Component, computed, signal } from '@angular/core';

import { Solicitacao } from '../../models';

interface ItemContagem {
  nome: string;
  total: number;
}

@Component({
  selector: 'app-relatorios',
  imports: [],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class Relatorios {
  // Vazia por enquanto. Na Etapa 14 virá da API.
  solicitacoes = signal<Solicitacao[]>([]);

  private nomesCategoria: Record<string, string> = {
    buraco: 'Buraco na via',
    iluminacao: 'Iluminação pública',
    lixo: 'Lixo acumulado',
    vazamento: 'Vazamento',
    outros: 'Outros',
  };

  totalAbertas = computed(() => this.solicitacoes().filter((s) => s.status === 'aberto').length);

  totalResolvidas = computed(
    () => this.solicitacoes().filter((s) => s.status === 'resolvido').length,
  );

  porTipo = computed(() =>
    this.contar((s) => this.nomesCategoria[s.categoria] || s.categoria),
  );

  porRegiao = computed(() => this.contar((s) => s.regiao?.trim() || 'Não informada'));

  // As 3 regiões com mais problemas.
  regioesPrioritarias = computed(() => this.porRegiao().slice(0, 3));

  // Maior valor da lista, usado para calcular o tamanho das barras.
  maxTipo = computed(() => Math.max(1, ...this.porTipo().map((i) => i.total)));
  maxRegiao = computed(() => Math.max(1, ...this.porRegiao().map((i) => i.total)));

  // Agrupa as ocorrências por uma chave e devolve do maior para o menor.
  private contar(chave: (s: Solicitacao) => string): ItemContagem[] {
    const contagem = new Map<string, number>();
    for (const s of this.solicitacoes()) {
      const nome = chave(s);
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
    return [...contagem.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }

  percentual(valor: number, maximo: number): number {
    return (valor / maximo) * 100;
  }
}