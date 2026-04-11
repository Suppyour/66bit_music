using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicalLotoBackend.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddPrizeTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFullCardClaimed",
                table: "Sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsHorizontalClaimed",
                table: "Sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerticalClaimed",
                table: "Sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFullCardClaimed",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "IsHorizontalClaimed",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "IsVerticalClaimed",
                table: "Sessions");
        }
    }
}
