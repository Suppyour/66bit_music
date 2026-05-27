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

        var updatedSlides = new List<Slide>();

        // 1. Preserve QrCode slides as they are not editable/sent by frontend
        var qrCodeSlides = session.Slides.Where(s => s.Type == SlideType.QrCode).ToList();
        updatedSlides.AddRange(qrCodeSlides);

        // 2. Process all incoming slides
        foreach (var slideDto in request.Slides)
        {
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
                
                updatedSlides.Add(existingSlide);
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
                
                updatedSlides.Add(newSlide);
            }
        }

        session.Slides = updatedSlides.OrderBy(s => s.Order).ToList();

        // Make sure order indices are applied and save
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
