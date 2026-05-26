using System.ComponentModel.DataAnnotations;
using MediatR;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

namespace MusicalLotoBackend.Core.Features.Songs;

public class UpdateSongCommand : IRequest<bool>
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Название песни обязательно")]
    [MaxLength(100, ErrorMessage = "Слишком длинное название")]
    public required string Title { get; init; }

    [Required(ErrorMessage = "Укажите исполнителя")]
    public required string Artist { get; init; }

    public IFormFile? AudioFile { get; init; }
    public IFormFile? BackgroundImageFile { get; init; }
}

public class UpdateSongHandler : IRequestHandler<UpdateSongCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public UpdateSongHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _dbContext.Songs.FindAsync(new object[] { request.Id }, cancellationToken);
        if (song == null || song.UserId != request.UserId) return false;

        song.Title = request.Title;
        song.Artist = request.Artist;

        if (request.AudioFile != null)
        {
            DeletePhysicalFile(song.AudioPath);

            var audioPath = await SaveFileAsync(request.AudioFile, "audio", cancellationToken);
            song.AudioPath = audioPath;

            int durationSeconds = 0;
            var fullAudioPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", audioPath.TrimStart('/'));
            try
            {
                using var tfile = TagLib.File.Create(fullAudioPath);
                durationSeconds = (int)tfile.Properties.Duration.TotalSeconds;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Не удалось прочитать длительность: {ex.Message}");
            }
            song.DurationSeconds = durationSeconds;
        }

        if (request.BackgroundImageFile != null)
        {
            if (song.BackgoundImagePath != null)
            {
                DeletePhysicalFile(song.BackgoundImagePath);
            }
            song.BackgoundImagePath = await SaveFileAsync(request.BackgroundImageFile, "images", cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private async Task<string> SaveFileAsync(IFormFile file, string folderName, CancellationToken cancellationToken)
    {
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);
        if (!Directory.Exists(uploadsPath))
            Directory.CreateDirectory(uploadsPath);
        var extension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        
        var filePath = Path.Combine(uploadsPath, uniqueFileName);
        
        FileStream? stream = null;
        try
        {
            stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream, cancellationToken);
        }
        finally
        {
            if (stream != null)
            {
                stream.Dispose();
            }
        }

        return $"/{folderName}/{uniqueFileName}";
    }

    private void DeletePhysicalFile(string relativePath)
    {
        var formattedPath = relativePath.TrimStart('/'); 
        var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", formattedPath);

        if (File.Exists(physicalPath))
        {
            try
            {
                File.Delete(physicalPath);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Не удалось удалить старый файл: {ex.Message}");
            }
        }
    }
}
