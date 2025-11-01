using System;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Extensão do DTO de criação de usuário permitindo informar o perfil desejado.
/// </summary>
public sealed class CriarUsuarioComPerfilDto : CriarUsuarioDto
{
    public PerfilUsuario Perfil { get; init; } = PerfilUsuario.Cliente;
}
