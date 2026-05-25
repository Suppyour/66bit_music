using MediatR;
using Microsoft.AspNetCore.Authorization;
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

    [HttpGet("{sessionId}/presentation")]
    public async Task<IActionResult> GetPresentation(Guid sessionId)
    {
        try
        {
            var slides = await _mediator.Send(new GetGamePresentationQuery { SessionId = sessionId });
            return Ok(slides);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpPut("{sessionId}/presentation")]
    public async Task<IActionResult> UpdatePresentation(Guid sessionId, [FromBody] UpdateGamePresentationCommand command)
    {
        var updatedCommand = new UpdateGamePresentationCommand
        {
            SessionId = sessionId,
            Slides = command.Slides
        };

        var result = await _mediator.Send(updatedCommand);
        if (!result) return NotFound(new { Message = "Сессия не найдена" });

        return Ok(new { Message = "Презентация обновлена успешно" });
    }

    [HttpPost("{sessionId}/presentation/slides/{slideId}/background")]
    public async Task<IActionResult> UploadSlideBackground(Guid sessionId, Guid slideId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "Файл изображения отсутствует" });

        var command = new UploadSlideBackgroundCommand
        {
            SessionId = sessionId,
            SlideId = slideId,
            BackgroundImageFile = file
        };

        var resultUrl = await _mediator.Send(command);
        if (resultUrl == null)
            return NotFound(new { Message = "Сессия или слайд не найдены" });

        return Ok(new { Url = resultUrl });
    }
}