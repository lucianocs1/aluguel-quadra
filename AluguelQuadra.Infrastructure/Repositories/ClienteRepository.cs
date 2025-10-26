using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AluguelQuadra.Infrastructure.Repositories;

/// <summary>
/// Implementação do repositório de clientes utilizando o contexto EF Core.
/// </summary>
public sealed class ClienteRepository : IClienteRepository
{
    private readonly ApplicationDbContext _context;

    public ClienteRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Localiza um cliente por Id incluindo suas reservas para facilitar consultas.
    /// </summary>
    public async Task<Cliente?> GetByIdAsync(Guid id)
    {
        return await _context.Clientes
            .Include(c => c.Reservas)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    /// <summary>
    /// Retorna todos os clientes cadastrados sem rastreamento.
    /// </summary>
    public async Task<IEnumerable<Cliente>> GetAllAsync()
    {
        return await _context.Clientes.AsNoTracking().ToListAsync();
    }

    /// <summary>
    /// Agenda a criação de um novo cliente no banco.
    /// </summary>
    public async Task AddAsync(Cliente cliente)
    {
        await _context.Clientes.AddAsync(cliente);
    }

    /// <summary>
    /// Registra alterações realizadas em um cliente existente.
    /// </summary>
    public Task UpdateAsync(Cliente cliente)
    {
        _context.Clientes.Update(cliente);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Remove o cliente no próximo SaveChanges, se aplicável.
    /// </summary>
    public Task RemoveAsync(Cliente cliente)
    {
        _context.Clientes.Remove(cliente);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Confirma as alterações pendentes no banco de dados.
    /// </summary>
    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}

