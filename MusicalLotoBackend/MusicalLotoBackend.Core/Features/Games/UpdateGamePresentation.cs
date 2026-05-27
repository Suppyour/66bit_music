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

        // 1. Identify which slides to keep/insert
        var targetSlides = new List<Slide>();

        // Preserve QrCode slides as they are not editable/sent by frontend
        var qrCodeSlides = session.Slides.Where(s => s.Type == SlideType.QrCode).ToList();
        targetSlides.AddRange(qrCodeSlides);

        // Process incoming slides
        foreach (var slideDto in request.Slides)
        {
            // Skip incoming QrCode to avoid duplicates if they sent it
            if (slideDto.Type == SlideType.QrCode) continue;

            var existingSlide = session.Slides.FirstOrDefault(s => s.Id == slideDto.Id);
            if (existingSlide != null)
            {
                existingSlide.Title = slideDto.Title;
                existingSlide.Content = slideDto.Content;
                existingSlide.BackgroundColor = slideDto.BackgroundColor;
                existingSlide.BackgroundImageUrl = slideDto.BackgroundImageUrl;
                existingSlide.Order = slideDto.Order;
                existingSlide.Type = slideDto.Type;
                existingSlide.IsRequired = slideDto.IsRequired;
                existingSlide.SongId = slideDto.SongId;
                
                targetSlides.Add(existingSlide);
            }
            else
            {
                var newSlide = new Slide
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
                };
                
                targetSlides.Add(newSlide);
            }
        }

        // 2. Synchronize session.Slides collection in-place
        var targetIds = targetSlides.Select(t => t.Id).ToHashSet();

        // Remove slides that are no longer in the target set
        for (int i = session.Slides.Count - 1; i >= 0; i--)
        {
            if (!targetIds.Contains(session.Slides[i].Id))
            {
                session.Slides.RemoveAt(i);
            }
        }

        // Add or Update slides
        foreach (var target in targetSlides)
        {
            var tracked = session.Slides.FirstOrDefault(s => s.Id == target.Id);
            if (tracked != null)
            {
                // Update in-place
                tracked.Title = target.Title;
                tracked.Content = target.Content;
                tracked.BackgroundColor = target.BackgroundColor;
                tracked.BackgroundImageUrl = target.BackgroundImageUrl;
                tracked.Order = target.Order;
                tracked.Type = target.Type;
                tracked.IsRequired = target.IsRequired;
                tracked.SongId = target.SongId;
            }
            else
            {
                // Add new slide
                session.Slides.Add(target);
            }
        }

        session.Slides.Sort((a, b) => a.Order.CompareTo(b.Order));

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
