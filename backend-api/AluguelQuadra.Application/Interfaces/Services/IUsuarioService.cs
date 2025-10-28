using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;

namespace AluguelQuadra.Application.Interfaces.Services;

/// <summary>
/// Define operações de criação e autenticação de usuários.
/// </summary>
public interface IUsuarioService
{
    Task<UsuarioDto> RegistrarUsuarioAsync(CriarUsuarioDto dto);
    Task<UsuarioDto> AutenticarAsync(LoginUsuarioDto dto);
    Task<IEnumerable<UsuarioDto>> ListarUsuariosAsync();
    Task<UsuarioDto?> ObterPorIdAsync(Guid id);
}
