using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Users;
using System.Security.Claims;

namespace MusicalLotoBackend.Core.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
                          ?? User.FindFirst("sub");
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("Пользователь не авторизован");
        }
        return userId;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
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

        var profile = await _mediator.Send(new GetProfileQuery { UserId = userId });
        if (profile == null) return NotFound(new { Message = "Пользователь не найден" });

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
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

        var updatedCommand = new UpdateProfileCommand
        {
            UserId = userId,
            Name = command.Name,
            SurName = command.SurName,
            Email = command.Email,
            Password = command.Password
        };

        try
        {
            var result = await _mediator.Send(updatedCommand);
            if (!result) return NotFound(new { Message = "Пользователь не найден" });

            return Ok(new { Message = "Профиль успешно обновлен" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteProfile()
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

        var result = await _mediator.Send(new DeleteAccountCommand { UserId = userId });
        if (!result) return NotFound(new { Message = "Пользователь не найден" });

        return Ok(new { Message = "Аккаунт успешно удален" });
    }
}
