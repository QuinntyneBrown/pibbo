using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pibbo.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "content_versions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Version = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    ETag = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_content_versions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ContentVersionId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Group = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Glyph = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Recording = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Pictures = table.Column<string>(type: "TEXT", nullable: false),
                    Recordings = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_activities_content_versions_ContentVersionId",
                        column: x => x.ContentVersionId,
                        principalTable: "content_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lessons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ContentVersionId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    LessonId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Recording = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Activities = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lessons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lessons_content_versions_ContentVersionId",
                        column: x => x.ContentVersionId,
                        principalTable: "content_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_activities_ContentVersionId_ActivityId",
                table: "activities",
                columns: new[] { "ContentVersionId", "ActivityId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_content_versions_Version",
                table: "content_versions",
                column: "Version",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lessons_ContentVersionId_LessonId",
                table: "lessons",
                columns: new[] { "ContentVersionId", "LessonId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "activities");

            migrationBuilder.DropTable(
                name: "lessons");

            migrationBuilder.DropTable(
                name: "content_versions");
        }
    }
}
