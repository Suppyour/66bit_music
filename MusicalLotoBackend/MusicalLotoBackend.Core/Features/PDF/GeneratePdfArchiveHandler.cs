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

        // --- Настройки текста и цветов для легкого изменения ---
        string companyName = request.CompanyName ?? "Название компании";
        string editionName = request.EditionName ?? "Название издания";
        string titleText = request.TitleText ?? "Заголовок";
        string footerText = request.FooterText ?? "Подзаголовок";
        string rulesTitle = "Победные комбинации";
        
        string redAccent = "#B21016"; // Красный цвет из макета
        // Слегка прозрачный фон (90% белого), чтобы фон (картинка) просвечивал, но текст хорошо читался
        string panelBackgroundColor = "#E6FFFFFF"; 
        string cellBackgroundColor = "#F2FFFFFF"; // Ячейки чуть более плотные

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
                        page.Margin(10); // Уменьшен отступ, чтобы точно влезло
                        
                        page.Background().Element(c => 
                        {
                            if (bgImageBytes != null)
                                c.Image(bgImageBytes).FitUnproportionally(); // Растягиваем на весь лист
                            else
                                c.Background(redAccent);
                        });

                        // Общий полупрозрачный белый фон для карточки (Glassmorphism эффект)
                        page.Content().Background(panelBackgroundColor).Row(row => 
                        {
                            // Левая часть (Основная сетка)
                            row.RelativeItem(3).Padding(15).Column(col => 
                            {
                                // Заголовок с линиями
                                col.Item().Row(r => {
                                    r.RelativeItem().PaddingTop(8).LineHorizontal(1).LineColor(redAccent);
                                    r.AutoItem().PaddingHorizontal(10).Text(companyName).FontSize(12).FontColor(Colors.Grey.Darken3);
                                    r.RelativeItem().PaddingTop(8).LineHorizontal(1).LineColor(redAccent);
                                    r.AutoItem().PaddingHorizontal(10).Text(editionName).FontSize(12).FontColor(Colors.Grey.Darken3);
                                    r.RelativeItem().PaddingTop(8).LineHorizontal(1).LineColor(redAccent);
                                });

                                // Главный заголовок
                                col.Item().PaddingVertical(10).AlignCenter().Text(titleText).FontSize(30).Bold().FontColor(Colors.Black);

                                // Сетка 5x5
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
                                            .Padding(4) // Уменьшен отступ
                                            .Element(e => e
                                                .Border(1.5f).BorderColor(redAccent)
                                                .Background(cellBackgroundColor)
                                                .Padding(4)
                                                .Height(52) // Уменьшена высота ячейки, чтобы точно всё влезло на 1 страницу
                                                .AlignCenter().AlignMiddle()
                                                .Column(c => 
                                                {
                                                    c.Item().AlignCenter().Text(artist).FontSize(10).FontColor(Colors.Black).SemiBold();
                                                    c.Item().AlignCenter().Text(title).FontSize(9).FontColor(Colors.Grey.Darken3);
                                                })
                                            );
                                    }
                                });

                                // Подвал
                                col.Item().PaddingTop(15).Row(r => {
                                    r.RelativeItem().PaddingTop(8).LineHorizontal(1).LineColor(redAccent);
                                    r.AutoItem().PaddingHorizontal(10).Text(footerText).FontSize(12).FontColor(Colors.Grey.Darken3);
                                    r.RelativeItem().PaddingTop(8).LineHorizontal(1).LineColor(redAccent);
                                });
                            });

                            // Линия отреза
                            row.AutoItem().Width(1).Background(redAccent);

                            // Правая часть (Правила)
                            row.RelativeItem(1).Padding(20).Column(col => 
                            {
                                col.Spacing(15);
                                col.Item().AlignCenter().Text("✂  твоя уникальная песня").FontSize(10).FontColor(Colors.Grey.Darken2);
                                col.Item().AlignCenter().Text(rulesTitle).FontSize(12).SemiBold();

                                // Рисуем 3 мини-сетки правил
                                DrawMiniGrid(col, "5 песен подряд в одном ряду", "horizontal", redAccent);
                                DrawMiniGrid(col, "5 песен подряд в одной колонке", "vertical", redAccent);
                                DrawMiniGrid(col, "комбинация из всех песен", "full", redAccent);
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

    private static void DrawMiniGrid(ColumnDescriptor col, string label, string type, string color)
    {
        col.Item().AlignCenter().Container().Width(80).Table(table => 
        {
            table.ColumnsDefinition(c => { for(int i=0; i<5; i++) c.RelativeColumn(); });
            
            for (uint row = 1; row <= 5; row++)
            {
                for (uint c = 1; c <= 5; c++)
                {
                    var cell = table.Cell().Row(row).Column(c).Border(1).BorderColor(Colors.Grey.Lighten1).Height(16);
                    
                    if (type == "horizontal" && row == 3)
                        cell.Background(color);
                    else if (type == "vertical" && c == 3)
                        cell.Background(color);
                    else if (type == "full")
                        cell.AlignCenter().AlignMiddle().Text("X").FontSize(10).FontColor(color).Bold();
                }
            }
        });
        col.Item().PaddingTop(5).AlignCenter().Text(label).FontSize(8).FontColor(Colors.Grey.Darken2);
    }
}
