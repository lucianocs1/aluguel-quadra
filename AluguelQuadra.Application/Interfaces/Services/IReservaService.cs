using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;

namespace AluguelQuadra.Application.Interfaces.Services;

/// <summary>
/// Define os casos de uso relacionados ao ciclo de vida das reservas.
/// </summary>
public interface IReservaService
{
    Task<ReservaDto> CriarReservaAsync(CriarReservaDto dto);
    Task<IEnumerable<ReservaDto>> GetReservasPorClienteAsync(Guid clienteId);
    Task CancelarReservaAsync(Guid reservaId);
}
