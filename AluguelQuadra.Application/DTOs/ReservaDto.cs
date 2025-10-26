using System;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Estrutura retornada aos clientes com os detalhes consolidados de uma reserva.
/// </summary>
public sealed class ReservaDto
{
    public Guid Id { get; init; }
    public Guid ClienteId { get; init; }
    public string ClienteNome { get; init; } = string.Empty;
    public Guid QuadraId { get; init; }
    public string QuadraNome { get; init; } = string.Empty;
    public DateTime DataHoraInicio { get; init; }
    public DateTime DataHoraFim { get; init; }
    public decimal PrecoTotal { get; init; }
    public StatusReserva Status { get; init; }
}
