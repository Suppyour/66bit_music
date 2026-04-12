using MediatR;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Gameplay;

namespace MusicalLotoBackend.Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameplayController : ControllerBase
{
    private readonly IMediator _mediator;

    public GameplayController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("next-song")]
    public async Task<IActionResult> NextSong([FromBody] NextSongCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // POST: /api/gameplay/previous-song
    [HttpPost("previous-song")]
    public async Task<IActionResult> PreviousSong([FromBody] PreviousSongCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
