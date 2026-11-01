import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Api } from '../../api';

@Component({
  selector: 'app-registrar',
  imports: [FormsModule],
  templateUrl: './registrar.html',
  styleUrl: './registrar.css',
})
export class Registrar {
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

  private tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  private tamanhoMaximoMB = 5;

  constructor(
    private api: Api,
    private router: Router,
  ) {}

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
    this.fotoPrevia.set(URL.createObjectURL(arquivo));
    this.mensagem.set('');
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
    }

    this.enviando.set(true);
    this.api.criarOcorrencia(dados).subscribe({
      next: () => this.router.navigate(['/minhas-solicitacoes']),
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