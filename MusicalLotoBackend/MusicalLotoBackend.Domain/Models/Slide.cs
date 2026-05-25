using System;

namespace MusicalLotoBackend.Domain.Models;

public enum SlideType
{
    Title,
    Rules,
    GameBoard,
    QrCode,
    Song,
    Winner
}

public class Slide
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public SlideType Type { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public int Order { get; set; }
    public bool IsRequired { get; set; } = false;
    public Guid? SongId { get; set; }
}
