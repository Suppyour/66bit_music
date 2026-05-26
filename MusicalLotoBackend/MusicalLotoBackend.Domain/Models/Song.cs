namespace MusicalLotoBackend.Domain.Models;

public class Song : BaseEntity
{
    public string Title { get; set; }
    public string Artist { get; set; }
    public string AudioPath { get; set; }
    public string? BackgoundImagePath { get; set; }
    public int DurationSeconds { get; set; }
    public Guid UserId { get; set; }

    public Song(string title, string artist, string audioPath, int durationSeconds, Guid userId, string? backgoundImagePath = null)
    {
        Title = title;
        Artist = artist;
        AudioPath = audioPath;
        DurationSeconds = durationSeconds;
        BackgoundImagePath = backgoundImagePath;
        UserId = userId;
    }
}