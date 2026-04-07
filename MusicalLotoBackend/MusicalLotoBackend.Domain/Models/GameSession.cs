namespace MusicalLotoBackend.Domain.Models;

public class GameSession : BaseEntity
{
    public required string Name { get; set; }
    public int ParticipantCount { get; set; }
    public int CardSize { get; set; }
    public List<GameCard> Cards { get; set; }
    public WinningRules Rules { get; set; }
    public List<Guid> Playlist { get; set; }
}

[Flags]
public enum WinningRules
{
    None = 0,
    Horizontal = 1,
    Vertical = 2,
    FullCard = 4
}