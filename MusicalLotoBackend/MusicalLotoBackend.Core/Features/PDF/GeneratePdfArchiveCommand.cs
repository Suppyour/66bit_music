using MediatR;
using Microsoft.AspNetCore.Http;

namespace MusicalLotoBackend.Core.Features.PDF;

public class GeneratePdfArchiveCommand : IRequest<byte[]>
{
    public required string CardsJson { get; set; }
    public required string SongsJson { get; set; }
    public IFormFile? Background { get; set; }
    
    public string CompanyName { get; set; } = "Название компании";
    public string EditionName { get; set; } = "Название издания";
    public string TitleText { get; set; } = "Заголовок";
    public string FooterText { get; set; } = "Подзаголовок";
    
    public string FontFamily { get; set; } = "Playfair Display";
    public string AccentColor { get; set; } = "#B21016";
    public int Rules { get; set; } = 0;
}
