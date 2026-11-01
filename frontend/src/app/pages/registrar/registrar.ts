import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registrar',
  imports: [FormsModule],
  templateUrl: './registrar.html',
  styleUrl: './registrar.css',
})
export class Registrar {
  // Os "valores" são os mesmos que o backend aceita (schema Categoria).
  tipos = [
    { valor: 'buraco', nome: 'Buraco na via' },
    { valor: 'iluminacao', nome: 'Iluminação pública' },
    { valor: 'lixo', nome: 'Lixo acumulado' },
    { valor: 'vazamento', nome: 'Vazamento' },
    { valor: 'outros', nome: 'Outros' },
  ];

  // Campos digitados pelo usuário (ligados ao HTML com ngModel).
  tipo = '';
  descricao = '';
  regiao = '';

  // Estados que mudam durante o uso e aparecem na tela.
  fotoArquivo: File | null = null;
  fotoPrevia = signal<string | null>(null);
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  mensagem = signal('');
  erro = signal(false);

  private tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  private tamanhoMaximoMB = 5;

  aoEscolherFoto(evento: Event) {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    if (!arquivo) {
      return;
    }

    // Validação no navegador (o backend também vai validar na Etapa 11).
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
    // O envio de verdade será feito na Etapa 11.
    this.avisar('Dados válidos! O envio ao backend será ligado na Etapa 11.', false);
  }

  private avisar(texto: string, ehErro: boolean) {
    this.mensagem.set(texto);
    this.erro.set(ehErro);
  }
}