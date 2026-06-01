using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Songs;

public class GetSongQuery : IRequest<SongDto?>
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
}

public class GetSongHandler : IRequestHandler<GetSongQuery, SongDto?>
{
    private readonly AppDbContext _dbContext;

    public GetSongHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SongDto?> Handle(GetSongQuery request, CancellationToken cancellationToken)
    {
        var song = await _dbContext.Songs
            .AsNoTracking()
            .Where(s => s.Id == request.Id && s.UserId == request.UserId)
            .Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                AudioPath = s.AudioPath,
                DurationSeconds = s.DurationSeconds,
                BackgroundImagePath = s.BackgoundImagePath
            })
            .FirstOrDefaultAsync(cancellationToken);

        return song;
    }
}
