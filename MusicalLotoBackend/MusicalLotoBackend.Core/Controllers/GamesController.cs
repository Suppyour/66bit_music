using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Games;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AppDbContext _dbContext;

    public GamesController(IMediator mediator, AppDbContext dbContext)
    {
        _mediator = mediator;
        _dbContext = dbContext;
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
    public async Task<IActionResult> CreateGame([FromBody] CreateGameSessionCommand command)
    {
        try
        {
            command.UserId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var gameId = await _mediator.Send(command);
        return Ok(new { Id = gameId });
    }

    [HttpGet]
    public async Task<IActionResult> GetGames()
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

        var games = await _mediator.Send(new GetGameSessions.GetGameSessionQuery { UserId = userId });
        return Ok(games); 
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGame(Guid id)
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

        var command = new DeleteGameSession.DeleteSessionCommand { Id = id, UserId = userId };
        var result = await _mediator.Send(command);
        if (!result) return NotFound(new { Message = "Сессия не найдена" });
        return Ok(new { Message = "Сессия удалена" });
    }

    [HttpGet("{sessionId}/presentation")]
    public async Task<IActionResult> GetPresentation(Guid sessionId)
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

        try
        {
            var slides = await _mediator.Send(new GetGamePresentationQuery { SessionId = sessionId, UserId = userId });
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
        Guid userId;
        try
        {
            userId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var updatedCommand = new UpdateGamePresentationCommand
        {
            SessionId = sessionId,
            Slides = command.Slides,
            UserId = userId
        };

        var result = await _mediator.Send(updatedCommand);
        if (!result) return NotFound(new { Message = "Сессия не найдена" });

        return Ok(new { Message = "Презентация обновлена успешно" });
    }

    [HttpPost("{sessionId}/presentation/slides/{slideId}/background")]
    [RequestSizeLimit(104857600)] // 100 MB
    public async Task<IActionResult> UploadSlideBackground(Guid sessionId, Guid slideId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { Message = "Файл изображения отсутствует" });

        Guid userId;
        try
        {
            userId = GetUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }

        var command = new UploadSlideBackgroundCommand
        {
            SessionId = sessionId,
            SlideId = slideId,
            BackgroundImageFile = file,
            UserId = userId
        };

        var resultUrl = await _mediator.Send(command);
        if (resultUrl == null)
            return NotFound(new { Message = "Сессия или слайд не найдены" });

        return Ok(new { Url = resultUrl });
    }

    [HttpGet("{sessionId}/cards")]
    public async Task<IActionResult> GetGameCards(Guid sessionId)
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

        try
        {
            var cards = await _mediator.Send(new GetGameCardsQuery { SessionId = sessionId, UserId = userId });
            return Ok(cards);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpPost("{sessionId}/complete")]
    public async Task<IActionResult> CompleteGame(Guid sessionId)
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

        var session = await _dbContext.Sessions.FindAsync(sessionId);
        if (session == null) return NotFound(new { Message = "Сессия не найдена" });
        if (session.UserId != userId) return Forbid();

        session.IsFullCardClaimed = true;
        await _dbContext.SaveChangesAsync();
        return Ok(new { Message = "Игра завершена" });
    }
}