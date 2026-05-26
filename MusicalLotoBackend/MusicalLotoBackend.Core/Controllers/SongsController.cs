using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Songs;

namespace MusicalLotoBackend.Core.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SongsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) 
                          ?? User.FindFirst("sub");
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Пользователь не авторизован");
        }
        return userId;
    }

    [HttpPost]
    [RequestSizeLimit(104857600)] // 100 MB
    public async Task<IActionResult> CreateSong([FromForm] CreateSongCommand command)
    {
        try
        {
            command.UserId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var songId = await _mediator.Send(command);
        
        return Ok(new { Id = songId });
    }
    
    [HttpGet]
    public async Task<IActionResult> GetSongs()
    {
        Guid userId;
        try
        {
            userId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var songs = await _mediator.Send(new GetSongsQuery { UserId = userId });
    
        return Ok(songs); 
    }

    [HttpPut("{id}")]
    [RequestSizeLimit(104857600)] // 100 MB
    public async Task<IActionResult> UpdateSong(Guid id, [FromForm] UpdateSongCommand command)
    {
        try
        {
            command.Id = id;
            command.UserId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var result = await _mediator.Send(command);
    
        if (!result) return NotFound(new { Message = "Такой песни не существует" });
    
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSong(Guid id)
    {
        Guid userId;
        try
        {
            userId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var command = new DeleteSongCommand { Id = id, UserId = userId };
    
        var result = await _mediator.Send(command);
    
        if (!result) return NotFound(new { Message = "Id несуществующей песни" });
    
        return Ok(new { Message = "Песня и лого песни удалены" });
    }

}