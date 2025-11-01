using System;

namespace AluguelQuadra.Application.DTOs;

/// <summary>
/// Representa os dados necessários para cadastrar uma nova quadra no sistema.
/// </summary>
public sealed class CriarQuadraDto
{
    public string Nome { get; init; } = string.Empty;
    public string ModalidadePrincipal { get; init; } = string.Empty;
    public decimal PrecoPorHora { get; init; }
    public string? ImagemUrl { get; init; }
}
