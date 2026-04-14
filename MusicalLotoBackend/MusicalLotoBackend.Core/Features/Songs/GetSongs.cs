using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Songs;

// отдать фронтенду
public class SongDto
{
    public Guid Id { get; init; }
    public string Title { get; init; }
    public string Artist { get; init; }
    public string AudioPath { get; set; }
    public string? BackgroundImagePath { get; set; }
    public int DurationSeconds { get; set; }
}
public class GetSongsQuery : IRequest<List<SongDto>> { }

public class GetSongsHandler : IRequestHandler<GetSongsQuery, List<SongDto>>
{
    private readonly AppDbContext _dbContext;

    public GetSongsHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<SongDto>> Handle(GetSongsQuery request, CancellationToken cancellationToken)
    {
        var songs = await _dbContext.Songs
            .AsNoTracking()
            .Select(s => new SongDto
            {
                Id = s.Id,
                Title = s.Title,
                Artist = s.Artist,
                AudioPath = s.AudioPath,
                DurationSeconds = s.DurationSeconds,
                BackgroundImagePath = s.BackgoundImagePath
            })
            .ToListAsync(cancellationToken);

        return songs;
    }
}
