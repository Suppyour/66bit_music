using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Cards;

public class MarkCellCommand : IRequest<bool>
{
    public required Guid CardId { get; init; }
    public required Guid SongId { get; init; }
}

public class MarkCellHandler : IRequestHandler<MarkCellCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public MarkCellHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(MarkCellCommand request, CancellationToken cancellationToken)
    {
        var card = await _dbContext.GameCards
            .FirstOrDefaultAsync(c => c.Id == request.CardId, cancellationToken);

        if (card == null) return false;

        var cellToMark = card.Cells.FirstOrDefault(c => c.SongId == request.SongId);

        if (cellToMark == null) return false;

        cellToMark.IsMarked = true;

        _dbContext.GameCards.Update(card);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // TODO ВАЛИДАЦИЯ БИНГО

        return true;
    }
}