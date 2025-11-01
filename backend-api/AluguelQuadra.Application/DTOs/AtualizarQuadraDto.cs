using System;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Dados utilizados para atualizar uma quadra existente.
/// </summary>
public sealed class AtualizarQuadraDto
{
    public string Nome { get; init; } = string.Empty;
    public string ModalidadePrincipal { get; init; } = string.Empty;
    public decimal PrecoPorHora { get; init; }
    public string? ImagemUrl { get; init; }
}
