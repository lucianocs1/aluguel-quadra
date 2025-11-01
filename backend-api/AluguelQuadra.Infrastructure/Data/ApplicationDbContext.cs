using AluguelQuadra.Domain.Entities;
using AluguelQuadra.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AluguelQuadra.Infrastructure.Data;

/// <summary>
/// Contexto EF Core que mapeia entidades de domínio para o banco PostgreSQL.
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Quadra> Quadras => Set<Quadra>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Reserva> Reservas => Set<Reserva>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configura restrições e relacionamentos específicos da entidade Quadra.
        modelBuilder.Entity<Quadra>(builder =>
        {
            builder.ToTable("quadras");
            builder.HasKey(q => q.Id);

            builder.Property(q => q.Nome)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(q => q.ModalidadePrincipal)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(q => q.PrecoPorHora)
                .HasColumnType("numeric(18,2)");

            builder.Property(q => q.ImagemUrl)
                .HasMaxLength(500);

            builder.HasMany(q => q.Reservas)
                .WithOne(r => r.Quadra)
                .HasForeignKey(r => r.QuadraId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Define atributos obrigatórios e chave estrangeira para a entidade Usuario.
        modelBuilder.Entity<Usuario>(builder =>
        {
            builder.ToTable("usuarios");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Nome)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Sobrenome)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Email)
                .IsRequired()
                .HasMaxLength(200);

            builder.HasIndex(c => c.Email)
                .IsUnique();

            builder.Property(c => c.SenhaHash)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(c => c.Perfil)
                .HasConversion<int>()
                .IsRequired()
                .HasDefaultValue(PerfilUsuario.Cliente);

            builder.HasMany(c => c.Reservas)
                .WithOne(r => r.Usuario)
                .HasForeignKey(r => r.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Ajusta colunas de datas, preço e status da Reserva.
        modelBuilder.Entity<Reserva>(builder =>
        {
            builder.ToTable("reservas");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.UsuarioId)
                .IsRequired();

            builder.Property(r => r.DataHoraInicio)
                .IsRequired();

            builder.Property(r => r.DataHoraFim)
                .IsRequired();

            builder.Property(r => r.PrecoTotal)
                .HasColumnType("numeric(18,2)");

            builder.Property(r => r.Status)
                .IsRequired();

            builder.Property(r => r.PagamentoId)
                .HasMaxLength(100);

            builder.Property(r => r.PagamentoStatus)
                .HasMaxLength(40);

            builder.Property(r => r.PagamentoExpiraEm);

            builder.Property(r => r.PixQrCode);
            builder.Property(r => r.PixQrCodeBase64);
            builder.Property(r => r.PixTicketUrl)
                .HasMaxLength(500);

            builder.Property(r => r.CriadoEm)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(r => r.AtualizadoEm);
        });
    }
}

