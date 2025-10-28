namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Estrutura de dados para autenticar um usuário pelo e-mail e senha.
/// </summary>
public sealed class LoginUsuarioDto
{
    public string Email { get; init; } = string.Empty;
    public string Senha { get; init; } = string.Empty;
}
