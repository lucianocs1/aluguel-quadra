using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Domain.Entities;

namespace AluguelQuadra.Application.Interfaces.Repositories;

/// <summary>
/// Fornece métodos especializados para consultar e manter reservas de quadras.
/// </summary>
public interface IReservaRepository
{
    Task<Reserva?> GetByIdAsync(Guid id);
    Task<IEnumerable<Reserva>> GetReservasPorUsuarioAsync(Guid usuarioId);
    Task<IEnumerable<Reserva>> GetReservasPorQuadraEDataAsync(Guid quadraId, DateTime data);
    Task AddAsync(Reserva reserva);
    Task UpdateAsync(Reserva reserva);
    Task SaveChangesAsync();
}

