using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicalLotoBackend.Database.Migrations
{
    /// <inheritdoc />
    public partial class UserGameSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Sessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Sessions\" SET \"UserId\" = (SELECT \"Id\" FROM \"Users\" LIMIT 1) WHERE \"UserId\" IS NULL");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Sessions",
                type: "uuid",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_UserId",
                table: "Sessions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sessions_Users_UserId",
                table: "Sessions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sessions_Users_UserId",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_UserId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Sessions");
        }
    }
}
