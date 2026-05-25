using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Core.Services;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MusicalLotoBackend.Core.Features.Games;

public class UploadSlideBackgroundCommand : IRequest<string?>
{
    public Guid SessionId { get; init; }
    public Guid SlideId { get; init; }
    public required IFormFile BackgroundImageFile { get; init; }
}

public class UploadSlideBackgroundHandler : IRequestHandler<UploadSlideBackgroundCommand, string?>
{
    private readonly AppDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public UploadSlideBackgroundHandler(AppDbContext dbContext, IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<string?> Handle(UploadSlideBackgroundCommand request, CancellationToken cancellationToken)
    {
        var session = await _dbContext.Sessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null) return null;

        var slide = session.Slides.FirstOrDefault(s => s.Id == request.SlideId);
        if (slide == null) return null;

        // Upload custom slide background image to storage
        var imageUrl = await _fileStorageService.UploadFileAsync(request.BackgroundImageFile, "images", cancellationToken);

        slide.BackgroundImageUrl = imageUrl;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return imageUrl;
    }
}
