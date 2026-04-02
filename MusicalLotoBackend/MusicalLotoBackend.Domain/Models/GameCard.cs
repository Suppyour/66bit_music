namespace MusicalLotoBackend.Domain.Models;

public class GameCard : BaseEntity
{
    public Guid GameSessionId { get; set; }
    public GameSession GameSession { get; set; }
    public List<CardCell> Cells { get; set; } = new();
}
