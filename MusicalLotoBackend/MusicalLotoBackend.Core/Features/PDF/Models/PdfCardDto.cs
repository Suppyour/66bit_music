namespace MusicalLotoBackend.Core.Features.PDF.Models;

public class PdfCardDto
{
    public string Id { get; set; } = string.Empty;
    public List<PdfCardCellDto> Cells { get; set; } = new();
}
