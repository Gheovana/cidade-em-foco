import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

import { Solicitacao } from '../../models';

@Component({
  selector: 'app-mapa',
  imports: [],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements AfterViewInit, OnDestroy {
  private mapa?: L.Map;
  private camada = L.layerGroup();

  // Vazia por enquanto. Na Etapa 13 virá da API.
  solicitacoes: Solicitacao[] = [];

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

  // O mapa só pode ser criado depois que o HTML já existe na tela.
  ngAfterViewInit() {
    // Posição inicial genérica (Brasil). Com marcadores, o mapa ajusta o zoom sozinho.
    this.mapa = L.map('mapa-ocorrencias').setView([-14.2, -51.9], 4);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; Colaboradores do OpenStreetMap',
    }).addTo(this.mapa);

    this.camada.addTo(this.mapa);
    this.desenharMarcadores();
  }

  ngOnDestroy() {
    this.mapa?.remove();
  }

  // Cria um marcador colorido para cada ocorrência que tenha coordenadas.
  desenharMarcadores() {
    this.camada.clearLayers();
    const pontos: L.LatLngTuple[] = [];

    for (const s of this.solicitacoes) {
      if (s.latitude === null || s.longitude === null) {
        continue;
      }

      const icone = L.divIcon({
        className: '',
        html: `<div class="marcador marcador-${s.status}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      // O popup é montado com textContent (e não com HTML em texto)
      // para que o que o usuário digitou nunca seja interpretado como código.
      const popup = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = this.nomesCategoria[s.categoria] || s.titulo;
      const detalhes = document.createElement('div');
      detalhes.textContent = `${this.rotulos[s.status]} · ${s.regiao || 'Local não informado'}`;
      popup.append(titulo, detalhes);

      L.marker([s.latitude, s.longitude], { icon: icone }).bindPopup(popup).addTo(this.camada);
      pontos.push([s.latitude, s.longitude]);
    }

    if (pontos.length > 0) {
      this.mapa?.fitBounds(pontos, { padding: [40, 40], maxZoom: 16 });
    }
  }
}