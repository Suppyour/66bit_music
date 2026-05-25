using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MusicalLotoBackend.Core.Features.Games;

public class GetGamePresentationQuery : IRequest<List<Slide>>
{
    public Guid SessionId { get; init; }
}

public class GetGamePresentationHandler : IRequestHandler<GetGamePresentationQuery, List<Slide>>
{
    private readonly AppDbContext _dbContext;

    public GetGamePresentationHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Slide>> Handle(GetGamePresentationQuery request, CancellationToken cancellationToken)
    {
        var session = await _dbContext.Sessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
            throw new KeyNotFoundException("Сессия не найдена");

        return session.Slides.OrderBy(s => s.Order).ToList();
    }
}
