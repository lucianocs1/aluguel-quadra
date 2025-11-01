using System;
using System.Collections.Generic;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Domain.Entities;

/// <summary>
/// Representa um usuário da plataforma capaz de reservar quadras.
/// </summary>
public class Usuario
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Sobrenome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; } = PerfilUsuario.Cliente;

    /// <summary>
    /// Reservas associadas ao usuário.
    /// </summary>
    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
}
