using System;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Dados de entrada necessários para criar uma nova reserva na API.
/// </summary>
public sealed class CriarReservaDto
{
    public Guid ClienteId { get; init; }
    public Guid QuadraId { get; init; }
    public DateTime DataHoraInicio { get; init; }
}

