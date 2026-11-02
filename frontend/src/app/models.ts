// Formatos dos dados que vêm do backend.
// Os nomes dos campos são iguais aos dos schemas (Python).

export type StatusOcorrencia = 'aberto' | 'em_andamento' | 'resolvido';

export interface Solicitacao {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string;
  foto: string | null;
  latitude: number | null;
  longitude: number | null;
  regiao: string | null;
  status: StatusOcorrencia;
  criado_em: string;
  usuario_id: number;
}

export interface HistoricoItem {
  status_anterior: string;
  status_novo: string;
  alterado_em: string;
  admin_nome: string | null;
}

export interface OcorrenciaDetalhe extends Solicitacao {
  autor_nome: string | null;
  historico: HistoricoItem[];
}

export interface UsuarioInfo {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

// Dados mínimos para desenhar um marcador no mapa.
export interface PontoMapa {
  id: number;
  categoria: string;
  status: StatusOcorrencia;
  regiao: string | null;
  latitude: number;
  longitude: number;
}

// Relatório calculado pelo backend.
export interface Contagem {
  nome: string;
  total: number;
}

export interface Relatorio {
  escopo: 'geral' | 'pessoal';
  total: number;
  abertas: number;
  em_andamento: number;
  resolvidas: number;
  por_tipo: Contagem[];
  por_regiao: Contagem[];
  regioes_prioritarias: Contagem[];
}