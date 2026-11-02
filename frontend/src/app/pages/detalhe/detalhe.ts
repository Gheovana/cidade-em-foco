import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Api } from '../../api';
import { Auth } from '../../auth';
import { OcorrenciaDetalhe, StatusOcorrencia } from '../../models';

@Component({
  selector: 'app-detalhe',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './detalhe.html',
  styleUrl: './detalhe.css',
})
export class Detalhe implements OnInit {
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

  ocorrencia = signal<OcorrenciaDetalhe | null>(null);
  erro = signal('');
  mensagem = signal('');
  salvando = signal(false);
  novoStatus: StatusOcorrencia = 'aberto';

  constructor(
    private rota: ActivatedRoute,
    public api: Api,
    public auth: Auth,
  ) {}

  ngOnInit() {
    const id = Number(this.rota.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.erro.set('Solicitação inválida.');
      return;
    }

    this.api.buscarOcorrencia(id).subscribe({
      next: (o) => {
        this.ocorrencia.set(o);
        this.novoStatus = o.status;
      },
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Solicitação não encontrada.' : 'Não foi possível carregar a solicitação.',
        ),
    });
  }

  // O botão só aparece para admin, mas quem decide é o backend (erro 403 para os demais).
  salvarStatus() {
    const atual = this.ocorrencia();
    if (!atual || this.novoStatus === atual.status) {
      this.mensagem.set('Escolha um status diferente do atual.');
      return;
    }
    this.salvando.set(true);
    this.api.alterarStatus(atual.id, this.novoStatus).subscribe({
      next: (o) => {
        this.ocorrencia.set(o);
        this.salvando.set(false);
        this.mensagem.set('Status atualizado.');
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.mensagem.set(
          e.status === 403 ? 'Apenas administradores podem alterar o status.' : 'Não foi possível atualizar.',
        );
      },
    });
  }
}