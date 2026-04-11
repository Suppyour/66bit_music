using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Features.Cards;

public class CheckBingoCommand : IRequest<string>
{
    public required Guid CardId { get; init; }
}

public class CheckBingoHandler : IRequestHandler<CheckBingoCommand, string>
{
    private readonly AppDbContext _dbContext;

    public CheckBingoHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<string> Handle(CheckBingoCommand request, CancellationToken cancellationToken)
    {
        var card = await _dbContext.GameCards
            .Include(c => c.GameSession)
            .FirstOrDefaultAsync(c => c.Id == request.CardId, cancellationToken);

        if (card == null) return "";

        var session = card.GameSession;
        var rules = session.Rules;
        var size = session.CardSize;
        string prizeWon = "";

        if (rules.HasFlag(WinningRules.Horizontal) && !session.IsHorizontalClaimed)
        {
            for (int r = 0; r < size; r++)
            {
                if (card.Cells.Count(c => c.Row == r && c.IsMarked) == size)
                {
                    session.IsHorizontalClaimed = true;
                    prizeWon = "Горизонталь";
                    break;
                }
            }
        }

        if (string.IsNullOrEmpty(prizeWon) && rules.HasFlag(WinningRules.Vertical) && !session.IsVerticalClaimed)
        {
            for (int c = 0; c < size; c++)
            {
                if (card.Cells.Count(cell => cell.Column == c && cell.IsMarked) == size)
                {
                    session.IsVerticalClaimed = true;
                    prizeWon = "Вертикаль";
                    break;
                }
            }
        }

        if (string.IsNullOrEmpty(prizeWon) && rules.HasFlag(WinningRules.FullCard) && !session.IsFullCardClaimed)
        {
            if (card.Cells.All(c => c.IsMarked))
            {
                session.IsFullCardClaimed = true;
                prizeWon = "Вся Карточка!";
            }
        }

        if (!string.IsNullOrEmpty(prizeWon))
        {
            _dbContext.Sessions.Update(session);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return prizeWon; 
    }
}