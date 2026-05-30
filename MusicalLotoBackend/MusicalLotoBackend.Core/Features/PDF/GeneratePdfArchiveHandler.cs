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
        padding: 12px;
        background-color: {ACCENT_COLOR};
        overflow: hidden;
    }
    
    .card-wrapper {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        background-color: #ffffff;
        border: none;
        border-radius: 16px;
        padding: 12px;
        position: relative;
    }
    
    .inner-border-box {
        border: 1.5px solid {ACCENT_COLOR};
        border-radius: 12px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        position: relative;
        box-sizing: border-box;
        /* УБРАН overflow: hidden, чтобы тексты на рамке не срезались */
        overflow: visible; 
    }
    
    /* Left Panel: Уменьшен флекс для сужения рабочего поля */
    .left-panel {
        flex: 2.2; 
        box-sizing: border-box;
        padding: 40px 36px 30px 36px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        position: relative;
    }
    
    /* Right Panel: Увеличен визуальный вес за счет сужения левой панели */
    .right-panel {
        flex: 1;
        box-sizing: border-box;
        border-left: 1.5px dashed {ACCENT_COLOR};
        padding: 30px 20px 20px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 24px;
        height: 100%;
        position: relative;
    }
    
    /* =========================================================
       МЕТКИ НА РАМКАХ (Идеальная центровка на линии)
       ========================================================= */
    .card-header-left {
        position: absolute;
        top: 0;
        left: 30px;
        transform: translateY(-50%);
        background-color: #ffffff;
        padding: 0 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        color: #475569;
        font-weight: 500;
        z-index: 10;
        letter-spacing: 0.5px;
    }
    
    .card-header-center {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ffffff;
        padding: 0 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        color: #475569;
        font-weight: 500;
        z-index: 10;
        white-space: nowrap;
        letter-spacing: 0.5px;
    }
    
    .scissors-label {
        position: absolute;
        top: 0;
        right: 30px;
        transform: translateY(-50%);
        background-color: #ffffff;
        padding: 0 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 10;
    }
    
    .scissors-label .scissors-icon {
        font-size: 14px;
        color: {ACCENT_COLOR};
    }

    .card-footer-row {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 50%);
        background-color: #ffffff;
        padding: 0 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        color: #475569;
        font-weight: 500;
        z-index: 10;
        white-space: nowrap;
    }
    
    /* =========================================================
       ЗАГОЛОВОК
       ========================================================= */
    .title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0 0 16px 0;
    }
    
    .title-line {
        flex-grow: 1;
        height: 1px;
        background-color: #000000;
        max-width: 60px;
    }
    
    .title-text {
        padding: 0 20px;
        font-family: ""Playfair Display"", serif; /* Элегантный шрифт с засечками */
        font-size: 34px;
        font-weight: 700;
        color: #000000;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 0;
        white-space: nowrap;
    }
    
    .card-subtitle-code {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: {ACCENT_COLOR};
        text-align: center;
        margin-top: -10px;
        margin-bottom: 14px;
    }
    
    /* =========================================================
       СЕТКА БИНГО (Рабочее поле)
       ========================================================= */
    .bingo-grid {
        display: grid;
        grid-template-columns: repeat({GRID_SIZE}, 1fr);
        gap: 12px; /* Чуть больше воздуха между карточками */
        width: 100%;
        margin: 0 auto;
        padding: 0;
        border: none;
        background-color: transparent;
        {BACKGROUND_IMAGE_CSS}
        background-size: cover;
        background-position: center;
        box-sizing: border-box;
    }
    
    .bingo-cell {
        border: 1.5px solid {ACCENT_COLOR};
        background-color: #ffffff;
        border-radius: 12px;
        padding: 8px;
        height: 95px; /* Увеличил высоту для более квадратного/премиального вида */
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        text-align: center;
        overflow: hidden;
        position: relative;
    }
    
    .cell-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 10.5px;
        font-weight: 500;
        color: #1e293b;
        line-height: 1.3;
        width: 100%;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .corner-bow {
        position: absolute;
        width: 16px;
        height: 16px;
        z-index: 15;
    }
    .corner-bow.top-left { top: -8px; left: -8px; transform: rotate(45deg); }
    .corner-bow.top-right { top: -8px; right: -8px; transform: rotate(-45deg); }
    .corner-bow.bottom-left { bottom: -8px; left: -8px; transform: rotate(135deg); }
    .corner-bow.bottom-right { bottom: -8px; right: -8px; transform: rotate(-135deg); }
    
    /* =========================================================
       ПРАВАЯ ПАНЕЛЬ (Правила и мини-сетки)
       ========================================================= */
    .rules-panel-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        font-weight: 700;
        text-align: center;
        color: #1e293b;
        margin-bottom: 4px;
        margin-top: 10px;
    }
    
    .mini-grids-container {
        display: flex;
        flex-direction: column;
        gap: 20px; /* Больше пространства между комбинациями */
        width: 100%;
        align-items: center;
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
        gap: 3px;
        width: 100px; /* УВЕЛИЧЕНО с 58px */
        height: 100px; /* УВЕЛИЧЕНО с 58px */
        background: transparent;
        padding: 0;
        box-sizing: border-box;
        position: relative;
    }
    
    .mini-grid-layout.horizontal-rule::after {
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
    
    .mini-grid-layout.vertical-rule::after {
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
    
    .mini-grid-cell {
        background-color: #ffffff;
        border: 1px solid #cbd5e1;
        box-sizing: border-box;
        border-radius: 50%;
        width: 17px; /* УВЕЛИЧЕНО с 10px */
        height: 17px; /* УВЕЛИЧЕНО с 10px */
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px; /* Размер крестика */
        line-height: 1;
    }
    
    .mini-grid-cell.active-cross {
        border-color: {ACCENT_COLOR} !important;
        color: {ACCENT_COLOR} !important;
        font-weight: 700;
    }
    
    .mini-grid-label {
        font-family: 'Montserrat', sans-serif;
        font-size: 10px; /* УВЕЛИЧЕНО с 7.5px */
        color: #475569;
        text-align: center;
        margin-top: 8px;
        font-weight: 500;
    }
    
    /* =========================================================
       ПЕРФОРАЦИЯ (Круглые вырезы)
       ========================================================= */
    .right-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: -0.75px; /* Идеально по центру линии border-left (1.5px) */
        transform: translate(-50%, -50%);
        width: 30px;
        height: 30px;
        background-color: {ACCENT_COLOR};
        border-radius: 50%;
        z-index: 10;
    }
    
    .right-panel::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -0.75px;
        transform: translate(-50%, 50%);
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
            <div class=""inner-border-box"">
                <div class=""left-panel"">
                    <div class=""card-header-left"">
                        — {COMPANY_NAME} —
                    </div>
                    <div class=""card-header-center"">
                        {EDITION_NAME}
                    </div>
                    
                    <div class=""title-row"">
                        <span class=""title-line""></span>
                        <h1 class=""title-text"">{TITLE_TEXT}</h1>
                        <span class=""title-line""></span>
                    </div>
                    
                    {TICKET_CODE_HTML}
                    
                    <div class=""bingo-grid"">
                        {BINGO_CELLS_HTML}
                    </div>
                    
                    <div class=""card-footer-row"">
                        {FOOTER_TEXT}
                    </div>
                </div>
                
                <div class=""right-panel"">
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
                            <span class=""mini-grid-label"">5 песен подряд в одном ряду</span>
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
