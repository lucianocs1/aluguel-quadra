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
/// Orquestra as regras de negócio para criar, consultar e cancelar reservas.
/// </summary>
public sealed class ReservaService : IReservaService
{
    private readonly IReservaRepository _reservaRepository;
    private readonly IQuadraRepository _quadraRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public ReservaService(
        IReservaRepository reservaRepository,
        IQuadraRepository quadraRepository,
        IUsuarioRepository usuarioRepository)
    {
        _reservaRepository = reservaRepository;
        _quadraRepository = quadraRepository;
        _usuarioRepository = usuarioRepository;
    }

    /// <summary>
    /// Valida disponibilidade e registra uma nova reserva retornando a projeção para o usuário.
    /// </summary>
    public async Task<ReservaDto> CriarReservaAsync(CriarReservaDto dto)
    {
        var quadra = await _quadraRepository.GetByIdAsync(dto.QuadraId)
            ?? throw new ArgumentException("Quadra não encontrada.", nameof(dto.QuadraId));

        var usuario = await _usuarioRepository.GetByIdAsync(dto.UsuarioId)
            ?? throw new ArgumentException("Usuário não encontrado.", nameof(dto.UsuarioId));

        var dataHoraInicio = dto.DataHoraInicio;
        var dataHoraFim = dataHoraInicio.AddHours(1);

        var reservasExistentes = await _reservaRepository.GetReservasPorQuadraEDataAsync(dto.QuadraId, dataHoraInicio);
        if (HasConflict(reservasExistentes, dataHoraInicio, dataHoraFim))
        {
            throw new InvalidOperationException("Já existe uma reserva para este horário.");
        }

        var reserva = new Reserva
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuario.Id,
            QuadraId = quadra.Id,
            DataHoraInicio = dataHoraInicio,
            DataHoraFim = dataHoraFim,
            PrecoTotal = CalcularPreco(quadra.PrecoPorHora, dataHoraInicio, dataHoraFim),
            Status = StatusReserva.Confirmada
        };

        await _reservaRepository.AddAsync(reserva);
        await _reservaRepository.SaveChangesAsync();

        reserva.Usuario = usuario;
        reserva.Quadra = quadra;

        return MapToDto(reserva);
    }

    /// <summary>
    /// Recupera todas as reservas de um usuário, incluindo dados da quadra.
    /// </summary>
    public async Task<IEnumerable<ReservaDto>> GetReservasPorUsuarioAsync(Guid usuarioId)
    {
        var reservas = await _reservaRepository.GetReservasPorUsuarioAsync(usuarioId);
        return reservas.Select(MapToDto);
    }

    /// <summary>
    /// Atualiza o status da reserva para cancelado, evitando duplicidade de operação.
    /// </summary>
    public async Task CancelarReservaAsync(Guid reservaId)
    {
        var reserva = await _reservaRepository.GetByIdAsync(reservaId)
            ?? throw new ArgumentException("Reserva não encontrada.", nameof(reservaId));

        if (reserva.Status == StatusReserva.Cancelada)
        {
            return;
        }

        reserva.Status = StatusReserva.Cancelada;
        await _reservaRepository.UpdateAsync(reserva);
        await _reservaRepository.SaveChangesAsync();
    }

    /// <summary>
    /// Avalia se o intervalo solicitado colide com reservas existentes.
    /// </summary>
    private static bool HasConflict(IEnumerable<Reserva> reservas, DateTime inicio, DateTime fim)
    {
        foreach (var reserva in reservas)
        {
            if (reserva.Status == StatusReserva.Cancelada)
            {
                continue;
            }

            var overlaps = inicio < reserva.DataHoraFim && fim > reserva.DataHoraInicio;
            if (overlaps)
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Calcula o valor total multiplicando a duração pelo preço unitário.
    /// </summary>
    private static decimal CalcularPreco(decimal precoPorHora, DateTime inicio, DateTime fim)
    {
        var horas = (decimal)(fim - inicio).TotalHours;
        return decimal.Round(precoPorHora * horas, 2);
    }

    /// <summary>
    /// Constrói o DTO com informações combinadas da reserva e entidades relacionadas.
    /// </summary>
    private static ReservaDto MapToDto(Reserva reserva)
    {
        return new ReservaDto
        {
            Id = reserva.Id,
            UsuarioId = reserva.UsuarioId,
            UsuarioNome = reserva.Usuario?.Nome ?? string.Empty,
            UsuarioSobrenome = reserva.Usuario?.Sobrenome ?? string.Empty,
            QuadraId = reserva.QuadraId,
            QuadraNome = reserva.Quadra?.Nome ?? string.Empty,
            DataHoraInicio = reserva.DataHoraInicio,
            DataHoraFim = reserva.DataHoraFim,
            PrecoTotal = reserva.PrecoTotal,
            Status = reserva.Status
        };
    }
}

