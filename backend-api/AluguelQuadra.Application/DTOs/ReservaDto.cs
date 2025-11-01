using System;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Estrutura retornada aos usuários com os detalhes consolidados de uma reserva.
/// </summary>
public class ReservaDto
{
    public Guid Id { get; init; }
    public Guid UsuarioId { get; init; }
    public string UsuarioNome { get; init; } = string.Empty;
    public string UsuarioSobrenome { get; init; } = string.Empty;
    public Guid QuadraId { get; init; }
    public string QuadraNome { get; init; } = string.Empty;
    public DateTime DataHoraInicio { get; init; }
    public DateTime DataHoraFim { get; init; }
    public decimal PrecoTotal { get; init; }
    public StatusReserva Status { get; init; }
    public string? PagamentoStatus { get; init; }
    public DateTime? PagamentoExpiraEm { get; init; }
    public string? PixTicketUrl { get; init; }
}
