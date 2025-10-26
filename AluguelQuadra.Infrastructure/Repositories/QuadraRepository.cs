using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AluguelQuadra.Infrastructure.Repositories;

/// <summary>
/// Implementa o repositório de quadras usando EF Core como provedor de dados.
/// </summary>
public sealed class QuadraRepository : IQuadraRepository
{
    private readonly ApplicationDbContext _context;

    public QuadraRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Retorna todas as quadras sem rastreamento para leitura.
    /// </summary>
    public async Task<IEnumerable<Quadra>> GetAllAsync()
    {
        return await _context.Quadras.AsNoTracking().ToListAsync();
    }

    /// <summary>
    /// Busca uma quadra por identificador incluindo suas reservas.
    /// </summary>
    public async Task<Quadra?> GetByIdAsync(Guid id)
    {
        return await _context.Quadras
            .Include(q => q.Reservas)
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == id);
    }

    /// <summary>
    /// Agenda a inclusão de uma nova quadra no contexto.
    /// </summary>
    public async Task AddAsync(Quadra quadra)
    {
        await _context.Quadras.AddAsync(quadra);
    }

    /// <summary>
    /// Marca mudanças em uma quadra existente.
    /// </summary>
    public Task UpdateAsync(Quadra quadra)
    {
        _context.Quadras.Update(quadra);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Marca uma quadra para remoção.
    /// </summary>
    public Task RemoveAsync(Quadra quadra)
    {
        _context.Quadras.Remove(quadra);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Persiste as alterações acumuladas no contexto.
    /// </summary>
    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}

