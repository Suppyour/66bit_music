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

public class UpdateGamePresentationCommand : IRequest<bool>
{
    public Guid SessionId { get; init; }
    public required List<SlideUpdateDto> Slides { get; init; }
    public Guid UserId { get; set; }
}

public class SlideUpdateDto
{
    public Guid Id { get; init; }
    public SlideType Type { get; init; }
    public string? Title { get; init; }
    public string? Content { get; init; }
    public string? BackgroundColor { get; init; }
    public string? BackgroundImageUrl { get; init; }
    public int Order { get; init; }
    public bool IsRequired { get; init; }
    public Guid? SongId { get; init; }
}

public class UpdateGamePresentationHandler : IRequestHandler<UpdateGamePresentationCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public UpdateGamePresentationHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateGamePresentationCommand request, CancellationToken cancellationToken)
    {
        var session = await _dbContext.Sessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null || session.UserId != request.UserId) return false;

        var freshSlides = new List<Slide>();

        var qrCodeSlides = session.Slides
            .Where(s => s.Type == SlideType.QrCode)
            .Select(s => new Slide
            {
                Id = s.Id,
                Type = s.Type,
                Title = s.Title,
                Content = s.Content,
                BackgroundColor = s.BackgroundColor,
                BackgroundImageUrl = s.BackgroundImageUrl,
                Order = s.Order,
                IsRequired = s.IsRequired,
                SongId = s.SongId
            })
            .ToList();
        freshSlides.AddRange(qrCodeSlides);

        foreach (var slideDto in request.Slides)
        {
            if (slideDto.Type == SlideType.QrCode) continue;

            freshSlides.Add(new Slide
            {
                Id = slideDto.Id,
                Type = slideDto.Type,
                Title = slideDto.Title,
                Content = slideDto.Content,
                BackgroundColor = slideDto.BackgroundColor,
                BackgroundImageUrl = slideDto.BackgroundImageUrl,
                Order = slideDto.Order,
                IsRequired = slideDto.IsRequired,
                SongId = slideDto.SongId
            });
        }

        var slideEntries = _dbContext.ChangeTracker.Entries<Slide>().ToList();
        foreach (var entry in slideEntries)
        {
            entry.State = EntityState.Detached;
        }

        session.Slides.Clear();
        foreach (var slide in freshSlides.OrderBy(s => s.Order))
        {
            session.Slides.Add(slide);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
