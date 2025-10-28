using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Application.Interfaces.Services;
using AluguelQuadra.Domain.Entities;

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

    public async Task<UsuarioDto> RegistrarUsuarioAsync(CriarUsuarioDto dto)
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

        var usuario = new Usuario
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome.Trim(),
            Sobrenome = dto.Sobrenome.Trim(),
            Email = emailNormalizado,
            SenhaHash = GerarHashSenha(dto.Senha)
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

        if (!ValidarSenha(dto.Senha, usuario.SenhaHash))
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

    private static UsuarioDto MapToDto(Usuario usuario)
    {
        return new UsuarioDto
        {
            Id = usuario.Id,
            Nome = usuario.Nome,
            Sobrenome = usuario.Sobrenome,
            Email = usuario.Email
        };
    }

    private static string GerarHashSenha(string senha)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var senhaBytes = Encoding.UTF8.GetBytes(senha);
        var hash = SHA256.HashData(Combinar(senhaBytes, salt));
        return Convert.ToHexString(salt) + ":" + Convert.ToHexString(hash);
    }

    private static bool ValidarSenha(string senha, string hashArmazenado)
    {
        var partes = hashArmazenado.Split(':');
        if (partes.Length != 2)
        {
            return false;
        }

        var salt = Convert.FromHexString(partes[0]);
        var hashEsperado = Convert.FromHexString(partes[1]);
        var senhaBytes = Encoding.UTF8.GetBytes(senha);
        var hashCalculado = SHA256.HashData(Combinar(senhaBytes, salt));
        return hashCalculado.AsSpan().SequenceEqual(hashEsperado);
    }

    private static byte[] Combinar(byte[] primeiraParte, byte[] segundaParte)
    {
        var resultado = new byte[primeiraParte.Length + segundaParte.Length];
        Buffer.BlockCopy(primeiraParte, 0, resultado, 0, primeiraParte.Length);
        Buffer.BlockCopy(segundaParte, 0, resultado, primeiraParte.Length, segundaParte.Length);
        return resultado;
    }
}
