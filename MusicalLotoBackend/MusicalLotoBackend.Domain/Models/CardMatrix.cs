namespace MusicalLotoBackend.Domain.Models;

public class CardCell
{
    public int Row { get; set; }
    public int Column  { get; set; }
    public required Guid SongId { get; set; }
    public bool IsMarked { get; set; }
}