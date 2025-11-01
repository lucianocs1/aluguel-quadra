using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.Interfaces.Services;

/// <summary>
/// Define operações de criação e autenticação de usuários.
/// </summary>
public interface IUsuarioService
{
    Task<UsuarioDto> RegistrarUsuarioAsync(CriarUsuarioDto dto, PerfilUsuario perfil = PerfilUsuario.Cliente);
    Task<UsuarioDto> AutenticarAsync(LoginUsuarioDto dto);
    Task<IEnumerable<UsuarioDto>> ListarUsuariosAsync();
    Task<UsuarioDto?> ObterPorIdAsync(Guid id);
    Task RemoverUsuarioAsync(Guid id);
    Task<bool> ValidarAdministradorAsync(Guid usuarioId);
}
