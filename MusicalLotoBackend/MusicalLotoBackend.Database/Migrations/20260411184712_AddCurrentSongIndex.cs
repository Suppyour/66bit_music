using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicalLotoBackend.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentSongIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentSongIndex",
                table: "Sessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentSongIndex",
                table: "Sessions");
        }
    }
}
