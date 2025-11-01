using System;
using System.Threading;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;

namespace AluguelQuadra.Application.Interfaces.Services;

/// <summary>
/// Define operações necessárias para integração com a API de PIX do Mercado Pago.
/// </summary>
public interface IMercadoPagoPixService
{
    Task<PixPagamentoDto> CriarPagamentoPixAsync(
        decimal valor,
        string descricao,
        string payerEmail,
        string payerFirstName,
        string payerLastName,
        DateTime expiraEm,
        CancellationToken cancellationToken = default);

    Task<(string Status, DateTime? PagoEm)> ObterStatusPagamentoAsync(
        string pagamentoId,
        CancellationToken cancellationToken = default);
}
