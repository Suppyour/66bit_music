using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicalLotoBackend.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCuteNameToGameCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CuteName",
                table: "GameCards",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CuteName",
                table: "GameCards");
        }
    }
}
