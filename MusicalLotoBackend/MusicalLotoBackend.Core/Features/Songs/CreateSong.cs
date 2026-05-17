using System.ComponentModel.DataAnnotations;
using MediatR;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

using MusicalLotoBackend.Core.Services;
namespace MusicalLotoBackend.Core.Features.Songs;

public class CreateSongCommand : IRequest<Guid>
{
    [Required(ErrorMessage = "Название песни обязательно")]
    [MaxLength(100, ErrorMessage = "Слишком длинное название")]
    public required string Title { get; init; }
    [Required(ErrorMessage = "Укажите исполнителя")]
    public required string Artist { get; init; }
    [Required(ErrorMessage = "Загрузите аудиофайл")]
    public required IFormFile AudioFile { get; init; }
    public IFormFile? BackgroundImageFile { get; init; }
}

public class CreateSongHandler : IRequestHandler<CreateSongCommand, Guid>
{
    private readonly AppDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    public CreateSongHandler(AppDbContext dbContext, IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<Guid> Handle(CreateSongCommand request, CancellationToken cancellationToken)
    {
        var audioPath = await _fileStorageService.UploadFileAsync(request.AudioFile, "audio", cancellationToken);
        
        string? imagePath = null;
        if (request.BackgroundImageFile != null)
        {
            imagePath = await _fileStorageService.UploadFileAsync(request.BackgroundImageFile, "images", cancellationToken);
        }
        
        int durationSeconds = 0;
        
        var tempFilePath = Path.GetTempFileName();
        try
        {
            using (var stream = new FileStream(tempFilePath, FileMode.Create))
            {
                await request.AudioFile.CopyToAsync(stream, cancellationToken);
            }
            using var tfile = TagLib.File.Create(tempFilePath);
            durationSeconds = (int)tfile.Properties.Duration.TotalSeconds;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Не удалось прочитать длительность: {ex.Message}");
        }
        finally
        {
            if (File.Exists(tempFilePath))
            {
                File.Delete(tempFilePath);
            }
        }

        // здесь готовые уже данные
        var song = new Song(
            title: request.Title, 
            artist: request.Artist, 
            audioPath: audioPath, 
            durationSeconds: durationSeconds,
            backgoundImagePath: imagePath
        );

        _dbContext.Songs.Add(song);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return song.Id;
    }
}
