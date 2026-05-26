using System.ComponentModel.DataAnnotations;
using MediatR;
using MusicalLotoBackend.Database;
using MusicalLotoBackend.Domain.Models;
using MusicalLotoBackend.Core.Services;

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
    private readonly IFileStorageService _fileStorageService;

    public UpdateSongHandler(AppDbContext dbContext, IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<bool> Handle(UpdateSongCommand request, CancellationToken cancellationToken)
    {
        var song = await _dbContext.Songs.FindAsync(new object[] { request.Id }, cancellationToken);
        if (song == null || song.UserId != request.UserId) return false;

        song.Title = request.Title;
        song.Artist = request.Artist;

        if (request.AudioFile != null)
        {
            // Delete old audio from MinIO
            await _fileStorageService.DeleteFileAsync(song.AudioPath, cancellationToken);

            // Upload new audio to MinIO
            var audioPath = await _fileStorageService.UploadFileAsync(request.AudioFile, "audio", cancellationToken);
            song.AudioPath = audioPath;

            // Calculate duration using a safe temp file with correct extension
            int durationSeconds = 0;
            var extension = Path.GetExtension(request.AudioFile.FileName);
            var tempFilePath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}{extension}");
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
            song.DurationSeconds = durationSeconds;
        }

        if (request.BackgroundImageFile != null)
        {
            // Delete old background image from MinIO if exists
            if (song.BackgoundImagePath != null)
            {
                await _fileStorageService.DeleteFileAsync(song.BackgoundImagePath, cancellationToken);
            }

            // Upload new background image to MinIO
            var imagePath = await _fileStorageService.UploadFileAsync(request.BackgroundImageFile, "images", cancellationToken);
            song.BackgoundImagePath = imagePath;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
