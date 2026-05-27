using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MusicalLotoBackend.Core.Features.Games;

public class GetGameCardsQuery : IRequest<List<GameCardDto>>
{
    public Guid SessionId { get; init; }
    public Guid UserId { get; set; }
}

public class GameCardDto
{
    public Guid Id { get; init; }
    public required List<CardCellDto> Cells { get; init; }
}

public class CardCellDto
{
    public int Row { get; init; }
    public int Column { get; init; }
    public Guid SongId { get; init; }
    public string Title { get; init; } = "";
    public string Artist { get; init; } = "";
    public bool IsMarked { get; init; }
}

public class GetGameCardsHandler : IRequestHandler<GetGameCardsQuery, List<GameCardDto>>
{
    private readonly AppDbContext _dbContext;

    public GetGameCardsHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<GameCardDto>> Handle(GetGameCardsQuery request, CancellationToken cancellationToken)
    {
        var session = await _dbContext.Sessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null || session.UserId != request.UserId)
            throw new KeyNotFoundException("Сессия не найдена");

        var cards = await _dbContext.GameCards
            .AsNoTracking()
            .Where(c => c.GameSessionId == request.SessionId)
            .ToListAsync(cancellationToken);

        // Fetch all songs for this session to map Title and Artist
        var songs = await _dbContext.Songs
            .AsNoTracking()
            .Where(s => session.Playlist.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, cancellationToken);

        var result = new List<GameCardDto>();
        foreach (var card in cards)
        {
            var cellDtos = new List<CardCellDto>();
            foreach (var cell in card.Cells)
            {
                songs.TryGetValue(cell.SongId, out var song);
                cellDtos.Add(new CardCellDto
                {
                    Row = cell.Row,
                    Column = cell.Column,
                    SongId = cell.SongId,
                    Title = song?.Title ?? "Неизвестная песня",
                    Artist = song?.Artist ?? "Неизвестный исполнитель",
                    IsMarked = cell.IsMarked
                });
            }
            result.Add(new GameCardDto
            {
                Id = card.Id,
                Cells = cellDtos
            });
        }

        return result;
    }
}
