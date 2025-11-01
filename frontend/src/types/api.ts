export interface Quadra {
  id: string;
  nome: string;
  modalidadePrincipal: string;
  precoPorHora: number;
  imagemUrl?: string | null;
}

export enum StatusReserva {
  Pendente = 0,
  Confirmada = 1,
  Cancelada = 2,
}

export enum PerfilUsuario {
  Cliente = 0,
  Administrador = 1,
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

export interface CriarUsuarioComPerfilDto extends CriarUsuarioDto {
  perfil: PerfilUsuario;
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
  perfil: PerfilUsuario;
}

export interface CriarQuadraDto {
  nome: string;
  modalidadePrincipal: string;
  precoPorHora: number;
  imagemUrl?: string | null;
}

export interface AtualizarQuadraDto extends CriarQuadraDto {}

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
  pagamentoStatus?: string | null;
  pagamentoExpiraEm?: string | null;
  pixTicketUrl?: string | null;
}

export interface PixPagamentoDto {
  pagamentoId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiraEm: string;
  status: string;
}

export interface ReservaPagamentoDto extends ReservaDto {
  pagamentoId?: string | null;
  pix?: PixPagamentoDto | null;
}

export interface ReservaPagamentoStatusDto {
  reservaId: string;
  statusReserva: string;
  statusPagamento?: string | null;
  pago: boolean;
  expirado: boolean;
  pagamentoExpiraEm?: string | null;
  pagoEm?: string | null;
}
