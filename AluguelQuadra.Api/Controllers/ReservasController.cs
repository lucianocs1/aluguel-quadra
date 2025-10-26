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
    /// Cria uma nova reserva validando disponibilidade e retornando o resultado.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReservaDto>> CriarReservaAsync([FromBody] CriarReservaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var reserva = await _reservaService.CriarReservaAsync(dto);
            return CreatedAtAction(nameof(GetReservasPorClienteAsync), new { clienteId = dto.ClienteId }, reserva);
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
    /// Lista todas as reservas registradas para o cliente informado.
    /// </summary>
    [HttpGet("minhas-reservas/{clienteId:guid}")]
    public async Task<ActionResult<IEnumerable<ReservaDto>>> GetReservasPorClienteAsync(Guid clienteId)
    {
        var reservas = await _reservaService.GetReservasPorClienteAsync(clienteId);
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
}

