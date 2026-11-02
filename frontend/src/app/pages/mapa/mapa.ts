import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
  signal,
} from '@angular/core';
import * as L from 'leaflet';

import { Api } from '../../api';
import { PontoMapa } from '../../models';

@Component({
  selector: 'app-mapa',
  imports: [],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements AfterViewInit, OnDestroy {
  // Se verdadeiro, o mapa fica menor (usado no Início).
  resumido = input(false);

  @ViewChild('areaMapa', { static: true }) areaMapa!: ElementRef<HTMLDivElement>;

  total = signal(0);
  erro = signal('');

  private mapa?: L.Map;
  private camada = L.layerGroup();

  private rotulos: Record<string, string> = {
    aberto: 'Aberta',
    em_andamento: 'Em andamento',
    resolvido: 'Resolvida',
  };

  private nomesCategoria: Record<string, string> = {
    buraco: 'Buraco na via',
    iluminacao: 'Iluminação pública',
    lixo: 'Lixo acumulado',
    vazamento: 'Vazamento',
    outros: 'Outros',
  };

  constructor(private api: Api) {}

  // O mapa só pode ser criado depois que o HTML já existe na tela.
  ngAfterViewInit() {
    this.mapa = L.map(this.areaMapa.nativeElement, {
      // No mapa pequeno, a rodinha do mouse continua rolando a página.
      scrollWheelZoom: !this.resumido(),
    }).setView([-14.2, -51.9], 4);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; Colaboradores do OpenStreetMap',
    }).addTo(this.mapa);

    this.camada.addTo(this.mapa);

    this.api.listarPontosMapa().subscribe({
      next: (pontos) => this.desenharMarcadores(pontos),
      error: () => this.erro.set('Não foi possível carregar as ocorrências do mapa.'),
    });
  }

  ngOnDestroy() {
    this.mapa?.remove();
    this.mapa = undefined;
  }

  // Cria um marcador colorido para cada ocorrência.
  private desenharMarcadores(pontos: PontoMapa[]) {
    // Se o usuário já saiu da página, não há mais mapa para desenhar.
    if (!this.mapa) {
      return;
    }

    this.camada.clearLayers();
    this.total.set(pontos.length);
    const limites: L.LatLngTuple[] = [];

    for (const p of pontos) {
      const icone = L.divIcon({
        className: '',
        html: `<div class="marcador marcador-${p.status}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      // O popup é montado com textContent (e não com HTML em texto)
      // para que o que o usuário digitou nunca seja interpretado como código.
      const popup = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = this.nomesCategoria[p.categoria] || p.categoria;
      const detalhes = document.createElement('div');
      detalhes.textContent = `${this.rotulos[p.status] ?? p.status} · ${p.regiao || 'Local não informado'}`;
      popup.append(titulo, detalhes);

      L.marker([p.latitude, p.longitude], { icon: icone }).bindPopup(popup).addTo(this.camada);
      limites.push([p.latitude, p.longitude]);
    }

    if (limites.length > 0) {
      this.mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 });
    }
  }
}