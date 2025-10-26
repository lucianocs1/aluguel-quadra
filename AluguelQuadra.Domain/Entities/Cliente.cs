using System;
using System.Collections.Generic;

namespace AluguelQuadra.Domain.Entities;

/// <summary>
/// Define o cliente que efetua reservas de quadras e dados de contato básicos.
/// </summary>
public class Cliente
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;

    /// <summary>
    /// Conjunto de reservas associadas ao cliente para rastrear agendamentos.
    /// </summary>
    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
}

