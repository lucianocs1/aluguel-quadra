using System.IO;
using AluguelQuadra.Application.Interfaces.Repositories;
using AluguelQuadra.Application.Interfaces.Services;
using AluguelQuadra.Application.Services;
using AluguelQuadra.Infrastructure.Data;
using AluguelQuadra.Infrastructure.Payments;
using AluguelQuadra.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

// Configura host e contêiner de injeção de dependência da aplicação.
var builder = WebApplication.CreateBuilder(args);

// Registra serviços essenciais da Web API.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins("http://localhost:8080")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Recupera a string de conexão definida nas configurações.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Configura o DbContext para usar PostgreSQL via Npgsql.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Injeção dos repositórios e serviços de aplicação utilizados pelos controllers.
builder.Services.AddScoped<IQuadraRepository, QuadraRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();
builder.Services.AddScoped<IQuadraService, QuadraService>();
builder.Services.AddScoped<IReservaService, ReservaService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();

builder.Services.Configure<MercadoPagoOptions>(builder.Configuration.GetSection("MercadoPago"));
builder.Services.AddHttpClient<IMercadoPagoPixService, MercadoPagoPixService>();

var app = builder.Build();

if (string.IsNullOrWhiteSpace(app.Environment.WebRootPath))
{
    var defaultWebRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
    Directory.CreateDirectory(defaultWebRoot);
    app.Environment.WebRootPath = defaultWebRoot;
}

var uploadsPath = Path.Combine(app.Environment.WebRootPath!, "uploads", "quadras");
Directory.CreateDirectory(uploadsPath);

if (app.Environment.IsDevelopment())
{
    // Disponibiliza o Swagger para explorar os endpoints em desenvolvimento.
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("FrontendCors");

app.UseAuthorization();

// Mapeia os controllers da aplicação.
app.MapControllers();

app.Run();

