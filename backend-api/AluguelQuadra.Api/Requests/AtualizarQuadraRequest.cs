using System.ComponentModel.DataAnnotations;
using AluguelQuadra.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace AluguelQuadra.Api.Requests;

/// <summary>
/// Dados enviados no formulário multipart para atualizar quadras e manipular a imagem local.
/// </summary>
public sealed class AtualizarQuadraRequest
{
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Required]
    public string ModalidadePrincipal { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Informe um preço/hora válido.")]
    public decimal PrecoPorHora { get; set; }

    public IFormFile? Imagem { get; set; }

    /// <summary>
    /// Quando verdadeiro, remove a imagem atual caso nenhuma nova seja enviada.
    /// </summary>
    public bool RemoverImagem { get; set; }

    public AtualizarQuadraDto ToDto(string? imagemUrl) => new()
    {
        Nome = Nome,
        ModalidadePrincipal = ModalidadePrincipal,
        PrecoPorHora = PrecoPorHora,
        ImagemUrl = imagemUrl,
    };
}
