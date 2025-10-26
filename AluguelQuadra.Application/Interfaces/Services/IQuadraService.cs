using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;

namespace AluguelQuadra.Application.Interfaces.Services;

/// <summary>
/// Expõe lógica para consulta de disponibilidade das quadras.
/// </summary>
public interface IQuadraService
{
    Task<IEnumerable<HorarioDisponivelDto>> GetHorariosDisponiveisAsync(Guid quadraId, DateTime data);
}

