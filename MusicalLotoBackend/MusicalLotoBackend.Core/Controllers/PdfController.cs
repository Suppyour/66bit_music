using MediatR;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.PDF;

namespace MusicalLotoBackend.Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PdfController : ControllerBase
{
    private readonly IMediator _mediator;

    public PdfController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("generateArchive")]
    public async Task<IActionResult> GeneratePdfArchive([FromForm] GeneratePdfArchiveCommand command)
    {
        command.IsSingle = false;
        var zipBytes = await _mediator.Send(command);
        return File(zipBytes, "application/zip", "КарточныйАрхив.zip");
    }

    [HttpPost("generateSingle")]
    public async Task<IActionResult> GenerateSinglePdf([FromForm] GeneratePdfArchiveCommand command)
    {
        command.IsSingle = true;
        var pdfBytes = await _mediator.Send(command);
        
        string fileName = "Card.pdf";
        try
        {
            var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var cards = System.Text.Json.JsonSerializer.Deserialize<List<Features.PDF.Models.PdfCardDto>>(command.CardsJson, options);
            var card = cards?.FirstOrDefault();
            if (card != null && !string.IsNullOrEmpty(card.CuteName))
            {
                fileName = $"Карточка {card.CuteName}.pdf";
            }
        }
        catch {}

        return File(pdfBytes, "application/pdf", fileName);
    }
}
