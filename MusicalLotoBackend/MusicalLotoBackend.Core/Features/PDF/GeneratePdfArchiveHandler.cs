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
    
    .print-card-container {
        width: 793px;
        height: 560px;
        background-color: {ACCENT_COLOR};
        padding: 12px;
        box-sizing: border-box;
        display: flex;
        overflow: hidden;
        position: relative;
    }
    
    .print-card-container * {
        box-sizing: border-box;
    }
    
    .print-card-container .inner-border-box {
        border: 1.5px solid {ACCENT_COLOR};
        border-radius: 12px;
        background-color: #ffffff;
        width: 100%;
        height: 100%;
        display: flex;
        position: relative;
        overflow: visible; /* to avoid cutting text on borders */
    }
    
    .print-card-container .card-left-panel {
        flex: 3.1;
        background-color: rgba(255, 255, 255, 0.95);
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        position: relative;
    }
    
    .print-card-container .card-right-panel {
        flex: 1;
        background-color: rgba(255, 255, 255, 0.95);
        padding: 70px 14px 20px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        border-left: 1.5px dashed {ACCENT_COLOR};
        height: 100%;
        position: relative;
    }
    
    .print-card-container .card-right-panel::before {
        content: '';
        position: absolute;
        top: -15px;
        left: -16px;
        width: 30px;
        height: 30px;
        background-color: {ACCENT_COLOR};
        border-radius: 50%;
        z-index: 10;
    }
    
    .print-card-container .card-right-panel::after {
        content: '';
        position: absolute;
        bottom: -15px;
        left: -16px;
        width: 30px;
        height: 30px;
        background-color: {ACCENT_COLOR};
        border-radius: 50%;
        z-index: 10;
    }
    
    .print-card-container .scissors-label {
        position: absolute;
        top: 40px;
        right: 20px;
        background-color: #ffffff;
        padding: 0 8px;
        font-size: 10.5px;
        font-weight: 500;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 10;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .scissors-label .scissors-icon {
        font-size: 13px;
        color: {ACCENT_COLOR};
    }
    
    .print-card-container .card-header-left {
        position: absolute;
        top: 15px;
        left: 24px;
        overflow: hidden;
        vertical-align: -20px;
        background-color: #ffffff;
        padding: 0 8px;
        font-size: 10.5px;
        color: #475569;
        font-weight: 700;
        z-index: 10;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .card-header-center {
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ffffff;
        padding: 0 8px;
        font-size: 10.5px;
        color: #475569;
        font-weight: 500;
        z-index: 10;
        text-transform: uppercase;
        white-space: nowrap;
        letter-spacing: 0.5px;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .card-footer-row {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ffffff;
        padding: 0 8px;
        font-size: 10.5px;
        color: #475569;
        font-weight: 500;
        z-index: 10;
        white-space: nowrap;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .rules-panel-title {
        font-size: 11px;
        font-weight: 700;
        text-align: center;
        color: #1E293B;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 12px 0 6px 0;
    }
    
    .print-card-container .title-line {
        flex-grow: 1;
        height: 1.5px;
        background-color: #000000;
        max-width: 60px;
    }
    
    .print-card-container .card-title-text {
        padding: 0 16px;
        font-size: 26px;
        font-weight: 700;
        color: #000000;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin: 0;
        white-space: nowrap;
    }
    
    .print-card-container .card-subtitle-code {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: {ACCENT_COLOR};
        text-align: center;
        margin-top: -4px;
        margin-bottom: 10px;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .bingo-card {
        display: grid;
        grid-template-columns: repeat({GRID_SIZE}, 1fr);
        gap: 8px !important;
        background-color: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        margin: 0 auto !important;
        {BACKGROUND_IMAGE_CSS}
        background-size: cover;
        background-position: center;
    }
    
    .print-card-container .bingo-cell {
        border: 1.5px solid {ACCENT_COLOR} !important;
        background-color: #ffffff !important;
        border-radius: 14px !important;
        padding: 6px !important;
        height: 80px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        aspect-ratio: auto !important;
        position: relative !important;
    }
    
    .print-card-container .cell-title {
        font-size: 10px !important;
        font-weight: 500 !important;
        color: #1e293b !important;
        line-height: 1.25 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        width: 100% !important;
        text-align: center !important;
        font-family: 'Montserrat', sans-serif;
    }
    
    .print-card-container .corner-bow {
        position: absolute;
        width: 16px;
        height: 16px;
        z-index: 15;
        pointer-events: none;
    }
    
    .print-card-container .corner-bow.top-left {
        top: -8px;
        left: -8px;
        transform: rotate(45deg);
    }
    
    .print-card-container .corner-bow.top-right {
        top: -8px;
        right: -8px;
        transform: rotate(-45deg);
    }
    
    .print-card-container .corner-bow.bottom-left {
        bottom: -8px;
        left: -8px;
        transform: rotate(135deg);
    }
    
    .print-card-container .corner-bow.bottom-right {
        bottom: -8px;
        right: -8px;
        transform: rotate(-135deg);
    }
    
    .print-card-container .mini-grids-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        align-items: center;
        justify-content: center;
        transform: scale(1.6);
        transform-origin: center top;
    }
    
    .print-card-container .mini-grid-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    
    .print-card-container .mini-grid-layout {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 2px;
        width: 58px;
        height: 58px;
        background: transparent;
        padding: 0;
        position: relative;
    }
    
    .print-card-container .mini-grid-layout.horizontal-rule::after {
        content: '';
        position: absolute;
        left: -2px;
        right: -2px;
        top: 50%;
        transform: translateY(-50%);
        height: 2.5px;
        background-color: {ACCENT_COLOR};
        z-index: 5;
        border-radius: 1px;
    }
    
    .print-card-container .mini-grid-layout.vertical-rule::after {
        content: '';
        position: absolute;
        top: -2px;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 2.5px;
        background-color: {ACCENT_COLOR};
        z-index: 5;
        border-radius: 1px;
    }
    
    .print-card-container .mini-grid-cell {
        background-color: #FFFFFF;
        border: 1px solid #cbd5e1;
        border-radius: 50%;
        width: 10px;
        height: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7px;
        line-height: 1;
    }
    
    .print-card-container .mini-grid-cell.active-cross {
        border-color: {ACCENT_COLOR} !important;
        color: {ACCENT_COLOR} !important;
        font-weight: 700;
    }
    
    .print-card-container .mini-grid-label {
        font-size: 7.5px;
        color: #475569;
        text-align: center;
        margin-top: 4px;
        font-weight: 500;
        font-family: 'Montserrat', sans-serif;
    }
</style>
</head>
<body>
    <div class=""print-card-container"">
        <div class=""inner-border-box"">
            <div class=""card-left-panel"">
                <div class=""card-header-left"">
                    <strong>{COMPANY_NAME}</strong>
                </div>
                <div class=""card-header-center"">
                    <span>{EDITION_NAME}</span>
                </div>
                
                <div class=""title-row"">
                    <span class=""title-line""></span>
                    <h2 class=""card-title-text"">{TITLE_TEXT}</h2>
                    <span class=""title-line""></span>
                </div>
                
                {TICKET_CODE_HTML}
                
                <div class=""bingo-card"">
                    {BINGO_CELLS_HTML}
                </div>
                
                <div class=""card-footer-row"">
                    <span>{FOOTER_TEXT}</span>
                </div>
            </div>
            
            <div class=""card-right-panel"">
                <div class=""scissors-label"">
                    <span class=""scissors-icon"">✂</span> — твоя уникальная песня
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

            async Task<byte[]> GenerateCardPdfAsync(PdfCardDto card, IBrowser browser, int index)
            {
                // Generate cells HTML
                var orderedCells = card.Cells.OrderBy(c => c.Row).ThenBy(c => c.Column).ToList();
                int gridSize = (int)Math.Sqrt(card.Cells.Count);
                if (gridSize == 0) gridSize = 5;

                var cellsHtmlBuilder = new StringBuilder();
                for (int cIdx = 0; cIdx < orderedCells.Count; cIdx++)
                {
                    var cell = orderedCells[cIdx];
                    var song = songDict.GetValueOrDefault(cell.SongId);
                    string title = song?.Title ?? "...";
                    string artist = song?.Artist ?? "";
                    string fullText = !string.IsNullOrEmpty(artist) ? $"{artist} – {title}" : title;

                    string bowsHtml = "";
                    // Center cell is Row 2 Column 2 (0-indexed)
                    if (cell.Row == 2 && cell.Column == 2)
                    {
                        bowsHtml = $@"
                        <svg class=""corner-bow top-left"" viewBox=""0 0 100 100"" style=""stroke: {request.AccentColor};""><path d=""M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90"" fill=""none"" stroke-width=""8"" stroke-linecap=""round""/></svg>
                        <svg class=""corner-bow top-right"" viewBox=""0 0 100 100"" style=""stroke: {request.AccentColor};""><path d=""M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90"" fill=""none"" stroke-width=""8"" stroke-linecap=""round""/></svg>
                        <svg class=""corner-bow bottom-left"" viewBox=""0 0 100 100"" style=""stroke: {request.AccentColor};""><path d=""M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90"" fill=""none"" stroke-width=""8"" stroke-linecap=""round""/></svg>
                        <svg class=""corner-bow bottom-right"" viewBox=""0 0 100 100"" style=""stroke: {request.AccentColor};""><path d=""M 50 50 C 20 20, 20 80, 50 50 C 80 20, 80 80, 50 50 M 50 50 L 30 90 M 50 50 L 70 90"" fill=""none"" stroke-width=""8"" stroke-linecap=""round""/></svg>";
                    }

                    cellsHtmlBuilder.Append($@"
                    <div class=""bingo-cell"">
                        {bowsHtml}
                        <div class=""cell-title"">{WebUtility.HtmlEncode(fullText)}</div>
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
                        cellsGrid.Append("<div class=\"mini-grid-cell\"></div>");
                    }
                    
                    miniGridsBuilder.Append($@"
                    <div class=""mini-grid-wrapper"">
                        <div class=""mini-grid-layout horizontal-rule"">
                            {cellsGrid}
                        </div>
                        <span class=""mini-grid-label"">5 песен в одном ряду</span>
                    </div>");
                }

                // Vertical (2)
                if ((rules & 2) != 0)
                {
                    var cellsGrid = new StringBuilder();
                    for (int idx = 0; idx < 25; idx++)
                    {
                        cellsGrid.Append("<div class=\"mini-grid-cell\"></div>");
                    }
                    
                    miniGridsBuilder.Append($@"
                    <div class=""mini-grid-wrapper"">
                        <div class=""mini-grid-layout vertical-rule"">
                            {cellsGrid}
                        </div>
                        <span class=""mini-grid-label"">5 песен в одной колонке</span>
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
                        bool isAccent = r == col || r + col == 4;
                        if (isAccent)
                        {
                            cellsGrid.Append("<div class=\"mini-grid-cell active-cross\">✕</div>");
                        }
                        else
                        {
                            cellsGrid.Append("<div class=\"mini-grid-cell\"></div>");
                        }
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
                        cellsGrid.Append("<div class=\"mini-grid-cell active-cross\">✕</div>");
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
                    ? $"<div class=\"card-subtitle-code\">Код билета: {WebUtility.HtmlEncode(card.CuteName)}</div>"
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

                // Set viewport to the exact layout size (793x560) designed for the ticket elements
                await page.SetViewportAsync(new ViewPortOptions
                {
                    Width = 793,
                    Height = 560,
                    IsMobile = false,
                    DeviceScaleFactor = 1
                });

                // Wait for all resources (including web fonts) to be fully loaded
                await page.SetContentAsync(html, new NavigationOptions 
                { 
                    WaitUntil = new[] { WaitUntilNavigation.Networkidle0 } 
                });

                // Ensure fonts are fully loaded and rendered before capturing PDF
                await page.EvaluateExpressionAsync("document.fonts.ready");

                var pdfOptions = new PdfOptions
                {
                    Format = PaperFormat.A4,
                    Landscape = true,
                    PrintBackground = true,
                    Scale = 1.465m,
                    MarginOptions = new MarginOptions
                    {
                        Top = "0px",
                        Bottom = "0px",
                        Left = "0px",
                        Right = "0px"
                    }
                };

                var pdfBytes = await page.PdfDataAsync(pdfOptions);
                return pdfBytes;
            }

            if (request.IsSingle)
            {
                var card = cards.FirstOrDefault();
                if (card == null) return Array.Empty<byte>();
                return await GenerateCardPdfAsync(card, browser, 1);
            }

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                int index = 1;
                foreach (var card in cards)
                {
                    var pdfBytes = await GenerateCardPdfAsync(card, browser, index);
                    var fileName = !string.IsNullOrEmpty(card.CuteName) ? $"Карточка {card.CuteName}.pdf" : $"Карточка {index}.pdf";
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
