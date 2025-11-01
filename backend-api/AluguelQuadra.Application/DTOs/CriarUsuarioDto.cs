using System;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Dados necessários para registrar um novo usuário na plataforma.
/// </summary>
public class CriarUsuarioDto
{
    public string Nome { get; init; } = string.Empty;
    public string Sobrenome { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Senha { get; init; } = string.Empty;
}
