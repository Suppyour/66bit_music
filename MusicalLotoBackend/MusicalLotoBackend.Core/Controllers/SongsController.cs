using MediatR;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Songs;

namespace MusicalLotoBackend.Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SongsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateSong([FromForm] CreateSongCommand command)
    {
        var songId = await _mediator.Send(command);
        
        return Ok(new { Id = songId });
    }
    
    [HttpGet]
    public async Task<IActionResult> GetSongs()
    {
        var songs = await _mediator.Send(new GetSongsQuery());
    
        return Ok(songs); 
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSong(Guid id)
    {
        var command = new DeleteSongCommand { Id = id };
    
        var result = await _mediator.Send(command);
    
        if (!result) return NotFound(new { Message = "Id несуществующей песни" });
    
        return Ok(new { Message = "Песня и лого песни удалены" });
    }

}