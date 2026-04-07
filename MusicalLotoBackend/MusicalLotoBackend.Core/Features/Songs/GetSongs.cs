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
    public string AudioPath { get; init; }
    public string? BackgroundImagePath { get; init; }
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
                BackgroundImagePath = s.BackgoundImagePath
            })
            .ToListAsync(cancellationToken);

        return songs;
    }
}
