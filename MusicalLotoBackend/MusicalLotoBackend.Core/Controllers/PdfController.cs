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
        var zipBytes = await _mediator.Send(command);
        return File(zipBytes, "application/zip", "CardsArchive.zip");
    }
}
