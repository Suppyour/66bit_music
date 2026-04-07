using System.ComponentModel.DataAnnotations;
using MediatR;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;

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

    public CreateSongHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(CreateSongCommand request, CancellationToken cancellationToken)
    {
        var audioPath = await SaveFileAsync(request.AudioFile, "audio", cancellationToken);
        
        string? imagePath = null;
        if (request.BackgroundImageFile != null)
        {
            imagePath = await SaveFileAsync(request.BackgroundImageFile, "images", cancellationToken);
        }
        
        // здесь готовые уже данные
        var song = new Song(
            title: request.Title, 
            artist: request.Artist, 
            audioPath: audioPath, 
            backgoundImagePath: imagePath
        );

        _dbContext.Songs.Add(song);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return song.Id;
    }

    private async Task<string> SaveFileAsync(IFormFile file, string folderName, CancellationToken cancellationToken)
    {
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);
        if (!Directory.Exists(uploadsPath))
            Directory.CreateDirectory(uploadsPath);
        var extension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        
        var filePath = Path.Combine(uploadsPath, uniqueFileName);
        // нейросетка 
        FileStream? stream = null;
        try
        {
            stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream, cancellationToken);
        }
        finally
        {
            // Обязательно освобождаем файл, чтобы его могли читать другие программы!
            if (stream != null)
            {
                stream.Dispose();
            }
        }

        // Возвращаем относительный путь, чтобы потом легко вставлять его в HTML
        return $"/{folderName}/{uniqueFileName}";
        // конец нейросетки
    }
}
