using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Application.Interfaces.Services;
using AluguelQuadra.Domain.Enums;

namespace AluguelQuadra.Application.Services;

/// <summary>
/// Agrupa regras para consultar horários disponíveis de uma quadra específica.
/// </summary>
public sealed class QuadraService : IQuadraService
{
    private readonly IQuadraRepository _quadraRepository;
    private readonly IReservaRepository _reservaRepository;

    private const int HoraAbertura = 6;
    private const int HoraFechamento = 22;

    public QuadraService(IQuadraRepository quadraRepository, IReservaRepository reservaRepository)
    {
        _quadraRepository = quadraRepository;
        _reservaRepository = reservaRepository;
    }

    /// <summary>
    /// Gera uma agenda horária do dia informado marcando intervalos já reservados como indisponíveis.
    /// </summary>
    public async Task<IEnumerable<HorarioDisponivelDto>> GetHorariosDisponiveisAsync(Guid quadraId, DateTime data)
    {
        _ = await _quadraRepository.GetByIdAsync(quadraId)
            ?? throw new ArgumentException("Quadra não encontrada.", nameof(quadraId));

        var reservas = await _reservaRepository.GetReservasPorQuadraEDataAsync(quadraId, data);
        var dia = data.Date;
        var horarios = new List<HorarioDisponivelDto>();

        // Percorre o expediente padrão da quadra, criando blocos de 1 hora.
        for (var hora = HoraAbertura; hora < HoraFechamento; hora++)
        {
            var inicio = dia.AddHours(hora);
            var fim = inicio.AddHours(1);

            var disponivel = !reservas.Any(reserva =>
                reserva.Status != StatusReserva.Cancelada &&
                inicio < reserva.DataHoraFim &&
                fim > reserva.DataHoraInicio);

            horarios.Add(new HorarioDisponivelDto
            {
                DataHoraInicio = inicio,
                DataHoraFim = fim,
                Disponivel = disponivel
            });
        }

        return horarios;
    }
}

