// Formatos dos dados que vêm do backend.
// Os nomes dos campos são iguais aos do schema OcorrenciaResposta (Python).

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