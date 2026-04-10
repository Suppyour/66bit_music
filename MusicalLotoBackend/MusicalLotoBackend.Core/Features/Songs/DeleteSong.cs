using MediatR;
using MusicalLotoBackend.Database;

namespace MusicalLotoBackend.Core.Features.Songs;
public class DeleteSongCommand : IRequest<bool>
{
    public required Guid Id { get; init; }
}

public class DeleteSongHandler : IRequestHandler<DeleteSongCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public DeleteSongHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(DeleteSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _dbContext.Songs.FindAsync(new object[] { request.Id }, cancellationToken);
        if (song == null) return false;
        DeletePhysicalFile(song.AudioPath);
        if (song.BackgoundImagePath != null)
        {
            DeletePhysicalFile(song.BackgoundImagePath);
        }
        _dbContext.Songs.Remove(song);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
    // заглушка для wwwroot
    private void DeletePhysicalFile(string relativePath)
    {
        var formattedPath = relativePath.TrimStart('/'); 
        var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", formattedPath);

        if (File.Exists(physicalPath))
        {
            File.Delete(physicalPath);
        }
    }
}