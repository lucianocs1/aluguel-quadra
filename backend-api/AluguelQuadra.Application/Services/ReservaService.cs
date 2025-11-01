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
    private readonly IMercadoPagoPixService _mercadoPagoPixService;

    private const int PagamentoExpiraEmMinutos = 10;

    public ReservaService(
        IReservaRepository reservaRepository,
        IQuadraRepository quadraRepository,
        IUsuarioRepository usuarioRepository,
        IMercadoPagoPixService mercadoPagoPixService)
    {
        _reservaRepository = reservaRepository;
        _quadraRepository = quadraRepository;
        _usuarioRepository = usuarioRepository;
        _mercadoPagoPixService = mercadoPagoPixService;
    }

    /// <summary>
    /// Valida disponibilidade e registra uma nova reserva retornando a projeção para o usuário.
    /// </summary>
    public async Task<ReservaPagamentoDto> CriarReservaAsync(CriarReservaDto dto)
    {
        var quadra = await _quadraRepository.GetByIdAsync(dto.QuadraId)
            ?? throw new ArgumentException("Quadra não encontrada.", nameof(dto.QuadraId));

        var usuario = await _usuarioRepository.GetByIdAsync(dto.UsuarioId)
            ?? throw new ArgumentException("Usuário não encontrado.", nameof(dto.UsuarioId));

        var dataHoraInicio = NormalizeToUtc(dto.DataHoraInicio);
        var dataHoraFim = dataHoraInicio.AddHours(1);
        var agora = DateTime.UtcNow;

        if (dataHoraInicio <= agora)
        {
            throw new InvalidOperationException("Não é possível reservar um horário no passado.");
        }

        var reservasExistentes = await _reservaRepository.GetReservasPorQuadraEDataAsync(dto.QuadraId, dataHoraInicio);
        if (HasConflict(reservasExistentes, dataHoraInicio, dataHoraFim, agora))
        {
            throw new InvalidOperationException("Já existe uma reserva para este horário.");
        }

        var preco = CalcularPreco(quadra.PrecoPorHora, dataHoraInicio, dataHoraFim);
        var descricaoPagamento = $"Reserva quadra {quadra.Nome} - {dataHoraInicio:dd/MM/yyyy HH:mm}";
        var expiracao = agora.AddMinutes(PagamentoExpiraEmMinutos);

        var pixPagamento = await _mercadoPagoPixService.CriarPagamentoPixAsync(
            preco,
            descricaoPagamento,
            usuario.Email,
            usuario.Nome,
            usuario.Sobrenome,
            expiracao);

        var reserva = new Reserva
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuario.Id,
            QuadraId = quadra.Id,
            DataHoraInicio = dataHoraInicio,
            DataHoraFim = dataHoraFim,
            PrecoTotal = preco,
            Status = StatusReserva.Pendente,
            PagamentoId = pixPagamento.PagamentoId,
            PagamentoStatus = pixPagamento.Status,
            PagamentoExpiraEm = pixPagamento.ExpiraEm,
            PixQrCode = pixPagamento.QrCode,
            PixQrCodeBase64 = pixPagamento.QrCodeBase64,
            PixTicketUrl = pixPagamento.TicketUrl,
            CriadoEm = agora,
            AtualizadoEm = agora
        };

        await _reservaRepository.AddAsync(reserva);
        await _reservaRepository.SaveChangesAsync();

        reserva.Usuario = usuario;
        reserva.Quadra = quadra;

        return MapToPagamentoDto(reserva);
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
    /// Lista todas as reservas registradas no sistema para visualização administrativa.
    /// </summary>
    public async Task<IEnumerable<ReservaDto>> ListarReservasAsync()
    {
        var reservas = await _reservaRepository.GetAllAsync();
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
        reserva.AtualizadoEm = DateTime.UtcNow;
        await _reservaRepository.UpdateAsync(reserva);
        await _reservaRepository.SaveChangesAsync();
    }

    public async Task<ReservaPagamentoStatusDto> AtualizarStatusPagamentoAsync(Guid reservaId)
    {
        var reserva = await _reservaRepository.GetByIdAsync(reservaId)
            ?? throw new ArgumentException("Reserva não encontrada.", nameof(reservaId));

        var agora = DateTime.UtcNow;

        bool expirado = reserva.PagamentoExpiraEm.HasValue && reserva.PagamentoExpiraEm.Value <= agora;
        DateTime? pagoEm = null;

        if (reserva.Status == StatusReserva.Pendente)
        {
            if (expirado)
            {
                reserva.Status = StatusReserva.Cancelada;
                reserva.PagamentoStatus = "expired";
                reserva.AtualizadoEm = agora;
                await PersistirAlteracoesAsync(reserva);
            }
            else if (!string.IsNullOrWhiteSpace(reserva.PagamentoId))
            {
                var (statusPagamento, pagoEmMercadoPago) = await _mercadoPagoPixService.ObterStatusPagamentoAsync(reserva.PagamentoId);
                reserva.PagamentoStatus = statusPagamento;

                if (statusPagamento.Equals("approved", StringComparison.OrdinalIgnoreCase))
                {
                    reserva.Status = StatusReserva.Confirmada;
                    pagoEm = pagoEmMercadoPago ?? agora;
                    reserva.AtualizadoEm = pagoEm;
                }
                else if (statusPagamento.Equals("rejected", StringComparison.OrdinalIgnoreCase) ||
                         statusPagamento.Equals("cancelled", StringComparison.OrdinalIgnoreCase) ||
                         statusPagamento.Equals("expired", StringComparison.OrdinalIgnoreCase))
                {
                    reserva.Status = StatusReserva.Cancelada;
                    reserva.AtualizadoEm = agora;
                    expirado = true;
                }

                await PersistirAlteracoesAsync(reserva);
            }
        }
        else if (reserva.Status == StatusReserva.Confirmada)
        {
            pagoEm = reserva.AtualizadoEm;
        }

        return new ReservaPagamentoStatusDto
        {
            ReservaId = reserva.Id,
            StatusReserva = reserva.Status.ToString(),
            StatusPagamento = reserva.PagamentoStatus,
            Pago = reserva.Status == StatusReserva.Confirmada,
            Expirado = expirado,
            PagamentoExpiraEm = reserva.PagamentoExpiraEm,
            PagoEm = pagoEm
        };
    }

    private async Task PersistirAlteracoesAsync(Reserva reserva)
    {
        await _reservaRepository.UpdateAsync(reserva);
        await _reservaRepository.SaveChangesAsync();
    }

    /// <summary>
    /// Avalia se o intervalo solicitado colide com reservas existentes.
    /// </summary>
    private static bool HasConflict(IEnumerable<Reserva> reservas, DateTime inicio, DateTime fim, DateTime agoraUtc)
    {
        foreach (var reserva in reservas)
        {
            if (reserva.Status == StatusReserva.Cancelada)
            {
                continue;
            }

            if (reserva.Status == StatusReserva.Pendente &&
                reserva.PagamentoExpiraEm.HasValue &&
                reserva.PagamentoExpiraEm.Value <= agoraUtc)
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
            Status = reserva.Status,
            PagamentoStatus = reserva.PagamentoStatus,
            PagamentoExpiraEm = reserva.PagamentoExpiraEm,
            PixTicketUrl = reserva.PixTicketUrl
        };
    }

    private static ReservaPagamentoDto MapToPagamentoDto(Reserva reserva)
    {
        return new ReservaPagamentoDto
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
            Status = reserva.Status,
            PagamentoStatus = reserva.PagamentoStatus,
            PagamentoExpiraEm = reserva.PagamentoExpiraEm,
            PixTicketUrl = reserva.PixTicketUrl,
            PagamentoId = reserva.PagamentoId,
            Pix = reserva.PixQrCode is null
                ? null
                : new PixPagamentoDto
                {
                    PagamentoId = reserva.PagamentoId ?? string.Empty,
                    QrCode = reserva.PixQrCode,
                    QrCodeBase64 = reserva.PixQrCodeBase64 ?? string.Empty,
                    TicketUrl = reserva.PixTicketUrl ?? string.Empty,
                    ExpiraEm = reserva.PagamentoExpiraEm ?? DateTime.UtcNow,
                    Status = reserva.PagamentoStatus ?? string.Empty,
                }
        };
    }

    private static DateTime NormalizeToUtc(DateTime dateTime)
    {
        return dateTime.Kind switch
        {
            DateTimeKind.Utc => dateTime,
            DateTimeKind.Local => dateTime.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
        };
    }
}

