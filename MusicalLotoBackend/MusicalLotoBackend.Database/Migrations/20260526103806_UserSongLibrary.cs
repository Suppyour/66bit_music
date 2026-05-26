using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicalLotoBackend.Database.Migrations
{
    /// <inheritdoc />
    public partial class UserSongLibrary : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Songs",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Songs\" SET \"UserId\" = (SELECT \"Id\" FROM \"Users\" LIMIT 1) WHERE \"UserId\" IS NULL");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Songs",
                type: "uuid",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "IX_Songs_UserId",
                table: "Songs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Songs_Users_UserId",
                table: "Songs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Songs_Users_UserId",
                table: "Songs");

            migrationBuilder.DropIndex(
                name: "IX_Songs_UserId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Songs");
        }
    }
}
