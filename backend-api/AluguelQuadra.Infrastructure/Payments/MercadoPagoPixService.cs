using System;
using System.Globalization;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using AluguelQuadra.Application.DTOs;
using AluguelQuadra.Application.Interfaces.Services;
using Microsoft.Extensions.Options;

namespace AluguelQuadra.Infrastructure.Payments;

/// <summary>
/// Implementação simplificada da integração PIX com o Mercado Pago para geração de QR Codes.
/// </summary>
public sealed class MercadoPagoPixService : IMercadoPagoPixService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly HttpClient _httpClient;
    private readonly MercadoPagoOptions _options;

    public MercadoPagoPixService(HttpClient httpClient, IOptions<MercadoPagoOptions> optionsAccessor)
    {
        _options = optionsAccessor.Value ?? throw new ArgumentNullException(nameof(optionsAccessor));
        if (string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            throw new InvalidOperationException("Mercado Pago access token não configurado. Defina 'MercadoPago:AccessToken' nas configurações.");
        }

        _httpClient = httpClient;

        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl)
            ? "https://api.mercadopago.com/"
            : _options.BaseUrl.TrimEnd('/') + "/";

        if (_httpClient.BaseAddress is null || _httpClient.BaseAddress.AbsoluteUri != baseUrl)
        {
            _httpClient.BaseAddress = new Uri(baseUrl);
        }

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
        if (!_httpClient.DefaultRequestHeaders.UserAgent.Contains(new ProductInfoHeaderValue("NossaQuadra", "1.0")))
        {
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("NossaQuadra/1.0");
        }
    }

    public async Task<PixPagamentoDto> CriarPagamentoPixAsync(
        decimal valor,
        string descricao,
        string payerEmail,
        string payerFirstName,
        string payerLastName,
        DateTime expiraEm,
        CancellationToken cancellationToken)
    {
        var requestBody = new PixPaymentRequest
        {
            TransactionAmount = Math.Round(valor, 2, MidpointRounding.AwayFromZero),
            Description = descricao,
            PaymentMethodId = "pix",
            DateOfExpiration = expiraEm.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fffK", CultureInfo.InvariantCulture),
            NotificationUrl = string.IsNullOrWhiteSpace(_options.NotificationUrl) ? null : _options.NotificationUrl,
            Payer = new PixPaymentRequest.PayerInfo
            {
                Email = payerEmail,
                FirstName = payerFirstName,
                LastName = payerLastName,
            }
        };

        var idempotencyKey = Guid.NewGuid().ToString();

        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/payments")
        {
            Content = JsonContent.Create(requestBody, options: SerializerOptions)
        };
        request.Headers.TryAddWithoutValidation("X-Idempotency-Key", idempotencyKey);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Erro na criação do pagamento PIX no Mercado Pago: {(int)response.StatusCode} - {content}");
        }

        using var json = JsonDocument.Parse(content);
        var root = json.RootElement;

        var id = root.TryGetProperty("id", out var idElement)
            ? idElement.ToString()
            : string.Empty;
        var status = root.TryGetProperty("status", out var statusElement)
            ? statusElement.GetString() ?? "unknown"
            : "unknown";

        var transactionData = root
            .GetProperty("point_of_interaction")
            .GetProperty("transaction_data");

        var qrCode = transactionData.TryGetProperty("qr_code", out var qrCodeElement)
            ? qrCodeElement.GetString() ?? string.Empty
            : string.Empty;
        var qrCodeBase64 = transactionData.TryGetProperty("qr_code_base64", out var qrCodeBase64Element)
            ? qrCodeBase64Element.GetString() ?? string.Empty
            : string.Empty;
        var ticketUrl = transactionData.TryGetProperty("ticket_url", out var ticketElement)
            ? ticketElement.GetString() ?? string.Empty
            : string.Empty;

        DateTime expiration = expiraEm;
        if (transactionData.TryGetProperty("expiration_date", out var expirationElement) && expirationElement.ValueKind == JsonValueKind.String)
        {
            if (DateTimeOffset.TryParse(expirationElement.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var expirationOffset))
            {
                expiration = expirationOffset.UtcDateTime;
            }
        }
        else if (root.TryGetProperty("date_of_expiration", out var dateOfExpiration) && dateOfExpiration.ValueKind == JsonValueKind.String)
        {
            if (DateTimeOffset.TryParse(dateOfExpiration.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var expirationOffset))
            {
                expiration = expirationOffset.UtcDateTime;
            }
        }

        return new PixPagamentoDto
        {
            PagamentoId = id,
            Status = status,
            QrCode = qrCode,
            QrCodeBase64 = qrCodeBase64,
            TicketUrl = ticketUrl,
            ExpiraEm = expiration,
        };
    }

    public async Task<(string Status, DateTime? PagoEm)> ObterStatusPagamentoAsync(string pagamentoId, CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync($"v1/payments/{pagamentoId}", cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Não foi possível consultar o status do pagamento {pagamentoId}: {(int)response.StatusCode} - {content}");
        }

        using var json = JsonDocument.Parse(content);
        var root = json.RootElement;
        var status = root.TryGetProperty("status", out var statusElement)
            ? statusElement.GetString() ?? "unknown"
            : "unknown";

        DateTime? paidAt = null;
        if (status.Equals("approved", StringComparison.OrdinalIgnoreCase))
        {
            if (root.TryGetProperty("date_approved", out var dateApprovedElement) && dateApprovedElement.ValueKind == JsonValueKind.String)
            {
                if (DateTimeOffset.TryParse(dateApprovedElement.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dateApproved))
                {
                    paidAt = dateApproved.UtcDateTime;
                }
            }
        }

        return (status, paidAt);
    }

    private sealed record PixPaymentRequest
    {
        [JsonPropertyName("transaction_amount")]
        public decimal TransactionAmount { get; init; }

        [JsonPropertyName("description")]
        public string Description { get; init; } = string.Empty;

        [JsonPropertyName("payment_method_id")]
        public string PaymentMethodId { get; init; } = string.Empty;

        [JsonPropertyName("date_of_expiration")]
        public string DateOfExpiration { get; init; } = string.Empty;

        [JsonPropertyName("notification_url")]
        public string? NotificationUrl { get; init; }

        [JsonPropertyName("payer")]
        public PayerInfo Payer { get; init; } = new();

        public sealed record PayerInfo
        {
            [JsonPropertyName("email")]
            public string Email { get; init; } = string.Empty;

            [JsonPropertyName("first_name")]
            public string FirstName { get; init; } = string.Empty;

            [JsonPropertyName("last_name")]
            public string LastName { get; init; } = string.Empty;
        }
    }
}
