export interface Quadra {
  id: string;
  nome: string;
  modalidadePrincipal: string;
  precoPorHora: number;
}

export enum StatusReserva {
  Pendente = 0,
  Confirmada = 1,
  Cancelada = 2,
}

export interface HorarioDisponivelDto {
  dataHoraInicio: string;
  dataHoraFim: string;
  disponivel: boolean;
}

export interface CriarReservaDto {
  usuarioId: string;
  quadraId: string;
  dataHoraInicio: string;
}

export interface CriarUsuarioDto {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

export interface LoginUsuarioDto {
  email: string;
  senha: string;
}

export interface UsuarioDto {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
}

export interface ReservaDto {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioSobrenome: string;
  quadraId: string;
  quadraNome: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  precoTotal: number;
  status: StatusReserva;
}
