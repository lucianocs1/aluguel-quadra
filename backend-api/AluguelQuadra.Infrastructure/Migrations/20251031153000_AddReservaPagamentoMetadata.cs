using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AluguelQuadra.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReservaPagamentoMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AtualizadoEm",
                table: "reservas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CriadoEm",
                table: "reservas",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<DateTime>(
                name: "PagamentoExpiraEm",
                table: "reservas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PagamentoId",
                table: "reservas",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PagamentoStatus",
                table: "reservas",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PixQrCode",
                table: "reservas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PixQrCodeBase64",
                table: "reservas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PixTicketUrl",
                table: "reservas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AtualizadoEm",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "CriadoEm",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "PagamentoExpiraEm",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "PagamentoId",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "PagamentoStatus",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "PixQrCode",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "PixQrCodeBase64",
                table: "reservas");

            migrationBuilder.DropColumn(
                name: "PixTicketUrl",
                table: "reservas");
        }
    }
}
