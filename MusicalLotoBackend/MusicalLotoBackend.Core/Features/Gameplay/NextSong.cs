using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Gameplay;

public class NextSongCommand : IRequest<object>
{
    public required Guid SessionId { get; init; }
}

public class NextSongHandler : IRequestHandler<NextSongCommand, object>
{
    private readonly AppDbContext _dbContext;

    private readonly IHubContext<GameHub> _hubContext;

    public NextSongHandler(AppDbContext dbContext, IHubContext<GameHub> hubContext)
    {
        _dbContext = dbContext;
        _hubContext = hubContext;
    }

    public async Task<object> Handle(NextSongCommand request, CancellationToken cancellationToken)
    {
        var session = await _dbContext.Sessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null) throw new Exception("Игровая сессия не найдена");

        session.CurrentSongIndex++;

        if (session.CurrentSongIndex >= session.Playlist.Count)
        {
            await _hubContext.Clients.Group(request.SessionId.ToString())
                .SendAsync("GameOver", cancellationToken);
            return new { Message = "Конец" };
        }

        var songId = session.Playlist[session.CurrentSongIndex];

        var songInfo = await _dbContext.Songs
            .FirstOrDefaultAsync(s => s.Id == songId, cancellationToken);
            
        if (songInfo == null) throw new Exception("Песня не найдена");

        _dbContext.Sessions.Update(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _hubContext.Clients.Group(request.SessionId.ToString())
            .SendAsync("ReceiveNextSong", songInfo, cancellationToken);

        return songInfo;
    }
}
