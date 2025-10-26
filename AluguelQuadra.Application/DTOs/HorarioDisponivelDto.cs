using System;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Representa um intervalo de uma quadra indicando se pode ser reservado.
/// </summary>
public sealed class HorarioDisponivelDto
{
    public DateTime DataHoraInicio { get; init; }
    public DateTime DataHoraFim { get; init; }
    public bool Disponivel { get; init; }
}
