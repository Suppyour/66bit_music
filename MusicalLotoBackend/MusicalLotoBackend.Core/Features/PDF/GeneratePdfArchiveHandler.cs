using MediatR;
using System.IO.Compression;
using System.Text.Json;
using System.Text;
using System.Net;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using MusicalLotoBackend.Core.Features.PDF.Models;

namespace MusicalLotoBackend.Core.Features.PDF;

public class GeneratePdfArchiveHandler : IRequestHandler<GeneratePdfArchiveCommand, byte[]>
{
    private const string HtmlTemplate = @"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"" />
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
    @page {
        size: A4 landscape;
        margin: 0;
    }
    
    body {
        margin: 0;
        padding: 0;
        font-family: {FONT_FAMILY_CSS};
        -webkit-print-color-adjust: exact;
        background-color: #ffffff;
    }
    
    .page-container {
        width: 297mm;
        height: 210mm;
        box-sizing: border-box;
        padding: 15px;
        background-color: {ACCENT_COLOR};
        overflow: hidden;
    }
    
    .card-wrapper {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        background-color: rgba(255, 255, 255, 0.96);
        border: 2px solid #ffffff;
        display: flex;
        flex-direction: row;
        border-radius: 12px;
    }
    
    /* Left Panel: Ticket Main content */
    .left-panel {
        flex: 3.1;
        box-sizing: border-box;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }
    
    /* Right Panel: Separator and Rules */
    .right-panel {
        flex: 1;
        box-sizing: border-box;
        border-left: 2px dashed {ACCENT_COLOR};
        padding: 20px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        position: relative;
    }
    
    /* Scissors icon style */
    .scissors-label {
        font-size: 10px;
        color: #475569;
        text-align: center;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
    }
    
    .scissors-label span {
        font-size: 14px;
    }
    
