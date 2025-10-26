using AluguelQuadra.Domain.Entities;
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
    public DbSet<Cliente> Clientes => Set<Cliente>();
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

            builder.HasMany(q => q.Reservas)
                .WithOne(r => r.Quadra)
                .HasForeignKey(r => r.QuadraId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Define atributos obrigatórios e chave estrangeira para a entidade Cliente.
        modelBuilder.Entity<Cliente>(builder =>
        {
            builder.ToTable("clientes");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Nome)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Email)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Telefone)
                .IsRequired()
                .HasMaxLength(20);

            builder.HasMany(c => c.Reservas)
                .WithOne(r => r.Cliente)
                .HasForeignKey(r => r.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Ajusta colunas de datas, preço e status da Reserva.
        modelBuilder.Entity<Reserva>(builder =>
        {
            builder.ToTable("reservas");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.DataHoraInicio)
                .IsRequired();

            builder.Property(r => r.DataHoraFim)
                .IsRequired();

            builder.Property(r => r.PrecoTotal)
                .HasColumnType("numeric(18,2)");

            builder.Property(r => r.Status)
                .IsRequired();
        });
    }
}

