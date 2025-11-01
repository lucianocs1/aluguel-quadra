using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AluguelQuadra.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuadraImagem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagemUrl",
                table: "quadras",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagemUrl",
                table: "quadras");
        }
    }
}
