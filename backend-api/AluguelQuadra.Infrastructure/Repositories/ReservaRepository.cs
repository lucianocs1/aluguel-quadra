using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AluguelQuadra.Infrastructure.Repositories;

/// <summary>
/// Repositório especializado em consultas de reservas para suportar regras de disponibilidade.
/// </summary>
public sealed class ReservaRepository : IReservaRepository
{
    private readonly ApplicationDbContext _context;

    public ReservaRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Busca uma reserva incluindo dados de usuário e quadra para operações de cancelamento.
    /// </summary>
    public async Task<Reserva?> GetByIdAsync(Guid id)
    {
        return await _context.Reservas
            .Include(r => r.Usuario)
            .Include(r => r.Quadra)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    /// <summary>
    /// Recupera reservas ordenadas por data para exibir na área do usuário.
    /// </summary>
    public async Task<IEnumerable<Reserva>> GetReservasPorUsuarioAsync(Guid usuarioId)
    {
        return await _context.Reservas
            .Include(r => r.Usuario)
            .Include(r => r.Quadra)
            .Where(r => r.UsuarioId == usuarioId)
            .AsNoTracking()
            .OrderBy(r => r.DataHoraInicio)
            .ToListAsync();
    }

    /// <summary>
    /// Retorna reservas de uma quadra em um dia específico, base para checar conflitos.
    /// </summary>
    public async Task<IEnumerable<Reserva>> GetReservasPorQuadraEDataAsync(Guid quadraId, DateTime data)
    {
        var dia = data.Date;

        return await _context.Reservas
            .Include(r => r.Usuario)
            .Include(r => r.Quadra)
            .Where(r => r.QuadraId == quadraId && r.DataHoraInicio.Date == dia)
            .AsNoTracking()
            .ToListAsync();
    }

    /// <summary>
    /// Adiciona uma nova reserva ao contexto para posterior persistência.
    /// </summary>
    public async Task AddAsync(Reserva reserva)
    {
        await _context.Reservas.AddAsync(reserva);
    }

    /// <summary>
    /// Atualiza uma reserva existente com o estado atual dos objetos.
    /// </summary>
    public Task UpdateAsync(Reserva reserva)
    {
        _context.Reservas.Update(reserva);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Salva alterações pendentes no contexto.
    /// </summary>
    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}

