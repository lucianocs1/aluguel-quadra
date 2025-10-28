using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace AluguelQuadra.Api.Controllers;

/// <summary>
/// Controlador responsável por criar e autenticar usuários da aplicação.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    /// <summary>
    /// Registra um novo usuário na plataforma.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> RegistrarAsync([FromBody] CriarUsuarioDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var usuario = await _usuarioService.RegistrarUsuarioAsync(dto);
            return CreatedAtRoute("GetUsuarioById", new { id = usuario.Id }, usuario);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    /// <summary>
    /// Autentica um usuário por e-mail e senha, retornando seus dados básicos.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<UsuarioDto>> AutenticarAsync([FromBody] LoginUsuarioDto dto)
    {
        try
        {
            var usuario = await _usuarioService.AutenticarAsync(dto);
            return Ok(usuario);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    /// <summary>
    /// Lista todos os usuários cadastrados.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> ListarAsync()
    {
        var usuarios = await _usuarioService.ListarUsuariosAsync();
        return Ok(usuarios);
    }

    /// <summary>
    /// Obtém os dados de um usuário específico.
    /// </summary>
    [HttpGet("{id:guid}", Name = "GetUsuarioById")]
    public async Task<ActionResult<UsuarioDto>> ObterPorIdAsync(Guid id)
    {
        var usuario = await _usuarioService.ObterPorIdAsync(id);
        return usuario is null ? NotFound() : Ok(usuario);
    }
}
