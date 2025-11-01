namespace AluguelQuadra.Infrastructure.Payments;

/// <summary>
/// Configurações necessárias para autenticação e personalização da API do Mercado Pago.
/// </summary>
public sealed class MercadoPagoOptions
{
    /// <summary>
    /// Access token gerado no painel do Mercado Pago para o ambiente de homologação.
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Url base da API do Mercado Pago. Mantém-se padrão quando não informada.
    /// </summary>
    public string? BaseUrl { get; set; }

    /// <summary>
    /// Endpoint público para receber notificações (webhook). Opcional nesta fase.
    /// </summary>
    public string? NotificationUrl { get; set; }
}
