using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AluguelQuadra.Api.Requests;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Services;
using AluguelQuadra.Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AluguelQuadra.Api.Controllers;

/// <summary>
/// Endpoints responsáveis por listar quadras e verificar disponibilidade diária.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class QuadrasController : ControllerBase
{
    private const long MaxImageSizeBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedImageContentTypes = { "image/jpeg", "image/png", "image/webp" };

    private readonly IQuadraService _quadraService;
    private readonly IUsuarioService _usuarioService;
    private readonly IWebHostEnvironment _environment;

    public QuadrasController(IQuadraService quadraService, IUsuarioService usuarioService, IWebHostEnvironment environment)
    {
        _quadraService = quadraService;
        _usuarioService = usuarioService;
        _environment = environment;
    }

    /// <summary>
    /// Lista todas as quadras cadastradas no sistema.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Quadra>>> GetQuadrasAsync()
    {
        var quadras = await _quadraService.ListarQuadrasAsync();
        return Ok(quadras);
    }

    /// <summary>
    /// Obtém uma quadra específica.
    /// </summary>
    [HttpGet("{id:guid}", Name = "GetQuadraById")]
    public async Task<ActionResult<Quadra>> GetQuadraPorIdAsync(Guid id)
    {
        var quadra = await _quadraService.ObterQuadraPorIdAsync(id);
        return quadra is null ? NotFound() : Ok(quadra);
    }

    /// <summary>
    /// Retorna os horários disponíveis para a quadra informada na data especificada.
    /// </summary>
    [HttpGet("{id:guid}/horarios-disponiveis")]
    public async Task<ActionResult<IEnumerable<HorarioDisponivelDto>>> GetHorariosDisponiveisAsync(Guid id, [FromQuery] DateTime data)
    {
        if (data == default)
        {
            return BadRequest("Informe uma data válida (yyyy-MM-dd).");
        }

        try
        {
            var horarios = await _quadraService.GetHorariosDisponiveisAsync(id, data);
            return Ok(horarios);
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Cadastra uma nova quadra. Requer credenciais administrativas.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Quadra>> CriarQuadraAsync(
        [FromForm] CriarQuadraRequest request,
        [FromHeader(Name = "X-Admin-Id")] Guid adminId)
    {
        if (!await _usuarioService.ValidarAdministradorAsync(adminId))
        {
            return Unauthorized("Apenas administradores podem cadastrar quadras.");
        }

        string? imagemSalva = null;

        try
        {
            if (request.Imagem is not null)
            {
                imagemSalva = await SalvarImagemAsync(request.Imagem);
            }

            var quadra = await _quadraService.CriarQuadraAsync(request.ToDto(imagemSalva));
            return CreatedAtRoute("GetQuadraById", new { id = quadra.Id }, quadra);
        }
        catch (ArgumentException ex)
        {
            if (!string.IsNullOrWhiteSpace(imagemSalva))
            {
                RemoverImagemFisica(imagemSalva);
            }

            return BadRequest(ex.Message);
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(imagemSalva))
            {
                RemoverImagemFisica(imagemSalva);
            }

            throw;
        }
    }

    /// <summary>
    /// Atualiza os dados de uma quadra existente.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Quadra>> AtualizarQuadraAsync(
        Guid id,
        [FromForm] AtualizarQuadraRequest request,
        [FromHeader(Name = "X-Admin-Id")] Guid adminId)
    {
        if (!await _usuarioService.ValidarAdministradorAsync(adminId))
        {
            return Unauthorized("Apenas administradores podem atualizar quadras.");
        }

        string? caminhoNovo = null;
        Quadra? quadraAtual = null;

        try
        {
            quadraAtual = await _quadraService.ObterQuadraPorIdAsync(id)
                ?? throw new ArgumentException("Quadra não encontrada.", nameof(id));

            var caminhoOriginal = quadraAtual.ImagemUrl;

            if (request.Imagem is not null)
            {
                caminhoNovo = await SalvarImagemAsync(request.Imagem);
            }

            var caminhoFinal = caminhoNovo ?? (request.RemoverImagem ? null : caminhoOriginal);

            var quadraAtualizada = await _quadraService.AtualizarQuadraAsync(id, request.ToDto(caminhoFinal));

            if (request.Imagem is not null && !string.IsNullOrWhiteSpace(caminhoOriginal))
            {
                RemoverImagemFisica(caminhoOriginal);
            }
            else if (request.RemoverImagem && !string.IsNullOrWhiteSpace(caminhoOriginal))
            {
                RemoverImagemFisica(caminhoOriginal);
            }

            return Ok(quadraAtualizada);
        }
        catch (ArgumentException ex)
        {
            if (!string.IsNullOrWhiteSpace(caminhoNovo))
            {
                RemoverImagemFisica(caminhoNovo);
            }

            if (ex.ParamName == nameof(id))
            {
                return NotFound(ex.Message);
            }

            return BadRequest(ex.Message);
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(caminhoNovo))
            {
                RemoverImagemFisica(caminhoNovo);
            }

            throw;
        }
    }

    /// <summary>
    /// Remove uma quadra cadastrada.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemoverQuadraAsync(
        Guid id,
        [FromHeader(Name = "X-Admin-Id")] Guid adminId)
    {
        if (!await _usuarioService.ValidarAdministradorAsync(adminId))
        {
            return Unauthorized("Apenas administradores podem remover quadras.");
        }

        try
        {
            await _quadraService.RemoverQuadraAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }
    private async Task<string> SalvarImagemAsync(IFormFile arquivo)
    {
        if (arquivo.Length == 0)
        {
            throw new ArgumentException("O arquivo enviado está vazio.", nameof(arquivo));
        }

        if (arquivo.Length > MaxImageSizeBytes)
        {
            throw new ArgumentException("A imagem deve ter no máximo 5 MB.", nameof(arquivo));
        }

        if (!AllowedImageContentTypes.Contains(arquivo.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Formato de imagem não suportado. Utilize PNG, JPG ou WEBP.", nameof(arquivo));
        }

        var webRoot = string.IsNullOrWhiteSpace(_environment.WebRootPath)
            ? Path.Combine(AppContext.BaseDirectory, "wwwroot")
            : _environment.WebRootPath!;

        var uploadsDirectory = Path.Combine(webRoot, "uploads", "quadras");
        Directory.CreateDirectory(uploadsDirectory);

        var extensao = Path.GetExtension(arquivo.FileName);
        if (string.IsNullOrWhiteSpace(extensao))
        {
            extensao = ".jpg";
        }

        var nomeArquivo = $"{Guid.NewGuid():N}{extensao.ToLowerInvariant()}";
        var caminhoFisico = Path.Combine(uploadsDirectory, nomeArquivo);

        await using var stream = System.IO.File.Create(caminhoFisico);
        await arquivo.CopyToAsync(stream);

        return $"/uploads/quadras/{nomeArquivo}";
    }

    private void RemoverImagemFisica(string? caminhoRelativo)
    {
        if (string.IsNullOrWhiteSpace(caminhoRelativo))
        {
            return;
        }

        var webRoot = string.IsNullOrWhiteSpace(_environment.WebRootPath)
            ? Path.Combine(AppContext.BaseDirectory, "wwwroot")
            : _environment.WebRootPath!;

        var caminhoNormalizado = caminhoRelativo.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        var caminhoFisico = Path.Combine(webRoot, caminhoNormalizado);

        if (System.IO.File.Exists(caminhoFisico))
        {
            System.IO.File.Delete(caminhoFisico);
        }
    }
}