    .rules-panel-title {
        font-size: 11px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 8px;
        color: #1e293b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Header Row */
    .header-row {
        display: flex;
        align-items: center;
        width: 100%;
        margin-bottom: 6px;
    }
    
    .header-line {
        flex-grow: 1;
        height: 1px;
        background-color: {ACCENT_COLOR};
    }
    
    .header-text {
        padding: 0 8px;
        font-size: 10.5px;
        color: #475569;
        white-space: nowrap;
        font-weight: 600;
        text-transform: lowercase;
        letter-spacing: 0.5px;
    }
    
    /* Title */
    .title-text {
        font-size: 26px;
        font-weight: 700;
        text-align: center;
        margin: 6px 0;
        color: #000000;
        text-transform: uppercase;
        letter-spacing: 1.5px;
    }
    
    /* Ticket Code */
    .ticket-code {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: {ACCENT_COLOR};
        text-align: center;
        margin-bottom: 8px;
    }
    
    /* Grid */
    .bingo-grid {
        display: grid;
        grid-template-columns: repeat({GRID_SIZE}, 1fr);
        gap: 6px;
        width: 100%;
        margin: 0 auto;
        padding: 8px;
        /* Dynamic Background Image */
        {BACKGROUND_IMAGE_CSS}
        background-size: cover;
        background-position: center;
        border-radius: 8px;
        box-sizing: border-box;
        border: 2px solid {ACCENT_COLOR};
    }
    
    /* Cell */
    .bingo-cell {
        border: 1.5px solid {ACCENT_COLOR};
        background-color: rgba(255, 255, 255, 0.96);
        border-radius: 8px;
        padding: 6px 4px;
        height: 48px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        text-align: center;
        overflow: hidden;
    }
    
    .cell-artist {
        font-size: 8px;
        font-weight: 700;
        color: #000000;
        margin-bottom: 2px;
        text-transform: uppercase;
        white-space: nowrap;
        text-overflow: ellipsis;
        width: 100%;
        overflow: hidden;
    }
    
    .cell-title {
        font-size: 8px;
        font-weight: 400;
        color: #475569;
        line-height: 1.1;
        width: 100%;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    /* Footer Row */
    .footer-row {
        display: flex;
        align-items: center;
        width: 100%;
        margin-top: 8px;
    }
    
    .footer-line {
        flex-grow: 1;
        height: 1px;
        background-color: {ACCENT_COLOR};
    }
    
    .footer-text {
        padding: 0 8px;
        font-size: 10.5px;
        color: #475569;
        white-space: nowrap;
        font-weight: 600;
        text-transform: lowercase;
        letter-spacing: 0.5px;
    }
    
    /* Mini Grids */
    .mini-grids-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        align-items: center;
        justify-content: center;
    }
    
    .mini-grid-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    
    .mini-grid-layout {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 2px;
        width: 65px;
        height: 65px;
        background: #f1f5f9;
        padding: 2px;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        box-sizing: border-box;
    }
    
    .mini-grid-cell {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        box-sizing: border-box;
        border-radius: 1px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        line-height: 1;
    }
    
    .mini-grid-cell.active {
        background-color: {ACCENT_COLOR} !important;
        border-color: {ACCENT_COLOR} !important;
    }
    
    .mini-grid-cell.full-x {
        color: {ACCENT_COLOR};
        font-weight: 700;
    }
    
    .mini-grid-label {
        font-size: 7.5px;
        color: #475569;
        text-align: center;
        margin-top: 4px;
        font-weight: 500;
    }
    
    /* Circular cuts on top and bottom perforation edges */
    .right-panel::before {
        content: '';
        position: absolute;
        top: -15px; /* Offset by half the circle diameter */
        left: -16px; /* Offset by half the circle diameter */
        width: 30px;
        height: 30px;
        background-color: {ACCENT_COLOR};
        border-radius: 50%;
        z-index: 10;
    }
    
    .right-panel::after {
        content: '';
        position: absolute;
        bottom: -15px; /* Offset by half the circle diameter */
        left: -16px; /* Offset by half the circle diameter */
        width: 30px;
        height: 30px;
        background-color: {ACCENT_COLOR};
        border-radius: 50%;
        z-index: 10;
    }
</style>
</head>
<body>
    <div class=""page-container"">
        <div class=""card-wrapper"">
            <div class=""left-panel"">
                <div class=""header-row"">
                    <span class=""header-line""></span>
                    <span class=""header-text"">{COMPANY_NAME}</span>
                    <span class=""header-line""></span>
                    <span class=""header-text"">{EDITION_NAME}</span>
                    <span class=""header-line""></span>
                </div>
                
                <h1 class=""title-text"">{TITLE_TEXT}</h1>
                
                {TICKET_CODE_HTML}
                
                <div class=""bingo-grid"">
                    {BINGO_CELLS_HTML}
                </div>
                
                <div class=""footer-row"">
                    <span class=""footer-line""></span>
                    <span class=""footer-text"">{FOOTER_TEXT}</span>
                    <span class=""footer-line""></span>
                </div>
            </div>
            
            <div class=""right-panel"">
                <div class=""scissors-label"">
                    <span>✂</span> — твоя уникальная песня
                </div>
                
                <div class=""rules-panel-title"">Победные комбинации</div>
                
                <div class=""mini-grids-container"">
                    {MINI_GRIDS_HTML}
                </div>
            </div>
        </div>
    </div>
</body>
</html>";

    public async Task<byte[]> Handle(GeneratePdfArchiveCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var cards = JsonSerializer.Deserialize<List<PdfCardDto>>(request.CardsJson, options) ?? new List<PdfCardDto>();
            var songs = JsonSerializer.Deserialize<List<PdfSongDto>>(request.SongsJson, options) ?? new List<PdfSongDto>();
            var songDict = songs.ToDictionary(s => s.Id, s => s);

            // 1. Prepare Background Image Base64 Data URI
            string bgImageCss = "";
            if (request.Background != null)
            {
                using var msBg = new MemoryStream();
                await request.Background.CopyToAsync(msBg, cancellationToken);
                var base64 = Convert.ToBase64String(msBg.ToArray());
                var contentType = request.Background.ContentType ?? "image/png";
                bgImageCss = $"background-image: url('data:{contentType};base64,{base64}');";
            }

            // 2. Prepare Font Family CSS
            string fontFamilyCss = request.FontFamily switch
            {
                "Montserrat" => "'Montserrat', sans-serif",
                "Inter" => "'Inter', sans-serif",
                _ => "'Playfair Display', serif"
            };

            // 3. Find local Chrome or Edge installation to avoid heavy downloads and timeouts
            string? localBrowserPath = null;

            if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Linux))
            {
                // Under Linux (inside our Debian Docker container)
                var linuxPaths = new[]
                {
                    "/usr/bin/chromium",
                    "/usr/bin/chromium-browser",
                    "/usr/bin/google-chrome-stable",
                    "/usr/bin/google-chrome"
                };
                foreach (var path in linuxPaths)
                {
                    if (System.IO.File.Exists(path))
                    {
                        localBrowserPath = path;
                        break;
                    }
                }
            }
            else
            {
                // Under Windows host
                var userAppDataPath = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe");
                var standardPaths = new List<string>
                {
                    userAppDataPath,
                    @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                    @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                    @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                    @"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
                };

                foreach (var path in standardPaths)
                {
                    if (System.IO.File.Exists(path))
                    {
                        localBrowserPath = path;
                        break;
                    }
                }
            }

