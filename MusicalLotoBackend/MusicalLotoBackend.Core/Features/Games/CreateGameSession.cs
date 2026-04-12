using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using MediatR;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Features.Games;

public class CreateGameSessionCommand : IRequest<Guid>
{
    [Required]
    [DefaultValue("Название румы")]
    public required string Name { get; init; }
    
    [Range(1, 1000)]
    [DefaultValue(10)]
    public required int ParticipantsCount { get; init; }
    
    [Range(3, 7)] // range card
    [DefaultValue(3)]
    public required int CardSize { get; init; }
    
    [Required]
    public required WinningRules Rules { get; init; }

    [Required]
    [MinLength(9, ErrorMessage = "Для игры нужно хотя бы 9 песен")]
    public required List<Guid> SelectedSongIds { get; init; }
}

public class CreateGameSessionHandler : IRequestHandler<CreateGameSessionCommand, Guid>
{
    private readonly AppDbContext _dbContext;

    public CreateGameSessionHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(CreateGameSessionCommand request, CancellationToken cancellationToken)
    {
        var minSongsRequired = request.CardSize * request.CardSize;
        if (request.SelectedSongIds.Count < minSongsRequired)
        {
            throw new Exception($"Для карточки {request.CardSize}x{request.CardSize} необходимо минимум {minSongsRequired} песен.");
        }

        var randomizedPlaylist = request.SelectedSongIds
            .OrderBy(x => Guid.NewGuid()) // перемешивает список
            .ToList();
        
        var session = new GameSession
        {
            Name = request.Name,
            ParticipantCount = request.ParticipantsCount,
            CardSize = request.CardSize,
            Rules = request.Rules,
            Playlist = randomizedPlaylist
        };

        session.Cards = GenerateUniqueCards(request.ParticipantsCount, request.CardSize, request.SelectedSongIds);

        _dbContext.Sessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return session.Id;
    }

    private List<GameCard> GenerateUniqueCards(int participantsCount, int cardSize, List<Guid> songPool)
    {
        var generatedCards = new List<GameCard>();
        var existingSignatures = new HashSet<string>();
        int cellsCount = cardSize * cardSize; 
        var random = new Random();

        for (int i = 0; i < participantsCount; i++)
        {
            bool isUnique = false;
            List<Guid> selectedSongs = new List<Guid>();

            while (!isUnique)
            {
                selectedSongs = songPool.OrderBy(x => random.Next()).Take(cellsCount).ToList();
                
                var signature = string.Join(",", selectedSongs);
                
                if (existingSignatures.Add(signature)) 
                {
                    isUnique = true;
                }
            }

            var card = new GameCard();
            int songIndex = 0;

            for (int row = 0; row < cardSize; row++)
            {
                for (int col = 0; col < cardSize; col++)
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

        return generatedCards;
    }
}
