import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Api } from '../../api';

// Esta mesma tela serve para DOIS casos:
//  - /registrar                  -> cria uma ocorrência nova
//  - /solicitacao/:id/editar     -> edita uma ocorrência existente
@Component({
  selector: 'app-registrar',
  imports: [FormsModule],
  templateUrl: './registrar.html',
  styleUrl: './registrar.css',
})
export class Registrar implements OnInit {
  tipos = [
    { valor: 'buraco', nome: 'Buraco na via' },
    { valor: 'iluminacao', nome: 'Iluminação pública' },
    { valor: 'lixo', nome: 'Lixo acumulado' },
    { valor: 'vazamento', nome: 'Vazamento' },
    { valor: 'outros', nome: 'Outros' },
  ];

  tipo = '';
  descricao = '';
  regiao = '';

  fotoArquivo: File | null = null;
  fotoPrevia = signal<string | null>(null);
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  mensagem = signal('');
  erro = signal(false);
  enviando = signal(false);

  // Modo edição
  editando = signal(false);
  carregando = signal(false);
  private idEdicao: number | null = null;
  private removerFotoAtual = false;

  private tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  private tamanhoMaximoMB = 5;

  constructor(
    private api: Api,
    private router: Router,
    private rota: ActivatedRoute,
  ) {}

  ngOnInit() {
    const parametro = this.rota.snapshot.paramMap.get('id');
    if (parametro === null) {
      return; // /registrar: ocorrência nova
    }

    const id = Number(parametro);
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/minhas-solicitacoes']);
      return;
    }

    this.editando.set(true);
    this.idEdicao = id;
    this.carregando.set(true);

    this.api.buscarOcorrencia(id).subscribe({
      next: (o) => {
        // O backend também confere, mas já avisamos aqui para não deixar editar à toa.
        if (o.status !== 'aberto') {
          this.router.navigate(['/solicitacao', id]);
          return;
        }
        this.tipo = o.categoria;
        this.descricao = o.descricao ?? '';
        this.regiao = o.regiao ?? '';
        this.latitude.set(o.latitude);
        this.longitude.set(o.longitude);
        this.fotoPrevia.set(o.foto ? this.api.urlFoto(o.foto) : null);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.avisar(
          e.status === 404 ? 'Solicitação não encontrada.' : 'Não foi possível carregar a solicitação.',
          true,
        );
      },
    });
  }

  aoEscolherFoto(evento: Event) {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    if (!arquivo) {
      return;
    }

    // Validação rápida no navegador (o backend valida de novo, de verdade).
    if (!this.tiposPermitidos.includes(arquivo.type)) {
      this.avisar('Use uma imagem JPG, PNG ou WEBP.', true);
      campo.value = '';
      return;
    }
    if (arquivo.size > this.tamanhoMaximoMB * 1024 * 1024) {
      this.avisar(`A imagem deve ter no máximo ${this.tamanhoMaximoMB} MB.`, true);
      campo.value = '';
      return;
    }

    this.fotoArquivo = arquivo;
    this.removerFotoAtual = false;
    this.fotoPrevia.set(URL.createObjectURL(arquivo));
    this.mensagem.set('');
  }

  // Tira a foto escolhida (e, na edição, pede para apagar a foto que já estava salva).
  removerFoto(campo: HTMLInputElement) {
    campo.value = '';
    this.fotoArquivo = null;
    this.fotoPrevia.set(null);
    this.removerFotoAtual = this.editando();
  }

  usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
      this.avisar('Seu navegador não permite obter a localização.', true);
      return;
    }
    this.avisar('Obtendo localização...', false);

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        this.latitude.set(posicao.coords.latitude);
        this.longitude.set(posicao.coords.longitude);
        this.avisar('Localização capturada com sucesso.', false);
      },
      () => this.avisar('Não foi possível obter a localização. Verifique a permissão.', true),
    );
  }

  cancelar() {
    if (this.idEdicao !== null) {
      this.router.navigate(['/solicitacao', this.idEdicao]);
    } else {
      this.router.navigate(['/minhas-solicitacoes']);
    }
  }

  enviar() {
    if (!this.tipo) {
      this.avisar('Selecione o tipo de problema.', true);
      return;
    }
    if (!this.regiao.trim() && this.latitude() === null) {
      this.avisar('Informe a localização ou use a localização atual.', true);
      return;
    }

    // FormData é o formato que carrega texto e arquivo juntos.
    const dados = new FormData();
    dados.append('categoria', this.tipo);
    if (this.descricao.trim()) {
      dados.append('descricao', this.descricao.trim());
    }
    if (this.regiao.trim()) {
      dados.append('regiao', this.regiao.trim());
    }
    if (this.latitude() !== null && this.longitude() !== null) {
      dados.append('latitude', String(this.latitude()));
      dados.append('longitude', String(this.longitude()));
    }
    if (this.fotoArquivo) {
      dados.append('foto', this.fotoArquivo);
    } else if (this.removerFotoAtual) {
      dados.append('remover_foto', 'true');
    }

    this.enviando.set(true);

    const pedido =
      this.idEdicao !== null
        ? this.api.editarOcorrencia(this.idEdicao, dados)
        : this.api.criarOcorrencia(dados);

    pedido.subscribe({
      next: () => {
        if (this.idEdicao !== null) {
          this.router.navigate(['/solicitacao', this.idEdicao]);
        } else {
          this.router.navigate(['/minhas-solicitacoes']);
        }
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        // Mostra a mensagem do backend quando ela for um texto simples.
        const detalhe = typeof e.error?.detail === 'string' ? e.error.detail : null;
        this.avisar(detalhe ?? 'Não foi possível enviar. Confira os dados e tente de novo.', true);
      },
    });
  }

  private avisar(texto: string, ehErro: boolean) {
    this.mensagem.set(texto);
    this.erro.set(ehErro);
  }
}