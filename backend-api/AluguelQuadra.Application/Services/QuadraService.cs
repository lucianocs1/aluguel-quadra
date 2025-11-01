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
    /// Agrupa regras para consultar horários disponíveis e gerenciar quadras.
    /// </summary>
public sealed class QuadraService : IQuadraService
{
    private readonly IQuadraRepository _quadraRepository;
    private readonly IReservaRepository _reservaRepository;

    private const int HoraAbertura = 8;
    private const int HoraFechamento = 20;

    public QuadraService(IQuadraRepository quadraRepository, IReservaRepository reservaRepository)
    {
        _quadraRepository = quadraRepository;
        _reservaRepository = reservaRepository;
    }

    /// <summary>
    /// Retorna a lista de quadras cadastradas.
    /// </summary>
    public async Task<IEnumerable<Quadra>> ListarQuadrasAsync()
    {
        return await _quadraRepository.GetAllAsync();
    }

    public async Task<Quadra?> ObterQuadraPorIdAsync(Guid id)
    {
        return await _quadraRepository.GetByIdAsync(id);
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
    var agora = DateTime.UtcNow;

        // Percorre o expediente padrão da quadra, criando blocos de 1 hora.
        for (var hora = HoraAbertura; hora < HoraFechamento; hora++)
        {
            var inicio = dia.AddHours(hora);
            var fim = inicio.AddHours(1);

            var disponivel = !reservas.Any(reserva =>
        reserva.Status != StatusReserva.Cancelada &&
        !(reserva.Status == StatusReserva.Pendente &&
          reserva.PagamentoExpiraEm.HasValue &&
          reserva.PagamentoExpiraEm.Value <= agora) &&
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

    /// <summary>
    /// Cria uma nova quadra validando os dados fornecidos.
    /// </summary>
    public async Task<Quadra> CriarQuadraAsync(CriarQuadraDto dto)
    {
        ValidarQuadra(dto.Nome, dto.ModalidadePrincipal, dto.PrecoPorHora, dto.ImagemUrl);

        var quadra = new Quadra
        {
            Id = Guid.NewGuid(),
            Nome = dto.Nome.Trim(),
            ModalidadePrincipal = dto.ModalidadePrincipal.Trim(),
            PrecoPorHora = dto.PrecoPorHora,
            ImagemUrl = string.IsNullOrWhiteSpace(dto.ImagemUrl) ? null : dto.ImagemUrl.Trim()
        };

        await _quadraRepository.AddAsync(quadra);
        await _quadraRepository.SaveChangesAsync();

        return quadra;
    }

    /// <summary>
    /// Atualiza uma quadra existente com os dados informados.
    /// </summary>
    public async Task<Quadra> AtualizarQuadraAsync(Guid id, AtualizarQuadraDto dto)
    {
        var quadra = await _quadraRepository.GetByIdForUpdateAsync(id)
            ?? throw new ArgumentException("Quadra não encontrada.", nameof(id));

    ValidarQuadra(dto.Nome, dto.ModalidadePrincipal, dto.PrecoPorHora, dto.ImagemUrl);

        quadra.Nome = dto.Nome.Trim();
        quadra.ModalidadePrincipal = dto.ModalidadePrincipal.Trim();
        quadra.PrecoPorHora = dto.PrecoPorHora;
    quadra.ImagemUrl = string.IsNullOrWhiteSpace(dto.ImagemUrl) ? null : dto.ImagemUrl.Trim();

        await _quadraRepository.UpdateAsync(quadra);
        await _quadraRepository.SaveChangesAsync();

        return quadra;
    }

    /// <summary>
    /// Remove uma quadra existente, desde que encontrada.
    /// </summary>
    public async Task RemoverQuadraAsync(Guid id)
    {
        var quadra = await _quadraRepository.GetByIdForUpdateAsync(id)
            ?? throw new ArgumentException("Quadra não encontrada.", nameof(id));

        if (quadra.Reservas.Any(reserva => reserva.Status != StatusReserva.Cancelada))
        {
            throw new InvalidOperationException("Não é possível remover uma quadra com reservas ativas.");
        }

        await _quadraRepository.RemoveAsync(quadra);
        await _quadraRepository.SaveChangesAsync();
    }

    private static void ValidarQuadra(string nome, string modalidade, decimal precoPorHora, string? imagemUrl)
    {
        if (string.IsNullOrWhiteSpace(nome))
        {
            throw new ArgumentException("Informe um nome válido para a quadra.", nameof(nome));
        }

        if (string.IsNullOrWhiteSpace(modalidade))
        {
            throw new ArgumentException("Informe a modalidade principal da quadra.", nameof(modalidade));
        }

        if (precoPorHora <= 0)
        {
            throw new ArgumentException("O preço por hora deve ser maior que zero.", nameof(precoPorHora));
        }

        if (!string.IsNullOrWhiteSpace(imagemUrl))
        {
            if (imagemUrl.Length > 500)
            {
                throw new ArgumentException("O caminho da imagem pode ter no máximo 500 caracteres.", nameof(imagemUrl));
            }

            if (imagemUrl.Contains("..", StringComparison.Ordinal))
            {
                throw new ArgumentException("O caminho da imagem é inválido.", nameof(imagemUrl));
            }
        }
    }
}

