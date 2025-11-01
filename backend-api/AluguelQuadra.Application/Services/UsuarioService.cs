using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Application.Interfaces.Services;
using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.Services;

/// <summary>
/// Regras de negócio para gerenciamento de usuários e autenticação básica.
/// </summary>
public sealed class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarioRepository;

    public UsuarioService(IUsuarioRepository usuarioRepository)
    {
        _usuarioRepository = usuarioRepository;
    }

    public async Task<UsuarioDto> RegistrarUsuarioAsync(CriarUsuarioDto dto, PerfilUsuario perfil = PerfilUsuario.Cliente)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new ArgumentException("Informe um e-mail válido.", nameof(dto.Email));
        }

        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();

        var existente = await _usuarioRepository.GetByEmailAsync(emailNormalizado);
        if (existente is not null)
        {
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");
        }

        if (string.IsNullOrWhiteSpace(dto.Senha))
        {
            throw new ArgumentException("A senha é obrigatória.", nameof(dto.Senha));
        }

        var perfilNormalizado = perfil;

        var usuario = new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome.Trim(),
            Sobrenome = dto.Sobrenome.Trim(),
            Email = emailNormalizado,
            SenhaHash = SenhaHelper.GerarHash(dto.Senha),
            Perfil = perfilNormalizado
        };

        await _usuarioRepository.AddAsync(usuario);
        await _usuarioRepository.SaveChangesAsync();

        return MapToDto(usuario);
    }

    public async Task<UsuarioDto> AutenticarAsync(LoginUsuarioDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Senha))
        {
            throw new ArgumentException("E-mail e senha são obrigatórios para autenticação.");
        }

        var usuario = await _usuarioRepository.GetByEmailAsync(dto.Email.Trim().ToLowerInvariant())
            ?? throw new InvalidOperationException("Credenciais inválidas.");

        if (!SenhaHelper.Validar(dto.Senha, usuario.SenhaHash))
        {
            throw new InvalidOperationException("Credenciais inválidas.");
        }

        return MapToDto(usuario);
    }

    public async Task<IEnumerable<UsuarioDto>> ListarUsuariosAsync()
    {
        var usuarios = await _usuarioRepository.GetAllAsync();
        return usuarios.Select(MapToDto);
    }

    public async Task<UsuarioDto?> ObterPorIdAsync(Guid id)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id);
        return usuario is null ? null : MapToDto(usuario);
    }

    public async Task RemoverUsuarioAsync(Guid id)
    {
        var usuario = await _usuarioRepository.GetByIdForUpdateAsync(id)
            ?? throw new ArgumentException("Usuário não encontrado.", nameof(id));

        if (usuario.Perfil == PerfilUsuario.Administrador)
        {
            var quantidadeAdministradores = await _usuarioRepository.CountByPerfilAsync(PerfilUsuario.Administrador);
            if (quantidadeAdministradores <= 1)
            {
                throw new InvalidOperationException("Não é possível remover o último administrador da plataforma.");
            }
        }

        await _usuarioRepository.RemoveAsync(usuario);
        await _usuarioRepository.SaveChangesAsync();
    }

    public async Task<bool> ValidarAdministradorAsync(Guid usuarioId)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(usuarioId);
        return usuario?.Perfil == PerfilUsuario.Administrador;
    }

    private static UsuarioDto MapToDto(Usuario usuario)
    {
        return new UsuarioDto
        {
            Id = usuario.Id,
            Nome = usuario.Nome,
            Sobrenome = usuario.Sobrenome,
            Email = usuario.Email,
            Perfil = usuario.Perfil
        };
    }
}
