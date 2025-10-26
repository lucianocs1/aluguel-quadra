using System;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Domain.Entities;

/// <summary>
/// Representa o agendamento entre um cliente e uma quadra em um intervalo específico.
/// </summary>
public class Reserva
{
    public Guid Id { get; set; }

    public Guid ClienteId { get; set; }
    /// <summary>
    /// Navegação para o cliente responsável pela reserva.
    /// </summary>
    public Cliente Cliente { get; set; } = null!;

    public Guid QuadraId { get; set; }
    /// <summary>
    /// Navegação para a quadra reservada.
    /// </summary>
    public Quadra Quadra { get; set; } = null!;

    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public decimal PrecoTotal { get; set; }
    public StatusReserva Status { get; set; }
}

