using MediatR;
using System.IO.Compression;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.Json;
using MusicalLotoBackend.Core.Features.PDF.Models;

namespace MusicalLotoBackend.Core.Features.PDF;

public class GeneratePdfArchiveHandler : IRequestHandler<GeneratePdfArchiveCommand, byte[]>
{
    public async Task<byte[]> Handle(GeneratePdfArchiveCommand request, CancellationToken cancellationToken)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var cards = JsonSerializer.Deserialize<List<PdfCardDto>>(request.CardsJson, options) ?? new List<PdfCardDto>();
        var songs = JsonSerializer.Deserialize<List<PdfSongDto>>(request.SongsJson, options) ?? new List<PdfSongDto>();
        var songDict = songs.ToDictionary(s => s.Id, s => s);

        byte[]? bgImageBytes = null;
        if (request.Background != null)
        {
            using var msBg = new MemoryStream();
            await request.Background.CopyToAsync(msBg, cancellationToken);
            bgImageBytes = msBg.ToArray();
        }

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            int index = 1;
            foreach (var card in cards)
            {
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());
                        page.Margin(1, QuestPDF.Infrastructure.Unit.Centimetre);
                        page.PageColor(Colors.White);

                        if (bgImageBytes != null)
                        {
                            page.Background().Image(bgImageBytes).FitArea();
                        }

                        page.Content().Column(col => 
                        {
                            col.Spacing(20);
                            
                            col.Item()
                                .AlignCenter()
                                .Background(Colors.White.WithAlpha(200))
                                .Padding(10)
                                .Text("Музыкальное Лото")
                                .FontSize(24)
                                .Bold()
                                .FontColor(Colors.Black);
                            
                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    for (int i = 0; i < 5; i++) columns.RelativeColumn();
                                });

                                var orderedCells = card.Cells.OrderBy(c => c.Row).ThenBy(c => c.Column).ToList();

                                foreach (var cell in orderedCells)
                                {
                                    var song = songDict.GetValueOrDefault(cell.SongId);
                                    string title = song?.Title ?? "...";
                                    string artist = song?.Artist ?? "";

                                    table.Cell().Row((uint)cell.Row + 1).Column((uint)cell.Column + 1)
                                        .Border(1)
                                        .BorderColor(Colors.Grey.Lighten2)
                                        .Background(Colors.White)
                                        .Padding(10)
                                        .AlignCenter()
                                        .AlignMiddle()
                                        .Element(e => 
                                        {
                                            e.Column(c => 
                                            {
                                                c.Item().AlignCenter().Text(title).FontSize(12).Bold().FontColor(Colors.Black);
                                                if (!string.IsNullOrEmpty(artist))
                                                {
                                                    c.Item().AlignCenter().Text(artist).FontSize(10).FontColor(Colors.Grey.Darken2);
                                                }
                                            });
                                        });
                                }
                            });
                        });
                    });
                });

                var pdfBytes = document.GeneratePdf();

                var entry = archive.CreateEntry($"Card_{index}.pdf", CompressionLevel.Fastest);
                using var entryStream = entry.Open();
                await entryStream.WriteAsync(pdfBytes, 0, pdfBytes.Length, cancellationToken);
                
                index++;
            }
        }

        return memoryStream.ToArray();
    }
}
