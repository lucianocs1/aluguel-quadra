using System;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Resultado do fluxo de criação de reserva contendo instruções de pagamento PIX.
/// </summary>
public sealed class ReservaPagamentoDto : ReservaDto
{
    public string? PagamentoId { get; init; }
    public PixPagamentoDto? Pix { get; init; }
}

/// <summary>
/// Estrutura com os dados do QR Code PIX gerado através do Mercado Pago.
/// </summary>
public sealed class PixPagamentoDto
{
    public string PagamentoId { get; init; } = string.Empty;
    public string QrCode { get; init; } = string.Empty;
    public string QrCodeBase64 { get; init; } = string.Empty;
    public string TicketUrl { get; init; } = string.Empty;
    public DateTime ExpiraEm { get; init; }
    public string Status { get; init; } = string.Empty;
}

/// <summary>
/// DTO utilizado para consultar o status do pagamento associado a uma reserva.
/// </summary>
public sealed class ReservaPagamentoStatusDto
{
    public Guid ReservaId { get; init; }
    public string StatusReserva { get; init; } = string.Empty;
    public string? StatusPagamento { get; init; }
    public bool Pago { get; init; }
    public bool Expirado { get; init; }
    public DateTime? PagamentoExpiraEm { get; init; }
    public DateTime? PagoEm { get; init; }
}
