using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Application.Interfaces.Services;
using AluguelQuadra.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AluguelQuadra.Api.Controllers;

/// <summary>
/// Endpoints responsáveis por listar quadras e verificar disponibilidade diária.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class QuadrasController : ControllerBase
{
    private readonly IQuadraRepository _quadraRepository;
    private readonly IQuadraService _quadraService;

    public QuadrasController(IQuadraRepository quadraRepository, IQuadraService quadraService)
    {
        _quadraRepository = quadraRepository;
        _quadraService = quadraService;
    }

    /// <summary>
    /// Lista todas as quadras cadastradas no sistema.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Quadra>>> GetQuadrasAsync()
    {
        var quadras = await _quadraRepository.GetAllAsync();
        return Ok(quadras);
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
}

