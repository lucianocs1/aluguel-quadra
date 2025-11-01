using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace AluguelQuadra.Api.Controllers;

/// <summary>
/// Expõe endpoints para criar, listar e cancelar reservas.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class ReservasController : ControllerBase
{
    private readonly IReservaService _reservaService;

    public ReservasController(IReservaService reservaService)
    {
        _reservaService = reservaService;
    }

    /// <summary>
    /// Lista todas as reservas cadastradas. Requer privilégio de administrador.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservaDto>>> ListarAsync([FromHeader(Name = "X-Admin-Id")] Guid adminId, [FromServices] IUsuarioService usuarioService)
    {
        if (!await usuarioService.ValidarAdministradorAsync(adminId))
        {
            return Unauthorized("Apenas administradores podem visualizar todas as reservas.");
        }

        var reservas = await _reservaService.ListarReservasAsync();
        return Ok(reservas);
    }

    /// <summary>
    /// Cria uma nova reserva validando disponibilidade e retornando o resultado.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReservaPagamentoDto>> CriarReservaAsync([FromBody] CriarReservaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var reserva = await _reservaService.CriarReservaAsync(dto);
            return CreatedAtRoute("GetReservasPorUsuario", new { usuarioId = dto.UsuarioId }, reserva);
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
    /// Lista todas as reservas registradas para o usuário informado.
    /// </summary>
    [HttpGet("minhas-reservas/{usuarioId:guid}", Name = "GetReservasPorUsuario")]
    public async Task<ActionResult<IEnumerable<ReservaDto>>> GetReservasPorUsuarioAsync(Guid usuarioId)
    {
        var reservas = await _reservaService.GetReservasPorUsuarioAsync(usuarioId);
        return Ok(reservas);
    }

    /// <summary>
    /// Cancela a reserva indicada, retornando 404 caso não seja encontrada.
    /// </summary>
    [HttpPatch("{id:guid}/cancelar")]
    public async Task<IActionResult> CancelarReservaAsync(Guid id)
    {
        try
        {
            await _reservaService.CancelarReservaAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Consulta o status do pagamento gerado para a reserva.
    /// </summary>
    [HttpGet("{id:guid}/pagamento-status")]
    public async Task<ActionResult<ReservaPagamentoStatusDto>> ObterStatusPagamentoAsync(Guid id)
    {
        try
        {
            var status = await _reservaService.AtualizarStatusPagamentoAsync(id);
            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

