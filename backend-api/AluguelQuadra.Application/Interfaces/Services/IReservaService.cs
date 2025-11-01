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
    Task<ReservaPagamentoDto> CriarReservaAsync(CriarReservaDto dto);
    Task<IEnumerable<ReservaDto>> GetReservasPorUsuarioAsync(Guid usuarioId);
    Task CancelarReservaAsync(Guid reservaId);
    Task<IEnumerable<ReservaDto>> ListarReservasAsync();
    Task<ReservaPagamentoStatusDto> AtualizarStatusPagamentoAsync(Guid reservaId);
}
