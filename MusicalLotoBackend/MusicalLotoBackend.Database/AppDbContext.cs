using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        
    }
    
    public DbSet<Song> Songs { get; set; }
    public DbSet<GameSession> Sessions { get; set; }
    public DbSet<GameCard> GameCards { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<GameCard>().OwnsMany(card => card.Cells, cells =>
        {
            cells.ToJson();
        });
    }
}