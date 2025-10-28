using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Domain.Entities;

namespace AluguelQuadra.Application.Interfaces.Repositories;

/// <summary>
/// Contrato de acesso a dados para quadras, abstraindo operações de persistência.
/// </summary>
public interface IQuadraRepository
{
    Task<IEnumerable<Quadra>> GetAllAsync();
    Task<Quadra?> GetByIdAsync(Guid id);
    Task AddAsync(Quadra quadra);
    Task UpdateAsync(Quadra quadra);
    Task RemoveAsync(Quadra quadra);
    Task SaveChangesAsync();
}

