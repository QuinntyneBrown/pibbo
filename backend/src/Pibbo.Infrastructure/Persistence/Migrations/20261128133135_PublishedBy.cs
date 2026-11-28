using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pibbo.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PublishedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublishedBy",
                table: "content_versions",
                type: "TEXT",
                maxLength: 128,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublishedBy",
                table: "content_versions");
        }
    }
}
