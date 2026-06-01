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
            await _fileStorageService.DeleteFileAsync(song.AudioPath, cancellationToken);

            IFormFile fileToUpload = request.AudioFile;
            MemoryStream? trimmedStream = null;
            try
            {
                using (var originalStream = request.AudioFile.OpenReadStream())
                {
                    trimmedStream = AudioTrimmer.TryTrimMp3(originalStream, 30);
                }

                if (trimmedStream != null)
                {
                    fileToUpload = new StreamFormFile(
                        trimmedStream,
                        request.AudioFile.Name,
                        request.AudioFile.FileName,
                        request.AudioFile.ContentType
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UpdateSong] Ошибка при автоматической нарезке: {ex.Message}");
            }

            var audioPath = await _fileStorageService.UploadFileAsync(fileToUpload, "audio", cancellationToken);
            song.AudioPath = audioPath;

            int durationSeconds = 0;
            var extension = Path.GetExtension(fileToUpload.FileName);
            var tempFilePath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}{extension}");
            try
            {
                using (var stream = new FileStream(tempFilePath, FileMode.Create))
                {
                    using (var uploadStream = fileToUpload.OpenReadStream())
                    {
                        await uploadStream.CopyToAsync(stream, cancellationToken);
                    }
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
                trimmedStream?.Dispose();
            }
            song.DurationSeconds = durationSeconds;
        }

        if (request.BackgroundImageFile != null)
        {
            if (song.BackgoundImagePath != null)
            {
                await _fileStorageService.DeleteFileAsync(song.BackgoundImagePath, cancellationToken);
            }

            var imagePath = await _fileStorageService.UploadFileAsync(request.BackgroundImageFile, "images", cancellationToken);
            song.BackgoundImagePath = imagePath;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
