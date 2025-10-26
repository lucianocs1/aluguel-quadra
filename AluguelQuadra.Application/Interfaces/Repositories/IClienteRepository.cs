using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Domain.Entities;

namespace AluguelQuadra.Application.Interfaces.Repositories;

/// <summary>
/// Define operações de leitura e escrita para a entidade Cliente.
/// </summary>
public interface IClienteRepository
{
    Task<Cliente?> GetByIdAsync(Guid id);
    Task<IEnumerable<Cliente>> GetAllAsync();
    Task AddAsync(Cliente cliente);
    Task UpdateAsync(Cliente cliente);
    Task RemoveAsync(Cliente cliente);
    Task SaveChangesAsync();
}

