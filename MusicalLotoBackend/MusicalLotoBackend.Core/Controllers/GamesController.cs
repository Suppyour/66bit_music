using MediatR;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Games;

namespace MusicalLotoBackend.Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IMediator _mediator;

    public GamesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameSessionCommand command)
    {
        var gameId = await _mediator.Send(command);
        return Ok(new { Id = gameId });
    }
    [HttpGet]
    public async Task<IActionResult> GetGames()
    {
        var games = await _mediator.Send(new GetGameSessions.GetGameSessionQuery());
    
        return Ok(games); 
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGame(Guid id)
    {
        var command = new DeleteGameSession.DeleteSessionCommand { Id = id };
    
        var result = await _mediator.Send(command);
    
        if (!result) return NotFound(new { Message = "Сессия не найдена" });
    
        return Ok(new { Message = "Сессия удалена" });
    }
}