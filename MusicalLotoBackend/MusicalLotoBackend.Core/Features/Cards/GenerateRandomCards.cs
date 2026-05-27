using MediatR;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;
using System.ComponentModel.DataAnnotations;

namespace MusicalLotoBackend.Core.Features.Cards;

public class GenerateRandomCardsCommand : IRequest<List<CardDto>>
{
    [Required]
    [Range(1, 1000)]
    public int Count { get; set; } = 1;

    [Required]
    [Range(3, 7)]
    public int CardSize { get; set; } = 5;

    [Required]
    [MinLength(9)]
    public List<Guid> SongIds { get; set; } = new();

    public Guid? SessionId { get; set; }
}

public class GenerateRandomCardsHandler : IRequestHandler<GenerateRandomCardsCommand, List<CardDto>>
{
    private readonly AppDbContext _dbContext;

    public GenerateRandomCardsHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CardDto>> Handle(GenerateRandomCardsCommand request, CancellationToken cancellationToken)
    {
        var minSongsRequired = request.CardSize * request.CardSize;
        if (request.SongIds.Count < minSongsRequired)
        {
            throw new Exception($"Для карточки {request.CardSize}x{request.CardSize} необходимо минимум {minSongsRequired} песен.");
        }

        var generatedCards = new List<CardDto>();
        var existingSignatures = new HashSet<string>();
        int cellsCount = request.CardSize * request.CardSize; 
        var random = new Random();

        for (int i = 0; i < request.Count; i++)
        {
            bool isUnique = false;
            List<Guid> selectedSongs = new List<Guid>();

            int attempts = 0; 

            while (!isUnique && attempts < 100)
            {
                selectedSongs = request.SongIds.OrderBy(x => random.Next()).Take(cellsCount).ToList();
                var signature = string.Join(",", selectedSongs);
                
                if (existingSignatures.Add(signature)) 
                {
                    isUnique = true;
                }
                attempts++;
            }

            var card = new CardDto
            {
                Id = Guid.NewGuid(),
                Cells = new List<CardCell>()
            };

            int songIndex = 0;
            for (int row = 0; row < request.CardSize; row++)
            {
                for (int col = 0; col < request.CardSize; col++)
                {
                    card.Cells.Add(new CardCell
                    {
                        Row = row,
                        Column = col,
                        SongId = selectedSongs[songIndex],
                        IsMarked = false
                    });
                    songIndex++;
                }
            }
            
            generatedCards.Add(card);
        }

        if (request.SessionId.HasValue && request.SessionId.Value != Guid.Empty)
        {
            var session = await _dbContext.Sessions
                .Include(s => s.Cards)
                .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value, cancellationToken);

            if (session != null)
            {
                if (session.Cards != null && session.Cards.Any())
                {
                    _dbContext.GameCards.RemoveRange(session.Cards);
                    session.Cards.Clear();
                }
                else
                {
                    session.Cards = new List<GameCard>();
                }

                foreach (var c in generatedCards)
                {
                    session.Cards.Add(new GameCard
                    {
                        Id = c.Id,
                        GameSessionId = request.SessionId.Value,
                        Cells = c.Cells.Select(cell => new CardCell
                        {
                            Row = cell.Row,
                            Column = cell.Column,
                            SongId = cell.SongId,
                            IsMarked = false
                        }).ToList()
                    });
                }

                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        return generatedCards;
    }
}
