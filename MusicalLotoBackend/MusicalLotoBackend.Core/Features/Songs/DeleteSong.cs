using MediatR;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Core.Services;

namespace MusicalLotoBackend.Core.Features.Songs;
public class DeleteSongCommand : IRequest<bool>
{
    public required Guid Id { get; init; }
    public Guid UserId { get; set; }
}

public class DeleteSongHandler : IRequestHandler<DeleteSongCommand, bool>
{
    private readonly AppDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public DeleteSongHandler(AppDbContext dbContext, IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<bool> Handle(DeleteSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _dbContext.Songs.FindAsync(new object[] { request.Id }, cancellationToken);
        if (song == null || song.UserId != request.UserId) return false;
        await _fileStorageService.DeleteFileAsync(song.AudioPath, cancellationToken);
        if (song.BackgoundImagePath != null)
        {
            await _fileStorageService.DeleteFileAsync(song.BackgoundImagePath, cancellationToken);
        }
        _dbContext.Songs.Remove(song);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}