using MediatR;
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
}

public class GenerateRandomCardsHandler : IRequestHandler<GenerateRandomCardsCommand, List<CardDto>>
{
    public Task<List<CardDto>> Handle(GenerateRandomCardsCommand request, CancellationToken cancellationToken)
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

            // Защита от зацикливания, если просят слишком много уникальных карточек из малого пула песен
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

        return Task.FromResult(generatedCards);
    }
}
