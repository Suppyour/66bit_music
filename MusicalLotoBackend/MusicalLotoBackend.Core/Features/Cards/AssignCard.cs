using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Features.Cards;

public class CardDto
{
    public Guid Id { get; init; }
    public List<CardCell> Cells { get; init; } = new();
}

public class AssignCardCommand : IRequest<CardDto>
{
    public required Guid SessionId { get; init; }
}

public class AssignCardHandler : IRequestHandler<AssignCardCommand, CardDto>
{
    private readonly AppDbContext _dbContext;

    public AssignCardHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CardDto> Handle(AssignCardCommand request, CancellationToken cancellationToken)
    {
        var freeCard = await _dbContext.GameCards
            .FirstOrDefaultAsync(c => c.GameSessionId == request.SessionId && c.IsAssigned == false, cancellationToken);

        if (freeCard == null)
            throw new Exception("Свободные карточки закончились!");

        freeCard.IsAssigned = true;
        
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CardDto
        {
            Id = freeCard.Id,
            Cells = freeCard.Cells
        };
    }
}