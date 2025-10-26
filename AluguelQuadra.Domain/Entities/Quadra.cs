using System;
using System.Collections.Generic;

namespace AluguelQuadra.Domain.Entities;

/// <summary>
/// Representa uma quadra de areia disponível para reservas e seus atributos principais.
/// </summary>
public class Quadra
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string ModalidadePrincipal { get; set; } = string.Empty;
    public decimal PrecoPorHora { get; set; }

    /// <summary>
    /// Reservas associadas à quadra, carregadas para verificar disponibilidade.
    /// </summary>
    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
}

