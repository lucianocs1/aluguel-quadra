using System;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Domain.Entities;

/// <summary>
/// Representa o agendamento entre um usuário e uma quadra em um intervalo específico.
/// </summary>
public class Reserva
{
    public Guid Id { get; set; }

    public Guid UsuarioId { get; set; }
    /// <summary>
    /// Navegação para o usuário responsável pela reserva.
    /// </summary>
    public Usuario Usuario { get; set; } = null!;

    public Guid QuadraId { get; set; }
    /// <summary>
    /// Navegação para a quadra reservada.
    /// </summary>
    public Quadra Quadra { get; set; } = null!;

    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public decimal PrecoTotal { get; set; }
    public StatusReserva Status { get; set; }

    /// <summary>
    /// Identificador do pagamento gerado na adquirente (Mercado Pago).
    /// </summary>
    public string? PagamentoId { get; set; }

    /// <summary>
    /// Status retornado pela adquirente para o pagamento (pending, approved, etc.).
    /// </summary>
    public string? PagamentoStatus { get; set; }

    /// <summary>
    /// Data limite para efetivação do pagamento antes de expirar automaticamente.
    /// </summary>
    public DateTime? PagamentoExpiraEm { get; set; }

    /// <summary>
    /// Conteúdo do QR Code PIX (payload textual) retornado pela adquirente.
    /// </summary>
    public string? PixQrCode { get; set; }

    /// <summary>
    /// Representação em Base64 do QR Code para exibição imediata.
    /// </summary>
    public string? PixQrCodeBase64 { get; set; }

    /// <summary>
    /// URL do ticket PIX (link de pagamento) fornecido pela adquirente.
    /// </summary>
    public string? PixTicketUrl { get; set; }

    /// <summary>
    /// Data de criação da reserva.
    /// </summary>
    public DateTime CriadoEm { get; set; }

    /// <summary>
    /// Data da última atualização relevante (pagamento aprovado, cancelamento, etc.).
    /// </summary>
    public DateTime? AtualizadoEm { get; set; }
}

