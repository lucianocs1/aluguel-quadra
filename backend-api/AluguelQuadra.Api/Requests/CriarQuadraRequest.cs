using System.ComponentModel.DataAnnotations;
using AluguelQuadra.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace AluguelQuadra.Api.Requests;

/// <summary>
/// Dados enviados no formulário multipart para cadastrar uma quadra com imagem local.
/// </summary>
public sealed class CriarQuadraRequest
{
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Required]
    public string ModalidadePrincipal { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Informe um preço/hora válido.")]
    public decimal PrecoPorHora { get; set; }

    public IFormFile? Imagem { get; set; }

    public CriarQuadraDto ToDto(string? imagemUrl) => new()
    {
        Nome = Nome,
        ModalidadePrincipal = ModalidadePrincipal,
        PrecoPorHora = PrecoPorHora,
        ImagemUrl = imagemUrl,
    };
}
