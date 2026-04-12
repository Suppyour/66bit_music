using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;
using Microsoft.AspNetCore.SignalR;
using MusicalLotoBackend.Core.Features.Gameplay;

namespace MusicalLotoBackend.Core.Features.Cards;

public class CheckBingoCommand : IRequest<string>
{
    public required Guid CardId { get; init; }
}

public class CheckBingoHandler : IRequestHandler<CheckBingoCommand, string>
{
    private readonly AppDbContext _dbContext;
    private readonly IHubContext<GameHub> _hubContext;

    public CheckBingoHandler(AppDbContext dbContext, IHubContext<GameHub> hubContext)
    {
        _dbContext = dbContext;
        _hubContext = hubContext;
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

        // АНТИЧИТ СИСТЕМА: Зачеркнутая ячейка считается "честной" только если 
        // песня в ней уже прозвучала (её индекс <= CurrentSongIndex)
        bool IsCellValid(CardCell cell)
        {
            if (!cell.IsMarked) return false;
            
            int playlistIndex = session.Playlist.IndexOf(cell.SongId);
            return playlistIndex != -1 && playlistIndex <= session.CurrentSongIndex;
        }

        if (rules.HasFlag(WinningRules.Horizontal) && !session.IsHorizontalClaimed)
        {
            for (int r = 0; r < size; r++)
            {
                if (card.Cells.Count(c => c.Row == r && IsCellValid(c)) == size)
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
                if (card.Cells.Count(cell => cell.Column == c && IsCellValid(cell)) == size)
                {
                    session.IsVerticalClaimed = true;
                    prizeWon = "Вертикаль";
                    break;
                }
            }
        }

        if (string.IsNullOrEmpty(prizeWon) && rules.HasFlag(WinningRules.FullCard) && !session.IsFullCardClaimed)
        {
            if (card.Cells.All(c => IsCellValid(c)))
            {
                session.IsFullCardClaimed = true;
                prizeWon = "Вся Карточка!";
            }
        }

        if (!string.IsNullOrEmpty(prizeWon))
        {
            _dbContext.Sessions.Update(session);
            await _dbContext.SaveChangesAsync(cancellationToken);
            
            // МАГИЯ SIGNALR: выстреливаем салютом на экраны всех игроков в этой комнате!
            await _hubContext.Clients.Group(session.Id.ToString())
                .SendAsync("PlayerWonBingo", new { CardId = card.Id, Prize = prizeWon }, cancellationToken);
        }

        return prizeWon; 
    }
}