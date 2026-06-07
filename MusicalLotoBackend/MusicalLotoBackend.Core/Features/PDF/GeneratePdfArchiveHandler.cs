using MediatR;
using System.IO.Compression;
using System.Text.Json;
using System.Text;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using MusicalLotoBackend.Core.Features.PDF.Models;

namespace MusicalLotoBackend.Core.Features.PDF;

public class PdfCardHtmlDto
{
    public string Html { get; set; } = "";
    public string? CuteName { get; set; }
}

public class GeneratePdfArchiveHandler : IRequestHandler<GeneratePdfArchiveCommand, byte[]>
{
    public async Task<byte[]> Handle(GeneratePdfArchiveCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var cards = JsonSerializer.Deserialize<List<PdfCardHtmlDto>>(request.HtmlCards, options) ?? new List<PdfCardHtmlDto>();

            // Find local Chrome or Edge installation to avoid heavy downloads and timeouts
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

            // Launch headless browser with specific production-grade Docker sandbox arguments
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

            async Task<byte[]> GenerateCardPdfAsync(PdfCardHtmlDto card, IBrowser browser)
            {
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
                await page.SetContentAsync(card.Html, new NavigationOptions 
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
                    Scale = 1.415m,
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
                return await GenerateCardPdfAsync(card, browser);
            }

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                int index = 1;
                foreach (var card in cards)
                {
                    var pdfBytes = await GenerateCardPdfAsync(card, browser);
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
