using System;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Projeção dos dados do usuário retornada aos consumidores da API.
/// </summary>
public sealed class UsuarioDto
{
    public Guid Id { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string Sobrenome { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public PerfilUsuario Perfil { get; init; }
}
