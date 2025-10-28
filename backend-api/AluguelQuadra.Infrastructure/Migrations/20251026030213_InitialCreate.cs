using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AluguelQuadra.Infrastructure.Migrations
{
    /// <summary>
    /// Migration responsável por criar as tabelas de usuários, quadras e reservas.
    /// </summary>
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Sobrenome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SenhaHash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "quadras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ModalidadePrincipal = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PrecoPorHora = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quadras", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "reservas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuadraId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataHoraInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataHoraFim = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PrecoTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reservas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_reservas_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reservas_quadras_QuadraId",
                        column: x => x.QuadraId,
                        principalTable: "quadras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reservas_UsuarioId",
                table: "reservas",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_Email",
                table: "usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reservas_QuadraId",
                table: "reservas",
                column: "QuadraId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reservas");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "quadras");
        }
    }
}