            if (string.IsNullOrEmpty(localBrowserPath))
            {
                // Fallback: download Chromium if no local browser is found
                var browserFetcher = new BrowserFetcher();
                await browserFetcher.DownloadAsync();
            }

            // 4. Launch headless browser with specific production-grade Docker sandbox arguments
            var launchOptions = new LaunchOptions
            {
                Headless = true,
                ExecutablePath = localBrowserPath,
                Args = new[]
                {
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                }
            };
            using var browser = await Puppeteer.LaunchAsync(launchOptions);

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                int index = 1;
                foreach (var card in cards)
                {
                    // Generate cells HTML
                    var orderedCells = card.Cells.OrderBy(c => c.Row).ThenBy(c => c.Column).ToList();
                    int gridSize = (int)Math.Sqrt(card.Cells.Count);
                    if (gridSize == 0) gridSize = 5;

                    var cellsHtmlBuilder = new StringBuilder();
                    foreach (var cell in orderedCells)
                    {
                        var song = songDict.GetValueOrDefault(cell.SongId);
                        string title = song?.Title ?? "...";
                        string artist = song?.Artist ?? "";

                        cellsHtmlBuilder.Append($@"
                        <div class=""bingo-cell"">
                            <div class=""cell-artist"">{WebUtility.HtmlEncode(artist)}</div>
                            <div class=""cell-title"">{WebUtility.HtmlEncode(title)}</div>
                        </div>");
                    }

                    // Generate active rules grids
                    var miniGridsBuilder = new StringBuilder();
                    int rules = request.Rules;

                    // Horizontal (1)
                    if ((rules & 1) != 0)
                    {
                        var cellsGrid = new StringBuilder();
                        for (int idx = 0; idx < 25; idx++)
                        {
                            int r = idx / 5;
                            string activeClass = r == 2 ? "active" : "";
                            cellsGrid.Append($"<div class=\"mini-grid-cell {activeClass}\"></div>");
                        }
                        
                        miniGridsBuilder.Append($@"
                        <div class=""mini-grid-wrapper"">
                            <div class=""mini-grid-layout"">
                                {cellsGrid}
                            </div>
                            <span class=""mini-grid-label"">5 песен подряд в одном ряду</span>
                        </div>");
                    }

                    // Vertical (2)
                    if ((rules & 2) != 0)
                    {
                        var cellsGrid = new StringBuilder();
                        for (int idx = 0; idx < 25; idx++)
                        {
                            int col = idx % 5;
                            string activeClass = col == 2 ? "active" : "";
                            cellsGrid.Append($"<div class=\"mini-grid-cell {activeClass}\"></div>");
                        }
                        
                        miniGridsBuilder.Append($@"
                        <div class=""mini-grid-wrapper"">
                            <div class=""mini-grid-layout"">
                                {cellsGrid}
                            </div>
                            <span class=""mini-grid-label"">5 песен подряд в одной колонке</span>
                        </div>");
                    }

                    // Diagonal (8)
                    if ((rules & 8) != 0)
                    {
                        var cellsGrid = new StringBuilder();
                        for (int idx = 0; idx < 25; idx++)
                        {
                            int r = idx / 5;
                            int col = idx % 5;
                            string activeClass = (r == col || r + col == 4) ? "active" : "";
                            cellsGrid.Append($"<div class=\"mini-grid-cell {activeClass}\"></div>");
                        }
                        
                        miniGridsBuilder.Append($@"
                        <div class=""mini-grid-wrapper"">
                            <div class=""mini-grid-layout"">
                                {cellsGrid}
                            </div>
                            <span class=""mini-grid-label"">5 песен подряд по диагонали</span>
                        </div>");
                    }

                    // Full Card (always)
                    {
                        var cellsGrid = new StringBuilder();
                        for (int idx = 0; idx < 25; idx++)
                        {
                            cellsGrid.Append("<div class=\"mini-grid-cell full-x\">✖</div>");
                        }
                        
                        miniGridsBuilder.Append($@"
                        <div class=""mini-grid-wrapper"">
                            <div class=""mini-grid-layout"">
                                {cellsGrid}
                            </div>
                            <span class=""mini-grid-label"">комбинация из всех песен</span>
                        </div>");
                    }

                    string ticketCodeHtml = !string.IsNullOrEmpty(card.CuteName)
                        ? $"<div class=\"ticket-code\">Код билета: {WebUtility.HtmlEncode(card.CuteName)}</div>"
                        : "";

                    // Construct final HTML page
                    string html = HtmlTemplate
                        .Replace("{FONT_FAMILY_CSS}", fontFamilyCss)
                        .Replace("{ACCENT_COLOR}", request.AccentColor)
                        .Replace("{COMPANY_NAME}", WebUtility.HtmlEncode(request.CompanyName))
                        .Replace("{EDITION_NAME}", WebUtility.HtmlEncode(request.EditionName))
                        .Replace("{TITLE_TEXT}", WebUtility.HtmlEncode(request.TitleText))
                        .Replace("{FOOTER_TEXT}", WebUtility.HtmlEncode(request.FooterText))
                        .Replace("{TICKET_CODE_HTML}", ticketCodeHtml)
                        .Replace("{GRID_SIZE}", gridSize.ToString())
                        .Replace("{BACKGROUND_IMAGE_CSS}", bgImageCss)
                        .Replace("{BINGO_CELLS_HTML}", cellsHtmlBuilder.ToString())
                        .Replace("{MINI_GRIDS_HTML}", miniGridsBuilder.ToString());

                    // Print to PDF via Puppeteer
                    using var page = await browser.NewPageAsync();
                    await page.SetContentAsync(html);

                    var pdfOptions = new PdfOptions
                    {
                        Format = PaperFormat.A4,
                        Landscape = true,
                        PrintBackground = true,
                        MarginOptions = new MarginOptions
                        {
                            Top = "0px",
                            Bottom = "0px",
                            Left = "0px",
                            Right = "0px"
                        }
                    };

                    var pdfBytes = await page.PdfDataAsync(pdfOptions);

                    var fileName = !string.IsNullOrEmpty(card.CuteName) ? $"Card_{card.CuteName}.pdf" : $"Card_{index}.pdf";
                    var entry = archive.CreateEntry(fileName, CompressionLevel.Fastest);
                    using (var entryStream = entry.Open())
                    {
                        await entryStream.WriteAsync(pdfBytes, 0, pdfBytes.Length, cancellationToken);
                    }

                    index++;
                }
            }

            return memoryStream.ToArray();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PDF Generator Error] {ex}");
            try
            {
                System.IO.File.WriteAllText("pdf_error.txt", ex.ToString());
            }
            catch {}
            throw;
        }
    }
}
