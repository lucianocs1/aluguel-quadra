using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AluguelQuadra.Infrastructure.Repositories;

/// <summary>
/// Implementação do repositório de usuários utilizando EF Core.
/// </summary>
public sealed class UsuarioRepository : IUsuarioRepository
{
    private readonly ApplicationDbContext _context;

    public UsuarioRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Usuario?> GetByIdAsync(Guid id)
    {
        return await _context.Usuarios
            .Include(u => u.Reservas)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Usuario?> GetByEmailAsync(string email)
    {
        return await _context.Usuarios
            .Include(u => u.Reservas)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<IEnumerable<Usuario>> GetAllAsync()
    {
        return await _context.Usuarios
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task AddAsync(Usuario usuario)
    {
        await _context.Usuarios.AddAsync(usuario);
    }

    public Task UpdateAsync(Usuario usuario)
    {
        _context.Usuarios.Update(usuario);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
