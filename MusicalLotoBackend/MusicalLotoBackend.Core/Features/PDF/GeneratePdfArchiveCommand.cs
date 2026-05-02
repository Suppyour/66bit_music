using MediatR;
using Microsoft.AspNetCore.Http;

namespace MusicalLotoBackend.Core.Features.PDF;

public class GeneratePdfArchiveCommand : IRequest<byte[]>
{
    public required string CardsJson { get; set; }
    public required string SongsJson { get; set; }
    public IFormFile? Background { get; set; }
}
