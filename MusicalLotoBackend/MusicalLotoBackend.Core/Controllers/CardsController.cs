using MediatR;
using Microsoft.AspNetCore.Mvc;
using MusicalLotoBackend.Core.Features.Cards;

namespace MusicalLotoBackend.Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CardsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignCard([FromBody] AssignCardCommand command)
    {
        var card = await _mediator.Send(command);
        return Ok(card);
    }
    
    [HttpPost("mark")]
    public async Task<IActionResult> MarkCell([FromBody] MarkCellCommand command)
    {
        var result = await _mediator.Send(command);
    
        if (!result) return BadRequest(new { Message = "Ошибка! Такой ячейки нет на вашей карточке." });
    
        return Ok(new { Message = "Ячейка успешно зачеркнута!" });
    }
    // удалить после запуска докера на vps
}