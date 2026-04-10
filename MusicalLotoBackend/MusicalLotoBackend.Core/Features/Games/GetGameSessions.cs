using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Features.Games;

public class GetGameSessions
{
    public class GameSessionDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; }
        public int ParticipantCount { get; init; }
        public int CardSize { get; init; }
        public WinningRules Rules { get; init; }
    }

    
    public class GetGameSessionQuery : IRequest<List<GameSessionDto>> { }

    public class GetSongsHandler : IRequestHandler<GetGameSessionQuery, List<GameSessionDto>>
    {
        private readonly AppDbContext _dbContext;

        public GetSongsHandler(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<GameSessionDto>> Handle(GetGameSessionQuery request, CancellationToken cancellationToken)
        {
            var songs = await _dbContext.Sessions
                .AsNoTracking()
                .Select(s => new GameSessionDto()
                {
                    Id = s.Id,
                    Name = s.Name,
                    ParticipantCount = s.ParticipantCount,
                    CardSize = s.CardSize,
                    Rules = s.Rules
                })
                .ToListAsync(cancellationToken);

            return songs;
        }
    }
}