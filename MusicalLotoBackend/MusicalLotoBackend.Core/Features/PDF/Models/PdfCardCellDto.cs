namespace MusicalLotoBackend.Core.Features.PDF.Models;

public class PdfCardCellDto
{
    public int Row { get; set; }
    public int Column { get; set; }
    public string SongId { get; set; } = string.Empty;
}
