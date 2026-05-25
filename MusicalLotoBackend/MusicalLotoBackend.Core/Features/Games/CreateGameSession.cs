using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using MediatR;
using Microsoft.EntityFrameworkCore;
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

        // Fetch song details to construct presentation slides
        var songsDict = await _dbContext.Songs
            .Where(s => request.SelectedSongIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, cancellationToken);

        // Populate default slides
        session.Slides.Add(new Slide
        {
            Type = SlideType.Title,
            Title = request.Name,
            Content = "",
            BackgroundColor = "#2168F5",
            Order = 1,
            IsRequired = true
        });

        session.Slides.Add(new Slide
        {
            Type = SlideType.Rules,
            Title = "Правила игры",
            Content = $"Правила:\n- Количество карточек: {request.ParticipantsCount}\n- Выигрышная комбинация: {(request.Rules == WinningRules.None ? "Свободная игра" : request.Rules.ToString())}",
            BackgroundColor = "#EA580C",
            Order = 2,
            IsRequired = true
        });

        session.Slides.Add(new Slide
        {
            Type = SlideType.GameBoard,
            Title = "Игровое поле",
            Content = "Игра началась",
            BackgroundColor = "#1E293B",
            Order = 3,
            IsRequired = true
        });

        session.Slides.Add(new Slide
        {
            Type = SlideType.QrCode,
            Title = "QR-код для входа",
            Content = "musloto/join",
            BackgroundColor = "#16A34A",
            Order = 4,
            IsRequired = true
        });

        int orderIndex = 5;
        foreach (var songId in randomizedPlaylist)
        {
            songsDict.TryGetValue(songId, out var song);
            session.Slides.Add(new Slide
            {
                Type = SlideType.Song,
                SongId = songId,
                Title = song?.Title ?? "Неизвестная песня",
                Content = song?.Artist ?? "Неизвестный исполнитель",
                BackgroundColor = "#2168F5",
                Order = orderIndex++,
                IsRequired = false
            });
        }

        session.Slides.Add(new Slide
        {
            Type = SlideType.Winner,
            Title = "Слайд победителя",
            Content = "Финал и поздравление",
            BackgroundColor = "#CA8A04",
            Order = orderIndex,
            IsRequired = true
        });

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
