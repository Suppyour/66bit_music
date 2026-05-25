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
}

public class SlideUpdateDto
{
    public Guid Id { get; init; }
    public string? Title { get; init; }
    public string? Content { get; init; }
    public string? BackgroundColor { get; init; }
    public string? BackgroundImageUrl { get; init; }
    public int Order { get; init; }
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

        if (session == null) return false;

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
            }
        }

        // Make sure order indices are applied and save
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
