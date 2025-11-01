using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Domain.Entities;

namespace AluguelQuadra.Application.Interfaces.Services;

/// <summary>
/// Expõe lógica para consulta de disponibilidade das quadras.
/// </summary>
public interface IQuadraService
{
    Task<IEnumerable<HorarioDisponivelDto>> GetHorariosDisponiveisAsync(Guid quadraId, DateTime data);
    Task<Quadra> CriarQuadraAsync(CriarQuadraDto dto);
    Task<Quadra> AtualizarQuadraAsync(Guid id, AtualizarQuadraDto dto);
    Task RemoverQuadraAsync(Guid id);
    Task<IEnumerable<Quadra>> ListarQuadrasAsync();
    Task<Quadra?> ObterQuadraPorIdAsync(Guid id);
}

