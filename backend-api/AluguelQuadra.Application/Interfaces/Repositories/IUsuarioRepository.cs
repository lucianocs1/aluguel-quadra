using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.Interfaces.Repositories;

/// <summary>
/// Contrato de acesso a dados para usuários cadastrados na plataforma.
/// </summary>
public interface IUsuarioRepository
{
    Task<Usuario?> GetByIdAsync(Guid id);
    Task<Usuario?> GetByIdForUpdateAsync(Guid id);
    Task<Usuario?> GetByEmailAsync(string email);
    Task<IEnumerable<Usuario>> GetAllAsync();
    Task AddAsync(Usuario usuario);
    Task UpdateAsync(Usuario usuario);
    Task RemoveAsync(Usuario usuario);
    Task<int> CountByPerfilAsync(PerfilUsuario perfil);
    Task SaveChangesAsync();
}
