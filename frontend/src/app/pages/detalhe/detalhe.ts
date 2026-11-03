import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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

  // Controle da exclusão (pede confirmação antes de apagar).
  confirmandoExclusao = signal(false);
  excluindo = signal(false);
  erroExclusao = signal('');

  constructor(
    private rota: ActivatedRoute,
    private router: Router,
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

  // Os botões Editar/Excluir só aparecem para o dono da ocorrência e só enquanto ela
  // está aberta. Quem decide de verdade é o backend (404 se não for dono, 409 se não estiver aberta).
  get podeAlterar(): boolean {
    const o = this.ocorrencia();
    return !!o && o.usuario_id === this.auth.usuario()?.id && o.status === 'aberto';
  }

  pedirConfirmacao() {
    this.erroExclusao.set('');
    this.confirmandoExclusao.set(true);
  }

  cancelarExclusao() {
    this.confirmandoExclusao.set(false);
  }

  excluir() {
    const atual = this.ocorrencia();
    if (!atual) {
      return;
    }
    this.excluindo.set(true);
    this.api.excluirOcorrencia(atual.id).subscribe({
      next: () => this.router.navigate(['/minhas-solicitacoes']),
      error: (e: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.erroExclusao.set(
          typeof e.error?.detail === 'string' ? e.error.detail : 'Não foi possível excluir a ocorrência.',
        );
      },
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